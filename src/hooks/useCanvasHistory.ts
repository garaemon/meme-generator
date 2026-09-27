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
  const historyRef = useRef<CanvasHistory>(createHistory('[]'));
  const isRestoringRef = useRef(false);
  const pendingRecordRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    applyHistory(pushSnapshot(historyRef.current, serializeObjects(canvas)));
  }, [canvas, applyHistory, cancelPendingRecord]);

  const recordChange = useCallback(() => {
    if (isRestoringRef.current) {
      return;
    }
    cancelPendingRecord();
    pendingRecordRef.current = setTimeout(recordNow, RECORD_DEBOUNCE_MS);
  }, [recordNow, cancelPendingRecord]);

  const resetHistory = useCallback(() => {
    cancelPendingRecord();
    applyHistory(createHistory(canvas ? serializeObjects(canvas) : '[]'));
  }, [canvas, applyHistory, cancelPendingRecord]);

  const restoreSnapshot = useCallback(async (snapshot: string) => {
    if (!canvas) {
      return;
    }
    isRestoringRef.current = true;
    try {
      const restoredObjects = await fabric.util.enlivenObjects<fabric.FabricObject>(JSON.parse(snapshot));
      canvas.discardActiveObject();
      canvas.remove(...canvas.getObjects());
      canvas.add(...restoredObjects);
      canvas.requestRenderAll();
    } finally {
      isRestoringRef.current = false;
    }
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
    await restoreSnapshot(nextHistory.present);
  }, [recordNow, applyHistory, restoreSnapshot]);

  const undo = useCallback(() => moveHistory(undoSnapshot), [moveHistory]);
  const redo = useCallback(() => moveHistory(redoSnapshot), [moveHistory]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    // Discrete actions get their own step even when a text edit follows quickly.
    const discreteEvents = ['object:added', 'object:modified', 'object:removed'] as const;
    discreteEvents.forEach((eventName) => canvas.on(eventName, recordNow));
    canvas.on('text:changed', recordChange);
    return () => {
      discreteEvents.forEach((eventName) => canvas.off(eventName, recordNow));
      canvas.off('text:changed', recordChange);
      cancelPendingRecord();
    };
  }, [canvas, recordNow, recordChange, cancelPendingRecord]);

  return {
    undo,
    redo,
    canUndo: availability.canUndo,
    canRedo: availability.canRedo,
    recordChange,
    resetHistory,
  };
}
