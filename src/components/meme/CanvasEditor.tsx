'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Download, Type, Trash2, Loader2 } from 'lucide-react';
import GIF from 'gif.js';
import { parseGif, GifFrame } from '@/lib/gif-utils';

interface CanvasEditorProps {
  initialImage?: string | null;
  initialState?: object | null;
  onSave?: (blob: Blob, json: object) => void;
}

export default function CanvasEditor({ initialImage, initialState, onSave }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState('Impact');

  const [isGif, setIsGif] = useState(false);
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
  const [frameImages, setFrameImages] = useState<fabric.Image[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const CANVAS_SIZE = 600;

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: '#f3f4f6',
      enableRetinaScaling: false,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Setup Event Listeners
  useEffect(() => {
    if (!fabricCanvas) {
      return;
    }

    const updateControls = () => {
      const obj = fabricCanvas.getActiveObject();
      setSelectedObject(obj);
      if (obj && obj instanceof fabric.IText) {
        setText(obj.text || '');
        setColor(obj.fill as string || '#ffffff');
        setStrokeColor(obj.stroke as string || '#000000');
        setStrokeWidth(obj.strokeWidth || 2);
        setFontSize(obj.fontSize || 40);
        setFontFamily(obj.fontFamily || 'Impact');
      } else {
        setText('');
      }
    };

    fabricCanvas.on('selection:created', updateControls);
    fabricCanvas.on('selection:updated', updateControls);
    fabricCanvas.on('selection:cleared', updateControls);
    fabricCanvas.on('object:modified', updateControls);

    return () => {
      fabricCanvas.off('selection:created', updateControls);
      fabricCanvas.off('selection:updated', updateControls);
      fabricCanvas.off('selection:cleared', updateControls);
      fabricCanvas.off('object:modified', updateControls);
    };
  }, [fabricCanvas]);

  // Animation Loop for Editor
  useEffect(() => {
    if (!isGif || frameImages.length === 0 || !fabricCanvas) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let currentIdx = 0;

    const play = () => {
      const img = frameImages[currentIdx];
       
      fabricCanvas.backgroundImage = img;
      fabricCanvas.requestRenderAll();

      const delay = gifFrames[currentIdx]?.delay || 100;
      currentIdx = (currentIdx + 1) % frameImages.length;
      timeoutId = setTimeout(play, delay);
    };

    play();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGif, frameImages, fabricCanvas, gifFrames]);

  // Load Content (State or Image)
  useEffect(() => {
    if (!fabricCanvas) {
      return;
    }

    const setupBackgroundImage = (img: fabric.Image) => {
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      const aspectRatio = imgWidth / imgHeight;

      let canvasWidth = CANVAS_SIZE;
      let canvasHeight = CANVAS_SIZE;

      if (aspectRatio > 1) {
        // Landscape
        canvasHeight = CANVAS_SIZE / aspectRatio;
      } else {
        // Portrait
        canvasWidth = CANVAS_SIZE * aspectRatio;
      }

      fabricCanvas.setDimensions({ 
        width: Math.round(canvasWidth), 
        height: Math.round(canvasHeight) 
      });

      const scale = canvasWidth / imgWidth;

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      });

      return img;
    };

    const loadStaticImage = (url: string) => {
      fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        const configuredImg = setupBackgroundImage(img);
         
        fabricCanvas.backgroundImage = configuredImg;
        fabricCanvas.renderAll();
      }).catch(err => {
        console.error("Failed to load image", err);
      });
    };

    if (initialState) {
      fabricCanvas.loadFromJSON(initialState).then(() => {
        fabricCanvas.renderAll();
        fabricCanvas.discardActiveObject();
      });
    } else if (initialImage) {
      // Clear current state immediately
      fabricCanvas.clear();
      fabricCanvas.set('backgroundColor', '#f3f4f6');
      // eslint-disable-next-line react-hooks/immutability
      fabricCanvas.backgroundImage = undefined;
      fabricCanvas.setDimensions({ width: CANVAS_SIZE, height: CANVAS_SIZE });
      fabricCanvas.renderAll();

      setIsGif(false);
      setGifFrames([]);
      setFrameImages([]);

      // Check if GIF
      fetch(initialImage)
        .then(async (res) => {
          const contentType = res.headers.get('Content-Type');
          console.log(`Loading image: ${initialImage}, Content-Type: ${contentType}`);

          if (contentType === 'image/gif' || initialImage.toLowerCase().endsWith('.gif')) {
            try {
              console.log("Parsing GIF frames...");
              const parsedGif = await parseGif(initialImage);
              
              const imgWidth = parsedGif.width || 1;
              const imgHeight = parsedGif.height || 1;
              const aspectRatio = imgWidth / imgHeight;

              let canvasWidth = CANVAS_SIZE;
              let canvasHeight = CANVAS_SIZE;

              if (aspectRatio > 1) {
                canvasHeight = CANVAS_SIZE / aspectRatio;
              } else {
                canvasWidth = CANVAS_SIZE * aspectRatio;
              }

              fabricCanvas.setDimensions({ 
                width: Math.round(canvasWidth), 
                height: Math.round(canvasHeight) 
              });

              const scale = canvasWidth / imgWidth;

              const imgs = parsedGif.frames.map((frame) => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = imgHeight;
                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                  const patchCanvas = document.createElement('canvas');
                  patchCanvas.width = frame.dims.width;
                  patchCanvas.height = frame.dims.height;
                  patchCanvas.getContext('2d')?.putImageData(frame.imageData, 0, 0);
                  ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
                }

                const img = new fabric.Image(tempCanvas);
                img.set({
                  scaleX: scale,
                  scaleY: scale,
                  originX: 'left',
                  originY: 'top',
                  left: 0,
                  top: 0,
                  selectable: false,
                  evented: false,
                });
                return img;
              });

              setGifFrames(parsedGif.frames);
              setFrameImages(imgs);
              setIsGif(true);
            } catch (err) {
              console.error("Failed to parse GIF", err);
              loadStaticImage(initialImage);
            }
          } else {
            loadStaticImage(initialImage);
          }
        })
        .catch(err => {
          console.error("Failed to fetch image info", err);
          loadStaticImage(initialImage);
        });
    }
  }, [fabricCanvas, initialImage, initialState]);

  const addText = () => {
    if (!fabricCanvas) {
      return;
    }
    const iText = new fabric.IText('New Text', {
      left: fabricCanvas.width! / 4,
      top: fabricCanvas.height! / 4,
      fontFamily: fontFamily,
      fill: color,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fontSize: fontSize || Math.round(fabricCanvas.height! / 10),
    });
    fabricCanvas.add(iText);
    fabricCanvas.setActiveObject(iText);
    fabricCanvas.renderAll();
  };

  const updateSelectedObject = (key: string, value: string | number) => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      activeObject.set(key as keyof fabric.IText, value);
      activeObject.dirty = true;
      fabricCanvas?.requestRenderAll();
      
      // Update individual states to keep UI in sync
      if (key === 'text') {
        setText(value as string);
      } else if (key === 'fill') {
        setColor(value as string);
      } else if (key === 'stroke') {
        setStrokeColor(value as string);
      } else if (key === 'strokeWidth') {
        setStrokeWidth(Number(value));
      } else if (key === 'fontSize') {
        setFontSize(Number(value));
      } else if (key === 'fontFamily') {
        setFontFamily(value as string);
      }
      
      setSelectedObject(activeObject);
    }
  };

  const deleteSelected = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.remove(selectedObject);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setSelectedObject(null);
    }
  };

  const download = async () => {
    if (!fabricCanvas) {
      return;
    }

    // Deselect any active object before export to avoid showing control handles
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    if (isGif && gifFrames.length > 0) {
      setIsProcessing(true);
      try {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          workerScript: '/gif.worker.js',
          width: Math.floor(fabricCanvas.getWidth() || 0),
          height: Math.floor(fabricCanvas.getHeight() || 0),
        });

        // Loop through frames
        for (let i = 0; i < gifFrames.length; i++) {
          const img = frameImages[i];

          // eslint-disable-next-line react-hooks/immutability
          fabricCanvas.backgroundImage = img;
          // Use renderAll (synchronous) to ensure background is updated before capture
          fabricCanvas.renderAll();

          gif.addFrame(fabricCanvas.getElement(), { delay: gifFrames[i].delay, copy: true });
        }

        gif.on('finished', (blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `meme-${Date.now()}.gif`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (onSave) {
            onSave(blob, fabricCanvas.toJSON());
          }
          setIsProcessing(false);
        });

        gif.render();
      } catch (err) {
        console.error("GIF generation failed", err);
        setIsProcessing(false);
        alert("Failed to generate GIF");
      }
      return;
    }

    // Export PNG at full resolution
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });

    // Convert DataURL to Blob for DB
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        // Trigger download
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `meme-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Save to history
        if (onSave) {
          onSave(blob, fabricCanvas.toJSON());
        }
      });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-200 flex items-center justify-center p-4 rounded-lg overflow-auto">
        <div className="max-w-full max-h-full">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full md:w-80 bg-white p-4 shadow-lg rounded-lg flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-2 text-slate-800">Editor Tools</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={addText} className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2">
              <Type size={16} /> Add Text
            </button>
            <button onClick={deleteSelected} disabled={!selectedObject} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50">
              <Trash2 size={16} />
            </button>
          </div>

          {selectedObject instanceof fabric.IText ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">Text Content</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    updateSelectedObject('text', e.target.value);
                  }}
                  className="w-full border p-2 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    updateSelectedObject('fontFamily', e.target.value);
                  }}
                  className="w-full border p-2 rounded text-slate-900"
                >
                  <option value="Impact">Impact</option>
                  <option value="Arial">Arial</option>
                  <option value="var(--font-anton)">Anton</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      updateSelectedObject('fill', e.target.value);
                    }}
                    className="w-full h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Size</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFontSize(val);
                      updateSelectedObject('fontSize', val);
                    }}
                    className="w-full border p-2 rounded text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Stroke</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      updateSelectedObject('stroke', e.target.value);
                    }}
                    className="w-full h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Stroke Width</label>
                  <input
                    type="number"
                    value={strokeWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStrokeWidth(val);
                      updateSelectedObject('strokeWidth', val);
                    }}
                    className="w-full border p-2 rounded text-slate-900"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm italic">
                    Select a text object to edit its properties.
            </div>
          )}

          <hr className="my-2" />

          <button onClick={download} disabled={isProcessing} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50">
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Generating GIF...
              </>
            ) : (
              <>
                <Download size={20} /> {isGif ? 'Download GIF' : 'Download Meme'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
