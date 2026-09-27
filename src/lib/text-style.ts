/** Shadow applied by the text Shadow toggle. Offsets and blur are in canvas pixels. */
export const MEME_TEXT_SHADOW = {
  color: 'rgba(0, 0, 0, 0.8)',
  blur: 8,
  offsetX: 3,
  offsetY: 3,
};

/**
 * Returns the text uppercased when `isUppercase` is true.
 *
 * Characters whose uppercase form is longer, such as 'ß' -> 'SS', stay
 * unchanged. The length must not change, because Fabric keeps the caret
 * index while the user edits text in place.
 */
export function applyTextCase(text: string, isUppercase: boolean): string {
  if (!isUppercase) {
    return text;
  }
  return Array.from(text, (character) => {
    const upperCharacter = character.toUpperCase();
    return upperCharacter.length === character.length ? upperCharacter : character;
  }).join('');
}

export function isShadowEnabled(shadow: object | null | undefined): boolean {
  return shadow != null;
}
