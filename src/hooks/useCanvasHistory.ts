import { useCallback, useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import {
  CanvasHistory,
  canRedo,
  canUndo,
  createHistory,
  pushSnapshot,
  redoSnapshot,
  undoSnapshot,
} from '@/lib/canvas-history';

// Coalesces bursts such as typing or dragging a color picker into one step.
const RECORD_DEBOUNCE_MS = 300;

const EMPTY_HISTORY = createHistory('[]');

// Only foreground objects are serialized. The background image is a large
// data URL, and GIF playback swaps it on every frame.
function serializeObjects(canvas: fabric.Canvas): string {
  return JSON.stringify(canvas.getObjects().map((object) => object.toObject()));
}

/**
 * Tracks edits to the canvas objects and returns undo/redo controls.
 *
 * Call `recordChange` after mutating an object through `set()`, because
 * Fabric fires no event for programmatic property changes. Call
 * `resetHistory` after loading new content so that loading is not undoable.
 */
export function useCanvasHistory(canvas: fabric.Canvas | null) {
  const historyRef = useRef<CanvasHistory>(EMPTY_HISTORY);
  const isRestoringRef = useRef(false);
  const restoreSequenceRef = useRef(0);
  // The history whose present snapshot the canvas currently shows. Lags
  // historyRef while a restore is in flight.
  const appliedHistoryRef = useRef<CanvasHistory>(EMPTY_HISTORY);
  const pendingRecordRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDiscreteRecordQueuedRef = useRef(false);
  const [availability, setAvailability] = useState({ canUndo: false, canRedo: false });

  const applyHistory = useCallback((nextHistory: CanvasHistory) => {
    historyRef.current = nextHistory;
    setAvailability({ canUndo: canUndo(nextHistory), canRedo: canRedo(nextHistory) });
  }, []);

  const cancelPendingRecord = useCallback(() => {
    if (pendingRecordRef.current) {
      clearTimeout(pendingRecordRef.current);
      pendingRecordRef.current = null;
    }
  }, []);

  const recordNow = useCallback(() => {
    cancelPendingRecord();
    if (!canvas || isRestoringRef.current) {
      return;
    }
    const nextHistory = pushSnapshot(historyRef.current, serializeObjects(canvas));
    appliedHistoryRef.current = nextHistory;
    applyHistory(nextHistory);
  }, [canvas, applyHistory, cancelPendingRecord]);

  const recordChange = useCallback(() => {
    if (isRestoringRef.current) {
      return;
    }
    cancelPendingRecord();
    pendingRecordRef.current = setTimeout(recordNow, RECORD_DEBOUNCE_MS);
  }, [recordNow, cancelPendingRecord]);

  const recordDiscreteChange = useCallback(() => {
    if (isRestoringRef.current || isDiscreteRecordQueuedRef.current) {
      return;
    }
    // Fabric fires one event per object when several are added or removed
    // together. A microtask runs once the synchronous burst unwinds, so the
    // burst becomes one step before any user input can interleave.
    isDiscreteRecordQueuedRef.current = true;
    queueMicrotask(() => {
      isDiscreteRecordQueuedRef.current = false;
      recordNow();
    });
  }, [recordNow]);

  const resetHistory = useCallback(() => {
    cancelPendingRecord();
    const initialHistory = createHistory(canvas ? serializeObjects(canvas) : '[]');
    appliedHistoryRef.current = initialHistory;
    applyHistory(initialHistory);
  }, [canvas, applyHistory, cancelPendingRecord]);

  const restoreSnapshot = useCallback(async (targetHistory: CanvasHistory) => {
    if (!canvas) {
      return;
    }
    // Only the latest restore may touch the canvas. Key auto-repeat starts
    // several restores at once, and an older one could resolve last.
    const restoreSequence = ++restoreSequenceRef.current;
    const isSuperseded = () => restoreSequence !== restoreSequenceRef.current;
    const restoredObjects = await fabric.util
      .enlivenObjects<fabric.FabricObject>(JSON.parse(targetHistory.present))
      .catch((error: unknown) => {
        // A newer restore already moved the history, so rolling back here
        // would undo that move instead of this one.
        if (isSuperseded()) {
          console.error('Ignoring failure of a superseded canvas restore', error);
          return null;
        }
        throw error;
      });
    if (!restoredObjects || isSuperseded()) {
      return;
    }
    const previousObjects = canvas.getObjects();
    const activeObject = canvas.getActiveObject();
    const activeIndex = activeObject ? previousObjects.indexOf(activeObject) : -1;
    // Suppress recording only around the synchronous swap. A try/finally
    // would make the React Compiler lint skip this hook entirely.
    isRestoringRef.current = true;
    canvas.discardActiveObject();
    canvas.remove(...previousObjects);
    canvas.add(...restoredObjects);
    // Reselecting fires selection events, so the property panel stays open
    // and shows the restored values.
    const reselectedObject = restoredObjects[activeIndex];
    if (reselectedObject) {
      canvas.setActiveObject(reselectedObject);
    }
    isRestoringRef.current = false;
    appliedHistoryRef.current = targetHistory;
    canvas.requestRenderAll();
  }, [canvas]);

  const moveHistory = useCallback(async (step: (history: CanvasHistory) => CanvasHistory) => {
    // Flush a pending edit first so that undo reverts it instead of the one before.
    if (pendingRecordRef.current) {
      recordNow();
    }
    const nextHistory = step(historyRef.current);
    if (nextHistory === historyRef.current) {
      return;
    }
    applyHistory(nextHistory);
    // Roll the history back to what the canvas shows when Fabric fails to
    // rebuild the objects. An earlier restore may have been dropped, so the
    // history before this move can differ from the canvas.
    await restoreSnapshot(nextHistory).catch((error: unknown) => {
      console.error('Failed to restore canvas snapshot', error);
      applyHistory(appliedHistoryRef.current);
    });
  }, [recordNow, applyHistory, restoreSnapshot]);

  const undo = useCallback(() => moveHistory(undoSnapshot), [moveHistory]);
  const redo = useCallback(() => moveHistory(redoSnapshot), [moveHistory]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    // Discrete actions get their own step even when a text edit follows quickly.
    const discreteEvents = ['object:added', 'object:modified', 'object:removed'] as const;
    discreteEvents.forEach((eventName) => canvas.on(eventName, recordDiscreteChange));
    canvas.on('text:changed', recordChange);
    return () => {
      discreteEvents.forEach((eventName) => canvas.off(eventName, recordDiscreteChange));
      canvas.off('text:changed', recordChange);
      cancelPendingRecord();
    };
  }, [canvas, recordDiscreteChange, recordChange, cancelPendingRecord]);

  return {
    undo,
    redo,
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
    recordChange,
    resetHistory,
  };
}
