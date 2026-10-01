import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { useEditorShortcuts } from './useEditorShortcuts';

function setUpHandlers() {
  const handlers = { onUndo: jest.fn(), onRedo: jest.fn(), onDelete: jest.fn() };
  renderHook(() => useEditorShortcuts(handlers));
  return handlers;
}

describe('useEditorShortcuts', () => {
  it('should_call_undo_when_ctrl_z_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
  });

  it('should_call_undo_when_meta_z_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'z', metaKey: true });

    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
  });

  it('should_call_redo_when_ctrl_shift_z_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true });

    expect(handlers.onRedo).toHaveBeenCalledTimes(1);
  });

  it('should_call_redo_when_ctrl_y_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });

    expect(handlers.onRedo).toHaveBeenCalledTimes(1);
  });

  it('should_call_delete_when_delete_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'Delete' });

    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should_call_delete_when_backspace_pressed', () => {
    const handlers = setUpHandlers();

    fireEvent.keyDown(window, { key: 'Backspace' });

    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should_ignore_backspace_when_typing_in_input', () => {
    const handlers = setUpHandlers();
    const textInput = document.createElement('input');
    document.body.appendChild(textInput);

    fireEvent.keyDown(textInput, { key: 'Backspace' });

    expect(handlers.onDelete).not.toHaveBeenCalled();
    textInput.remove();
  });

  it('should_ignore_ctrl_z_when_typing_in_textarea', () => {
    const handlers = setUpHandlers();
    const hiddenTextarea = document.createElement('textarea');
    document.body.appendChild(hiddenTextarea);

    fireEvent.keyDown(hiddenTextarea, { key: 'z', ctrlKey: true });

    expect(handlers.onUndo).not.toHaveBeenCalled();
    hiddenTextarea.remove();
  });
});
