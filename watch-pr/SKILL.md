---
name: watch-pr
description: "When explicitly asked to watch PR, WatchPR, or use $watch-pr, quietly monitor GitHub approval and checks in a detached process and wake the same Codex session. Also supports requested CI fixes, actionable feedback, review announcements, and post-merge announcement cleanup."
---

# WatchPR

Default to a quiet background watch for a PR URL or a request to wait for approval and checks. Follow [Quiet background waiting](references/quiet-watcher.md), start the process once, report one short confirmation, and finish the turn. The process wakes this same session when the PR is ready; polling makes no model calls.

Use the managed workflow below when the user also requests CI fixes, actionable feedback handling, or a review announcement, or those actions remain part of the already-authorized task. After that work, hand approval waiting to the same background process. Perform post-merge Slack cleanup after a resumed session confirms the merge. Never keep an agent turn alive solely to poll for human review, approval, or merge.

## Invocation and authorization

A quiet watch does not require a Slack announcement or code changes. The managed workflow retains the authorization below. For its review announcement destination, read `references/local-review-channel.md` if present, or use the channel explicitly specified in the conversation. If neither is available, ask for the destination before posting.

An explicit "watch PR", "WatchPR", or `$watch-pr` invocation authorizes waiting for CI, fixing in-scope failures and available actionable feedback, pushing fixes, and posting the review announcement below. It overrides default instructions to return immediately after pushing or opening a PR and instructions to avoid waiting for CI. There is no five-minute cutoff or requirement to ask the user to resume while CI is running.

Outside an explicit watch invocation, preserve the normal handoff: commit, push, open a non-draft PR, return its link, and stop without waiting for CI or posting a review announcement. Creating a PR and returning its link alone is not a request for review.

Keep existing live-resource approval requirements. Read-only inspection is allowed. Before changing cloud or live resources, explain the exact target and proposed change and obtain explicit approval; reapprove material changes in target, scope, or consequences. Watching a PR authorizes the scoped GitHub work, Slack announcement, and post-merge announcement cleanup described here, not deployments, configuration updates, deletions, or permission changes to other live resources. Prefer the simplest appropriate existing tool or approved local operation; do not introduce orchestration to avoid approval.

## Managed workflow: fix and announce

1. Inspect the repository, branch, worktree, remotes, contributor instructions, and relevant tests. Preserve unrelated user changes. On resume, load the saved checkpoint and refresh the PR state and head commit. If already merged, go directly to post-merge Slack cleanup; if closed without merging, stop and leave the announcement intact. If the current work is incomplete, finish and verify it before opening the PR.
2. Commit only the in-scope work on a non-default branch, push, and open a non-draft PR against the repository's default base branch. Reuse an existing PR for the branch instead of creating a duplicate. Write a useful title and body with the change summary and tests run. During an explicit watch invocation, continue monitoring after the push or PR creation.
3. Monitor the latest PR head, applicable linting and PR jobs, required CI checks, review decisions, inline review threads, new top-level comments, and merge state. Refresh feedback as CI progresses and after every change; do not inspect it only once per invocation. Distinguish actionable feedback from questions, informational comments, stale comments, and automated noise. Continue the CI wait below until the latest head satisfies the announcement condition or a genuine blocker requires user action. If the head changes, discard readiness from the old head and evaluate the new head.
4. For each in-scope CI failure or available actionable feedback item, inspect the evidence and surrounding code, implement the smallest correct fix, run proportionate tests, commit, and push. Reply to the relevant review thread with what changed and resolve it when appropriate. After every push or retry, return to step 3 and check the new head and fresh results. Resolve merge conflicts in scope and recheck after pushing. If a request conflicts with requirements or would materially expand scope, explain the conflict on the PR and ask the user before changing direction. Report failures that cannot be fixed in scope as blockers.
5. Once the announcement condition below holds, automatically post the review announcement to the configured review channel without asking for further permission. Immediately before posting, refresh the PR and confirm the head is unchanged, applicable checks pass, available actionable feedback is handled, and there are no merge conflicts; unknown mergeability blocks posting. If anything changed, return to step 3. Use an available Slack connector; otherwise use the signed-in in-app browser. Check the checkpoint and search that channel for the exact PR URL before posting. If already announced there, reuse the original announcement without posting a duplicate. Record that exact message's channel ID, timestamp or message ID, and permalink alongside the PR URL in the checkpoint. Preserve timestamps and IDs exactly as strings. If posting has an ambiguous result, locate the message before retrying. After posting or identifying the existing announcement and saving its identifiers, start the quiet background watch and finish the turn.

