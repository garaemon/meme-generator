import {
  canRedo,
  canUndo,
  createHistory,
  pushSnapshot,
  redoSnapshot,
  undoSnapshot,
} from './canvas-history';

describe('canvas-history', () => {
  it('should_not_allow_undo_when_history_is_new', () => {
    const history = createHistory('initial');

    expect(canUndo(history)).toBe(false);
  });

  it('should_not_allow_redo_when_history_is_new', () => {
    const history = createHistory('initial');

    expect(canRedo(history)).toBe(false);
  });

  it('should_set_present_when_snapshot_pushed', () => {
    const history = createHistory('initial');

    const pushedHistory = pushSnapshot(history, 'second');

    expect(pushedHistory.present).toBe('second');
  });

  it('should_ignore_snapshot_identical_to_present', () => {
    const history = pushSnapshot(createHistory('initial'), 'second');

    const pushedHistory = pushSnapshot(history, 'second');

    expect(pushedHistory).toBe(history);
  });

  it('should_return_previous_snapshot_when_undo', () => {
    const history = pushSnapshot(createHistory('initial'), 'second');

    const undoneHistory = undoSnapshot(history);

    expect(undoneHistory.present).toBe('initial');
  });

  it('should_return_same_history_when_undo_without_past', () => {
    const history = createHistory('initial');

    const undoneHistory = undoSnapshot(history);

    expect(undoneHistory).toBe(history);
  });

  it('should_restore_undone_snapshot_when_redo', () => {
    const history = undoSnapshot(pushSnapshot(createHistory('initial'), 'second'));

    const redoneHistory = redoSnapshot(history);

    expect(redoneHistory.present).toBe('second');
  });

  it('should_return_same_history_when_redo_without_future', () => {
    const history = createHistory('initial');

    const redoneHistory = redoSnapshot(history);

    expect(redoneHistory).toBe(history);
  });

  it('should_clear_redo_stack_when_new_snapshot_pushed', () => {
    const undoneHistory = undoSnapshot(pushSnapshot(createHistory('initial'), 'second'));

    const pushedHistory = pushSnapshot(undoneHistory, 'third');

    expect(canRedo(pushedHistory)).toBe(false);
  });

  it('should_drop_oldest_snapshot_when_exceeding_limit', () => {
    const maxPastCount = 2;
    const history = ['a', 'b', 'c', 'd'].reduce(
      (accumulated, snapshot) => pushSnapshot(accumulated, snapshot, maxPastCount),
      createHistory('initial'),
    );

    expect(history.past).toEqual(['b', 'c']);
  });
});
