export type ElementType = 'H' | 'O' | 'Cl' | 'C' | 'N' | 'S';

export interface ElementData {
  symbol: ElementType;
  name: string;
  nameKr: string;
  color: string;
  glowColor: string;
  atomicNumber: number;
}

export const ELEMENTS_INFO: Record<ElementType, ElementData> = {
  H: { symbol: 'H', name: 'Hydrogen', nameKr: '수소', color: '#e0e7ff', glowColor: '#818cf8', atomicNumber: 1 },
  O: { symbol: 'O', name: 'Oxygen', nameKr: '산소', color: '#67e8f9', glowColor: '#06b6d4', atomicNumber: 8 },
  Cl: { symbol: 'Cl', name: 'Chlorine', nameKr: '염소', color: '#86efac', glowColor: '#22c55e', atomicNumber: 17 },
  C: { symbol: 'C', name: 'Carbon', nameKr: '탄소', color: '#fca5a5', glowColor: '#ef4444', atomicNumber: 6 },
  N: { symbol: 'N', name: 'Nitrogen', nameKr: '질소', color: '#c4b5fd', glowColor: '#a855f7', atomicNumber: 7 },
  S: { symbol: 'S', name: 'Sulfur', nameKr: '황', color: '#fde047', glowColor: '#eab308', atomicNumber: 16 },
};

export type MoleculeKey = 'HCl' | 'CH4' | 'NH3' | 'H2SO4' | 'O2' | 'H2O';

export interface MoleculeRecipe {
  key: MoleculeKey;
  name: string;
  nameKr: string;
  formula: string;
  cost: Partial<Record<ElementType, number>>;
  description: string;
  effectLabel: string;
  color: string;
  icon: string;
  cooldown: number; // in seconds
}

export const MOLECULE_RECIPES: Record<MoleculeKey, MoleculeRecipe> = {
  HCl: {
    key: 'HCl',
    name: 'Hydrochloric Acid',
    nameKr: '염산',
    formula: 'H + Cl',
    cost: { H: 1, Cl: 1 },
    description: '괴물의 거대한 외눈에 뿌려 5초간 극심한 고통과 함께 완전 실명 기절!',
    effectLabel: '외눈뽕 녹이기 (5초 기절)',
    color: '#22c55e',
    icon: '🧪',
    cooldown: 3,
  },
  CH4: {
    key: 'CH4',
    name: 'Methane',
    nameKr: '메탄 가스 폭탄',
    formula: 'C + 4H',
    cost: { C: 1, H: 4 },
    description: '불꽃을 튀겨 맹렬한 화학 대폭발! 괴물에게 폭발 데미지 & 거대 넉백!',
    effectLabel: '가스 대폭발 (광역 데미지)',
    color: '#ef4444',
    icon: '💥',
    cooldown: 4,
  },
  NH3: {
    key: 'NH3',
    name: 'Ammonia',
    nameKr: '암모니아 악취탄',
    formula: 'N + 3H',
    cost: { N: 1, H: 3 },
    description: '기형적으로 발달한 폴리페모스의 후각과 진동 감각을 마비시켜 추적 중단!',
    effectLabel: '악취 폭탄 (감각 마비 & 어그로 해제)',
    color: '#a855f7',
    icon: '☣️',
    cooldown: 5,
  },
  H2SO4: {
    key: 'H2SO4',
    name: 'Sulfuric Acid',
    nameKr: '농황산 슬로우 늪',
    formula: '2H + S + 4O',
    cost: { H: 2, S: 1, O: 4 },
    description: '바닥에 부식성 황산 늪을 뿌려 괴물 이동 속도 -60% 감속 및 지속 용해 데미지!',
    effectLabel: '슬로우 늪 (-60% 감속/용해)',
    color: '#eab308',
    icon: '⚠️',
    cooldown: 6,
  },
  O2: {
    key: 'O2',
    name: 'Oxygen Booster',
    nameKr: '고농도 산소 팩',
    formula: '2O',
    cost: { O: 2 },
    description: '산소 게이지를 즉시 +35% 회복하고 심박수를 안정시킵니다.',
    effectLabel: '산소 긴급 충전 (+35%)',
    color: '#06b6d4',
    icon: '🫁',
    cooldown: 2,
  },
  H2O: {
    key: 'H2O',
    name: 'Water Cannon',
    nameKr: '초고압 수류포',
    formula: '2H + O',
    cost: { H: 2, O: 1 },
    description: '화재 및 산성 바닥을 정화하고 괴물을 강력한 수압으로 밀쳐냅니다.',
    effectLabel: '초고압 밀치기 & 정화',
    color: '#3b82f6',
    icon: '🌊',
    cooldown: 2.5,
  },
};