Use this review announcement format, including the PR title, a short summary, and passing test/check status in the description. Do not use "Could someone review."

```text
PR Link: [GitHub PR URL]
Ticket: [Linear ticket URL, if available]
Description: [PR title and one to two sentences describing the change and passing checks/tests.]
```

## Managed CI work, stop, and resume

This section applies only while performing the requested fix-and-announce work. For ordinary waiting, use the detached watcher instead of this active CI loop.

Poll pending, queued, or running CI at most once per minute, using waits of at most 60 seconds so the user can interrupt. Continue while CI is active, without a total elapsed-time cutoff. Pushes, retries, and head changes continue the same watch workflow. Do not end the turn or ask the user to resume merely because CI is still running. Respect an explicit user stop or time limit. Missing expected checks or unknown mergeability without active CI are blockers to report, not reasons to keep polling indefinitely. Terminal failures require an in-scope fix or a concrete blocker, not passive waiting.

Save a local checkpoint after pushes, announcement posting or discovery, and before stopping. Reuse an existing watch state file when available; otherwise use `~/ai/plans/<TICKET-ID>/watch-pr-<number>-state.json` (or `~/ai/plans/watch-pr-<number>/state.json` when no ticket exists). Record the PR URL, repository/worktree, last observed head commit, current blocker or announcement state, exact Slack announcement identifiers (or that no announcement exists), and the next action on resume. Do not commit this operational state. Saving a checkpoint does not end an active CI watch.

After the announcement, start the quiet watcher, return the PR URL, announcement permalink, and passing checks/tests, then finish the turn. The background process waits for GitHub approval and checks without agent polling. The user can resume after merge for Slack cleanup. Missing approvals do not block the announcement. For a genuine blocker that cannot be resolved in scope, save the checkpoint and report the exact blocker and required next action; do not claim the PR satisfies the announcement condition.

Use the detached process in [Quiet background waiting](references/quiet-watcher.md) for approval/check waits. Do not create recurring agent tasks or keep tool waits running. On a watcher wake-up or user resume, use the checkpoint and fresh GitHub state; do not recreate the PR or repost an existing announcement. A readiness event does not authorize merging or live-resource changes. Respect an explicit stop by cancelling the worker.

## Announcement condition

Post the review announcement only when:

- all applicable linting and PR jobs and required CI checks pass for the latest PR head commit;
- all available actionable review feedback and change requests have been addressed;
- the latest head has no merge conflicts and mergeability is known;
- the branch is push-complete and the PR description still matches the implementation; and
- the latest changes have appropriate test evidence.

Pending human review, missing approvals, or a review status awaiting a reviewer update after its actionable feedback has been addressed do not block posting. This condition governs the review announcement, not permission to merge. Do not merge, force-push, dismiss reviews, or bypass branch protections unless the user explicitly asks. Posting or reusing the announcement completes the active fix-and-announce work. The detached approval/check watcher continues quietly. Slack cleanup remains pending until a resumed session confirms the merge.

## Post-merge Slack cleanup

On resume, once GitHub confirms the PR is merged, delete the exact original Slack announcement recorded in step 5 using the available Slack connector or signed-in in-app browser. Verify that the deletion succeeded, update the checkpoint, and report the PR URL and cleanup result. Delete only that announcement; do not delete unrelated channel messages or separately remove replies. Never delete the announcement merely because the PR is approved, ready, or closed without merging.

If the announcement is already absent, treat cleanup as complete. If the exact message cannot be identified or deletion is unavailable or denied, report the cleanup blocker and the message permalink when known; do not claim cleanup succeeded. If the PR closes without merging, stop monitoring and report that state while leaving the announcement intact.
