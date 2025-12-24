'use client';

import React from 'react';
import { Image, History as HistoryIcon } from 'lucide-react';

type Tab = 'editor' | 'gallery' | 'history';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navItems = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ] as const;

  return (
    <div className="w-16 md:w-64 bg-slate-900 text-white flex flex-col h-screen shrink-0">
      <div className="p-4 font-bold text-xl tracking-tighter hidden md:block border-b border-slate-800 mb-4">
        MemeGen
      </div>
      <nav className="flex-1 flex flex-col gap-2 p-2">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <Icon size={24} />
                    <span className="hidden md:inline font-medium">{item.label}</span>
                </button>
            );
        })}
      </nav>
    </div>
  );
}
