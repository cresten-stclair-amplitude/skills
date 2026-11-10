# Quiet PR watcher

Run `scripts/watch-pr.mjs` with Node.js 22 or newer. It uses authenticated `gh` and an installed Codex with `queue --resume` support and a running local app-server daemon. No Codex fork, API key, ticket, or model polling is needed.

## Start

Resolve the PR's full GitHub URL from the conversation or current branch. Resolve the target session from `CODEX_THREAD_ID`; use an explicit `--thread` only when the user wants another session. Do not guess another session from its title. If either target is missing, ask for it.

Execute once (replace the path and URL; this is an agent operation, not a command for the user to copy):

`node <skill-directory>/scripts/watch-pr.mjs start https://github.com/OWNER/REPO/pull/NUMBER`

The parent returns after the worker starts. Report only “Watching PR #NUMBER quietly; I’ll wake when approval and checks are ready.” Then finish the turn. Do not keep a goal, tool wait, polling loop, recurring agent task, or repeated progress message running. Do not dump watcher state unless requested.

Default interval is 60 seconds; timeout is seven days. Override with `--interval-seconds` (minimum 10) or `--timeout-hours` when requested. The worker follows new head commits and requires two consecutive ready observations of the same commit. It checks all current reported checks, including optional checks; passed and skipped checks count as complete. GitHub must report the PR mergeable with a clean merge state. Required review rules must be satisfied; for repositories without required review rules, at least one approval of the current commit and no outstanding changes-requested review is required.

The watcher emits one session message on readiness, closure/merge, timeout, or five consecutive polling errors, then exits. Failures and pending reviews remain quiet while it waits. Readiness is an observation, not permission to merge or deploy; retain the conversation's existing authorization boundaries. This skill does not monitor Slack approval.

## Inspect or stop

- `node <skill-directory>/scripts/watch-pr.mjs status` lists this session's watches; supply a PR URL to select one.
- `node <skill-directory>/scripts/watch-pr.mjs stop <PR-URL>` requests cancellation; the worker notices within one polling interval plus any in-flight command timeout and sends no wake-up message.
- `node <skill-directory>/scripts/watch-pr.mjs check <PR-URL>` reads GitHub once without starting a worker or sending a message.

State is private local JSON under `${CODEX_HOME:-~/.codex}/pr-watches/`, outside repositories. Starting the same PR for the same session twice reuses the running watch. Sleeping pauses polling; a reboot stops it. Restart an interrupted watch with `start`. The local Codex daemon must remain available for automatic wake-up. A queued message with a resume warning is retained for the next session resume; inspect status for delivery failures instead of blindly resending and duplicating the message.

## Validation

Run `node --test <skill-directory>/scripts/*.test.mjs`. These tests use fake GitHub and Codex commands; a live `check` validates GitHub access without changing the PR.
