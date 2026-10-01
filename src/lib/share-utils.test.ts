import { canCopyImageType, canShareFile, copyImageToClipboard, shareImageFile } from './share-utils';

class FakeClipboardItem {
  static supports = jest.fn((type: string) => type === 'image/png');
  constructor(public items: Record<string, Promise<Blob>>) {}
}

function installClipboard(write: jest.Mock) {
  Object.defineProperty(navigator, 'clipboard', { value: { write }, configurable: true });
  Object.defineProperty(window, 'ClipboardItem', { value: FakeClipboardItem, configurable: true });
}

function uninstallClipboard() {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  Object.defineProperty(window, 'ClipboardItem', { value: undefined, configurable: true });
}

function installShare(share: jest.Mock, canShare: (data: ShareData) => boolean) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true });
}

function uninstallShare() {
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
}

describe('share-utils', () => {
  afterEach(() => {
    uninstallClipboard();
    uninstallShare();
  });

  it('should_report_png_copyable_when_clipboard_supports_png', () => {
    installClipboard(jest.fn());

    expect(canCopyImageType('image/png')).toBe(true);
  });

  it('should_report_gif_not_copyable_when_clipboard_rejects_gif', () => {
    installClipboard(jest.fn());

    expect(canCopyImageType('image/gif')).toBe(false);
  });

  it('should_report_not_copyable_when_clipboard_api_missing', () => {
    uninstallClipboard();

    expect(canCopyImageType('image/png')).toBe(false);
  });

  it('should_write_blob_to_clipboard_under_its_type', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    installClipboard(write);
    const blob = new Blob(['png'], { type: 'image/png' });

    await copyImageToClipboard(Promise.resolve(blob), 'image/png');

    const [[clipboardItems]] = write.mock.calls;
    await expect(clipboardItems[0].items['image/png']).resolves.toBe(blob);
  });

  it('should_report_file_shareable_when_can_share_accepts_it', () => {
    installShare(jest.fn(), () => true);

    expect(canShareFile(new File(['x'], 'meme.png', { type: 'image/png' }))).toBe(true);
  });

  it('should_report_file_not_shareable_when_share_api_missing', () => {
    uninstallShare();

    expect(canShareFile(new File(['x'], 'meme.png', { type: 'image/png' }))).toBe(false);
  });

  it('should_share_file_through_navigator_share', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    installShare(share, () => true);
    const file = new File(['x'], 'meme.png', { type: 'image/png' });

    await shareImageFile(file);

    expect(share).toHaveBeenCalledWith({ files: [file] });
  });
});
