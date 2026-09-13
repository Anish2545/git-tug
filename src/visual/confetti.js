/**
 * High-performance celebratory confetti particle system
 */

export class ConfettiSystem {
  constructor() {
    this.particles = [];
    this.active = false;
    this.colors = [
      "#f0c060", // Git City Gold
      "#39d353", // GitHub green L4
      "#26a641", // GitHub green L3
      "#58a6ff", // GitHub blue
      "#f0f6fc", // Off white
      "#8b949e", // Muted silver
      "#ffd180"  // Warm amber
    ];
  }

  burst(x, y, count = 120) {
    this.active = true;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: Math.random() * 8 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        life: 1.0,
        decay: Math.random() * 0.008 + 0.006
      });
    }
  }

  update(dt = 0.016) {
    if (!this.active) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 9.8 * 0.35; // gravity
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    if (this.particles.length === 0) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.active = false;
  }
}
