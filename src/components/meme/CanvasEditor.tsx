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
  // ... existing state ...
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState('Impact');

  const [isGif, setIsGif] = useState(false);
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#f3f4f6',
    });

    setFabricCanvas(canvas);

    const updateControls = (obj: fabric.Object | null) => {
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

    canvas.on('selection:created', (e) => updateControls(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => updateControls(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => updateControls(null));

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load Content (State or Image)
  useEffect(() => {
    if (!fabricCanvas) {
      return;
    }

    const setupBackgroundImage = (img: fabric.Image) => {
      const scale = Math.min(
        (fabricCanvas.width || 600) / (img.width || 1),
        (fabricCanvas.height || 600) / (img.height || 1)
      );
      
      img.scale(scale);
      fabricCanvas.backgroundImage = img;
      
      img.originX = 'left';
      img.originY = 'top';
      img.left = (fabricCanvas.width! - img.width! * scale) / 2;
      img.top = (fabricCanvas.height! - img.height! * scale) / 2;
      
      fabricCanvas.renderAll();
    };

    const loadStaticImage = (url: string) => {
      fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        setupBackgroundImage(img);
      }).catch(err => {
        console.error("Failed to load image", err);
      });
    };

    if (initialState) {
      fabricCanvas.loadFromJSON(initialState).then(() => {
        fabricCanvas.renderAll();
        // Reset selection if any
        fabricCanvas.discardActiveObject();
      });
    } else if (initialImage) {
      fabricCanvas.clear();
      fabricCanvas.set('backgroundColor', '#f3f4f6');
      fabricCanvas.renderAll();
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsGif(false);
      setGifFrames([]);

      // Check if GIF
      fetch(initialImage)
        .then(async (res) => {
          const contentType = res.headers.get('Content-Type');
          if (contentType === 'image/gif') {
            setIsGif(true);
            try {
              const frames = await parseGif(initialImage);
              setGifFrames(frames);
              if (frames.length > 0) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = frames[0].dims.width;
                tempCanvas.height = frames[0].dims.height;
                tempCanvas.getContext('2d')?.putImageData(frames[0].imageData, 0, 0);
                
                const img = new fabric.Image(tempCanvas);
                setupBackgroundImage(img);
              }
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
      left: 100,
      top: 100,
      fontFamily: 'Impact',
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      fontSize: 40,
    });
    fabricCanvas.add(iText);
    fabricCanvas.setActiveObject(iText);
  };

  const updateSelectedObject = (key: string, value: string | number) => {
    if (selectedObject && selectedObject instanceof fabric.IText) {
      selectedObject.set(key, value);
      fabricCanvas?.renderAll();
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
    
    if (isGif && gifFrames.length > 0) {
      setIsProcessing(true);
      try {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          workerScript: '/gif.worker.js',
          width: fabricCanvas.width,
          height: fabricCanvas.height,
        });

        // Loop through frames
        for (const frame of gifFrames) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = frame.dims.width;
          tempCanvas.height = frame.dims.height;
          tempCanvas.getContext('2d')?.putImageData(frame.imageData, 0, 0);
          
          const img = new fabric.Image(tempCanvas);
          
          // Re-apply scale and position logic
          const scale = Math.min(
            (fabricCanvas.width || 600) / (img.width || 1),
            (fabricCanvas.height || 600) / (img.height || 1)
          );
          img.scale(scale);
          img.originX = 'left';
          img.originY = 'top';
          img.left = (fabricCanvas.width! - img.width! * scale) / 2;
          img.top = (fabricCanvas.height! - img.height! * scale) / 2;
          
          fabricCanvas.set('backgroundImage', img);
          fabricCanvas.renderAll();
          
          gif.addFrame(fabricCanvas.getElement(), { delay: frame.delay, copy: true });
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

    // Export to blob
    // fabric.js keeps the state in memory, but to export including background we use toDataURL usually
    // but toBlob is better for Dexie.
    // However, fabricCanvas.toDataURL works best.
    
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
        <canvas ref={canvasRef} />
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
