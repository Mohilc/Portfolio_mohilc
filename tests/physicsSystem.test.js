import { describe, expect, it } from 'vitest';
import { PhysicsSystem } from '../src/engine/PhysicsSystem.js';

describe('PhysicsSystem', () => {
  it('applies gravity, jump impulse, and landing callbacks accurately', () => {
    const physics = new PhysicsSystem();
    let jumped = false;
    let landed = false;

    physics.requestJump();
    const s1 = physics.step(0.016, 0, 0, {
      onJump: () => {
        jumped = true;
      },
      onLand: () => {
        landed = true;
      },
    });

    expect(jumped).toBe(true);
    expect(s1.grounded).toBe(false);
    expect(s1.y).toBeGreaterThan(0);

    // Simulate ~1 second of gravity until avatar lands cleanly back at y = 0
    let state = s1;
    let peakSquash = 0;
    for (let i = 0; i < 65; i += 1) {
      state = physics.step(0.016, 0, 0, {
        onLand: () => {
          landed = true;
        },
      });
      peakSquash = Math.max(peakSquash, state.landingSquash);
    }

    expect(landed).toBe(true);
    expect(state.grounded).toBe(true);
    expect(state.y).toBe(0);
    expect(peakSquash).toBeGreaterThan(0);
  });

  it('accelerates with input, decelerates with friction, and transfers kick momentum to the soccer ball', () => {
    const physics = new PhysicsSystem();
    const ball = physics.props.find((p) => p.id === 'patio-soccer-ball');
    const startBallX = ball.x;

    // Move player straight toward soccer ball at (2.4, 15.2)
    physics.teleportPlayer(1.5, 15.2);
    let hitProp = false;
    for (let i = 0; i < 20; i += 1) {
      physics.step(0.02, 1, 0, {
        onPropHit: () => {
          hitProp = true;
        },
      });
    }

    expect(hitProp).toBe(true);
    expect(ball.x).toBeGreaterThan(startBallX);
    expect(ball.vx).toBeGreaterThan(0);

    // Stop input and verify friction damps player velocity down
    const movingSpeed = Math.hypot(physics.player.vx, physics.player.vz);
    for (let i = 0; i < 25; i += 1) {
      physics.step(0.02, 0, 0);
    }
    const dampedSpeed = Math.hypot(physics.player.vx, physics.player.vz);
    expect(dampedSpeed).toBeLessThan(movingSpeed * 0.2);
  });
});
