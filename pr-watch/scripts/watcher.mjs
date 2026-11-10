import { setTimeout as sleep } from 'node:timers/promises';

/** A second ready sample avoids waking during a transient or newly scheduled check update. */
export function advanceReadiness(previousHead, observation) {
  const ready = observation.outcome === 'ready';
  return { candidateHead: ready ? observation.head : null, ready: ready && previousHead === observation.head };
}

/** Polling has no model calls. Only a terminal observation invokes the wake callback. */
export async function watch(config, { observe, save, wake, stopped, now = Date.now, wait = sleep }) {
  let candidateHead = null;
  let failures = 0;
  while (!await stopped()) {
    if (now() >= config.deadline) return finish('timeout', {}, save, wake);
    let observation;
    try {
      observation = await observe();
      failures = 0;
    } catch (error) {
      if (await stopped()) break;
      candidateHead = null;
      failures += 1;
      await save({ status: 'watching', failures, error: error.message });
      if (failures >= 5) return finish('error', { error: error.message }, save, wake);
      await wait(config.intervalMs);
      continue;
    }
    if (await stopped()) break;
    const readiness = advanceReadiness(candidateHead, observation);
    candidateHead = readiness.candidateHead;
    await save({ status: 'watching', observation, failures, error: null });
    if (readiness.ready || ['closed', 'merged'].includes(observation.outcome)) {
      return finish(observation.outcome, { head: observation.head }, save, wake);
    }
    await wait(config.intervalMs);
  }
  await save({ status: 'stopped' });
}

async function finish(outcome, details, save, wake) {
  // Persist before delivery. A delivery timeout is ambiguous, so never blindly requeue.
  await save({ status: 'delivering', outcome, ...details });
  try {
    const delivery = await wake(outcome, details);
    await save({ status: delivery.warning ? 'queued' : 'notified', delivery });
  } catch (error) {
    await save({ status: 'delivery-failed', error: error.message });
  }
}
