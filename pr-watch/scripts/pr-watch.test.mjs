import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import test from 'node:test';
import { evaluateSnapshot, parsePrUrl, readSnapshot } from './github.mjs';
import { watch } from './watcher.mjs';
import { wakeSession } from './pr-watch.mjs';

const exec = promisify(execFile);
const head = 'a'.repeat(40);
const url = 'https://github.com/example/repo/pull/12';
const thread = '00000000-0000-4000-8000-000000000001';
const target = parsePrUrl(url);
const readyPr = { state: 'OPEN', isDraft: false, headRefOid: head, mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN', reviewDecision: 'APPROVED', reviews: [] };
const ready = { outcome: 'ready', head, waitingFor: [] };
const waiting = { outcome: 'waiting', head, waitingFor: ['GitHub approval'] };

test('readiness requires approval, all current checks, and clean merge state', () => {
  assert.equal(evaluateSnapshot({ pr: readyPr, checks: [{ bucket: 'pass' }, { bucket: 'skipping' }] }).outcome, 'ready');
  for (const bucket of ['pending', 'fail', 'cancel', 'unknown', undefined]) {
    assert.equal(evaluateSnapshot({ pr: readyPr, checks: [{ bucket }] }).outcome, 'waiting');
  }
  for (const patch of [{ isDraft: true }, { reviewDecision: 'REVIEW_REQUIRED' },
    { reviewDecision: 'CHANGES_REQUESTED' }, { mergeable: 'UNKNOWN' }, { mergeable: 'CONFLICTING' },
    { mergeStateStatus: 'BLOCKED' }, { mergeStateStatus: 'BEHIND' }, { mergeStateStatus: 'UNKNOWN' }]) {
    assert.equal(evaluateSnapshot({ pr: { ...readyPr, ...patch }, checks: [] }).outcome, 'waiting');
  }
  assert.equal(evaluateSnapshot({ pr: readyPr, checks: [], changedDuringRead: true }).outcome, 'waiting');
  assert.throws(() => evaluateSnapshot({ pr: {}, checks: [] }), /incomplete/);
});

test('unprotected PR needs a current-head approval with no outstanding change request', () => {
  const review = { author: { login: 'reviewer' }, state: 'APPROVED', commit: { oid: head } };
  const evaluate = reviews => evaluateSnapshot({ pr: { ...readyPr, reviewDecision: '', reviews }, checks: [] }).outcome;
  assert.equal(evaluate([]), 'waiting');
  assert.equal(evaluate([review]), 'ready');
  assert.equal(evaluate([{ ...review, commit: { oid: 'b'.repeat(40) } }]), 'waiting');
  assert.equal(evaluate([review, { ...review, state: 'COMMENTED' }]), 'ready');
  assert.equal(evaluate([review, { ...review, state: 'DISMISSED' }]), 'waiting');
  assert.equal(evaluate([review, { ...review, author: { login: 'second' }, state: 'CHANGES_REQUESTED' }]), 'waiting');
});

test('GitHub snapshot catches a new commit during check retrieval', async () => {
  const replies = [readyPr, [{ bucket: 'pass' }], { ...readyPr, headRefOid: 'b'.repeat(40) }];
  const snapshot = await readSnapshot(target, async () => ({ stdout: JSON.stringify(replies.shift()), stderr: '' }));
  assert.equal(evaluateSnapshot(snapshot).outcome, 'waiting');
});

test('no checks is distinct from a GitHub permission failure', async () => {
  const runner = stderr => async (_file, args) => args[1] === 'checks'
    ? { stdout: '', stderr, code: 1 } : { stdout: JSON.stringify(readyPr), stderr: '' };
  assert.equal(evaluateSnapshot(await readSnapshot(target, runner('no checks reported on the branch'))).outcome, 'ready');
  await assert.rejects(readSnapshot(target, runner('permission denied')));
  assert.throws(() => parsePrUrl('https://github.com.evil.test/example/repo/pull/12'));
});

async function exercise(observations, overrides = {}) {
  let calls = 0;
  const states = [];
  const wakes = [];
  await watch({ intervalMs: 1, deadline: 100 }, {
    observe: async () => {
      const value = observations[calls++];
      if (value instanceof Error) throw value;
      assert.ok(value, 'Unexpected extra polling');
      return value;
    },
    save: async state => states.push(state),
    wake: async (...args) => { wakes.push(args); return { warning: null }; },
    stopped: async () => false, now: () => 0, wait: async () => {}, ...overrides,
  });
  return { calls, states, wakes };
}

test('stays quiet until two ready reads of the same head, then wakes once', async () => {
  const result = await exercise([waiting, ready, { ...ready, head: 'b'.repeat(40) }, { ...ready, head: 'b'.repeat(40) }]);
  assert.equal(result.calls, 4);
  assert.equal(result.wakes.length, 1);
  assert.equal(result.wakes[0][0], 'ready');
  assert.equal(result.states.at(-1).status, 'notified');
});

test('a transient read error resets readiness without a model call', async () => {
  const result = await exercise([ready, new Error('offline'), ready, ready]);
  assert.equal(result.calls, 4);
  assert.equal(result.wakes.length, 1);
});

test('five consecutive errors stop polling and produce one wake', async () => {
  const result = await exercise(Array(5).fill(new Error('offline')));
  assert.equal(result.calls, 5);
  assert.equal(result.wakes[0][0], 'error');
});

test('closure, merge, timeout, and cancellation terminate cleanly', async () => {
  for (const outcome of ['closed', 'merged']) {
    const result = await exercise([{ outcome, head, waitingFor: [] }]);
    assert.equal(result.wakes[0][0], outcome);
  }
  const timeout = await exercise([], { now: () => 101 });
  assert.equal(timeout.wakes[0][0], 'timeout');
  const stopped = await exercise([], { stopped: async () => true });
  assert.equal(stopped.wakes.length, 0);
  assert.equal(stopped.states.at(-1).status, 'stopped');
});

test('ambiguous wake failure is saved without duplicate delivery attempts', async () => {
  let deliveries = 0;
  const result = await exercise([ready, ready], { wake: async () => { deliveries++; throw new Error('queue timed out'); } });
  assert.equal(deliveries, 1);
  assert.equal(result.states.at(-1).status, 'delivery-failed');
});

test('cancellation during a failing GitHub read does not send a wake', async () => {
  let cancelled = false;
  const result = await exercise([], {
    observe: async () => { cancelled = true; throw new Error('offline'); },
    stopped: async () => cancelled,
  });
  assert.equal(result.wakes.length, 0);
  assert.equal(result.states.at(-1).status, 'stopped');
});

test('wake targets the same session and does not override model or permissions', async () => {
  let invocation;
  const result = await wakeSession({ target, thread, remote: 'unix:///example.sock' }, 'ready', { head }, async (...args) => {
    invocation = args;
    return { stdout: 'queued', stderr: 'Warning: message was queued, but could not resume thread' };
  });
  assert.equal(invocation[0], 'codex');
  assert.equal(invocation[1][0], 'queue');
  assert.equal(invocation[1][invocation[1].indexOf('--thread') + 1], thread);
  assert.equal(invocation[1].at(-1), '--resume');
  assert.ok(result.warning);
});

async function waitForState(path, expected) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const state = JSON.parse(await readFile(path, 'utf8'));
    if (state.status === expected) return state;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${expected}`);
}

test('detached CLI deduplicates watches, stays silent, wakes once, and supports stopping', { timeout: 35_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'pr-watch-test-'));
  const bin = join(root, 'bin');
  const home = join(root, 'codex');
  await mkdir(bin);
  const gh = `#!${process.execPath}\nconst p=${JSON.stringify(readyPr)};\nconsole.log(JSON.stringify(process.argv[3]==='checks'?[{bucket:'pass'}]:p));\n`;
  const codex = `#!${process.execPath}\nimport {appendFileSync} from 'node:fs';\nconst a=process.argv.slice(2);\nif(a.includes('--help')) console.log('--resume');\nelse if(a[0]==='app-server') console.log(JSON.stringify({status:'running',socketPath:'/fake.sock'}));\nelse {appendFileSync(process.env.WAKE_FILE,JSON.stringify(a)+'\\n');console.log('queued');}\n`;
  await writeFile(join(bin, 'gh'), gh);
  await writeFile(join(bin, 'codex'), codex);
  await chmod(join(bin, 'gh'), 0o755);
  await chmod(join(bin, 'codex'), 0o755);
  const alias = join(root, 'skill');
  await symlink(fileURLToPath(new URL('.', import.meta.url)), alias);
  const script = join(alias, 'pr-watch.mjs');
  const wakeFile = join(root, 'wake.jsonl');
  const env = { ...process.env, CODEX_HOME: home, CODEX_THREAD_ID: thread,
    PATH: `${bin}:${process.env.PATH}`, WAKE_FILE: wakeFile };
  const cli = (...args) => exec(process.execPath, [script, ...args], { env });
  let statePath;
  try {
    const first = await cli('start', url, '--interval-seconds', '10');
    assert.match(first.stdout, /^Watching .*\n$/);
    assert.equal(first.stderr, '');
    const duplicate = await cli('start', url);
    assert.match(duplicate.stdout, /^Already watching/);
    const ids = await readdir(join(home, 'pr-watches'));
    assert.equal(ids.length, 1);
    statePath = join(home, 'pr-watches', ids[0], 'state.json');
    await waitForState(statePath, 'notified');
    assert.equal((await readFile(wakeFile, 'utf8')).trim().split('\n').length, 1);
    await cli('start', url, '--interval-seconds', '10');
    await cli('stop', url);
    await waitForState(statePath, 'stopped');
    assert.equal((await readFile(wakeFile, 'utf8')).trim().split('\n').length, 1);
  } finally {
    if (statePath) await writeFile(join(statePath, '..', 'stop'), '').catch(() => {});
    await rm(root, { recursive: true, force: true });
  }
});
