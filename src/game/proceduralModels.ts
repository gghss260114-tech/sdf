import * as THREE from 'three';
import { createEyeTexture } from './proceduralTextures.ts';
import { CharacterId } from '../types/game.ts';

/**
 * Builds composite 3D procedural models (3-12 parts)
 * Following the Three.js skill mandates:
 * - Proper roughness/metalness variation (>= 0.25)
 * - Ground-centered bottom pivots
 * - Zero external 3D file dependencies
 */

export interface MonsterParts {
  root: THREE.Group;
  eyeMesh: THREE.Mesh;
  eyeContainer: THREE.Group;
  jawGroup: THREE.Group;
  tongueMesh: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  spineGroup: THREE.Group;
  chestCore?: THREE.Mesh;
  laserBeam?: THREE.Mesh;
  salivaParticles?: THREE.Points;
}

export function createPolyphemusModel(isBoss: boolean = false): MonsterParts {
  const root = new THREE.Group();
  const scale = isBoss ? 2.4 : 1.35;
  root.scale.set(scale, scale, scale);

  // Materials with varied roughness and metalness
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: isBoss ? 0x4a1d24 : 0x2e4a38,
    roughness: 0.85,
    metalness: 0.1,
  });

  const muscleMaterial = new THREE.MeshStandardMaterial({
    color: isBoss ? 0x831843 : 0x581c87,
    roughness: 0.7,
    metalness: 0.2,
  });

  const boneMaterial = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.35,
    metalness: 0.05,
  });

  const teethMaterial = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    roughness: 0.2,
    metalness: 0.1,
  });

  const steelMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.85,
  });

  // 1. Lower Body / Hips
  const hips = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), muscleMaterial);
  hips.position.y = 1.3;
  hips.scale.set(1.1, 0.9, 1.2);
  root.add(hips);

  // 2. Hunched Bulging Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 1.4, 8), skinMaterial);
  torso.position.set(0, 2.2, 0.2);
  torso.rotation.x = 0.3; // hunched forward
  root.add(torso);

  // Chest pectoral slabs (grotesque asymmetrical slabs)
  const leftPec = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), muscleMaterial);
  leftPec.position.set(-0.35, 2.35, 0.65);
  leftPec.scale.set(1, 0.8, 1.2);
  root.add(leftPec);

  const rightPec = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), muscleMaterial);
  rightPec.position.set(0.4, 2.3, 0.7);
  rightPec.scale.set(1.2, 0.9, 1.3);
  root.add(rightPec);

  // 3. Spines on back (Jagged bone crest)
  const spineGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12 - i * 0.015, 0.5 + i * 0.05, 5), boneMaterial);
    spike.position.set((Math.sin(i * 2) * 0.05), 1.6 + i * 0.24, -0.3 - i * 0.08);
    spike.rotation.x = -1.1 + (i * 0.1);
    spineGroup.add(spike);
  }
  root.add(spineGroup);

  // 4. Head & Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 6), skinMaterial);
  neck.position.set(0, 2.8, 0.5);
  neck.rotation.x = 0.45;
  root.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 3.2, 0.8);
  root.add(head);

  // Deformed cranium
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), skinMaterial);
  cranium.scale.set(1.1, 1.25, 1.3);
  head.add(cranium);

  // Horns / Lab spikes on head
  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 5), boneMaterial);
  leftHorn.position.set(-0.45, 0.5, -0.1);
  leftHorn.rotation.z = 0.5;
  leftHorn.rotation.x = -0.3;
  head.add(leftHorn);

  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 5), boneMaterial);
  rightHorn.position.set(0.4, 0.6, -0.05);
  rightHorn.rotation.z = -0.4;
  rightHorn.rotation.x = -0.2;
  head.add(rightHorn);

  // 5. THE GIANT EYE (외눈) - In center of forehead
  const eyeContainer = new THREE.Group();
  eyeContainer.position.set(0, 0.15, 0.62);
  head.add(eyeContainer);

  // Eye socket ring (fleshy wrinkles)
  const eyeSocket = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.1, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.1 })
  );
  eyeContainer.add(eyeSocket);

  // Eyeball with procedural bloodshot texture
  const eyeTexture = createEyeTexture();
  const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
  // Rotate texture so pupil faces forward
  eyeGeo.rotateY(Math.PI / 2);
  const eyeMat = new THREE.MeshPhysicalMaterial({
    map: eyeTexture,
    roughness: 0.05,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
  eyeContainer.add(eyeMesh);

  // 6. Gaping Jaw & Teeth
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.25, 0.4);
  head.add(jawGroup);

  const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), muscleMaterial);
  lowerJaw.position.set(0, -0.15, 0.2);
  jawGroup.add(lowerJaw);

  // Razor teeth inside jaw
  for (let t = -3; t <= 3; t++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), teethMaterial);
    tooth.position.set(t * 0.08, 0.05, 0.4 - Math.abs(t) * 0.04);
    tooth.rotation.x = 0.2;
    jawGroup.add(tooth);

    const upperTooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), teethMaterial);
    upperTooth.position.set(t * 0.08, 0.22, 0.4 - Math.abs(t) * 0.04);
    upperTooth.rotation.x = Math.PI - 0.2;
    head.add(upperTooth);
  }

  // Comical yet horrifying lolling tongue
  const tongueCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, -0.05, 0.2),
    new THREE.Vector3(0, -0.2, 0.6),
    new THREE.Vector3(0.05, -0.35, 0.8)
  );
  const tongueGeo = new THREE.TubeGeometry(tongueCurve, 10, 0.07, 6, false);
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.3, metalness: 0.1 });
  const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
  jawGroup.add(tongueMesh);

  // 7. Left Arm: Swollen dragging claw arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.95, 2.4, 0.1);
  root.add(leftArm);

  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), muscleMaterial);
  leftArm.add(leftShoulder);

  const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.1, 6), skinMaterial);
  leftBicep.position.set(-0.2, -0.5, 0);
  leftBicep.rotation.z = 0.35;
  leftArm.add(leftBicep);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.3, 6), muscleMaterial);
  leftForearm.position.set(-0.45, -1.5, 0.2);
  leftForearm.rotation.x = -0.4;
  leftArm.add(leftForearm);

  // Claw fingers
  for (let f = 0; f < 4; f++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 4), boneMaterial);
    claw.position.set(-0.45 + (f - 1.5) * 0.16, -2.2, 0.4);
    claw.rotation.x = 0.5;
    leftArm.add(claw);
  }

  // 8. Right Arm: Mutated elongated tentacle arm with grafted lab tube
  const rightArm = new THREE.Group();
  rightArm.position.set(0.95, 2.4, 0.1);
  root.add(rightArm);

  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), muscleMaterial);
  rightArm.add(rightShoulder);

  const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.0, 6), skinMaterial);
  rightBicep.position.set(0.15, -0.5, 0);
  rightArm.add(rightBicep);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.35, 1.2, 6), skinMaterial);
  rightForearm.position.set(0.3, -1.4, 0.15);
  rightArm.add(rightForearm);

  // Grafted lab syringe / chemical tube on right arm
  const labCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8),
    new THREE.MeshPhysicalMaterial({ color: 0x22c55e, transmission: 0.8, roughness: 0.1, thickness: 0.5 })
  );
  labCylinder.position.set(0.4, -1.4, 0.3);
  rightArm.add(labCylinder);

  // 9. Heavy Stomping Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.55, 1.3, 0);
  root.add(leftLeg);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 6), muscleMaterial);
  leftThigh.position.y = -0.4;
  leftLeg.add(leftThigh);

  const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.48, 0.9, 6), skinMaterial);
  leftShin.position.set(0, -1.0, 0.1);
  leftLeg.add(leftShin);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.8), boneMaterial);
  leftFoot.position.set(0, -1.45, 0.25);
  leftLeg.add(leftFoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.55, 1.3, 0);
  root.add(rightLeg);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.9, 6), muscleMaterial);
  rightThigh.position.y = -0.4;
  rightLeg.add(rightThigh);

  const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 6), skinMaterial);
  rightShin.position.set(0, -1.0, 0.1);
  rightLeg.add(rightShin);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.3, 0.85), boneMaterial);
  rightFoot.position.set(0, -1.45, 0.25);
  rightLeg.add(rightFoot);

  let chestCore: THREE.Mesh | undefined;
  let laserBeam: THREE.Mesh | undefined;

  // Boss-specific enhancements: Cyber restraints, glowing core, laser barrel
  if (isBoss) {
    // Cyber restraint neck collar
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 6, 12), steelMaterial);
    collar.position.set(0, 2.7, 0.5);
    collar.rotation.x = Math.PI / 2;
    root.add(collar);

    // Broken hanging chains
    for (let c = 0; c < 3; c++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 4, 8), steelMaterial);
      link.position.set(-0.4 + c * 0.4, 2.4 - c * 0.15, 0.8);
      root.add(link);
    }

    // Exposed Glowing Bio-Chemical Chest Core
    const coreGeo = new THREE.DodecahedronGeometry(0.35, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.1,
    });
    chestCore = new THREE.Mesh(coreGeo, coreMat);
    chestCore.position.set(0, 2.2, 0.8);
    root.add(chestCore);

    // Laser emitter on forehead above eye
    const laserEmitter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8), steelMaterial);
    laserEmitter.position.set(0, 0.55, 0.6);
    laserEmitter.rotation.x = Math.PI / 2;
    head.add(laserEmitter);

    // Dynamic laser beam (hidden by default)
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.4, 30, 8);
    beamGeo.translate(0, 15, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.85,
    });
    laserBeam = new THREE.Mesh(beamGeo, beamMat);
    laserBeam.position.set(0, 0.55, 0.8);
    laserBeam.visible = false;
    head.add(laserBeam);
  }

  return {
    root,
    eyeMesh,
    eyeContainer,
    jawGroup,
    tongueMesh,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    spineGroup,
    chestCore,
    laserBeam,
  };
}

