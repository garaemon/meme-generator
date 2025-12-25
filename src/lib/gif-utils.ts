import { parseGIF, decompressFrames } from 'gifuct-js';

export interface GifFrame {
  imageData: ImageData;
  delay: number;
  dims: { width: number; height: number; top: number; left: number };
}

export async function parseGif(url: string): Promise<GifFrame[]> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // Set canvas size to GIF size
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  canvas.width = width;
  canvas.height = height;

  const resultFrames: GifFrame[] = [];
  
  // To handle disposal, we might need to keep track of previous states.
  // Simplified frame composition loop

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    // Handle disposal of previous frame before drawing current
    // (This logic is simplified; full GIF spec compliance is complex)
    // gifuct-js returns raw pixels in 'patch'.

    // Draw current frame patch
    if (frame.patch.length > 0) {
      const patchData = new ImageData(
        new Uint8ClampedArray(frame.patch),
        frame.dims.width,
        frame.dims.height
      );
        
      // Create a temp canvas for the patch to draw it at the correct position
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frame.dims.width;
      tempCanvas.height = frame.dims.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(patchData, 0, 0);
        ctx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);
      }
    }

    // Capture the full frame
    const currentImageData = ctx.getImageData(0, 0, width, height);
    
    resultFrames.push({
      imageData: currentImageData,
      delay: frame.delay,
      dims: { width, height, top: 0, left: 0 }
    });

    // Handle Disposal for NEXT frame preparation
    // frame.disposalType:
    // 0: No disposal specified (do nothing)
    // 1: Do not dispose (leave as is) -> This is what we did (accumulated).
    // 2: Restore to background color.
    // 3: Restore to previous.
    
    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } 
    // disposalType 3 is hard to handle without saving state before drawing.
    // Ignoring for MVP as it requires deep history tracking.
  }

  return resultFrames;
}
