import React, { useState } from 'react';
import { 
  CharacterId, 
  CHARACTERS, 
  DifficultyMode, 
  ElementType, 
  GameScreen, 
  MoleculeKey, 
  MOLECULE_RECIPES 
} from './types/game.ts';
import { LevelSelect } from './components/LevelSelect.tsx';
import { CharacterSelect } from './components/CharacterSelect.tsx';
import { GameCanvas, GameEndStats } from './game/GameCanvas.tsx';
import { HUD } from './components/HUD.tsx';
import { LeaderboardDashboard } from './components/LeaderboardDashboard.tsx';
import { soundManager } from './audio/soundManager.ts';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('difficulty_select');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('easy');
  const [characterId, setCharacterId] = useState<CharacterId>('charles');

  // Active game session state
  const [isBossStage, setIsBossStage] = useState(false);
  const [inventory, setInventory] = useState<Record<ElementType, number>>({
    H: 2,
    O: 2,
    Cl: 1,
    C: 1,
    N: 0,
    S: 0,
  });
  const [ammo, setAmmo] = useState<Record<MoleculeKey, number>>({
    HCl: 1,
    CH4: 0,
    NH3: 0,
    H2SO4: 0,
    O2: 1,
    H2O: 0,
  });
  const [selectedMolecule, setSelectedMolecule] = useState<MoleculeKey>('HCl');
  const [oxygen, setOxygen] = useState(100);
  const [heartRate, setHeartRate] = useState(72);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(1000);
  const [jetpackFuel, setJetpackFuel] = useState(100);
  const [teacherDialogue, setTeacherDialogue] = useState('');
  const [moleculesMadeCount, setMoleculesMadeCount] = useState(0);

  const [endStats, setEndStats] = useState<GameEndStats | null>(null);

  // Start new game run
  const handleStartGame = (charId: CharacterId) => {
    setCharacterId(charId);
    setIsBossStage(false);
    setOxygen(100);
    setHeartRate(72);
    setPlayerHealth(100);
    setBossHealth(1000);
    setJetpackFuel(100);
    setMoleculesMadeCount(0);
    setInventory({
      H: 3,
      O: 2,
      Cl: 1,
      C: 1,
      N: 1,
      S: 0,
    });
    setAmmo({
      HCl: 1,
      CH4: 0,
      NH3: 0,
      H2SO4: 0,
      O2: 1,
      H2O: 0,
    });
    setSelectedMolecule('HCl');
    setTeacherDialogue(
      charId === 'teacher' 
        ? '등짝이야... 애들아 선생님 허리디스크 터지기 전에 탈출하자꾸나.' 
        : ''
    );
    setScreen('playing');
  };

  // Synthesize Molecule Action
  const handleSynthesize = (molKey: MoleculeKey) => {
    const recipe = MOLECULE_RECIPES[molKey];
    // Check if player has required elements
    const hasIngredients = Object.entries(recipe.cost).every(
      ([sym, req]) => (inventory[sym as ElementType] || 0) >= (req || 0)
    );

    if (!hasIngredients) return;

    // Deduct ingredients
    setInventory(prev => {
      const next = { ...prev };
      Object.entries(recipe.cost).forEach(([sym, req]) => {
        next[sym as ElementType] = Math.max(0, (next[sym as ElementType] || 0) - (req || 0));
      });
      return next;
    });

    // Add ammo (Teacher makes 2x due to chemistry mastery!)
    const amountProduced = characterId === 'teacher' ? 2 : 1;
    setAmmo(prev => ({
      ...prev,
      [molKey]: (prev[molKey] || 0) + amountProduced,
    }));

    // If O2 was crafted, immediately boost oxygen level
    if (molKey === 'O2') {
      setOxygen(prev => Math.min(100, prev + 35));
    }

    setMoleculesMadeCount(prev => prev + 1);
    setSelectedMolecule(molKey);
    soundManager.playSynthesize();

    if (characterId === 'teacher') {
      setTeacherDialogue(`"${recipe.nameKr} 합성 완료! 분자식 시험에 낸다 했다!"`);
    }
  };

  // Game over trigger
  const handleGameOver = (stats: GameEndStats) => {
    setEndStats(stats);
    setScreen('game_over');
  };

  // Victory trigger
  const handleVictory = (stats: GameEndStats) => {
    setEndStats(stats);
    setScreen('victory');
  };

  return (
    <div className={`w-screen h-screen ${screen === 'playing' ? 'overflow-hidden' : 'overflow-y-auto'} bg-black text-white relative`}>
      {screen === 'difficulty_select' && (
        <LevelSelect
          onSelectDifficulty={(mode) => {
            setDifficulty(mode);
            setScreen('character_select');
          }}
        />
      )}

      {screen === 'character_select' && (
        <CharacterSelect
          difficulty={difficulty}
          onSelectCharacter={(charId) => handleStartGame(charId)}
          onBack={() => setScreen('difficulty_select')}
        />
      )}

      {screen === 'playing' && (
        <div className="relative w-full h-full">
          <GameCanvas
            characterId={characterId}
            difficulty={difficulty}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            isBossStage={isBossStage}
            setIsBossStage={setIsBossStage}
            selectedMolecule={selectedMolecule}
            inventory={inventory}
            setInventory={setInventory}
            ammo={ammo}
            setAmmo={setAmmo}
            synthesizeMolecule={handleSynthesize}
            oxygen={oxygen}
            setOxygen={setOxygen}
            heartRate={heartRate}
            setHeartRate={setHeartRate}
            playerHealth={playerHealth}
            setPlayerHealth={setPlayerHealth}
            bossHealth={bossHealth}
            setBossHealth={setBossHealth}
            jetpackFuel={jetpackFuel}
            setJetpackFuel={setJetpackFuel}
            teacherDialogue={teacherDialogue}
            setTeacherDialogue={setTeacherDialogue}
            moleculesMadeCount={moleculesMadeCount}
          />
          <HUD
            characterId={characterId}
            isBossStage={isBossStage}
            playerHealth={playerHealth}
            oxygen={oxygen}
            heartRate={heartRate}
            jetpackFuel={jetpackFuel}
            bossHealth={bossHealth}
            inventory={inventory}
            ammo={ammo}
            selectedMolecule={selectedMolecule}
            setSelectedMolecule={setSelectedMolecule}
            onSynthesize={handleSynthesize}
            teacherDialogue={teacherDialogue}
          />
        </div>
      )}

      {(screen === 'game_over' || screen === 'victory') && endStats && (
        <LeaderboardDashboard
          stats={endStats}
          isVictory={screen === 'victory'}
          onPlayAgain={() => setScreen('difficulty_select')}
        />
      )}
    </div>
  );
}