/**
 * Creates 3D player models with distinct visual personalities
 */
export function createPlayerModel(charId: CharacterId): THREE.Group {
  const root = new THREE.Group();

  if (charId === 'teacher') {
    // Teacher Kim: Disheveled formal suit, balding gray hair, glasses, chalk, book
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.1 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.05 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6, metalness: 0.05 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, metalness: 0.0 });
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });

    // Torso (Suit jacket with crooked tie)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.9, 8), suitMat);
    torso.position.y = 1.05;
    root.add(torso);

    const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.1), shirtMat);
    shirtV.position.set(0, 1.25, 0.32);
    root.add(shirtV);

    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), tieMat);
    tie.position.set(0.02, 1.15, 0.37);
    tie.rotation.z = -0.08;
    root.add(tie);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.7;
    root.add(head);

    // Balding gray side hair
    const hairLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.35), hairMat);
    hairLeft.position.set(-0.25, 1.7, 0);
    root.add(hairLeft);
    const hairRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.35), hairMat);
    hairRight.position.set(0.25, 1.7, 0);
    root.add(hairRight);

    // Thick nerd glasses
    const glassFrame = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 4, 8), glassesMat);
    glassFrame.position.set(-0.11, 1.7, 0.27);
    root.add(glassFrame);
    const glassFrame2 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 4, 8), glassesMat);
    glassFrame2.position.set(0.11, 1.7, 0.27);
    root.add(glassFrame2);

    // Chalk piece held in right hand
    const chalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
    );
    chalk.position.set(0.45, 0.9, 0.3);
    chalk.rotation.x = Math.PI / 3;
    root.add(chalk);

    // Attendance book on belt
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.35, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
    );
    book.position.set(-0.4, 0.85, 0);
    book.rotation.z = 0.2;
    root.add(book);

    // Legs
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.7, 6), pantsMat);
    legL.position.set(-0.18, 0.4, 0);
    root.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.7, 6), pantsMat);
    legR.position.set(0.18, 0.4, 0);
    root.add(legR);

  } else if (charId === 'friend') {
    // Charles Friend (Track star Minho): Sporty yellow/black hoodie, sneakers, jetpack
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6, metalness: 0.05 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.5 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.95, 8), hoodMat);
    torso.position.y = 1.05;
    root.add(torso);

    // Head with sports headband
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.7;
    root.add(head);

    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.04, 6, 12), darkMat);
    headband.position.set(0, 1.75, 0);
    headband.rotation.x = Math.PI / 2;
    root.add(headband);

    // High-tech sports jetpack thruster on back
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), darkMat);
    thrusterL.position.set(-0.2, 1.1, -0.35);
    root.add(thrusterL);
    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), darkMat);
    thrusterR.position.set(0.2, 1.1, -0.35);
    root.add(thrusterR);

    // Glowing exhaust rings
    const ringL = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.02, 6, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ringL.position.set(-0.2, 0.78, -0.35);
    ringL.rotation.x = Math.PI / 2;
    root.add(ringL);
    const ringR = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.02, 6, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ringR.position.set(0.2, 0.78, -0.35);
    ringR.rotation.x = Math.PI / 2;
    root.add(ringR);

    // Athletic legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.75, 6), darkMat);
    legL.position.set(-0.18, 0.4, 0);
    root.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.75, 6), darkMat);
    legR.position.set(0.18, 0.4, 0);
    root.add(legR);

  } else {
    // Charles (Chemistry Major): Lab coat, glowing wrist synthesizer gauntlet, chemical flasks
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, metalness: 0.05 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6, metalness: 0.05 });

    // Lab coat body
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.95, 8), coatMat);
    torso.position.y = 1.05;
    root.add(torso);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.1), innerMat);
    shirt.position.set(0, 1.15, 0.33);
    root.add(shirt);

    // Head with lab goggles
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.7;
    root.add(head);

    const goggles = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.14, 0.15),
      new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.7, roughness: 0.1 })
    );
    goggles.position.set(0, 1.72, 0.28);
    root.add(goggles);

    // Right arm: WRIST MOLECULE SYNTHESIZER GAUNTLET!
    const gauntlet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
    );
    gauntlet.position.set(0.48, 0.9, 0.2);
    gauntlet.rotation.x = Math.PI / 4;
    root.add(gauntlet);

    // Glowing synthesizer dial ring
    const synthRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.02, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    synthRing.position.set(0.48, 0.95, 0.25);
    root.add(synthRing);

    // Chemical flasks on belt
    for (let f = -1; f <= 1; f++) {
      const flask = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshPhysicalMaterial({
          color: f === -1 ? 0xef4444 : f === 0 ? 0x22c55e : 0x3b82f6,
          transmission: 0.8,
          roughness: 0.1,
        })
      );
      flask.position.set(f * 0.18, 0.72, 0.35);
      root.add(flask);
    }

    // Legs
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.75, 6), pantsMat);
    legL.position.set(-0.18, 0.4, 0);
    root.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.75, 6), pantsMat);
    legR.position.set(0.18, 0.4, 0);
    root.add(legR);
  }

  return root;
}
