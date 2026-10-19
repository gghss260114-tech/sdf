import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { 
  CharacterId, 
  CHARACTERS, 
  DifficultyMode, 
  DIFFICULTIES, 
  ElementType, 
  MoleculeKey, 
  MOLECULE_RECIPES 
} from '../types/game.ts';
import { soundManager } from '../audio/soundManager.ts';
import { createLabWallTexture, createFloorTexture, createElementTexture } from './proceduralTextures.ts';
import { createPolyphemusModel, createPlayerModel, MonsterParts } from './proceduralModels.ts';
import { generateMaze, MazeGrid } from './mazeGenerator.ts';

interface GameCanvasProps {
  characterId: CharacterId;
  difficulty: DifficultyMode;
  onGameOver: (stats: GameEndStats) => void;
  onVictory: (stats: GameEndStats) => void;
  isBossStage: boolean;
  setIsBossStage: (val: boolean) => void;
  selectedMolecule: MoleculeKey;
  inventory: Record<ElementType, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<ElementType, number>>>;
  ammo: Record<MoleculeKey, number>;
  setAmmo: React.Dispatch<React.SetStateAction<Record<MoleculeKey, number>>>;
  synthesizeMolecule: (mol: MoleculeKey) => void;
  oxygen: number;
  setOxygen: React.Dispatch<React.SetStateAction<number>>;
  heartRate: number;
  setHeartRate: React.Dispatch<React.SetStateAction<number>>;
  playerHealth: number;
  setPlayerHealth: React.Dispatch<React.SetStateAction<number>>;
  bossHealth: number;
  setBossHealth: React.Dispatch<React.SetStateAction<number>>;
  jetpackFuel: number;
  setJetpackFuel: React.Dispatch<React.SetStateAction<number>>;
  teacherDialogue: string;
  setTeacherDialogue: React.Dispatch<React.SetStateAction<string>>;
  moleculesMadeCount: number;
}

export interface GameEndStats {
  characterId: CharacterId;
  difficulty: DifficultyMode;
  score: number;
  timeSeconds: number;
  moleculesSynthesized: number;
  bossDefeated: boolean;
}

// Reusable math helpers outside animation loop to prevent GC stalls
const _vec3 = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _side = new THREE.Vector3();

