/**
 * GitTug Battle Physics & State Machine Engine
 */
import { sounds } from "./audio.js";

export const BATTLE_STATES = {
  IDLE: "IDLE",
  COUNTDOWN: "COUNTDOWN",
  BATTLING: "BATTLING",
  FINISHED: "FINISHED"
};

export class TugEngine {
  constructor({ onStateChange, onPhysicsUpdate, onRoundUpdate, commentator }) {
    this.onStateChange = onStateChange;
    this.onPhysicsUpdate = onPhysicsUpdate;
    this.onRoundUpdate = onRoundUpdate;
    this.commentator = commentator;

    this.state = BATTLE_STATES.IDLE;
    this.mode = "auto"; // "auto" or "mash"
    this.p1 = null; // Left player (negative rope offset = P1 advantage)
    this.p2 = null; // Right player (positive rope offset = P2 advantage)

    // Physics
    this.ropeOffset = 0; // -100 to +100 (-100 = P1 win, +100 = P2 win)
    this.velocity = 0;
    this.tension = 0.3; // 0.0 to 1.0
    this.targetRopeOffset = 0;

    // Simulation timing
    this.animationFrameId = null;
    this.roundIndex = 0;
    this.roundTimer = null;
    this.mashTimer = null;
    this.p1MashCount = 0;
    this.p2MashCount = 0;

    this.rounds = [
      { id: "commits", name: "Commit Volume", statKey: "commits", weight: 35 },
      { id: "repos", name: "Repository Muscle", statKey: "repos", weight: 15 },
      { id: "stars", name: "Star Gravity", statKey: "stars", weight: 15 },
      { id: "velocity", name: "Recent Velocity", statKey: "velocity", weight: 15 },
      { id: "suddenDeath", name: "Overdrive Finale", statKey: "tugPower", weight: 20 }
    ];
  }

  setFighters(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.reset();
  }

  setMode(mode) {
    this.mode = mode;
  }

