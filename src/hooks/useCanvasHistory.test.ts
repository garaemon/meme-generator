import { act, renderHook } from '@testing-library/react';
import * as fabric from 'fabric';
import { useCanvasHistory } from './useCanvasHistory';

jest.mock('fabric', () => ({
  util: { enlivenObjects: jest.fn() },
}));

const mockedEnlivenObjects = fabric.util.enlivenObjects as unknown as jest.Mock;

interface FakeObject {
  name: string;
  toObject: () => { name: string };
}

function createFakeObject(name: string): FakeObject {
  return { name, toObject: () => ({ name }) };
}

// Implements only the canvas surface that useCanvasHistory touches.
function createFakeCanvas() {
  const handlers = new Map<string, Set<() => void>>();
  const objects: FakeObject[] = [];
  const canvas = {
    objects,
    on: (eventName: string, handler: () => void) => {
      const eventHandlers = handlers.get(eventName) ?? new Set();
      eventHandlers.add(handler);
      handlers.set(eventName, eventHandlers);
    },
    off: (eventName: string, handler: () => void) => handlers.get(eventName)?.delete(handler),
    emit: (eventName: string) => handlers.get(eventName)?.forEach((handler) => handler()),
    getObjects: () => [...objects],
    getActiveObject: () => undefined,
    discardActiveObject: jest.fn(),
    setActiveObject: jest.fn(),
    requestRenderAll: jest.fn(),
    remove: (...removed: FakeObject[]) => {
      removed.forEach((object) => objects.splice(objects.indexOf(object), 1));
    },
    add: (...added: FakeObject[]) => objects.push(...added),
  };
  return canvas;
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

// Leaves the history at [], [a], [a, b] with [a, b] as the present snapshot.
async function setUpHistoryWithTwoEdits() {
  const canvas = createFakeCanvas();
  const { result } = renderHook(() => useCanvasHistory(canvas as unknown as fabric.Canvas));
  // Separate acts let the queued record of each edit run before the next one.
  for (const name of ['a', 'b']) {
    await act(async () => {
      canvas.add(createFakeObject(name));
      canvas.emit('object:added');
    });
  }
  return { canvas, result };
}

describe('useCanvasHistory', () => {
  beforeEach(() => {
    mockedEnlivenObjects.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should_roll_back_history_when_restore_fails', async () => {
    const { result } = await setUpHistoryWithTwoEdits();
    mockedEnlivenObjects.mockRejectedValueOnce(new Error('broken snapshot'));

    await act(() => result.current.undo());

    expect({ canUndo: result.current.canUndo, canRedo: result.current.canRedo })
      .toEqual({ canUndo: true, canRedo: false });
  });

  it('should_apply_only_latest_restore_when_undo_called_twice', async () => {
    const { canvas, result } = await setUpHistoryWithTwoEdits();
    const firstRestore = createDeferred<FakeObject[]>();
    mockedEnlivenObjects.mockReturnValueOnce(firstRestore.promise).mockResolvedValueOnce([]);

    await act(async () => {
      const firstUndo = result.current.undo();
      await result.current.undo();
      firstRestore.resolve([createFakeObject('a')]);
      await firstUndo;
    });

    expect(canvas.objects).toEqual([]);
  });

  it('should_keep_history_when_superseded_restore_fails', async () => {
    const { result } = await setUpHistoryWithTwoEdits();
    const firstRestore = createDeferred<FakeObject[]>();
    mockedEnlivenObjects.mockReturnValueOnce(firstRestore.promise).mockResolvedValueOnce([]);

    await act(async () => {
      const firstUndo = result.current.undo();
      await result.current.undo();
      firstRestore.reject(new Error('broken snapshot'));
      await firstUndo;
    });

    expect({ canUndo: result.current.canUndo, canRedo: result.current.canRedo })
      .toEqual({ canUndo: false, canRedo: true });
  });

  it('should_roll_back_to_canvas_state_when_latest_restore_fails', async () => {
    const { canvas, result } = await setUpHistoryWithTwoEdits();
    const firstRestore = createDeferred<FakeObject[]>();
    mockedEnlivenObjects
      .mockReturnValueOnce(firstRestore.promise)
      .mockRejectedValueOnce(new Error('broken snapshot'));

    await act(async () => {
      const firstUndo = result.current.undo();
      await result.current.undo();
      firstRestore.resolve([createFakeObject('a')]);
      await firstUndo;
    });

    expect({ objectCount: canvas.objects.length, canRedo: result.current.canRedo })
      .toEqual({ objectCount: 2, canRedo: false });
  });
  it('should_record_one_step_when_objects_removed_together', async () => {
    const { canvas, result } = await setUpHistoryWithTwoEdits();
    mockedEnlivenObjects.mockResolvedValueOnce([]);
    // Fabric fires object:removed once per object while splicing the list.
    await act(async () => {
      [...canvas.objects].forEach((object) => {
        canvas.remove(object);
        canvas.emit('object:removed');
      });
    });

    await act(() => result.current.undo());

    expect(mockedEnlivenObjects).toHaveBeenCalledWith([{ name: 'a' }, { name: 'b' }]);
  });
});