export type CharacterId = 'charles' | 'friend' | 'teacher';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  title: string;
  avatar: string;
  quote: string;
  speed: number;
  sprintMultiplier: number;
  oxygenDepletionRate: number; // multiplier
  heartRateSensitivity: number; // multiplier
  jetpackDuration: number; // seconds
  jetpackCooldown: number;
  specialAbilityDesc: string;
  specialTraitName: string;
  handicapDesc?: string;
  scoreBonusMultiplier: number;
  color: string;
}

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  charles: {
    id: 'charles',
    name: '찰스 (Charles)',
    title: '손목 분자 합성기를 착용한 화학과 학부생',
    avatar: '🧑‍🔬',
    quote: '"화학식만 기억하면 이 괴물 지옥에서 나갈 수 있어!"',
    speed: 7.2,
    sprintMultiplier: 1.5,
    oxygenDepletionRate: 1.0,
    heartRateSensitivity: 1.0,
    jetpackDuration: 4.0,
    jetpackCooldown: 7.0,
    specialAbilityDesc: '분자 합성 속도가 빠르고 밸런스가 잡힌 표준 스탯.',
    specialTraitName: '표준 분자 가속기',
    scoreBonusMultiplier: 1.0,
    color: '#3b82f6',
  },
  friend: {
    id: 'friend',
    name: '찰스 친구 (민호)',
    title: '육상부 출신 피지컬 괴물',
    avatar: '🏃‍♂️',
    quote: '"야! 거인 눈깔에 염산 뿌리고 내가 먼저 뛴다?!"',
    speed: 9.5,
    sprintMultiplier: 1.7,
    oxygenDepletionRate: 1.25,
    heartRateSensitivity: 0.7, // recovers heart rate faster
    jetpackDuration: 5.5,
    jetpackCooldown: 5.5,
    specialAbilityDesc: '압도적인 달리기 속도와 높은 점프력, 길어진 제트팩 체공 시간.',
    specialTraitName: '피지컬 폭주 & 고공 도약',
    scoreBonusMultiplier: 1.2,
    color: '#eab308',
  },
  teacher: {
    id: 'teacher',
    name: '김선생님 (Teacher Kim)',
    title: '만성 요통 디스크 화학 교사 (초특급 핸디캡)',
    avatar: '👨‍🏫',
    quote: '"아이고 허리야... 수업시간에 원소 주기율표 외우라 했지?!"',
    speed: 5.4,
    sprintMultiplier: 1.25,
    oxygenDepletionRate: 1.8, // sighs constantly, burns oxygen
    heartRateSensitivity: 1.9, // high bpm easily
    jetpackDuration: 2.8,
    jetpackCooldown: 9.0,
    specialAbilityDesc: '【병맛 특권】 화학 지식 만렙으로 분자 합성 시 탄약 2배 생성! 분필 탄환 무제한 난사!',
    specialTraitName: '분필 무한 투척 & 분자 2배 합성',
    handicapDesc: '⚠️ 만성 요통: 점프할 때마다 윽! 소리와 함께 2.5초 쿨다운, 느린 달리기, 심박수 폭발로 괴물이 기가 막히게 찾아옴.',
    scoreBonusMultiplier: 5.0, // 500% score bonus!
    color: '#ef4444',
  },
};

export type DifficultyMode = 'easy' | 'hard';

export interface DifficultyConfig {
  mode: DifficultyMode;
  name: string;
  nameKr: string;
  monsterCount: number;
  monsterSpeed: number;
  monsterPerceptionRange: number;
  description: string;
  tagline: string;
  color: string;
}

export const DIFFICULTIES: Record<DifficultyMode, DifficultyConfig> = {
  easy: {
    mode: 'easy',
    name: 'EASY MODE',
    nameKr: '이지 모드',
    monsterCount: 1,
    monsterSpeed: 5.2,
    monsterPerceptionRange: 16,
    description: '폴리페모스 괴물 1마리가 미로를 배회합니다. 초보자용 화학 실습 코스.',
    tagline: '외눈박이 거인 1마리 출현',
    color: '#10b981',
  },
  hard: {
    mode: 'hard',
    name: 'NIGHTMARE HARD',
    nameKr: '하드 모드',
    monsterCount: 3,
    monsterSpeed: 7.2,
    monsterPerceptionRange: 26,
    description: '기형 변종 폴리페모스 3마리가 동시 협공! 진동과 호흡 소리만으로 즉각 포위합니다.',
    tagline: '외눈박이 변종 거인 3마리 집단 사냥!!',
    color: '#ef4444',
  },
};

export type GameScreen = 
  | 'difficulty_select' 
  | 'character_select' 
  | 'playing' 
  | 'boss_fight' 
  | 'victory' 
  | 'game_over' 
  | 'leaderboard';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  characterId: CharacterId;
  characterName: string;
  difficulty: DifficultyMode;
  score: number;
  timeSeconds: number;
  moleculesSynthesized: number;
  bossDefeated: boolean;
  date: string;
  title: string;
  comment: string;
}