  reset() {
    this.cancelLoops();
    this.state = BATTLE_STATES.IDLE;
    this.ropeOffset = 0;
    this.velocity = 0;
    this.tension = 0.3;
    this.targetRopeOffset = 0;
    this.roundIndex = 0;
    this.p1MashCount = 0;
    this.p2MashCount = 0;

    if (this.onPhysicsUpdate) {
      this.onPhysicsUpdate({
        ropeOffset: 0,
        tension: 0.3,
        velocity: 0,
        p1Strain: 0,
        p2Strain: 0
      });
    }
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  cancelLoops() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  startBattle() {
    if (!this.p1 || !this.p2) return;
    this.reset();
    this.state = BATTLE_STATES.COUNTDOWN;
    this.onStateChange(this.state);

    this.commentator.announceMatchStart(this.p1, this.p2, this.mode);

    // 3, 2, 1, GO!
    let count = 3;
    sounds.countdownBeep(false);
    this.commentator.say(`READY... ${count}`, "countdown");

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        sounds.countdownBeep(false);
        this.commentator.say(`SET... ${count}`, "countdown");
      } else {
        clearInterval(countdownInterval);
        sounds.countdownBeep(true);
        sounds.whistle();
        this.commentator.say("⚔️ PULL! FIGHT!", "hype");

        this.state = BATTLE_STATES.BATTLING;
        this.onStateChange(this.state);
        this.startPhysicsLoop();

        if (this.mode === "auto") {
          this.runNextAutoRound();
        } else {
          this.commentator.say("🎮 TAP RAPIDLY! P1 press [A] / P2 press [L]!", "hype");
        }
      }
    }, 900);
  }

  startPhysicsLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (this.state === BATTLE_STATES.BATTLING) {
        if (this.mode === "auto") {
          // Smooth spring-like lerp towards targetRopeOffset
          const diff = this.targetRopeOffset - this.ropeOffset;
          this.velocity += diff * 3.5 * dt;
          this.velocity *= 0.88; // friction damping
          this.ropeOffset += this.velocity;

          // Tension dynamically follows speed and absolute pull force
          this.tension = Math.min(0.95, 0.35 + Math.abs(diff) * 0.015 + Math.abs(this.velocity) * 0.08);
        } else {
          // Mash Mode physics
          this.ropeOffset += this.velocity * dt * 25;
          this.velocity *= 0.93; // deceleration
          this.tension = Math.min(0.98, 0.3 + Math.abs(this.velocity) * 0.12);

          // Check win condition for mash mode
          if (this.ropeOffset <= -80) {
            this.finishMatch(this.p1, this.p2);
            return;
          } else if (this.ropeOffset >= 80) {
            this.finishMatch(this.p2, this.p1);
            return;
          }
        }

        // Clamp rope offset to [-95, 95]
        this.ropeOffset = Math.max(-95, Math.min(95, this.ropeOffset));

        // Calculate strain per player
        const p1Strain = Math.max(0, Math.min(1, (-this.ropeOffset / 80) * 0.5 + this.tension * 0.5));
        const p2Strain = Math.max(0, Math.min(1, (this.ropeOffset / 80) * 0.5 + this.tension * 0.5));

        if (this.onPhysicsUpdate) {
          this.onPhysicsUpdate({
            ropeOffset: this.ropeOffset,
            tension: this.tension,
            velocity: this.velocity,
            p1Strain,
            p2Strain
          });
        }
      }

      if (this.state !== BATTLE_STATES.IDLE) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Auto battle round orchestrator
   */
  runNextAutoRound() {
    if (this.roundIndex >= this.rounds.length) {
      // Determine match winner based on final rope position
      if (this.ropeOffset < 0) {
        this.finishMatch(this.p1, this.p2);
      } else if (this.ropeOffset > 0) {
        this.finishMatch(this.p2, this.p1);
      } else {
        // Absolute tie breaker by raw commits
        if (this.p1.stats.commits >= this.p2.stats.commits) {
          this.finishMatch(this.p1, this.p2);
        } else {
          this.finishMatch(this.p2, this.p1);
        }
      }
      return;
    }

    const round = this.rounds[this.roundIndex];
    if (this.onRoundUpdate) {
      this.onRoundUpdate({
        index: this.roundIndex,
        total: this.rounds.length,
        round
      });
    }

    this.commentator.announceRound(
      this.roundIndex + 1,
      round.name,
      round.statKey,
      this.p1,
      this.p2
    );

    const val1 = this.p1.stats[round.statKey] || 0;
    const val2 = this.p2.stats[round.statKey] || 0;
    const totalVal = Math.max(1, val1 + val2);

    // Pull ratio (-1 for total P1 dominance, +1 for total P2 dominance)
    const ratio = (val2 - val1) / totalVal;
    const pullAmount = ratio * round.weight;

    // Small counter-pull / tease before full heave
    const puller = ratio < 0 ? this.p1 : this.p2;
    const opponent = ratio < 0 ? this.p2 : this.p1;
    const absMargin = Math.abs(val1 - val2);

    // Initial slight heave
    sounds.ropeCreak();
    this.targetRopeOffset += pullAmount * 0.3;

    // Secondary surge
    this.roundTimer = setTimeout(() => {
      sounds.tugSurge(Math.min(1.5, Math.abs(ratio) * 1.8));
      this.targetRopeOffset += pullAmount * 0.7;

      this.commentator.announceTugSurge(
        puller,
        opponent,
        round.name,
        absMargin,
        this.targetRopeOffset
      );

      // Check if instant KO occurred (|offset| > 85)
      if (Math.abs(this.targetRopeOffset) >= 80 && this.roundIndex >= 2) {
        setTimeout(() => {
          if (this.targetRopeOffset < 0) {
            this.finishMatch(this.p1, this.p2);
          } else {
            this.finishMatch(this.p2, this.p1);
          }
        }, 1200);
        return;
      }

      this.roundIndex++;
      this.roundTimer = setTimeout(() => {
        this.runNextAutoRound();
      }, 2200);
    }, 1100);
  }

  /**
   * Handle player button mash input
   */
  handleMash(player) {
    if (this.state !== BATTLE_STATES.BATTLING || this.mode !== "mash") return;

    // Calculate pull strength scaled by commits
    if (player === 1) {
      this.p1MashCount++;
      const commitMultiplier = 1 + Math.log10(Math.max(10, this.p1.stats.commits)) * 0.18;
      const impulse = -(1.6 * commitMultiplier);
      this.velocity += impulse;
      sounds.mashClick(520);
    } else if (player === 2) {
      this.p2MashCount++;
      const commitMultiplier = 1 + Math.log10(Math.max(10, this.p2.stats.commits)) * 0.18;
      const impulse = 1.6 * commitMultiplier;
      this.velocity += impulse;
      sounds.mashClick(680);
    }
  }

  finishMatch(winner, loser) {
    if (this.state === BATTLE_STATES.FINISHED) return;
    this.cancelLoops();
    this.state = BATTLE_STATES.FINISHED;
    this.onStateChange(this.state);

    sounds.victoryFanfare();
    const margin = Math.abs(winner.stats.commits - loser.stats.commits);
    this.commentator.announceVictory(winner, loser, margin);

    if (this.onPhysicsUpdate) {
      this.onPhysicsUpdate({
        ropeOffset: winner === this.p1 ? -85 : 85,
        tension: 0.15,
        velocity: 0,
        p1Strain: winner === this.p1 ? 0 : 1,
        p2Strain: winner === this.p2 ? 0 : 1,
        winner,
        loser
      });
    }
  }
}
