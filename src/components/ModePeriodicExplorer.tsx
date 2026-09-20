import React, { useState } from 'react';
import { PeriodicElement } from '../types';
import { ELEMENTS, CATEGORY_INFO, GROUP_NAMES_TH } from '../data/elements';
import { soundManager } from '../utils/audio';
import { ArrowLeft, Search, X, BookOpen, Volume2 } from 'lucide-react';

interface Props {
  onBackToMenu: () => void;
}

export const ModePeriodicExplorer: React.FC<Props> = ({ onBackToMenu }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<PeriodicElement | null>(null);

  const filteredElements = ELEMENTS.filter(el => {
    const matchesSearch =
      el.nameTH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (el.nameEN && el.nameEN.toLowerCase().includes(searchTerm.toLowerCase())) ||
      el.atomicNumber.toString() === searchTerm.trim();

    const matchesCategory =
      selectedCategory === 'all' || el.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSpeakName = (name: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.lang = 'th-TH';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className="w-full max-w-xl mx-auto p-4 flex flex-col space-y-4"
      style={{ fontFamily: "'Mali', 'Sarabun', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-2 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-3 rounded-2xl shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] transition-colors">
        <button
          onClick={() => {
            soundManager.playClick();
            onBackToMenu();
          }}
          className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>เมนู</span>
        </button>

        <div className="text-center font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>สารานุกรมตารางธาตุ</span>
        </div>

        <div className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700">
          {filteredElements.length} ธาตุ
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-zinc-800 rounded-2xl p-3 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a] space-y-2.5 transition-colors">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อธาตุ (เช่น โซเดียม, Na, 11)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-blue-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedCategory('all');
            }}
            className={`py-1 px-2.5 rounded-lg whitespace-nowrap font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            ทั้งหมด
          </button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => {
                soundManager.playClick();
                setSelectedCategory(key);
              }}
              className={`py-1 px-2.5 rounded-lg whitespace-nowrap font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedCategory === key
                  ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{info.emoji}</span>
              <span>{info.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Elements Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[65vh] overflow-y-auto p-1">
        {filteredElements.map(el => {
          const cat = CATEGORY_INFO[el.category];
          return (
            <button
              key={el.symbol}
              onClick={() => {
                soundManager.playElementSound(el.atomicNumber);
                setSelectedElement(el);
              }}
              className={`p-2 rounded-2xl border-2 border-slate-900 dark:border-zinc-700 ${cat.bg} flex flex-col items-center justify-center text-center shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] hover:-translate-y-0.5 transition cursor-pointer active:scale-95`}
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold self-start pl-1">
                {el.atomicNumber}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {el.symbol}
              </span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-cyan-200 truncate w-full">
                {el.nameTH}
              </span>
            </button>
          );
        })}
      </div>

      {/* Element Detail Modal */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border-3 border-slate-900 dark:border-zinc-800 bg-white dark:bg-black p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 transition-colors">
            <button
              onClick={() => setSelectedElement(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Giant Element Card */}
            <div
              className={`p-5 rounded-2xl border-2 border-slate-900 dark:border-zinc-700 ${
                CATEGORY_INFO[selectedElement.category].bg
              } text-center space-y-1 shadow-[4px_4px_0px_#1e293b] dark:shadow-[4px_4px_0px_#27272a]`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>เลขอะตอม {selectedElement.atomicNumber}</span>
                <span>{selectedElement.atomicMass ? `${selectedElement.atomicMass} u` : ''}</span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white pt-1">
                {selectedElement.symbol}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-slate-900 dark:text-cyan-300 pt-1">
                <span>{selectedElement.nameTH}</span>
                {selectedElement.nameEN && (
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-normal">
                    ({selectedElement.nameEN})
                  </span>
                )}
                <button
                  onClick={() => handleSpeakName(selectedElement.nameTH)}
                  title="ฟังเสียงอ่าน"
                  className="p-1 hover:bg-white/20 dark:hover:bg-zinc-800 rounded-full text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <div className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold border border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                {CATEGORY_INFO[selectedElement.category].emoji}{' '}
                {CATEGORY_INFO[selectedElement.category].label}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  📍 ตำแหน่งในตารางธาตุ:
                </div>
                <div>
                  {GROUP_NAMES_TH[selectedElement.group] || `หมู่ ${selectedElement.group}`} · คาบ {selectedElement.period}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-amber-950/40 border border-yellow-200 dark:border-zinc-800 rounded-xl p-3 space-y-1">
                <div className="font-bold text-yellow-900 dark:text-amber-300">
                  💡 จุดเด่น & เกร็ดความรู้:
                </div>
                <div className="leading-relaxed font-semibold">
                  {selectedElement.trivia}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedElement(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
