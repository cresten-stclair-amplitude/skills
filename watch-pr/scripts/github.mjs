import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PR_FIELDS = 'state,isDraft,headRefOid,mergeable,mergeStateStatus,reviewDecision,reviews';

/** Commands run without a shell; stdout/stderr stay out of the conversation. */
export async function runCommand(file, args, allowedCodes = [0]) {
  try {
    return await execFileAsync(file, args, {
      encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' },
    });
  } catch (error) {
    if (allowedCodes.includes(error.code) && !error.killed) return error;
    throw new Error(`${file}: ${(error.stderr || error.message).trim().slice(0, 700)}`);
  }
}

export function parsePrUrl(value) {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/([1-9]\d*)\/?$/.exec(value ?? '');
  if (!match) throw new Error('Provide a full https://github.com/OWNER/REPO/pull/NUMBER URL.');
  return Object.freeze({ repo: `${match[1]}/${match[2]}`, number: match[3], url: value.replace(/\/$/, '') });
}

function validatePr(pr) {
  if (!pr || !['OPEN', 'CLOSED', 'MERGED'].includes(pr.state) || !/^[a-f0-9]{40}$/i.test(pr.headRefOid)) {
    throw new Error('GitHub returned an incomplete PR snapshot.');
  }
  if (typeof pr.isDraft !== 'boolean' || !Array.isArray(pr.reviews)) {
    throw new Error('GitHub omitted draft/review information.');
  }
  return pr;
}

function hasApproval(pr) {
  if (pr.reviewDecision === 'APPROVED') return true;
  if (pr.reviewDecision) return false;
  // Comments do not supersede a reviewer's approval or request for changes.
  const latest = new Map();
  for (const review of pr.reviews) {
    if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue;
    if (review.author?.login) latest.set(review.author.login, review);
  }
  const reviews = [...latest.values()];
  return !reviews.some(review => review.state === 'CHANGES_REQUESTED') &&
    reviews.some(review => review.state === 'APPROVED' && review.commit?.oid === pr.headRefOid);
}

/** Fail closed for unknown checks, mergeability, draft status, or review state. */
export function evaluateSnapshot({ pr, checks, changedDuringRead = false }) {
  validatePr(pr);
  if (!Array.isArray(checks)) throw new Error('GitHub returned invalid check data.');
  if (pr.state !== 'OPEN') return { outcome: pr.state.toLowerCase(), head: pr.headRefOid, waitingFor: [] };
  const waitingFor = [];
  if (changedDuringRead) waitingFor.push('stable head commit');
  if (pr.isDraft) waitingFor.push('PR ready for review');
  if (!hasApproval(pr)) waitingFor.push('GitHub approval');
  if (checks.some(check => !['pass', 'skipping'].includes(check.bucket))) waitingFor.push('checks');
  if (pr.mergeable !== 'MERGEABLE' || pr.mergeStateStatus !== 'CLEAN') waitingFor.push('clean merge state');
  return { outcome: waitingFor.length ? 'waiting' : 'ready', head: pr.headRefOid, waitingFor };
}

/** Bracket the check query with head reads so results from different commits cannot pass. */
export async function readSnapshot(target, run = runCommand) {
  const viewArgs = ['pr', 'view', target.number, '--repo', target.repo, '--json', PR_FIELDS];
  const before = validatePr(JSON.parse((await run('gh', viewArgs)).stdout));
  if (before.state !== 'OPEN') return { pr: before, checks: [] };
  const result = await run('gh', ['pr', 'checks', target.number, '--repo', target.repo,
    '--json', 'bucket,name,workflow'], [0, 1, 8]);
  // gh exits 1 with no JSON when a PR has no checks. Other errors must remain errors.
  const noChecks = !result.stdout.trim() && /^no checks reported on the /.test(result.stderr.trim());
  const checks = noChecks ? [] : JSON.parse(result.stdout);
  const after = validatePr(JSON.parse((await run('gh', viewArgs)).stdout));
  return { pr: after, checks, changedDuringRead: before.headRefOid !== after.headRefOid };
}
