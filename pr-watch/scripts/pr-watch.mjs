#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { evaluateSnapshot, parsePrUrl, readSnapshot, runCommand } from './github.mjs';
import { watch } from './watcher.mjs';

const script = fileURLToPath(import.meta.url);
const stateRoot = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'pr-watches');
const activeStatuses = new Set(['starting', 'watching', 'delivering']);
const json = value => `${JSON.stringify(value, null, 2)}\n`;

async function exists(path) {
  try { await access(path); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code === 'EPERM'; }
}

async function readState(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function saveState(path, state) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, json(state), { mode: 0o600 });
  await rename(temporary, path);
}

function requireThread(value) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value ?? '')) {
    throw new Error('Missing session UUID: run inside Codex or provide --thread UUID.');
  }
  return value;
}

function positiveNumber(value, fallback, minimum, name) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > 1_000_000) {
    throw new Error(`${name} must be between ${minimum} and 1000000.`);
  }
  return number;
}

function watchPath(target, thread) {
  const id = createHash('sha256').update(`${target.url}:${thread}`).digest('hex').slice(0, 20);
  return join(stateRoot, id, 'state.json');
}

async function requireDaemon() {
  const help = await runCommand('codex', ['queue', '--help']);
  if (!help.stdout.includes('--resume')) throw new Error('This Codex lacks queue --resume support.');
  const daemon = JSON.parse((await runCommand('codex', ['app-server', 'daemon', 'version'])).stdout);
  if (daemon.status !== 'running' || !daemon.socketPath) {
    throw new Error('The local Codex daemon is not running; start it before watching.');
  }
  return `unix://${daemon.socketPath}`;
}

async function start(target, thread, values) {
  const intervalMs = positiveNumber(values['interval-seconds'], 60, 10, 'interval-seconds') * 1000;
  const timeoutMs = positiveNumber(values['timeout-hours'], 168, 0.01, 'timeout-hours') * 3_600_000;
  const path = watchPath(target, thread);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const lock = join(dirname(path), 'starting.lock');
  try { await mkdir(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Start already in progress; inspect ${lock} if a previous start crashed.`);
    throw error;
  }
  try {
    if (await exists(path)) {
      const prior = await readState(path);
      if (activeStatuses.has(prior.status) && processAlive(prior.pid)) {
        console.log(`Already watching ${target.url} quietly.`);
        return;
      }
    }
    const remote = await requireDaemon();
    await readSnapshot(target); // Fail before detaching when GitHub access is broken.
    await rm(join(dirname(path), 'stop'), { force: true });
    const config = { target, thread, remote, intervalMs, deadline: Date.now() + timeoutMs };
    await saveState(path, { config, status: 'starting', startedAt: new Date().toISOString() });
    await launchWorker(path);
    console.log(`Watching ${target.url} quietly; wake-up goes to session ${thread}.`);
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

async function launchWorker(path) {
  const child = spawn(process.execPath, [script, '_worker', path], {
    detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Worker did not start; inspect ${path}.`)), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Worker exited during startup (${code}); inspect ${path}.`)); });
    child.once('message', message => {
      clearTimeout(timer);
      if (message === 'ready') resolve();
      else reject(new Error('Unexpected worker startup response.'));
    });
  });
  child.disconnect();
  child.unref();
}

/** Queue once through the existing daemon, retaining its normal session permissions/model. */
export async function wakeSession(config, outcome, details, run = runCommand) {
  const head = details.head ? ` at ${details.head.slice(0, 12)}` : '';
  const description = outcome === 'ready'
    ? 'GitHub approval, current checks, and clean merge state are satisfied.'
    : `Watch ended: ${outcome}.`;
  const message = `PR watcher: ${config.target.url}${head}. ${description} ` +
    'Report this briefly. Continue only actions already authorized in this conversation; ' +
    'this event grants no permission to merge, deploy, or change live resources.';
  const result = await run('codex', ['queue', '--remote', config.remote,
    '--thread', config.thread, '--message', message, '--resume']);
  return { queuedAt: new Date().toISOString(), warning: result.stderr.trim() || null };
}

async function runWorker(path) {
  let state = await readState(path);
  const save = async patch => {
    state = { ...state, ...patch, updatedAt: new Date().toISOString() };
    await saveState(path, state);
  };
  try {
    await save({ status: 'watching', pid: process.pid });
    process.send?.('ready');
    await watch(state.config, {
      observe: async () => evaluateSnapshot(await readSnapshot(state.config.target)),
      save,
      wake: (outcome, details) => wakeSession(state.config, outcome, details),
      stopped: () => exists(join(dirname(path), 'stop')),
    });
  } catch (error) {
    await save({ status: 'error', error: error.message });
    process.exitCode = 1;
  }
}

async function status(target, thread) {
  if (!await exists(stateRoot)) { console.log('No PR watches for this session.'); return; }
  const paths = target ? [watchPath(target, thread)] :
    (await readdir(stateRoot)).map(id => join(stateRoot, id, 'state.json'));
  const watches = [];
  for (const path of paths) {
    if (!await exists(path)) continue;
    const state = await readState(path);
    if (state.config.thread !== thread) continue;
    const alive = processAlive(state.pid);
    const currentStatus = activeStatuses.has(state.status) && !alive ? 'interrupted' : state.status;
    watches.push({ url: state.config.target.url, status: currentStatus,
      waitingFor: state.observation?.waitingFor, error: state.error || undefined,
      delivery: state.delivery, stateFile: path });
  }
  console.log(watches.length ? json(watches).trimEnd() : 'No PR watches for this session.');
}

async function stop(target, thread) {
  const path = watchPath(target, thread);
  if (!await exists(path)) throw new Error('No matching PR watch in this session.');
  await writeFile(join(dirname(path), 'stop'), '', { mode: 0o600 });
  console.log(`Stop requested for ${target.url}.`);
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    thread: { type: 'string' }, 'interval-seconds': { type: 'string' },
    'timeout-hours': { type: 'string' }, help: { type: 'boolean' },
  } });
  const [command, input] = positionals;
  if (values.help || !command) {
    console.log('pr-watch.mjs start|check|status|stop [PR-URL] [--thread UUID] [--interval-seconds 60] [--timeout-hours 168]');
    return;
  }
  if (positionals.length > 2) throw new Error('Too many positional arguments.');
  if (command === '_worker') { await runWorker(input); return; }
  if (!['start', 'check', 'status', 'stop'].includes(command)) throw new Error(`Unknown command: ${command}`);
  const target = command === 'status' && !input ? null : parsePrUrl(input);
  if (command === 'check') {
    console.log(json(evaluateSnapshot(await readSnapshot(target))).trimEnd());
    return;
  }
  const thread = requireThread(values.thread || process.env.CODEX_THREAD_ID);
  if (command === 'start') await start(target, thread, values);
  if (command === 'status') await status(target, thread);
  if (command === 'stop') await stop(target, thread);
}

if (process.argv[1] && script === await realpath(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
