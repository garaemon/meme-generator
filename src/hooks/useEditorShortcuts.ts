import { useEffect } from 'react';

interface EditorShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
}

// Fabric edits IText through a hidden textarea, so this check also skips
// in-place text editing on the canvas.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

/**
 * Binds editor keyboard shortcuts to the window while mounted.
 *
 * Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes, and
 * Delete/Backspace deletes. Keys typed into form fields pass through.
 */
export function useEditorShortcuts({ onUndo, onRedo, onDelete }: EditorShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      const hasModifier = event.ctrlKey || event.metaKey;
      const lowerCaseKey = event.key.toLowerCase();
      if (hasModifier && lowerCaseKey === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
      } else if (hasModifier && lowerCaseKey === 'y') {
        event.preventDefault();
        onRedo();
      } else if (!hasModifier && (lowerCaseKey === 'delete' || lowerCaseKey === 'backspace')) {
        event.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onDelete]);
}
