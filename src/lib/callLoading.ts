/**
 * Loading-state rules for the active call. Kept pure so the timing rules
 * (minimum and maximum waits, stall detection, resume budget) stay testable.
 */
export const MIN_CONNECTING_MS = 1200;
export const MAX_CONNECTING_MS = 10000;
export const BUFFERING_DELAY_MS = 400;
export const STALL_MS = 1000;
export const MAX_RESUME_TRIES = 3;
export const RESUME_SPACING_MS = 500;

/** "Conectando..." leaves once the video is ready: never before MIN, never after MAX. */
export function shouldLeaveConnecting(elapsedMs: number, videoReady: boolean): boolean {
  if (elapsedMs >= MAX_CONNECTING_MS) return true;
  return videoReady && elapsedMs >= MIN_CONNECTING_MS;
}

/** A playing video whose clock stops advancing for STALL_MS counts as buffering. */
export function isStalled(nowMs: number, lastAdvanceMs: number, paused: boolean): boolean {
  return !paused && nowMs - lastAdvanceMs >= STALL_MS;
}

/** Diagnostics only: console.warn never reaches the lead's screen. */
let answerAt = 0;
let waiting = 0;
let errors = 0;

export const callDiag = {
  start: () => {
    answerAt = Date.now();
    waiting = 0;
    errors = 0;
  },
  /** Logs the time from "Atender" until the video really started; once per answer. */
  ready: () => {
    if (!answerAt) return;
    console.warn(`[CallSim] playing after ${Date.now() - answerAt}ms`);
    answerAt = 0;
  },
  waiting: () => {
    waiting += 1;
    console.warn(`[CallSim] buffering (${waiting})`);
  },
  error: () => {
    errors += 1;
    console.warn(`[CallSim] video error (${errors})`);
  },
};
