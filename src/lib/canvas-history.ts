/**
 * Immutable undo/redo stack of serialized canvas snapshots.
 *
 * Snapshots are opaque strings so that equality checks stay cheap and the
 * stack never shares mutable references with the live canvas.
 */
export interface CanvasHistory {
  past: string[];
  present: string;
  future: string[];
}

const DEFAULT_MAX_PAST_COUNT = 50;

/** Returns a history whose only entry is the given snapshot. */
export function createHistory(initialSnapshot: string): CanvasHistory {
  return { past: [], present: initialSnapshot, future: [] };
}

/**
 * Returns a history with the snapshot recorded as the present state.
 *
 * Discards the redo stack, and drops the oldest entries once `past` exceeds
 * `maxPastCount`. Returns the same object when the snapshot equals the
 * present one, so callers can skip re-rendering.
 */
export function pushSnapshot(
  history: CanvasHistory,
  snapshot: string,
  maxPastCount = DEFAULT_MAX_PAST_COUNT,
): CanvasHistory {
  if (snapshot === history.present) {
    return history;
  }
  const extendedPast = [...history.past, history.present];
  return {
    past: extendedPast.slice(Math.max(0, extendedPast.length - maxPastCount)),
    present: snapshot,
    future: [],
  };
}

/** Returns the history moved one step back, or the same object if impossible. */
export function undoSnapshot(history: CanvasHistory): CanvasHistory {
  if (!canUndo(history)) {
    return history;
  }
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

/** Returns the history moved one step forward, or the same object if impossible. */
export function redoSnapshot(history: CanvasHistory): CanvasHistory {
  if (!canRedo(history)) {
    return history;
  }
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  };
}

export function canUndo(history: CanvasHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: CanvasHistory): boolean {
  return history.future.length > 0;
}
