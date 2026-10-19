import React, { useState } from 'react';
import { CharacterId, CHARACTERS, DifficultyMode, DIFFICULTIES } from '../types/game.ts';
import { ArrowLeft, Play, Flame, Activity, Sparkles, Shield, Rocket } from 'lucide-react';

interface CharacterSelectProps {
  difficulty: DifficultyMode;
  onSelectCharacter: (charId: CharacterId) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  difficulty,
  onSelectCharacter,
  onBack,
}) => {
  const [selected, setSelected] = useState<CharacterId>('charles');
  const selectedChar = CHARACTERS[selected];

  const handleStartGame = (id: CharacterId) => {
    onSelectCharacter(id);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 pb-28 bg-radial from-slate-900 via-zinc-950 to-black select-none font-chakra">
      <div className="crt-scanlines absolute inset-0 pointer-events-none" />
      <div className="horror-vignette absolute inset-0 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center text-center">
        {/* Top Navigation & Info */}
        <div className="w-full flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>난이도 변경</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-mono">
            <span className="text-zinc-500">선택 난이도:</span>
            <span className={`font-bold flex items-center gap-1 ${difficulty === 'hard' ? 'text-red-400' : 'text-emerald-400'}`}>
              <Shield className="w-3.5 h-3.5" />
              {DIFFICULTIES[difficulty].nameKr} ({difficulty === 'hard' ? '괴물 3마리' : '괴물 1마리'})
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>생존자 캐릭터를 클릭하여 즉시 게임을 시작하세요</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-orbitron text-white">
            생존자 선택 및 게임 시작
          </h2>
        </div>

        {/* Character Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          {(['charles', 'friend', 'teacher'] as CharacterId[]).map((id) => {
            const char = CHARACTERS[id];
            const isSelected = selected === id;

            return (
              <div
                key={id}
                onClick={() => setSelected(id)}
                onDoubleClick={() => handleStartGame(id)}
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-zinc-900/95 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-[1.01]'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60'
                }`}
              >
                {/* Special Tag */}
                {id === 'teacher' && (
                  <div className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3" />
                    <span>병맛 극한 핸디캡 (점수 5배!)</span>
                  </div>
                )}
                {id === 'friend' && (
                  <div className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    <span>고공 도약 & 스피드</span>
                  </div>
                )}

                <div>
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
                      {char.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-black font-orbitron text-white flex items-center gap-1.5">
                        {char.name}
                      </h4>
                      <div className="text-[11px] text-zinc-400 font-sans line-clamp-1">{char.title}</div>
                    </div>
                  </div>

                  <blockquote className="text-[11px] italic text-zinc-300 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60 mb-3 font-serif">
                    {char.quote}
                  </blockquote>

                  {/* Special Trait Box */}
                  <div className="mb-2.5 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-1 text-cyan-400 font-bold text-[11px] mb-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{char.specialTraitName}</span>
                    </div>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">
                      {char.specialAbilityDesc}
                    </p>
                  </div>

                  {/* Handicap Box (Teacher Kim) */}
                  {char.handicapDesc && (
                    <div className="mb-2.5 p-2 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                      <div className="font-bold flex items-center gap-1 mb-0.5 text-red-400 text-[11px]">
                        <Activity className="w-3 h-3" />
                        <span>만성 요통 디스크 핸디캡</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-red-200/90">
                        {char.handicapDesc}
                      </p>
                    </div>
                  )}

                  {/* Stat Sliders */}
                  <div className="space-y-1 text-[11px] text-zinc-400 font-mono mb-3">
                    <div className="flex justify-between items-center">
                      <span>이동 속도</span>
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400"
                          style={{ width: `${(char.speed / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>제트팩 체공</span>
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400"
                          style={{ width: `${(char.jetpackDuration / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>산소 소모율</span>
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${char.oxygenDepletionRate > 1.2 ? 'bg-red-500' : 'bg-emerald-400'}`}
                          style={{ width: `${(char.oxygenDepletionRate / 2) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Start Button on Card */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>이 캐릭터로 게임 시작</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* FIXED FLOATING BOTTOM LAUNCH BAR - ALWAYS 100% VISIBLE ON ANY SCREEN */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-zinc-950/95 to-transparent flex items-center justify-center pointer-events-auto">
        <div className="max-w-2xl w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/95 border-2 border-cyan-500/80 rounded-2xl p-3 sm:px-5 shadow-[0_0_35px_rgba(6,182,212,0.4)] backdrop-blur-md">
          {/* Currently selected character preview */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedChar.avatar}</span>
            <div className="text-left">
              <div className="text-[10px] text-cyan-400 uppercase font-mono font-bold">선택된 캐릭터</div>
              <div className="text-sm font-black text-white">{selectedChar.name}</div>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            type="button"
            onClick={() => handleStartGame(selected)}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-base font-black font-orbitron shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>게임 시작 (START GAME)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
