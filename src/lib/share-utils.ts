/**
 * Returns whether the browser can put an image of the MIME type on the clipboard.
 *
 * Browsers generally accept only PNG images, so GIF memes cannot be copied.
 */
export function canCopyImageType(mimeType: string): boolean {
  if (typeof window === 'undefined' || !window.ClipboardItem || !navigator.clipboard?.write) {
    return false;
  }
  // Safari before 17.4 lacks ClipboardItem.supports but accepts PNG.
  if (typeof window.ClipboardItem.supports !== 'function') {
    return mimeType === 'image/png';
  }
  return window.ClipboardItem.supports(mimeType);
}

/**
 * Writes the image to the system clipboard.
 *
 * Takes a promise instead of a blob because Safari rejects clipboard writes
 * that start after an `await` breaks the user-gesture chain. Rejects when
 * the user denies clipboard permission.
 */
export async function copyImageToClipboard(blobPromise: Promise<Blob>, mimeType: string): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blobPromise })]);
}

/** Returns whether the Web Share API can share the file on this device. */
export function canShareFile(file: File): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  return navigator.canShare({ files: [file] });
}

/**
 * Opens the native share sheet for the file.
 *
 * Rejects with an `AbortError` when the user dismisses the sheet.
 */
export async function shareImageFile(file: File): Promise<void> {
  await navigator.share({ files: [file] });
}
