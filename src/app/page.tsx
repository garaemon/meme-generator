'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/layout/Navigation';
import Gallery from '@/components/meme/Gallery';
import History from '@/components/meme/History';
import { db } from '@/lib/db';

// Dynamically import CanvasEditor to avoid SSR issues with Fabric.js
const CanvasEditor = dynamic(() => import('@/components/meme/CanvasEditor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading Editor...</div>
});

type Tab = 'editor' | 'gallery' | 'history';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('gallery'); // Start at gallery to pick a template
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<object | null>(null);

  const handleGallerySelect = (url: string) => {
    setEditorImage(url);
    setEditorState(null); // Reset state so it loads the image
    setActiveTab('editor');
  };

  const handleHistorySelect = (state: object) => {
    setEditorState(state);
    setEditorImage(null); // Reset image so it loads the state
    setActiveTab('editor');
  };

  const handleSave = async (blob: Blob, json: object) => {
    // Convert blob to base64 for thumbnail storage
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      
      await db.history.add({
        thumbnail: base64data,
        canvasState: json,
        createdAt: new Date(),
      });
      
      // Optional: Notify user or just stay in editor
      // alert('Saved to history!'); 
    };
  };

  return (
    <main className="flex h-screen bg-gray-100 overflow-hidden">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 h-full overflow-hidden">
        {activeTab === 'editor' && (
          <div className="h-full p-4">
            <CanvasEditor 
              initialImage={editorImage} 
              initialState={editorState}
              onSave={handleSave}
            />
          </div>
        )}
        
        {activeTab === 'gallery' && (
          <div className="h-full overflow-hidden">
            <Gallery onSelect={handleGallerySelect} />
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="h-full overflow-hidden">
            <History onSelect={handleHistorySelect} />
          </div>
        )}
      </div>
    </main>
  );
}