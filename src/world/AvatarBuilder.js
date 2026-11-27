import * as THREE from 'three';

function boxMat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.68,
    metalness: 0.08,
    flatShading: true,
  });
}

function makePixelPart(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, boxMat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds and animates the customizable 3D PBR pixel-art avatar with
 * walk cycles, airborne jump pose, squash-and-stretch landing, and contact shadow.
 */
export class AvatarBuilder {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.name = 'PlayerAvatar';
    this.root.position.set(0, 0, 14.5);
    scene.add(this.root);

    this.modelGroup = new THREE.Group();
    this.root.add(this.modelGroup);

    // Subtle ground contact shadow disc that stays on floor when jumping
    const shadowGeo = new THREE.CircleGeometry(0.46, 12);
    shadowGeo.rotateX(-Math.PI / 2);
    this.contactShadow = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.32 })
    );
    this.contactShadow.position.y = 0.09;
    this.root.add(this.contactShadow);

    this.parts = {};
    this.walkTime = 0;
    this.isMoving = false;
    this.facingAngle = Math.PI;
  }

  rebuild(avatarConfig) {
    // Clean previous meshes
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0];
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.modelGroup.remove(child);
    }

    const { skinTone, hairStyle, hairColor, outfitColor, pantsColor, accessory } = avatarConfig;

    // Legs (pivoted at hip y = 0.65)
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.15, 0.65, 0);
    const leftLeg = makePixelPart(0.22, 0.62, 0.24, pantsColor);
    leftLeg.position.y = -0.31;
    const leftShoe = makePixelPart(0.24, 0.14, 0.3, '#1e293b');
    leftShoe.position.set(0, -0.58, 0.03);
    leftLegPivot.add(leftLeg, leftShoe);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.15, 0.65, 0);
    const rightLeg = makePixelPart(0.22, 0.62, 0.24, pantsColor);
    rightLeg.position.y = -0.31;
    const rightShoe = makePixelPart(0.24, 0.14, 0.3, '#1e293b');
    rightShoe.position.set(0, -0.58, 0.03);
    rightLegPivot.add(rightLeg, rightShoe);

    // Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.98, 0);
    const chest = makePixelPart(0.58, 0.66, 0.32, outfitColor);
    const collar = makePixelPart(0.32, 0.1, 0.34, '#f8fafc');
    collar.position.set(0, 0.29, 0.01);
    torsoGroup.add(chest, collar);

    // Arms (pivoted at shoulder y = 1.26)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.4, 1.26, 0);
    const leftSleeve = makePixelPart(0.2, 0.42, 0.22, outfitColor);
    leftSleeve.position.y = -0.18;
    const leftHand = makePixelPart(0.18, 0.18, 0.2, skinTone);
    leftHand.position.y = -0.46;
    leftArmPivot.add(leftSleeve, leftHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.4, 1.26, 0);
    const rightSleeve = makePixelPart(0.2, 0.42, 0.22, outfitColor);
    rightSleeve.position.y = -0.18;
    const rightHand = makePixelPart(0.18, 0.18, 0.2, skinTone);
    rightHand.position.y = -0.46;
    rightArmPivot.add(rightSleeve, rightHand);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.58, 0);
    const head = makePixelPart(0.54, 0.54, 0.54, skinTone);
    headGroup.add(head);

    // Pixel eyes facing +Z in local avatar space
    const leftEye = makePixelPart(0.08, 0.1, 0.04, '#0f172a');
    leftEye.position.set(-0.12, 0.02, 0.27);
    const rightEye = makePixelPart(0.08, 0.1, 0.04, '#0f172a');
    rightEye.position.set(0.12, 0.02, 0.27);
    headGroup.add(leftEye, rightEye);

    // Hair Styles
    if (hairStyle === 'spiky') {
      const cap = makePixelPart(0.58, 0.18, 0.58, hairColor);
      cap.position.set(0, 0.26, -0.02);
      const back = makePixelPart(0.56, 0.36, 0.14, hairColor);
      back.position.set(0, 0.08, -0.24);
      const spike1 = makePixelPart(0.16, 0.14, 0.16, hairColor);
      spike1.position.set(-0.12, 0.38, 0.05);
      const spike2 = makePixelPart(0.18, 0.18, 0.16, hairColor);
      spike2.position.set(0.1, 0.4, -0.04);
      headGroup.add(cap, back, spike1, spike2);
    } else if (hairStyle === 'bob') {
      const top = makePixelPart(0.6, 0.18, 0.6, hairColor);
      top.position.set(0, 0.25, 0);
      const sideL = makePixelPart(0.12, 0.44, 0.52, hairColor);
      sideL.position.set(-0.27, 0.02, -0.03);
      const sideR = makePixelPart(0.12, 0.44, 0.52, hairColor);
      sideR.position.set(0.27, 0.02, -0.03);
      const back = makePixelPart(0.58, 0.46, 0.14, hairColor);
      back.position.set(0, 0.02, -0.26);
      headGroup.add(top, sideL, sideR, back);
    } else if (hairStyle === 'cap') {
      const dome = makePixelPart(0.58, 0.22, 0.58, '#ef4444');
      dome.position.set(0, 0.25, 0);
      const brim = makePixelPart(0.56, 0.07, 0.26, '#b91c1c');
      brim.position.set(0, 0.17, 0.34);
      headGroup.add(dome, brim);
    } else if (hairStyle === 'mohawk') {
      const strip = makePixelPart(0.18, 0.24, 0.6, hairColor);
      strip.position.set(0, 0.36, -0.02);
      headGroup.add(strip);
    }

    // Accessories
    if (accessory === 'visor') {
      const visor = makePixelPart(0.5, 0.14, 0.1, '#38bdf8');
      visor.material.emissive = new THREE.Color(0x0284c7);
      visor.material.emissiveIntensity = 0.5;
      visor.position.set(0, 0.03, 0.29);
      headGroup.add(visor);
    } else if (accessory === 'headphones') {
      const band = makePixelPart(0.62, 0.08, 0.14, '#f43f5e');
      band.position.set(0, 0.34, 0);
      const cupL = makePixelPart(0.1, 0.24, 0.24, '#f43f5e');
      cupL.position.set(-0.31, 0.02, 0);
      const cupR = makePixelPart(0.1, 0.24, 0.24, '#f43f5e');
      cupR.position.set(0.31, 0.02, 0);
      headGroup.add(band, cupL, cupR);
    } else if (accessory === 'jetpack') {
      const pack = makePixelPart(0.44, 0.48, 0.22, '#64748b');
      pack.position.set(0, 0.02, -0.25);
      const thrL = makePixelPart(0.14, 0.12, 0.14, '#f97316');
      thrL.position.set(-0.13, -0.24, -0.25);
      const thrR = makePixelPart(0.14, 0.12, 0.14, '#f97316');
      thrR.position.set(0.13, -0.24, -0.25);
      torsoGroup.add(pack, thrL, thrR);
    }

    this.modelGroup.add(leftLegPivot, rightLegPivot, torsoGroup, leftArmPivot, rightArmPivot, headGroup);
    this.parts = { leftLegPivot, rightLegPivot, torsoGroup, leftArmPivot, rightArmPivot, headGroup };
  }

  setVisibleForCameraMode(mode) {
    const visible = mode !== 'firstPerson';
    this.modelGroup.visible = visible;
    this.contactShadow.visible = visible;
  }

  updateAnimation(dt, isMoving, targetAngle, physicsState = null) {
    this.isMoving = isMoving;

    // Smooth yaw interpolation
    if (targetAngle !== null && targetAngle !== undefined) {
      let diff = targetAngle - this.facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(1, dt * 12);
    }
    this.modelGroup.rotation.y = this.facingAngle;

    const grounded = physicsState ? physicsState.grounded : true;
    const heightY = physicsState ? physicsState.y : 0;
    const squash = physicsState ? physicsState.landingSquash : 0;

    // Ground contact shadow shrinks & fades cleanly as avatar jumps higher
    this.contactShadow.position.y = 0.09 - heightY;
    const shadowScale = Math.max(0.45, 1 - heightY * 0.22);
    this.contactShadow.scale.setScalar(shadowScale);
    this.contactShadow.material.opacity = Math.max(0.08, 0.34 - heightY * 0.1);

    // Subtle squash-and-stretch on landing
    const scaleY = 1 - squash * 0.18;
    const scaleXZ = 1 + squash * 0.12;
    this.modelGroup.scale.set(scaleXZ, scaleY, scaleXZ);

    if (!this.parts.leftLegPivot) return;

    if (!grounded) {
      this.parts.leftLegPivot.rotation.x = 0.45;
      this.parts.rightLegPivot.rotation.x = -0.35;
      this.parts.leftArmPivot.rotation.x = -0.85;
      this.parts.rightArmPivot.rotation.x = -0.85;
      this.modelGroup.position.y = 0;
      return;
    }

    if (isMoving) {
      this.walkTime += dt * 11.5;
      const swing = Math.sin(this.walkTime) * 0.65;
      this.parts.leftLegPivot.rotation.x = swing;
      this.parts.rightLegPivot.rotation.x = -swing;
      this.parts.leftArmPivot.rotation.x = -swing * 0.85;
      this.parts.rightArmPivot.rotation.x = swing * 0.85;
      this.modelGroup.position.y = Math.abs(Math.sin(this.walkTime)) * 0.08;
    } else {
      this.walkTime += dt * 2.2;
      const damp = Math.min(1, dt * 10);
      this.parts.leftLegPivot.rotation.x *= 1 - damp;
      this.parts.rightLegPivot.rotation.x *= 1 - damp;
      this.parts.leftArmPivot.rotation.x *= 1 - damp;
      this.parts.rightArmPivot.rotation.x *= 1 - damp;
      this.modelGroup.position.y = Math.sin(this.walkTime) * 0.02;
    }
  }
}
