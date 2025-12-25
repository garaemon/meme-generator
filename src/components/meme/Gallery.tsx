'use client';

import React from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Plus, Trash2 } from 'lucide-react';

interface GalleryProps {
  onSelect: (url: string) => void;
}

const DEFAULT_TEMPLATES = [
  { name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { name: 'Roll Safe (Thinking Guy)', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif' },
  { name: 'Math Lady', url: 'https://media.giphy.com/media/APqEbxBsVlkWSuFcsL/giphy.gif' },
  { name: 'Vince McMahon', url: 'https://media.giphy.com/media/7FyMQm2vBiTjG/giphy.gif' },
  { name: 'Mocking Spongebob', url: 'https://i.imgflip.com/1otk96.jpg' },
  { name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
];

export default function Gallery({ onSelect }: GalleryProps) {
  const templates = useLiveQuery(() => db.templates.toArray());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      await db.templates.add({
        name: file.name,
        data: dataUrl,
        isCustom: true,
        addedAt: new Date(),
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteTemplate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await db.templates.delete(id);
  };

  const getProxiedUrl = (url: string) => {
    if (url.startsWith('http')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const isGif = (url: string) => url.toLowerCase().endsWith('.gif') || url.startsWith('data:image/gif');

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Template Gallery</h2>
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Upload Custom Template
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Default Templates (Static for now, could be seeded to DB) */}
        {DEFAULT_TEMPLATES.map((tmpl) => (
          <div 
            key={tmpl.url} 
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative group bg-white"
            onClick={() => onSelect(getProxiedUrl(tmpl.url))}
          >
            <div className="w-full h-40 relative">
              <Image 
                src={tmpl.url} 
                alt={tmpl.name} 
                fill
                unoptimized={isGif(tmpl.url)}
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
            <div className="p-2 bg-white">
              <p className="text-sm font-medium truncate text-slate-700">{tmpl.name}</p>
            </div>
          </div>
        ))}

        {/* User Templates */}
        {templates?.map((tmpl) => (
          <div 
            key={tmpl.id} 
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative group bg-white"
            onClick={() => onSelect(tmpl.data)}
          >
            <div className="w-full h-40 relative">
              <Image 
                src={tmpl.data} 
                alt={tmpl.name} 
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
            <div className="p-2 bg-white flex justify-between items-center">
              <p className="text-sm font-medium truncate text-slate-700">{tmpl.name}</p>
              <button 
                onClick={(e) => tmpl.id && deleteTemplate(e, tmpl.id)} 
                className="text-red-500 hover:bg-red-50 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
