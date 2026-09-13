/**
 * Minimalist Developer Character Renderer (Git City Aesthetic)
 * Clean silhouettes, GitHub avatar badges, and precise mechanical stance.
 */

export class TuggerCharacter {
  constructor(side, colorScheme) {
    this.side = side; // "left" or "right"
    this.colorScheme = colorScheme; // { accent: "#38bdf8", platform: "#1f242c" }
    this.avatarImg = null;
    this.avatarLoaded = false;
    this.username = "";
    this.displayName = "";

    // Poses: "idle", "pulling", "slipping", "victory", "defeated"
    this.pose = "idle";
    this.strain = 0;
    this.leanAngle = 0;
    this.voxelParticles = [];
  }

  setFighter(fighter) {
    if (!fighter) return;
    this.username = fighter.login;
    this.displayName = fighter.name || fighter.login;
    this.avatarLoaded = false;

    if (fighter.avatar_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fighter.avatar_url;
      img.onload = () => {
        this.avatarImg = img;
        this.avatarLoaded = true;
      };
      img.onerror = () => {
        this.avatarLoaded = false;
      };
    }
  }

  setPose(pose, strain = 0) {
    this.pose = pose;
    this.strain = Math.max(0, Math.min(1, strain));
  }

  update(dt = 0.016, isActivelyPulling = false) {
    // Spawn tiny 3D voxel dust cubes when applying heavy torque
    if (isActivelyPulling && Math.random() < 0.4) {
      this.voxelParticles.push({
        x: (Math.random() - 0.5) * 20,
        y: 0,
        vx: (this.side === "left" ? 1 : -1) * (Math.random() * 2 + 0.5),
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 3 + 2,
        life: 1.0,
        color: this.colorScheme.accent
      });
    }

    // Update voxel particles
    for (let i = this.voxelParticles.length - 1; i >= 0; i--) {
      const p = this.voxelParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.04;
      if (p.life <= 0) this.voxelParticles.splice(i, 1);
    }
  }

  render(ctx, x, y, cableHandPos) {
    ctx.save();
    ctx.translate(x, y);

    const isLeft = this.side === "left";
    const dir = isLeft ? 1 : -1;

    // Render floor voxel cubes
    for (const vp of this.voxelParticles) {
      ctx.save();
      ctx.globalAlpha = vp.life * 0.7;
      ctx.fillStyle = vp.color;
      ctx.fillRect(vp.x, vp.y, vp.size, vp.size);
      ctx.restore();
    }

    // Precise architectural lean angle calculation
    let targetAngle = 0;
    if (this.pose === "pulling") {
      targetAngle = isLeft ? -0.38 - this.strain * 0.18 : 0.38 + this.strain * 0.18;
    } else if (this.pose === "slipping") {
      targetAngle = isLeft ? 0.12 + this.strain * 0.1 : -0.12 - this.strain * 0.1;
    } else if (this.pose === "victory") {
      targetAngle = Math.sin(Date.now() * 0.004) * 0.04;
    } else if (this.pose === "defeated") {
      targetAngle = isLeft ? 0.75 : -0.75;
    }

    this.leanAngle += (targetAngle - this.leanAngle) * 0.15;
    ctx.rotate(this.leanAngle);

    // Subtle drop shadow on platform
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 1. LEGS & BRACED STANCE
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#161b22";

    if (this.pose === "victory") {
      ctx.beginPath();
      ctx.moveTo(-10, -38);
      ctx.lineTo(-10, 0);
      ctx.moveTo(10, -38);
      ctx.lineTo(10, 0);
      ctx.stroke();
    } else {
      // Braced stance
      ctx.beginPath();
      ctx.moveTo(-4 * dir, -38);
      ctx.lineTo(-20 * dir, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(8 * dir, -38);
      ctx.lineTo(16 * dir, -16);
      ctx.lineTo(20 * dir, 0);
      ctx.stroke();
    }

    // Modern technical boots
    ctx.fillStyle = this.colorScheme.accent;
    ctx.fillRect(-22 * dir - 5, -5, 14, 5);
    ctx.fillRect(16 * dir - 3, -5, 14, 5);

    // 2. TORSO / DEVELOPER HOODIE
    ctx.save();
    ctx.translate(0, -38);

    // Dark architectural jacket
    ctx.fillStyle = "#1e242c";
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-16, -42, 32, 42, [6, 6, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Subtle vertical zipper/accent line
    ctx.strokeStyle = this.colorScheme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.restore();

    // 3. ARMS & CABLE GRIP
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#1e242c";

    const shoulderY = -68;
    if (this.pose === "victory") {
      ctx.beginPath();
      ctx.moveTo(-14, shoulderY);
      ctx.lineTo(-24, shoulderY - 26);
      ctx.moveTo(14, shoulderY);
      ctx.lineTo(24, shoulderY - 26);
      ctx.stroke();

      // Minimalist victory geometric mark
      ctx.strokeStyle = "#f0c060";
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, shoulderY - 42, 16, 12);
    } else {
      const gripReachX = isLeft ? 24 : -24;
      ctx.beginPath();
      ctx.moveTo(-8 * dir, shoulderY);
      ctx.lineTo(gripReachX, shoulderY + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6 * dir, shoulderY + 4);
      ctx.lineTo(gripReachX + 10 * dir, shoulderY + 12);
      ctx.stroke();

      // Grip Gloves
      ctx.fillStyle = this.colorScheme.accent;
      ctx.beginPath();
      ctx.arc(gripReachX, shoulderY + 10, 5, 0, Math.PI * 2);
      ctx.arc(gripReachX + 10 * dir, shoulderY + 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. CIRCULAR AVATAR BADGE (HEAD)
    const headY = -92;
    const headRadius = 24;

    ctx.save();
    ctx.translate(0, headY);

    // Clean subtle glow
    ctx.shadowColor = this.colorScheme.accent;
    ctx.shadowBlur = this.strain > 0.5 ? 16 : 6;

    // Outer clipping boundary
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#161b22";
    ctx.fill();
    ctx.clip();

    if (this.avatarLoaded && this.avatarImg) {
      ctx.drawImage(
        this.avatarImg,
        -headRadius,
        -headRadius,
        headRadius * 2,
        headRadius * 2
      );
    } else {
      ctx.fillStyle = "#21262d";
      ctx.fillRect(-headRadius, -headRadius, headRadius * 2, headRadius * 2);
      ctx.fillStyle = "#f0f6fc";
      ctx.font = "600 13px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        (this.displayName || this.username || "P").substring(0, 2).toUpperCase(),
        0,
        0
      );
    }
    ctx.restore();

    // Clean hairline border around avatar
    ctx.save();
    ctx.translate(0, headY);
    ctx.strokeStyle = this.colorScheme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. MINIMALIST CONTENDER LABEL
    ctx.save();
    ctx.translate(0, headY - 32);
    ctx.font = "600 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9d1d9";
    ctx.fillText(`@${this.username || (isLeft ? "player-1" : "player-2")}`, 0, 0);

    if (this.pose === "defeated") {
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("DISPLACED", 0, -14);
    }
    ctx.restore();

    ctx.restore();
  }
}
