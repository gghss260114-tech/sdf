import React from 'react';
import { DifficultyMode, DIFFICULTIES } from '../types/game.ts';
import { Skull, Shield, Zap, Sparkles, AlertOctagon } from 'lucide-react';

interface LevelSelectProps {
  onSelectDifficulty: (mode: DifficultyMode) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onSelectDifficulty }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-slate-900 via-zinc-950 to-black select-none font-chakra overflow-y-auto">
      {/* Background ambient grid & horror effects */}
      <div className="crt-scanlines absolute inset-0 pointer-events-none" />
      <div className="horror-vignette absolute inset-0 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center">
        {/* Title & Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>지하 생화학 비밀 연구소 시뮬레이터</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-300 to-cyan-400 drop-shadow-[0_4px_25px_rgba(239,68,68,0.4)] mb-3">
          폴리페모스의 실험실
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl mb-10 leading-relaxed font-sans">
          기형 거인 외눈박이 괴물이 사냥하는 칠흑 같은 지하 미로! 화학 원소를 채취·합성해 괴물의 약점을 공략하고 최종 보스룸의 문을 열어라!
        </p>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm bg-cyan-950/60 px-4 py-1.5 rounded-full border border-cyan-500/40">
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-extrabold">1</span>
            <span>난이도 선택</span>
          </div>
          <div className="w-8 h-[1px] bg-zinc-700" />
          <div className="text-zinc-500 text-sm font-semibold">2. 캐릭터 선택</div>
          <div className="w-8 h-[1px] bg-zinc-700" />
          <div className="text-zinc-500 text-sm font-semibold">3. 게임 시작</div>
        </div>

        {/* Difficulty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Easy Mode */}
          <div 
            onClick={() => onSelectDifficulty('easy')}
            className="group relative flex flex-col items-start p-6 rounded-2xl bg-zinc-950/90 border-2 border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all duration-300 cursor-pointer overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-32 h-32 text-emerald-500" />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4" />
              <span>{DIFFICULTIES.easy.tagline}</span>
            </div>

            <h3 className="text-2xl font-black font-orbitron text-emerald-300 group-hover:text-emerald-200 transition-colors mb-2">
              {DIFFICULTIES.easy.nameKr}
            </h3>

            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {DIFFICULTIES.easy.description}
            </p>

            <div className="space-y-2 w-full text-xs text-zinc-300 font-mono mb-6 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">외눈박이 괴물 수:</span>
                <span className="text-emerald-400 font-bold">1마리</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">괴물 추적 감각:</span>
                <span className="text-zinc-300">표준 청각 & 진동</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">미로 크기:</span>
                <span className="text-zinc-300">17 x 17 콤팩트 랩</span>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
              <Zap className="w-4 h-4" />
              이지 모드로 연구소 진입
            </button>
          </div>

          {/* Hard Mode */}
          <div 
            onClick={() => onSelectDifficulty('hard')}
            className="group relative flex flex-col items-start p-6 rounded-2xl bg-zinc-950/90 border-2 border-red-500/40 hover:border-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Skull className="w-32 h-32 text-red-500" />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider mb-2">
              <AlertOctagon className="w-4 h-4" />
              <span>{DIFFICULTIES.hard.tagline}</span>
            </div>

            <h3 className="text-2xl font-black font-orbitron text-red-400 group-hover:text-red-300 transition-colors mb-2">
              {DIFFICULTIES.hard.nameKr}
            </h3>

            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {DIFFICULTIES.hard.description}
            </p>

            <div className="space-y-2 w-full text-xs text-zinc-300 font-mono mb-6 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">외눈박이 괴물 수:</span>
                <span className="text-red-400 font-bold">3마리 동시 사냥!</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">괴물 추적 감각:</span>
                <span className="text-red-300">초감각 진동 & 심박수 추적</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">미로 크기:</span>
                <span className="text-zinc-300">23 x 23 광활한 지옥 랩</span>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400 font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
              <Skull className="w-4 h-4" />
              하드 모드 사투 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
