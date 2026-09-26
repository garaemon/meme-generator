'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Plus, Search, Trash2 } from 'lucide-react';

interface GalleryProps {
  onSelect: (url: string) => void;
}

export const DEFAULT_TEMPLATES = [
  { name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { name: 'Roll Safe (Thinking Guy)', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif' },
  { name: 'Vince McMahon', url: 'https://media.giphy.com/media/7FyMQm2vBiTjG/giphy.gif' },
  { name: 'Mocking Spongebob', url: 'https://i.imgflip.com/1otk96.jpg' },
  { name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { name: 'Woman Yelling At Cat', url: 'https://i.imgflip.com/345v97.jpg' },
  { name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
  { name: 'Left Exit 12 Off Ramp', url: 'https://i.imgflip.com/22bdq6.jpg' },
  { name: 'Running Away Balloon', url: 'https://i.imgflip.com/261o3j.jpg' },
  { name: 'UNO Draw 25 Cards', url: 'https://i.imgflip.com/3lmzyx.jpg' },
  { name: 'Bernie I Am Once Again Asking', url: 'https://i.imgflip.com/3oevdk.jpg' },
  { name: 'Always Has Been', url: 'https://i.imgflip.com/46e43q.png' },
  { name: 'Buff Doge vs. Cheems', url: 'https://i.imgflip.com/43a45p.png' },
  { name: "Gru's Plan", url: 'https://i.imgflip.com/26jxvz.jpg' },
  { name: 'Tuxedo Winnie The Pooh', url: 'https://i.imgflip.com/2ybua0.png' },
  { name: 'Epic Handshake', url: 'https://i.imgflip.com/28s2gu.jpg' },
  { name: 'Anakin Padme 4 Panel', url: 'https://i.imgflip.com/5c7lwq.png' },
  { name: 'Trade Offer', url: 'https://i.imgflip.com/54hjww.jpg' },
  { name: 'Panik Kalm Panik', url: 'https://i.imgflip.com/3qqcim.png' },
  { name: 'Clown Applying Makeup', url: 'https://i.imgflip.com/38el31.jpg' },
  { name: 'Is This A Pigeon', url: 'https://i.imgflip.com/1o00in.jpg' },
  { name: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg' },
  { name: 'Monkey Puppet', url: 'https://i.imgflip.com/2gnnjh.jpg' },
  { name: 'Hide the Pain Harold', url: 'https://i.imgflip.com/gk5el.jpg' },
  { name: 'Sad Pablo Escobar', url: 'https://i.imgflip.com/1c1uej.jpg' },
  { name: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk.jpg' },
  { name: 'Waiting Skeleton', url: 'https://i.imgflip.com/2fm6x.jpg' },
  { name: 'Boardroom Meeting Suggestion', url: 'https://i.imgflip.com/m78d.jpg' },
  { name: 'Blank Nut Button', url: 'https://i.imgflip.com/1yxkcp.jpg' },
  { name: 'Bike Fall', url: 'https://i.imgflip.com/1b42wl.jpg' },
  { name: 'This Is Fine', url: 'https://i.imgflip.com/wxica.jpg' },
  { name: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg' },
  { name: 'One Does Not Simply', url: 'https://i.imgflip.com/1bij.jpg' },
  { name: 'Success Kid', url: 'https://i.imgflip.com/1bhk.jpg' },
  { name: 'Ancient Aliens', url: 'https://i.imgflip.com/26am.jpg' },
  { name: 'Futurama Fry', url: 'https://i.imgflip.com/1bgw.jpg' },
  { name: 'Leonardo Dicaprio Cheers', url: 'https://i.imgflip.com/39t1o.jpg' },
  { name: 'X, X Everywhere', url: 'https://i.imgflip.com/1ihzfe.jpg' },
  { name: "I Bet He's Thinking About Other Women", url: 'https://i.imgflip.com/1tl71a.jpg' },
  { name: 'The Scroll Of Truth', url: 'https://i.imgflip.com/21tqf4.jpg' },
  { name: 'Evil Kermit', url: 'https://i.imgflip.com/1e7ql7.jpg' },
  { name: 'Inhaling Seagull', url: 'https://i.imgflip.com/1w7ygt.jpg' },
  { name: 'Unsettled Tom', url: 'https://i.imgflip.com/2wifvo.jpg' },
  { name: "They're The Same Picture", url: 'https://i.imgflip.com/2za3u1.jpg' },
  { name: 'Third World Skeptical Kid', url: 'https://i.imgflip.com/265k.jpg' },
  { name: 'Grandma Finds The Internet', url: 'https://i.imgflip.com/1bhw.jpg' },
  { name: 'The Rock Driving', url: 'https://i.imgflip.com/grr.jpg' },
  { name: 'American Chopper Argument', url: 'https://i.imgflip.com/2896ro.jpg' },
  { name: 'Look At Me', url: 'https://i.imgflip.com/d0tb7.jpg' },
  { name: 'Finding Neverland', url: 'https://i.imgflip.com/3pnmg.jpg' },
  { name: 'Captain Picard Facepalm', url: 'https://i.imgflip.com/wczz.jpg' },
  { name: 'The Most Interesting Man In The World', url: 'https://i.imgflip.com/1bh8.jpg' },
  { name: 'Bad Luck Brian', url: 'https://i.imgflip.com/1bip.jpg' },
  { name: 'Grumpy Cat', url: 'https://i.imgflip.com/8p0a.jpg' },
  { name: 'First World Problems', url: 'https://i.imgflip.com/1bhf.jpg' },
  { name: 'Doge', url: 'https://i.imgflip.com/4t0m5.jpg' },
  { name: 'Matrix Morpheus', url: 'https://i.imgflip.com/25w3.jpg' },
  { name: 'That Would Be Great', url: 'https://i.imgflip.com/c2qn.jpg' },
  { name: 'Y U No', url: 'https://i.imgflip.com/1bh3.jpg' },
  { name: 'Philosoraptor', url: 'https://i.imgflip.com/1bgs.jpg' },
  { name: 'Imagination Spongebob', url: 'https://i.imgflip.com/3i7p.jpg' },
  { name: "But That's None Of My Business", url: 'https://i.imgflip.com/9sw43.jpg' },
  { name: 'Brace Yourselves X is Coming', url: 'https://i.imgflip.com/1bhm.jpg' },
  { name: 'X All The Y', url: 'https://i.imgflip.com/1bh9.jpg' },
  { name: 'Evil Toddler', url: 'https://i.imgflip.com/51s5.jpg' },
  { name: 'Star Wars Yoda', url: 'https://i.imgflip.com/8k0sa.jpg' },
  { name: 'Sleeping Shaq', url: 'https://i.imgflip.com/1nck6k.jpg' },
  { name: 'Hard To Swallow Pills', url: 'https://i.imgflip.com/271ps6.jpg' },
  { name: 'Trump Bill Signing', url: 'https://i.imgflip.com/1ii4oc.jpg' },
  { name: 'Guy Holding Cardboard Sign', url: 'https://i.imgflip.com/3l60ph.jpg' },
  { name: 'Spider-Man Pointing at Spider-Man', url: 'https://i.imgflip.com/1tkjq9.jpg' },
  { name: 'Megamind Peeking', url: 'https://i.imgflip.com/64sz4u.png' },
  { name: "This Is Where I'd Put My Trophy If I Had One", url: 'https://i.imgflip.com/1wz1x.jpg' },
  { name: 'Laughing Leo', url: 'https://i.imgflip.com/4acd7j.png' },
  { name: "They Don't Know", url: 'https://i.imgflip.com/4pn1an.png' },
  { name: 'Spongebob Ight Imma Head Out', url: 'https://i.imgflip.com/392xtu.jpg' },
  { name: 'Domino Effect', url: 'https://i.imgflip.com/2oo7h0.jpg' },
  { name: 'Car Salesman Slaps Roof Of Car', url: 'https://i.imgflip.com/2d3al6.jpg' },
  { name: 'Too Damn High', url: 'https://i.imgflip.com/1bik.jpg' },
  { name: "Don't You Squidward", url: 'https://i.imgflip.com/26br.jpg' },
  { name: 'Creepy Condescending Wonka', url: 'https://i.imgflip.com/1bim.jpg' },
  { name: 'Yo Dawg Heard You', url: 'https://i.imgflip.com/26hg.jpg' },
  { name: 'Who Would Win?', url: 'https://i.imgflip.com/1ooaki.jpg' },
  { name: 'You Guys Are Getting Paid', url: 'https://i.imgflip.com/2xscjb.png' },
  { name: 'Jack Sparrow Being Chased', url: 'https://i.imgflip.com/9vct.jpg' },
  { name: 'All My Homies Hate', url: 'https://i.imgflip.com/3kwur5.jpg' },
  { name: 'Mother Ignoring Kid Drowning In A Pool', url: 'https://i.imgflip.com/46hhvr.jpg' },
  { name: 'Marked Safe From', url: 'https://i.imgflip.com/2odckz.jpg' },
  { name: 'Scumbag Steve', url: 'https://i.imgflip.com/1bgy.jpg' },
  { name: 'Good Guy Greg', url: 'https://i.imgflip.com/1bgx.jpg' },
  { name: 'Two Guys On A Bus', url: 'https://i.imgflip.com/5ru4ym.jpg' },
];

export default function Gallery({ onSelect }: GalleryProps) {
  const templates = useLiveQuery(() => db.templates.toArray());
  const [query, setQuery] = useState('');
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (name: string) => name.toLowerCase().includes(normalizedQuery);
  const visibleDefaultTemplates = DEFAULT_TEMPLATES.filter(
    (tmpl) => !brokenUrls.has(tmpl.url) && matchesQuery(tmpl.name)
  );
  const visibleUserTemplates = templates?.filter((tmpl) => matchesQuery(tmpl.name));

  const markBroken = (url: string) => {
    setBrokenUrls((prev) => new Set(prev).add(url));
  };

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

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          aria-label="Search templates"
          className="w-full border rounded pl-9 pr-3 py-2 text-slate-800"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Default Templates (Static for now, could be seeded to DB) */}
        {visibleDefaultTemplates.map((tmpl) => (
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
                onError={() => markBroken(tmpl.url)}
              />
            </div>
            <div className="p-2 bg-white">
              <p className="text-sm font-medium truncate text-slate-700">{tmpl.name}</p>
            </div>
          </div>
        ))}

        {/* User Templates */}
        {visibleUserTemplates?.map((tmpl) => (
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