export const GameCanvas: React.FC<GameCanvasProps> = ({
  characterId,
  difficulty,
  onGameOver,
  onVictory,
  isBossStage,
  setIsBossStage,
  selectedMolecule,
  inventory,
  setInventory,
  ammo,
  setAmmo,
  oxygen,
  setOxygen,
  heartRate,
  setHeartRate,
  playerHealth,
  setPlayerHealth,
  bossHealth,
  setBossHealth,
  jetpackFuel,
  setJetpackFuel,
  setTeacherDialogue,
  moleculesMadeCount,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const charConfig = CHARACTERS[characterId];
  const diffConfig = DIFFICULTIES[difficulty];

  // Mutable refs to track real-time gameplay state
  const stateRef = useRef({
    playerPos: new THREE.Vector3(0, 0, 0),
    playerVelocity: new THREE.Vector3(0, 0, 0),
    playerYaw: 0,
    playerPitch: 0,
    isGrounded: true,
    isJetpacking: false,
    isSpraying: false,
    isSneaking: false,
    keys: {} as Record<string, boolean>,
    hp: 100,
    o2: 100,
    bpm: 72,
    fuel: 100,
    bHealth: 1000,
    lastShootTime: 0,
    lastTeacherGroanTime: 0,
    gameStartTime: Date.now(),
    isBossActive: false,
    bossPhase: 1,
    bossActionTimer: 0,
    laserActive: false,
    laserAngle: 0,
  });

  useEffect(() => {
    stateRef.current.hp = 100;
    stateRef.current.o2 = 100;
    stateRef.current.bpm = 72;
    stateRef.current.fuel = 100;
    stateRef.current.bHealth = 1000;
    stateRef.current.isBossActive = isBossStage;
  }, [isBossStage]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    // 1. Renderer Setup
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, powerPreference: 'high-performance' });
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountEl.appendChild(renderer.domElement);

    // 2. Scene & Studio Lighting Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.035);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(75, mountEl.clientWidth / mountEl.clientHeight, 0.1, 150);

    // Studio lights: Warm key light, cool hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x050814, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    keyLight.position.set(20, 35, 20);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // 3. Player 3D Model & Container
    const playerGroup = new THREE.Group();
    const playerVisual = createPlayerModel(characterId);
    playerGroup.add(playerVisual);
    scene.add(playerGroup);

    // Player flash light / hand light
    const playerLight = new THREE.SpotLight(0x67e8f9, 3, 22, Math.PI / 4, 0.4);
    playerLight.position.set(0, 1.6, 0);
    playerGroup.add(playerLight);
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 1.4, 6);
    playerGroup.add(lightTarget);
    playerLight.target = lightTarget;

    // Jetpack flame particles
    const jetpackFlameGeo = new THREE.BufferGeometry();
    const flameCount = 40;
    const flamePositions = new Float32Array(flameCount * 3);
    for (let i = 0; i < flameCount * 3; i++) flamePositions[i] = (Math.random() - 0.5) * 0.4;
    jetpackFlameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    const jetpackFlameMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const jetpackFlames = new THREE.Points(jetpackFlameGeo, jetpackFlameMat);
    jetpackFlames.position.set(0, 0.6, -0.3);
    jetpackFlames.visible = false;
    playerGroup.add(jetpackFlames);

    // 4. Projectiles and Particle Systems
    interface Projectile {
      mesh: THREE.Mesh;
      dir: THREE.Vector3;
      speed: number;
      type: 'bullet' | 'chalk' | MoleculeKey;
      damage: number;
      lifetime: number;
    }
    const projectiles: Projectile[] = [];

    // Chemical spray continuous particles (Right click)
    const sprayCount = 120;
    const sprayGeo = new THREE.BufferGeometry();
    const sprayPositions = new Float32Array(sprayCount * 3);
    const sprayVelocities: THREE.Vector3[] = [];
    for (let i = 0; i < sprayCount; i++) {
      sprayPositions[i * 3] = 0;
      sprayPositions[i * 3 + 1] = 0;
      sprayPositions[i * 3 + 2] = 0;
      sprayVelocities.push(new THREE.Vector3());
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
    scene.add(sprayPoints);

    // Acid pools on ground (H2SO4)
    interface AcidPool {
      mesh: THREE.Mesh;
      remainingTime: number;
    }
    const acidPools: AcidPool[] = [];

    // 5. Maze or Boss Stage Generation
    let maze: MazeGrid | null = null;
    const mazeMeshes: THREE.Object3D[] = [];
    const elementObjects: Array<{ mesh: THREE.Group; type: ElementType; collected: boolean; pos: THREE.Vector3 }> = [];

    interface MonsterInstance {
      parts: MonsterParts;
      pos: THREE.Vector3;
      targetPos: THREE.Vector3;
      isBlinded: number; // seconds
      isSlowed: number;
      isStunned: number;
      health: number;
      speed: number;
      animOffset: number;
    }
    const monsters: MonsterInstance[] = [];

    let bossInstance: MonsterInstance | null = null;
    let exitPortalMesh: THREE.Group | null = null;

    const wallTex = createLabWallTexture();
    const floorTex = createFloorTexture();

    function setupMazeStage() {
      // Clear previous meshes
      mazeMeshes.forEach(m => scene.remove(m));
      mazeMeshes.length = 0;
      elementObjects.length = 0;
      monsters.length = 0;

      scene.fog = new THREE.FogExp2(0x050814, 0.038);

      maze = generateMaze(difficulty === 'hard');

      // Floor
      const floorSize = Math.max(maze.width, maze.height) * maze.cellSize + 10;
      const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.8,
        metalness: 0.4,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = !isHeadless;
      scene.add(floorMesh);
      mazeMeshes.push(floorMesh);

      // Maze Walls
      const wallMat = new THREE.MeshStandardMaterial({
        map: wallTex,
        roughness: 0.65,
        metalness: 0.5,
      });
      const wallGeo = new THREE.BoxGeometry(maze.cellSize, 4.2, maze.cellSize);

      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          if (maze.grid[y][x] === 0) {
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(
              (x - maze.width / 2) * maze.cellSize,
              2.1,
              (y - maze.height / 2) * maze.cellSize
            );
            wall.castShadow = !isHeadless;
            wall.receiveShadow = !isHeadless;
            scene.add(wall);
            mazeMeshes.push(wall);
          }
        }
      }

      // Exit Portal: Hologram pad with rotating rings
      const portalGroup = new THREE.Group();
      portalGroup.position.set(maze.exitPos.x, 0.1, maze.exitPos.z);

      const portalBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.6, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 })
      );
      portalGroup.add(portalBase);

      const portalRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.12, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      portalRing.rotation.x = Math.PI / 2;
      portalRing.position.y = 0.3;
      portalGroup.add(portalRing);

      const portalLight = new THREE.PointLight(0x06b6d4, 3, 12);
      portalLight.position.y = 1.5;
      portalGroup.add(portalLight);

      scene.add(portalGroup);
      mazeMeshes.push(portalGroup);
      exitPortalMesh = portalGroup;

      // Spawn Elements
      maze.elementSpawns.forEach(el => {
        const elGroup = new THREE.Group();
        elGroup.position.set(el.x, 1.2, el.z);

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 12),
          new THREE.MeshPhysicalMaterial({
            map: createElementTexture(el.type, el.type === 'H' ? '#818cf8' : el.type === 'O' ? '#06b6d4' : el.type === 'Cl' ? '#22c55e' : el.type === 'C' ? '#ef4444' : el.type === 'N' ? '#c084fc' : '#eab308'),
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            emissive: el.type === 'H' ? 0x312e81 : el.type === 'O' ? 0x0e7490 : 0x14532d,
            emissiveIntensity: 0.8,
          })
        );
        elGroup.add(sphere);

        // Orbiting electron ring
        const orbitRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.03, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        );
        orbitRing.rotation.x = Math.PI / 3;
        elGroup.add(orbitRing);

        scene.add(elGroup);
        mazeMeshes.push(elGroup);
        elementObjects.push({
          mesh: elGroup,
          type: el.type,
          collected: false,
          pos: new THREE.Vector3(el.x, 1.2, el.z),
        });
      });

      // Spawn Monsters
      maze.monsterSpawns.forEach((spawn, idx) => {
        const monsterParts = createPolyphemusModel(false);
        monsterParts.root.position.set(spawn.x, 0, spawn.z);
        scene.add(monsterParts.root);
        mazeMeshes.push(monsterParts.root);

        monsters.push({
          parts: monsterParts,
          pos: new THREE.Vector3(spawn.x, 0, spawn.z),
          targetPos: new THREE.Vector3(spawn.x, 0, spawn.z),
          isBlinded: 0,
          isSlowed: 0,
          isStunned: 0,
          health: 150,
          speed: diffConfig.monsterSpeed,
          animOffset: idx * 1.5,
        });
      });

      // Set player initial position at spawn
      stateRef.current.playerPos.set(maze.spawnPos.x, 0, maze.spawnPos.z);
      playerGroup.position.copy(stateRef.current.playerPos);
    }

    function setupBossArenaStage() {
      // Clear maze
      mazeMeshes.forEach(m => scene.remove(m));
      mazeMeshes.length = 0;
      elementObjects.length = 0;
      monsters.length = 0;

      scene.fog = new THREE.FogExp2(0x18040a, 0.022);

      // Huge Colosseum Arena (Radius 36m)
      const arenaRadius = 36;
      const arenaFloorGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 2, 1, 32);
      const arenaFloorMat = new THREE.MeshStandardMaterial({
        color: 0x1f1724,
        roughness: 0.7,
        metalness: 0.5,
      });
      const arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
      arenaFloor.position.y = -0.5;
      arenaFloor.receiveShadow = !isHeadless;
      scene.add(arenaFloor);
      mazeMeshes.push(arenaFloor);

      // Outer glowing acid moat
      const moatGeo = new THREE.RingGeometry(arenaRadius - 2, arenaRadius + 14, 32);
      const moatMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
      const moat = new THREE.Mesh(moatGeo, moatMat);
      moat.rotation.x = -Math.PI / 2;
      moat.position.y = -0.3;
      scene.add(moat);
      mazeMeshes.push(moat);

      // Colosseum cyber pillars
      for (let p = 0; p < 12; p++) {
        const angle = (p / 12) * Math.PI * 2;
        const px = Math.cos(angle) * (arenaRadius - 4);
        const pz = Math.sin(angle) * (arenaRadius - 4);

        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.8, 16, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        pillar.position.set(px, 8, pz);
        scene.add(pillar);
        mazeMeshes.push(pillar);

        // Flashing red emergency beacon on pillars
        const beacon = new THREE.PointLight(0xef4444, 2, 20);
        beacon.position.set(px, 16.5, pz);
        scene.add(beacon);
        mazeMeshes.push(beacon);
      }

      // Final Boss: TITAN POLYPHEMUS
      const bossParts = createPolyphemusModel(true);
      bossParts.root.position.set(0, 0, 15);
      scene.add(bossParts.root);
      mazeMeshes.push(bossParts.root);

      bossInstance = {
        parts: bossParts,
        pos: new THREE.Vector3(0, 0, 15),
        targetPos: new THREE.Vector3(0, 0, 15),
        isBlinded: 0,
        isSlowed: 0,
        isStunned: 0,
        health: 1000,
        speed: 6.2,
        animOffset: 0,
      };

      // Periodic element re-supply pods in boss arena
      const arenaElements: ElementType[] = ['H', 'Cl', 'C', 'N', 'S', 'O'];
      for (let i = 0; i < 18; i++) {
        const rad = 8 + Math.random() * (arenaRadius - 14);
        const ang = Math.random() * Math.PI * 2;
        const type = arenaElements[i % arenaElements.length];
        const elGroup = new THREE.Group();
        elGroup.position.set(Math.cos(ang) * rad, 1.2, Math.sin(ang) * rad);

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 12, 12),
          new THREE.MeshPhysicalMaterial({
            map: createElementTexture(type, '#38bdf8'),
            roughness: 0.1,
            clearcoat: 1.0,
            emissive: 0x0284c7,
            emissiveIntensity: 0.9,
          })
        );
        elGroup.add(sphere);
        scene.add(elGroup);
        mazeMeshes.push(elGroup);
        elementObjects.push({
          mesh: elGroup,
          type,
          collected: false,
          pos: new THREE.Vector3(elGroup.position.x, 1.2, elGroup.position.z),
        });
      }

      // Player start in Boss arena
      stateRef.current.playerPos.set(0, 0, -22);
      playerGroup.position.copy(stateRef.current.playerPos);

      soundManager.playMonsterRoar(1.5);
    }

    if (isBossStage) {
      setupBossArenaStage();
    } else {
      setupMazeStage();
    }

    // 6. Keyboard & Mouse Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;

      // Sneak toggle
      if (e.code === 'KeyC' || e.code === 'ControlLeft') {
        stateRef.current.isSneaking = !stateRef.current.isSneaking;
      }

      // Jetpack flight toggle
      if (e.code === 'ShiftLeft' || e.code === 'KeyE') {
        if (stateRef.current.fuel > 15) {
          stateRef.current.isJetpacking = true;
          soundManager.startJetpack();
        }
      }

      // Jump
      if (e.code === 'Space' && stateRef.current.isGrounded && !stateRef.current.isJetpacking) {
        if (characterId === 'teacher') {
          // Teacher chronic backache constraint!
          const now = Date.now();
          if (now - stateRef.current.lastTeacherGroanTime < 2500) {
            setTeacherDialogue('아이고 허리야! 뼈마디가 쑤셔서 연속 점프는 무리다...');
            return;
          }
          stateRef.current.lastTeacherGroanTime = now;
          soundManager.playTeacherGroan();
          setTeacherDialogue('커헉! 척추 4번 5번 디스크가 탈출하려 한다!');
          stateRef.current.playerVelocity.y = 4.2;
        } else if (characterId === 'friend') {
          stateRef.current.playerVelocity.y = 7.5; // High athletic jump!
        } else {
          stateRef.current.playerVelocity.y = 5.8;
        }
        stateRef.current.isGrounded = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;

      if (e.code === 'ShiftLeft' || e.code === 'KeyE') {
        stateRef.current.isJetpacking = false;
        soundManager.stopJetpack();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click: Fire active weapon or molecule
        fireWeapon();
      } else if (e.button === 2) {
        // Right click: Spray chemical acid/flame stream
        e.preventDefault();
        stateRef.current.isSpraying = true;
        soundManager.startSpray();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        stateRef.current.isSpraying = false;
        soundManager.stopSpray();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Rotation with mouse drag or move
      if (document.pointerLockElement === renderer.domElement || e.buttons > 0) {
        const sens = 0.003;
        stateRef.current.playerYaw -= e.movementX * sens;
        stateRef.current.playerPitch = Math.max(-0.6, Math.min(0.6, stateRef.current.playerPitch - e.movementY * sens));
      }
    };

    const handleCanvasClick = () => {
      if (renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    mountEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    mountEl.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);
    mountEl.addEventListener('click', handleCanvasClick);

    // Weapon projectile spawner
    function fireWeapon() {
      const now = Date.now();
      if (now - stateRef.current.lastShootTime < 220) return;
      stateRef.current.lastShootTime = now;

      // Compute forward direction
      const forward = new THREE.Vector3(
        -Math.sin(stateRef.current.playerYaw),
        stateRef.current.playerPitch,
        -Math.cos(stateRef.current.playerYaw)
      ).normalize();

      const spawnPoint = stateRef.current.playerPos.clone().add(new THREE.Vector3(0, 1.4, 0)).add(forward.clone().multiplyScalar(0.8));

      // Check if player has ammo of selected molecule
      if (ammo[selectedMolecule] > 0) {
        // Spend 1 molecule ammo
        setAmmo(prev => ({ ...prev, [selectedMolecule]: prev[selectedMolecule] - 1 }));

        const molRecipe = MOLECULE_RECIPES[selectedMolecule];
        const projMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 10, 10),
          new THREE.MeshStandardMaterial({
            color: molRecipe.color,
            emissive: molRecipe.color,
            emissiveIntensity: 1.5,
            roughness: 0.2,
          })
        );
        projMesh.position.copy(spawnPoint);
        scene.add(projMesh);

        projectiles.push({
          mesh: projMesh,
          dir: forward,
          speed: 18,
          type: selectedMolecule,
          damage: selectedMolecule === 'CH4' ? 120 : selectedMolecule === 'HCl' ? 60 : 35,
          lifetime: 4.0,
        });

        soundManager.playShoot(false);

        if (characterId === 'teacher') {
          setTeacherDialogue(`"${molRecipe.nameKr} 투척! 화학 결합 에너지를 맛보거라!"`);
        }
      } else {
        // Basic attack
        if (characterId === 'teacher') {
          // Chalk projectile (infinite for teacher!)
          const chalkMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          chalkMesh.position.copy(spawnPoint);
          chalkMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
          scene.add(chalkMesh);

          projectiles.push({
            mesh: chalkMesh,
            dir: forward,
            speed: 22,
            type: 'chalk',
            damage: 22,
            lifetime: 2.5,
          });

          soundManager.playShoot(true);
          const quotes = [
            '거기 맨 뒷자리! 분필 맞고 정신 차려라!',
            '집중! 화학 시험범위는 외눈박이 해부까지다!',
            '분필 하나로 교단에서 30년을 버텼다!',
          ];
          if (Math.random() < 0.25) {
            setTeacherDialogue(quotes[Math.floor(Math.random() * quotes.length)]);
          }
        } else {
          // Standard laser bolt
          const laserMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.7),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          laserMesh.position.copy(spawnPoint);
          laserMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
          scene.add(laserMesh);

          projectiles.push({
            mesh: laserMesh,
            dir: forward,
            speed: 26,
            type: 'bullet',
            damage: 25,
            lifetime: 2.0,
          });

          soundManager.playShoot(false);
        }
      }
    }

    // 7. Main Game Physics & Render Loop
    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Check win/lose
      if (stateRef.current.hp <= 0 || stateRef.current.o2 <= 0) {
        const timeSec = Math.floor((Date.now() - stateRef.current.gameStartTime) / 1000);
        onGameOver({
          characterId,
          difficulty,
          score: Math.max(100, moleculesMadeCount * 80 + timeSec * 10),
          timeSeconds: timeSec,
          moleculesSynthesized: moleculesMadeCount,
          bossDefeated: false,
        });
        cancelAnimationFrame(animFrameId);
        return;
      }

      // Oxygen drain
      stateRef.current.o2 -= dt * 0.9 * charConfig.oxygenDepletionRate;
      setOxygen(Math.max(0, Math.floor(stateRef.current.o2)));

      // Player Movement
      const keys = stateRef.current.keys;
      let moveX = 0;
      let moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      const isMoving = moveX !== 0 || moveZ !== 0;

      // Heart rate adjustments
      if (stateRef.current.isSneaking) {
        stateRef.current.bpm = THREE.MathUtils.damp(stateRef.current.bpm, 65, 2.0, dt);
      } else if (isMoving) {
        stateRef.current.bpm = THREE.MathUtils.damp(stateRef.current.bpm, 110 * charConfig.heartRateSensitivity, 1.5, dt);
      } else {
        stateRef.current.bpm = THREE.MathUtils.damp(stateRef.current.bpm, 72, 1.2, dt);
      }
      setHeartRate(Math.floor(stateRef.current.bpm));
      soundManager.updateHeartbeat(stateRef.current.bpm);

      // Jetpack Flight Logic (미로 위쪽으로 일시적으로 날아드는 기능)
      jetpackFlames.visible = stateRef.current.isJetpacking;
      if (stateRef.current.isJetpacking && stateRef.current.fuel > 0) {
        stateRef.current.fuel = Math.max(0, stateRef.current.fuel - dt * (100 / charConfig.jetpackDuration));
        stateRef.current.playerVelocity.y = 8.5; // Elevate high!
        // Cap max flight altitude
        if (stateRef.current.playerPos.y > 13.5) {
          stateRef.current.playerVelocity.y = 0;
          stateRef.current.playerPos.y = 13.5;
        }
      } else {
        // Recharge jetpack fuel when on ground
        if (stateRef.current.isGrounded) {
          stateRef.current.fuel = Math.min(100, stateRef.current.fuel + dt * (100 / charConfig.jetpackCooldown));
        }
        // Gravity
        stateRef.current.playerVelocity.y -= 22 * dt;
      }
      setJetpackFuel(Math.floor(stateRef.current.fuel));

      // Calculate move vector in world space
      let currentSpeed = charConfig.speed;
      if (stateRef.current.isSneaking) currentSpeed *= 0.45;
      if (keys['ShiftLeft'] && !stateRef.current.isJetpacking) currentSpeed *= charConfig.sprintMultiplier;

      _forward.set(-Math.sin(stateRef.current.playerYaw), 0, -Math.cos(stateRef.current.playerYaw));
      _side.set(-Math.sin(stateRef.current.playerYaw - Math.PI / 2), 0, -Math.cos(stateRef.current.playerYaw - Math.PI / 2));

      _vec3.set(0, 0, 0);
      if (moveZ !== 0) _vec3.addScaledVector(_forward, -moveZ);
      if (moveX !== 0) _vec3.addScaledVector(_side, moveX);
      if (_vec3.lengthSq() > 0) _vec3.normalize().multiplyScalar(currentSpeed * dt);

      // Apply movement with simple maze wall collision
      const newX = stateRef.current.playerPos.x + _vec3.x;
      const newZ = stateRef.current.playerPos.z + _vec3.z;

      // Check wall collision if in maze and below wall height (height 4.2)
      let canMoveX = true;
      let canMoveZ = true;

      if (!isBossStage && maze && stateRef.current.playerPos.y < 3.8) {
        const gridX_NewX = Math.round(newX / maze.cellSize + maze.width / 2);
        const gridZ_OldZ = Math.round(stateRef.current.playerPos.z / maze.cellSize + maze.height / 2);
        if (maze.grid[gridZ_OldZ]?.[gridX_NewX] === 0) canMoveX = false;

        const gridX_OldX = Math.round(stateRef.current.playerPos.x / maze.cellSize + maze.width / 2);
        const gridZ_NewZ = Math.round(newZ / maze.cellSize + maze.height / 2);
        if (maze.grid[gridZ_NewZ]?.[gridX_OldX] === 0) canMoveZ = false;
      }

      // Arena boundary if in boss stage
      if (isBossStage) {
        if (Math.hypot(newX, newZ) > 34) {
          canMoveX = false;
          canMoveZ = false;
        }
      }

      if (canMoveX) stateRef.current.playerPos.x = newX;
      if (canMoveZ) stateRef.current.playerPos.z = newZ;

      // Vertical position & ground collision
      stateRef.current.playerPos.y += stateRef.current.playerVelocity.y * dt;
      if (stateRef.current.playerPos.y <= 0) {
        stateRef.current.playerPos.y = 0;
        stateRef.current.playerVelocity.y = 0;
        stateRef.current.isGrounded = true;
      }

      // Update player model visual orientation
      playerGroup.position.copy(stateRef.current.playerPos);
      playerGroup.rotation.y = stateRef.current.playerYaw;

      // Camera positioning:
      // When jetpacking, camera pulls back and up high for tactical bird's-eye maze view!
      if (stateRef.current.isJetpacking || stateRef.current.playerPos.y > 6) {
        const highCamPos = stateRef.current.playerPos.clone().add(new THREE.Vector3(0, 16, 12));
        camera.position.lerp(highCamPos, 0.08);
        camera.lookAt(stateRef.current.playerPos);
      } else {
        // Standard third-person over-the-shoulder immersive horror cam
        const camOffset = new THREE.Vector3(
          Math.sin(stateRef.current.playerYaw) * 3.8,
          2.4 + stateRef.current.playerPitch * 1.5,
          Math.cos(stateRef.current.playerYaw) * 3.8
        );
        const targetCamPos = stateRef.current.playerPos.clone().add(camOffset);
        camera.position.lerp(targetCamPos, 0.15);
        camera.lookAt(stateRef.current.playerPos.clone().add(new THREE.Vector3(0, 1.6, 0)));
      }

      // Element pickup detection
      elementObjects.forEach(elObj => {
        if (!elObj.collected) {
          // Bobbing & rotation
          elObj.mesh.rotation.y += dt * 2.0;
          elObj.mesh.position.y = 1.2 + Math.sin(time * 3 + elObj.pos.x) * 0.25;

          const dist = stateRef.current.playerPos.distanceTo(elObj.mesh.position);
          if (dist < 1.8) {
            elObj.collected = true;
            elObj.mesh.visible = false;
            soundManager.playPickup();

            setInventory(prev => ({
              ...prev,
              [elObj.type]: (prev[elObj.type] || 0) + 1,
            }));
          }
        }
      });

      // Exit portal detection in maze
      if (!isBossStage && exitPortalMesh) {
        exitPortalMesh.children[1].rotation.z += dt * 2.5; // Rotate portal ring
        const distToExit = stateRef.current.playerPos.distanceTo(exitPortalMesh.position);
        if (distToExit < 2.5) {
          // REACHED EXIT PORTAL -> TRANSITION TO GRAND POLYPHEMUS BOSS ARENA!
          setIsBossStage(true);
          setupBossArenaStage();
          return;
        }
      }

      // Continuous chemical spray stream (Right click)
      if (stateRef.current.isSpraying) {
        const sprayPosAttr = sprayGeo.attributes.position as THREE.BufferAttribute;
        const array = sprayPosAttr.array as Float32Array;

        const muzzlePos = stateRef.current.playerPos.clone().add(new THREE.Vector3(0, 1.3, 0));
        const forwardDir = new THREE.Vector3(
          -Math.sin(stateRef.current.playerYaw),
          stateRef.current.playerPitch,
          -Math.cos(stateRef.current.playerYaw)
        );

        for (let i = 0; i < sprayCount; i++) {
          if (Math.random() < 0.2) {
            // Re-spawn particle at muzzle
            array[i * 3] = muzzlePos.x;
            array[i * 3 + 1] = muzzlePos.y;
            array[i * 3 + 2] = muzzlePos.z;
            sprayVelocities[i] = forwardDir.clone()
              .add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4))
              .multiplyScalar(14 + Math.random() * 6);
          } else {
            // Update particle
            array[i * 3] += sprayVelocities[i].x * dt;
            array[i * 3 + 1] += sprayVelocities[i].y * dt;
            array[i * 3 + 2] += sprayVelocities[i].z * dt;
          }

          // Check hit against monsters
          const pVec = new THREE.Vector3(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]);
          monsters.forEach(m => {
            if (m.pos.distanceTo(pVec) < 1.8) {
              m.health -= dt * 35;
              m.isSlowed = 1.0;
            }
          });
          if (bossInstance && bossInstance.pos.distanceTo(pVec) < 4.0) {
            bossInstance.health -= dt * 45;
            stateRef.current.bHealth = Math.max(0, bossInstance.health);
            setBossHealth(Math.floor(stateRef.current.bHealth));
          }
        }
        sprayPosAttr.needsUpdate = true;
      } else {
        // Hide spray
        const sprayPosAttr = sprayGeo.attributes.position as THREE.BufferAttribute;
        const array = sprayPosAttr.array as Float32Array;
        for (let i = 0; i < sprayCount * 3; i++) array[i] = -9999;
        sprayPosAttr.needsUpdate = true;
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.lifetime -= dt;
        p.mesh.position.addScaledVector(p.dir, p.speed * dt);

        let hit = false;

        // Check monster hits
        monsters.forEach(m => {
          if (m.pos.distanceTo(p.mesh.position) < 2.0) {
            hit = true;
            m.health -= p.damage;

            if (p.type === 'HCl') {
              // Blind monster's eye for 5 seconds!
              m.isBlinded = 5.0;
              soundManager.playEyeBurn();
            } else if (p.type === 'CH4') {
              // Gas explosion!
              soundManager.playExplosion();
              m.pos.addScaledVector(p.dir, 4.5); // Knockback
            } else if (p.type === 'NH3') {
              // Ammonia stink disorientation
              m.isStunned = 4.0;
            } else if (p.type === 'H2SO4') {
              // Slow mud
              m.isSlowed = 6.0;
            }
          }
        });

        // Check boss hit
        if (bossInstance && bossInstance.pos.distanceTo(p.mesh.position) < 4.2) {
          hit = true;
          bossInstance.health -= p.damage;
          stateRef.current.bHealth = Math.max(0, bossInstance.health);
          setBossHealth(Math.floor(stateRef.current.bHealth));

          if (p.type === 'HCl') {
            soundManager.playEyeBurn();
            bossInstance.isBlinded = 3.5;
          } else if (p.type === 'CH4') {
            soundManager.playExplosion();
          }

          // Check Boss Victory!
          if (bossInstance.health <= 0) {
            const timeSec = Math.floor((Date.now() - stateRef.current.gameStartTime) / 1000);
            const finalScore = Math.floor(
              (10000 + moleculesMadeCount * 300 + (300 - Math.min(300, timeSec)) * 50) * charConfig.scoreBonusMultiplier
            );
            onVictory({
              characterId,
              difficulty,
              score: finalScore,
              timeSeconds: timeSec,
              moleculesSynthesized: moleculesMadeCount,
              bossDefeated: true,
            });
            cancelAnimationFrame(animFrameId);
            return;
          }
        }

        if (hit || p.lifetime <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          projectiles.splice(i, 1);
        }
      }

      // Update Maze Monsters AI & Animation
      monsters.forEach(m => {
        // Recovery from states
        if (m.isBlinded > 0) m.isBlinded -= dt;
        if (m.isStunned > 0) m.isStunned -= dt;
        if (m.isSlowed > 0) m.isSlowed -= dt;

        // Comical, grotesque procedural animations:
        // Lolling tongue oscillation
        m.parts.tongueMesh.rotation.z = Math.sin(time * 6 + m.animOffset) * 0.35;
        // Jaw opening and closing
        m.parts.jawGroup.rotation.x = Math.sin(time * 3 + m.animOffset) * 0.25;
        // Bloodshot eye darts towards player!
        m.parts.eyeContainer.lookAt(stateRef.current.playerPos);

        // Arm swing & stomping legs
        m.parts.leftArm.rotation.x = Math.sin(time * 4 + m.animOffset) * 0.4;
        m.parts.rightArm.rotation.x = -Math.sin(time * 4 + m.animOffset) * 0.4;
        m.parts.leftLeg.rotation.x = -Math.sin(time * 4 + m.animOffset) * 0.5;
        m.parts.rightLeg.rotation.x = Math.sin(time * 4 + m.animOffset) * 0.5;

        // Monster AI behavior
        const distToPlayer = m.pos.distanceTo(stateRef.current.playerPos);

        // Perception radius grows when player has high BPM / running!
        const perceptionRadius = diffConfig.monsterPerceptionRange * (stateRef.current.bpm > 100 ? 1.6 : 1.0);

        if (m.isBlinded > 0 || m.isStunned > 0) {
          // Writhes in pain, shakes rapidly
          m.parts.root.rotation.y += Math.sin(time * 20) * 0.05;
        } else if (distToPlayer < perceptionRadius) {
          // Pursue player!
          const moveDir = stateRef.current.playerPos.clone().sub(m.pos).setY(0).normalize();
          let effSpeed = m.speed;
          if (m.isSlowed > 0) effSpeed *= 0.4;

          m.pos.addScaledVector(moveDir, effSpeed * dt);
          m.parts.root.position.copy(m.pos);
          m.parts.root.lookAt(stateRef.current.playerPos.x, 0, stateRef.current.playerPos.z);

          // Footstep sounds
          if (Math.sin(time * 4 + m.animOffset) > 0.95) {
            soundManager.playFootstep(distToPlayer / 30);
          }

          // Attack player if close
          if (distToPlayer < 2.0 && stateRef.current.playerPos.y < 2.5) {
            stateRef.current.hp -= dt * 25;
            setPlayerHealth(Math.max(0, Math.floor(stateRef.current.hp)));
            soundManager.playMonsterRoar(0.8);
          }
        }
      });

      // Update Final Boss: TITAN POLYPHEMUS
      if (bossInstance) {
        const b = bossInstance;
        // Boss eye tracking
        b.parts.eyeContainer.lookAt(stateRef.current.playerPos);
        b.parts.root.lookAt(stateRef.current.playerPos.x, 0, stateRef.current.playerPos.z);

        // Breathing animation & chest core pulse
        if (b.parts.chestCore) {
          const coreScale = 1.0 + Math.sin(time * 6) * 0.2;
          b.parts.chestCore.scale.set(coreScale, coreScale, coreScale);
        }

        // Boss Actions based on phases
        stateRef.current.bossActionTimer += dt;

        const distToPlayer = b.pos.distanceTo(stateRef.current.playerPos);

        // Phase 1 (HP > 600): Aggressive Stomping & Charging
        if (b.health > 600) {
          const bossDir = stateRef.current.playerPos.clone().sub(b.pos).setY(0).normalize();
          b.pos.addScaledVector(bossDir, b.speed * 0.7 * dt);
          b.parts.root.position.copy(b.pos);

          if (distToPlayer < 4.2 && stateRef.current.playerPos.y < 3.0) {
            stateRef.current.hp -= dt * 38;
            setPlayerHealth(Math.max(0, Math.floor(stateRef.current.hp)));
          }
        } 
        // Phase 2 (HP 300 ~ 600): Laser Eye Sweep!
        else if (b.health > 300) {
          if (stateRef.current.bossActionTimer > 6.0) {
            stateRef.current.bossActionTimer = 0;
            stateRef.current.laserActive = true;
            soundManager.playBossLaser();
            if (b.parts.laserBeam) b.parts.laserBeam.visible = true;

            setTimeout(() => {
              stateRef.current.laserActive = false;
              if (b.parts.laserBeam) b.parts.laserBeam.visible = false;
            }, 2500);
          }

          if (stateRef.current.laserActive) {
            // Sweeping laser damage if player doesn't jump/jetpack!
            if (stateRef.current.playerPos.y < 4.0) {
              stateRef.current.hp -= dt * 45;
              setPlayerHealth(Math.max(0, Math.floor(stateRef.current.hp)));
            }
          }
        } 
        // Phase 3 (HP <= 300): Berserk Enrage!
        else {
          const berserkDir = stateRef.current.playerPos.clone().sub(b.pos).setY(0).normalize();
          b.pos.addScaledVector(berserkDir, b.speed * 1.3 * dt);
          b.parts.root.position.copy(b.pos);

          if (distToPlayer < 4.8 && stateRef.current.playerPos.y < 3.5) {
            stateRef.current.hp -= dt * 50;
            setPlayerHealth(Math.max(0, Math.floor(stateRef.current.hp)));
          }
        }
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!mountEl) return;
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      mountEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      mountEl.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousemove', handleMouseMove);
      mountEl.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);

      soundManager.stopSpray();
      soundManager.stopJetpack();

      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [characterId, difficulty, isBossStage]);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden" 
    />
  );
};
