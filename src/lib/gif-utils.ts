import { parseGIF, decompressFrames } from 'gifuct-js';

export interface GifFrame {
  imageData: ImageData;
  delay: number;
  dims: { width: number; height: number; top: number; left: number };
}

export interface ParsedGif {
  frames: GifFrame[];
  width: number;
  height: number;
}

export async function parseGif(url: string): Promise<ParsedGif> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);

  const resultFrames: GifFrame[] = [];
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    const patchData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height
    );

    resultFrames.push({
      imageData: patchData,
      delay: Math.max(frame.delay, 20),
      dims: { 
        width: frame.dims.width, 
        height: frame.dims.height, 
        top: frame.dims.top, 
        left: frame.dims.left 
      }
    });
  }

  return {
    frames: resultFrames,
    width: gif.lsd.width,
    height: gif.lsd.height
  };
}
