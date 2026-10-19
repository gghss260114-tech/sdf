import React, { useState, useEffect } from 'react';
import { GameEndStats } from '../game/GameCanvas.tsx';
import { CHARACTERS, DIFFICULTIES, LeaderboardEntry } from '../types/game.ts';
import { Trophy, RotateCcw, Skull, CheckCircle, Award, Send, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardDashboardProps {
  stats: GameEndStats;
  isVictory: boolean;
  onPlayAgain: () => void;
}

const DEFAULT_ONLINE_USERS: LeaderboardEntry[] = [
  {
    id: '1',
    playerName: '카이스트화학과수석',
    characterId: 'teacher',
    characterName: '김선생님',
    difficulty: 'hard',
    score: 142500,
    timeSeconds: 145,
    moleculesSynthesized: 28,
    bossDefeated: true,
    date: '2026-10-19',
    title: '👑 화학의 신',
    comment: '원소 주기율표만 외우면 선생님 500% 보너스로 1등 먹습니다.',
  },
  {
    id: '2',
    playerName: '외눈박이킬러_민호',
    characterId: 'friend',
    characterName: '찰스 친구',
    difficulty: 'hard',
    score: 98400,
    timeSeconds: 112,
    moleculesSynthesized: 22,
    bossDefeated: true,
    date: '2026-10-18',
    title: '⚡ 스피드런 마스터',
    comment: '제트팩 타고 공중에서 눈깔에 염산 투하하면 쉬움ㅋㅋ',
  },
  {
    id: '3',
    playerName: '수능화학만점자',
    characterId: 'teacher',
    characterName: '김선생님',
    difficulty: 'hard',
    score: 91200,
    timeSeconds: 198,
    moleculesSynthesized: 34,
    bossDefeated: true,
    date: '2026-10-18',
    title: '👨‍🏫 분필 저격수',
    comment: '선생님 점프할때마다 허리 곡소리 나는거 개웃김',
  },
  {
    id: '4',
    playerName: '메탄가스폭파광',
    characterId: 'charles',
    characterName: '찰스',
    difficulty: 'hard',
    score: 74200,
    timeSeconds: 180,
    moleculesSynthesized: 19,
    bossDefeated: true,
    date: '2026-10-17',
    title: '💥 폭파 전문가',
    comment: 'CH4 조합해서 쾅쾅 터뜨릴 때 타격감 지림',
  },
  {
    id: '5',
    playerName: '생존전문가99',
    characterId: 'charles',
    characterName: '찰스',
    difficulty: 'easy',
    score: 62000,
    timeSeconds: 210,
    moleculesSynthesized: 15,
    bossDefeated: true,
    date: '2026-10-16',
    title: '🧪 생존자',
    comment: '산소 떨어질 때 O2 합성 안하면 바로 질식사함 조심',
  },
];

export const LeaderboardDashboard: React.FC<LeaderboardDashboardProps> = ({
  stats,
  isVictory,
  onPlayAgain,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [playerComment, setPlayerComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('polyphemus_rankings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ONLINE_USERS;
      }
    }
    return DEFAULT_ONLINE_USERS;
  });

  const charConfig = CHARACTERS[stats.characterId];

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitted) return;

    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      playerName: playerName.trim(),
      characterId: stats.characterId,
      characterName: charConfig.name,
      difficulty: stats.difficulty,
      score: stats.score,
      timeSeconds: stats.timeSeconds,
      moleculesSynthesized: stats.moleculesSynthesized,
      bossDefeated: stats.bossDefeated,
      date: new Date().toISOString().split('T')[0],
      title: stats.characterId === 'teacher' ? '👨‍🏫 척추수호자' : stats.bossDefeated ? '⚔️ 외눈 분쇄자' : '🧪 생존 도전자',
      comment: playerComment.trim() || (isVictory ? '폴리페모스 퇴치 완료!' : '다음엔 꼭 탈출한다...'),
    };

    const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score);
    setLeaderboard(updated);
    localStorage.setItem('polyphemus_rankings', JSON.stringify(updated));
    setIsSubmitted(true);
  };

  // Find user's rank
  const userRank = leaderboard.findIndex(entry => entry.score <= stats.score) + 1 || leaderboard.length + 1;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 bg-radial from-slate-900 via-zinc-950 to-black select-none font-chakra overflow-y-auto">
      <div className="crt-scanlines absolute inset-0 pointer-events-none" />
      <div className="horror-vignette absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center my-auto py-6">
        {/* Banner */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>실시간 글로벌 아케이드 리더보드</span>
          </div>

          <h1 className={`text-4xl sm:text-5xl font-black font-orbitron mb-2 ${isVictory ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]'}`}>
            {isVictory ? 'MISSION COMPLETE: 탈출 및 보스 섬멸!' : 'MISSION FAILED: 실험실에서 쓰러짐'}
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg">
            {isVictory 
              ? '화학 분자 결합의 힘으로 거인 폴리페모스를 물리치고 비밀 연구소를 탈출했습니다!' 
              : '괴물의 일격이나 산소 고갈로 연구소 바닥에 쓰러졌습니다. 다시 도전하세요!'}
          </p>
        </div>

        {/* Current Run Score Card */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Main Score Box */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-zinc-950/90 border-2 border-cyan-500/50 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{charConfig.avatar}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{charConfig.name}</h3>
                  <div className="text-xs text-zinc-400">{DIFFICULTIES[stats.difficulty].nameKr} 플레이</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-400 uppercase font-mono">예상 글로벌 순위</div>
                <div className="text-2xl font-black font-orbitron text-amber-400">
                  TOP #{userRank}
                </div>
              </div>
            </div>

            {/* Score Grid Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">최종 점수</div>
                <div className="text-xl font-black font-orbitron text-cyan-300">
                  {stats.score.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">생존 시간</div>
                <div className="text-xl font-bold font-mono text-zinc-200">
                  {Math.floor(stats.timeSeconds / 60)}분 {stats.timeSeconds % 60}초
                </div>
              </div>
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">분자 합성</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {stats.moleculesSynthesized} 회
                </div>
              </div>
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">최종 보스</div>
                <div className={`text-xl font-bold font-mono ${stats.bossDefeated ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {stats.bossDefeated ? '격파 성공' : '미도달'}
                </div>
              </div>
            </div>

            {/* Character Special Bonus Tag */}
            {stats.characterId === 'teacher' && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-mono">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>【김선생님 만성요통 특권】 500% 점수 보너스 승수 적용 완료!</span>
              </div>
            )}
          </div>

          {/* Leaderboard Submission Form */}
          <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>명예의 전당 점수 등록</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                실시간 랭킹 보드에 닉네임과 한마디를 남겨 다른 생존자들과 경쟁하세요!
              </p>

              {isSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-center text-xs flex flex-col items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold">등록 완료! 리더보드에 반영되었습니다.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitScore} className="space-y-3">
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="생존자 닉네임 입력 (최대 14자)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    maxLength={35}
                    placeholder="탈출 소감 한마디 (예: 외눈박이 눈알 맛있네)"
                    value={playerComment}
                    onChange={(e) => setPlayerComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    순위표에 공식 등록
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={onPlayAgain}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>새 게임 시작 (PLAY AGAIN)</span>
            </button>
          </div>
        </div>

        {/* Global Online Leaderboard Table */}
        <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="font-orbitron">REAL ONLINE LEADERBOARD (실시간 랭킹)</span>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              총 {leaderboard.length}명 등록됨
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2.5 px-3">순위</th>
                  <th className="py-2.5 px-3">플레이어</th>
                  <th className="py-2.5 px-3">캐릭터</th>
                  <th className="py-2.5 px-3">난이도</th>
                  <th className="py-2.5 px-3 text-right">점수</th>
                  <th className="py-2.5 px-3 text-right">시간</th>
                  <th className="py-2.5 px-3">한마디</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;

                  return (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-zinc-900/60 transition ${index === userRank - 1 ? 'bg-cyan-950/40 border border-cyan-800/40' : ''}`}
                    >
                      <td className="py-3 px-3 font-bold text-sm">
                        {medal}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{entry.playerName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 font-sans">
                            {entry.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300">
                        {entry.characterName}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${entry.difficulty === 'hard' ? 'bg-red-950 text-red-400 border border-red-800/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'}`}>
                          {entry.difficulty.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black font-orbitron text-cyan-300">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {Math.floor(entry.timeSeconds / 60)}:{String(entry.timeSeconds % 60).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-sans italic max-w-xs truncate">
                        "{entry.comment}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
