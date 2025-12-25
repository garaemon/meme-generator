'use client';

import React from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Trash2, Clock } from 'lucide-react';

interface HistoryProps {
  onSelect: (state: object) => void;
}

export default function History({ onSelect }: HistoryProps) {
  const history = useLiveQuery(() => db.history.orderBy('createdAt').reverse().toArray());

  const deleteHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await db.history.delete(id);
  };

  if (!history || history.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Clock size={48} className="mb-4 opacity-50"/>
              <p>No history yet. Create your first meme!</p>
          </div>
      );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Creation History</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative group bg-white"
            onClick={() => onSelect(item.canvasState)}
          >
            <div className="aspect-square w-full overflow-hidden flex items-center justify-center bg-gray-100 relative">
                <Image 
                  src={item.thumbnail} 
                  alt="History Item" 
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
            </div>
            <div className="p-2 flex justify-between items-center text-xs text-gray-500 border-t">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <button 
                onClick={(e) => item.id && deleteHistory(e, item.id)} 
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
