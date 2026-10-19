import React, { useEffect, useRef } from 'react';
import { 
  CharacterId, 
  CHARACTERS, 
  ElementType, 
  ELEMENTS_INFO, 
  MoleculeKey, 
  MOLECULE_RECIPES 
} from '../types/game.ts';
import { 
  Heart, 
  Wind, 
  ShieldAlert, 
  Rocket, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  Zap, 
  FlaskConical, 
  AlertTriangle 
} from 'lucide-react';
import { soundManager } from '../audio/soundManager.ts';

interface HUDProps {
  characterId: CharacterId;
  isBossStage: boolean;
  playerHealth: number;
  oxygen: number;
  heartRate: number;
  jetpackFuel: number;
  bossHealth: number;
  inventory: Record<ElementType, number>;
  ammo: Record<MoleculeKey, number>;
  selectedMolecule: MoleculeKey;
  setSelectedMolecule: (mol: MoleculeKey) => void;
  onSynthesize: (mol: MoleculeKey) => void;
  teacherDialogue: string;
}

export const HUD: React.FC<HUDProps> = ({
  characterId,
  isBossStage,
  playerHealth,
  oxygen,
  heartRate,
  jetpackFuel,
  bossHealth,
  inventory,
  ammo,
  selectedMolecule,
  setSelectedMolecule,
  onSynthesize,
  teacherDialogue,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const charConfig = CHARACTERS[characterId];

  // Animated Real-Time ECG Heartbeat Monitor on HTML5 Canvas
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const history: number[] = new Array(width).fill(height / 2);

    let phase = 0;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.fillStyle = 'rgba(3, 7, 18, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let gy = 10; gy < height; gy += 15) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // ECG wave algorithm based on heartRate BPM
      const speed = (heartRate / 60) * 1.8;
      phase = (phase + speed) % 100;

      let yVal = height / 2;
      if (phase > 40 && phase < 45) {
        yVal = height / 2 - 4; // P wave
      } else if (phase >= 45 && phase < 48) {
        yVal = height / 2 + 5; // Q
      } else if (phase >= 48 && phase < 54) {
        yVal = 6; // R peak
      } else if (phase >= 54 && phase < 58) {
        yVal = height - 8; // S trough
      } else if (phase >= 68 && phase < 78) {
        yVal = height / 2 - 8; // T wave
      }

      history[x] = yVal;
      x = (x + 1) % width;

      // Draw ECG trace line
      ctx.strokeStyle = heartRate > 110 ? '#ef4444' : heartRate > 90 ? '#eab308' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < width; i++) {
        const val = history[i];
        if (i === 0) ctx.moveTo(i, val);
        else ctx.lineTo(i, val);
      }
      ctx.stroke();
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [heartRate]);

  const handleMuteToggle = () => {
    const state = soundManager.toggleMute();
    setIsMuted(state);
  };

  // Helper to check if recipe is craftable
  const canCraft = (molKey: MoleculeKey) => {
    const recipe = MOLECULE_RECIPES[molKey];
    return Object.entries(recipe.cost).every(([sym, req]) => (inventory[sym as ElementType] || 0) >= (req || 0));
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-chakra">
      {/* Sci-fi Scanlines & Horror Vignette */}
      <div className="crt-scanlines absolute inset-0 z-0" />
      <div className={playerHealth < 35 || oxygen < 25 ? "danger-vignette absolute inset-0 z-0" : "horror-vignette absolute inset-0 z-0"} />

      {/* TOP HEADER: Player Vitals & Boss Bar */}
      <div className="relative z-10 w-full p-4 flex flex-col items-center justify-start gap-3">
        {/* Boss Health Bar (Displayed during final arena) */}
        {isBossStage && (
          <div className="w-full max-w-2xl bg-zinc-950/90 border-2 border-red-600/80 rounded-xl p-3 shadow-2xl neon-glow-red backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-bounce" />
                <span className="font-orbitron font-extrabold text-red-400 tracking-wider text-base sm:text-lg">
                  FINAL BOSS: 타이탄 폴리페모스 (TITAN FORM)
                </span>
              </div>
              <span className="font-mono font-bold text-red-300 text-sm">
                {bossHealth} / 1000 HP
              </span>
            </div>
            {/* Health fill */}
            <div className="w-full h-5 bg-zinc-900 rounded-md overflow-hidden border border-red-950 relative">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150 relative"
                style={{ width: `${Math.max(0, (bossHealth / 1000) * 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-red-300/80 font-mono">
              <span>⚠️ 광폭화 레이저 빔 경보</span>
              <span>외눈 집중 타격 시 치명타 적용</span>
            </div>
          </div>
        )}

        {/* TOP STATUS ROW */}
        <div className="w-full flex items-start justify-between">
          {/* Left: Player Health, Oxygen, BPM */}
          <div className="bg-zinc-950/85 border border-cyan-800/60 rounded-xl p-3 shadow-xl backdrop-blur-sm flex flex-col gap-2.5 min-w-[270px]">
            {/* Character Header */}
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{charConfig.avatar}</span>
                <span className="font-bold text-cyan-300 text-sm">{charConfig.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                {isBossStage ? '최종 결전장' : '지하 미로'}
              </span>
            </div>

            {/* Health Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> 체력 (HP)
                </span>
                <span className="font-mono text-zinc-300 font-bold">{playerHealth}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-200 ${playerHealth < 35 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                  style={{ width: `${playerHealth}%` }}
                />
              </div>
            </div>

            {/* Oxygen Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> 산소량 (O₂)
                </span>
                <span className={`font-mono font-bold ${oxygen < 25 ? 'text-red-400 animate-ping' : 'text-zinc-300'}`}>
                  {oxygen}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-200 ${oxygen < 25 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-cyan-600 to-sky-400'}`}
                  style={{ width: `${oxygen}%` }}
                />
              </div>
            </div>

            {/* Jetpack Fuel */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Rocket className="w-3.5 h-3.5 text-amber-400" /> 제트팩 연료 [Shift / E]
                </span>
                <span className="font-mono text-zinc-300 font-bold">{jetpackFuel}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-150"
                  style={{ width: `${jetpackFuel}%` }}
                />
              </div>
            </div>

            {/* Real-time ECG Graph & Heart Rate */}
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
              <canvas 
                ref={ecgCanvasRef} 
                width={110} 
                height={34} 
                className="bg-black/70 rounded border border-cyan-900/50" 
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">심박수</span>
                <span className={`font-orbitron font-extrabold text-sm ${heartRate > 105 ? 'text-red-400 animate-pulse' : heartRate > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {heartRate} <span className="text-[10px]">BPM</span>
                </span>
                <span className="text-[9px] text-zinc-500">
                  {heartRate > 100 ? '⚠️ 괴물이 위치 감지중!' : '정상 은폐 상태'}
                </span>
              </div>
            </div>
          </div>

          {/* Center-Top: Teacher Kim dialogue bubble (if playing teacher) */}
          {characterId === 'teacher' && teacherDialogue && (
            <div className="max-w-md bg-amber-950/90 border-2 border-amber-500/80 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top duration-200">
              <span className="text-2xl">👨‍🏫</span>
              <div>
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">김선생님의 만성요통 절규</div>
                <div className="text-sm font-semibold">{teacherDialogue}</div>
              </div>
            </div>
          )}

          {/* Right Top: Collected Elements Pouch & Sound Toggle */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <button 
              onClick={handleMuteToggle}
              className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              title="사운드 토글"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>

            {/* Element Pouch */}
            <div className="bg-zinc-950/85 border border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-sm flex flex-col gap-1.5 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 border-b border-zinc-800/80 pb-1">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>채취한 원소 보관함</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['H', 'O', 'Cl', 'C', 'N', 'S'] as ElementType[]).map(sym => {
                  const info = ELEMENTS_INFO[sym];
                  const count = inventory[sym] || 0;
                  return (
                    <div 
                      key={sym} 
                      className={`flex items-center justify-between px-2 py-1 rounded bg-zinc-900/80 border ${count > 0 ? 'border-cyan-700/60' : 'border-zinc-800 text-zinc-600'}`}
                    >
                      <span className="font-bold font-mono" style={{ color: count > 0 ? info.color : '#71717a' }}>{sym}</span>
                      <span className="font-mono font-bold text-zinc-200">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CROSSHAIR & AIM RETICLE IN CENTER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]" />
          <div className="w-8 h-8 rounded-full border border-cyan-400/40 absolute" />
          {/* Target tick lines */}
          <div className="w-12 h-[1px] bg-cyan-400/40 absolute" />
          <div className="h-12 w-[1px] bg-cyan-400/40 absolute" />
        </div>
      </div>

      {/* BOTTOM CONTROL DOCK: Molecule Synthesizer & Weapon Selector */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-4 pointer-events-auto">
        <div className="bg-zinc-950/90 border border-cyan-800/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2">
          {/* Action hotkey bar info */}
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Crosshair className="w-3.5 h-3.5" /> [마우스 좌클릭]: 발사 / 투척
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <Zap className="w-3.5 h-3.5" /> [마우스 우클릭]: 화학 고압 분사
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Rocket className="w-3.5 h-3.5" /> [Shift / E]: 제트팩 미로 고공비행
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              [C]: 살금살금 | [Space]: 점프
            </span>
          </div>

          {/* Molecule Recipes & Synthesis Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {(Object.keys(MOLECULE_RECIPES) as MoleculeKey[]).map((key, idx) => {
              const recipe = MOLECULE_RECIPES[key];
              const craftable = canCraft(key);
              const isSelected = selectedMolecule === key;
              const count = ammo[key] || 0;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedMolecule(key)}
                  className={`relative flex flex-col justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Top: Hotkey & Ammo count */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-mono font-extrabold ${count > 0 ? 'text-cyan-300' : 'text-zinc-600'}`}>
                      x{count}
                    </span>
                  </div>

                  {/* Title & Formula */}
                  <div className="my-0.5">
                    <div className="text-xs font-bold flex items-center gap-1" style={{ color: recipe.color }}>
                      <span>{recipe.icon}</span>
                      <span>{key}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">{recipe.formula}</div>
                  </div>

                  {/* Description pill */}
                  <div className="text-[9px] text-zinc-400 line-clamp-1 mb-1.5" title={recipe.description}>
                    {recipe.effectLabel}
                  </div>

                  {/* Synthesize Button */}
                  <button
                    disabled={!craftable}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSynthesize(key);
                    }}
                    className={`w-full py-1 text-[11px] font-bold rounded-lg transition-all ${
                      craftable 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md' 
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    합성 ({characterId === 'teacher' ? '+2' : '+1'})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
