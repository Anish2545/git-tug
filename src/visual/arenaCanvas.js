/**
 * 60 FPS Isometric 3D Git City Arena Canvas
 * Renders 3D extruded voxel contribution buildings, tension cable physics, and minimalist contenders.
 */
import { TuggerCharacter } from "./character.js";
import { ConfettiSystem } from "./confetti.js";

export class ArenaCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;

    this.width = 0;
    this.height = 0;

    // Characters in Git City aesthetic
    this.p1Character = new TuggerCharacter("left", {
      accent: "#58a6ff", // GitHub blue
      platform: "#161b22"
    });
    this.p2Character = new TuggerCharacter("right", {
      accent: "#f85149", // GitHub muted red
      platform: "#161b22"
    });

    this.confetti = new ConfettiSystem();

    // Physics State
    this.ropeOffset = 0; // -100 to +100
    this.tension = 0.3;
    this.cameraShake = 0;

    // Isometric 3D Voxel Buildings for Left and Right platforms
    this.leftBuildings = [];
    this.rightBuildings = [];
    this.initVoxelDistricts();

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  initVoxelDistricts() {
    this.leftBuildings = [];
    this.rightBuildings = [];

    const rows = 5;
    const cols = 7;

    // GitHub Contribution Palette
    const greenLevels = [
      { top: "#161b22", left: "#0d1117", right: "#12161d" }, // Empty
      { top: "#0e4429", left: "#072b1a", right: "#0a3520" }, // L1
      { top: "#006d32", left: "#004721", right: "#005728" }, // L2
      { top: "#26a641", left: "#197a2e", right: "#1f8c36" }, // L3
      { top: "#39d353", left: "#239d3b", right: "#2cb845" }  // L4
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pseudo-random architectural heights based on commit tiers
        const lvl1 = Math.floor(Math.random() * 5);
        const baseH1 = lvl1 === 0 ? 6 : 8 + lvl1 * 7 + Math.random() * 8;

        this.leftBuildings.push({
          row: r,
          col: c,
          level: lvl1,
          palette: greenLevels[lvl1],
          baseHeight: baseH1,
          currentHeight: baseH1,
          pulse: 0
        });

        const lvl2 = Math.floor(Math.random() * 5);
        const baseH2 = lvl2 === 0 ? 6 : 8 + lvl2 * 7 + Math.random() * 8;

        this.rightBuildings.push({
          row: r,
          col: c,
          level: lvl2,
          palette: greenLevels[lvl2],
          baseHeight: baseH2,
          currentHeight: baseH2,
          pulse: 0
        });
      }
    }
  }

  setFighters(p1, p2) {
    this.p1Character.setFighter(p1);
    this.p2Character.setFighter(p2);

    // Scale city heights based on real commits
    if (p1?.stats?.commits) {
      const scale1 = Math.min(2.2, 0.8 + Math.log10(p1.stats.commits) * 0.3);
      this.leftBuildings.forEach((b) => {
        b.baseHeight = Math.max(6, b.baseHeight * scale1);
        b.currentHeight = b.baseHeight;
      });
    }
    if (p2?.stats?.commits) {
      const scale2 = Math.min(2.2, 0.8 + Math.log10(p2.stats.commits) * 0.3);
      this.rightBuildings.forEach((b) => {
        b.baseHeight = Math.max(6, b.baseHeight * scale2);
        b.currentHeight = b.baseHeight;
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  triggerShake(intensity = 6) {
    this.cameraShake = intensity;
  }

  updatePhysics(physicsData) {
    this.ropeOffset = physicsData.ropeOffset || 0;
    this.tension = physicsData.tension || 0.3;

    if (physicsData.winner) {
      if (physicsData.winner === this.p1Character.username || this.ropeOffset < 0) {
        this.p1Character.setPose("victory");
        this.p2Character.setPose("defeated");
        this.confetti.burst(this.width * 0.28, this.height * 0.45, 100);
      } else {
        this.p1Character.setPose("defeated");
        this.p2Character.setPose("victory");
        this.confetti.burst(this.width * 0.72, this.height * 0.45, 100);
      }
      return;
    }

    if (Math.abs(this.ropeOffset) < 5 && this.tension < 0.4) {
      this.p1Character.setPose("idle", 0.1);
      this.p2Character.setPose("idle", 0.1);
    } else if (this.ropeOffset < -5) {
      this.p1Character.setPose("pulling", physicsData.p1Strain || 0.55);
      this.p2Character.setPose("slipping", physicsData.p2Strain || 0.65);
      this.pulseDistrict("left");
    } else if (this.ropeOffset > 5) {
      this.p1Character.setPose("slipping", physicsData.p1Strain || 0.65);
      this.p2Character.setPose("pulling", physicsData.p2Strain || 0.55);
      this.pulseDistrict("right");
    }
  }

  pulseDistrict(side) {
    const list = side === "left" ? this.leftBuildings : this.rightBuildings;
    list.forEach((b) => {
      b.pulse = 1.0;
    });
  }

  update(dt = 0.016) {
    if (this.cameraShake > 0) {
      this.cameraShake -= dt * 12;
      if (this.cameraShake < 0) this.cameraShake = 0;
    }

    this.p1Character.update(dt, this.ropeOffset < -15);
    this.p2Character.update(dt, this.ropeOffset > 15);

    // Voxel building heights animation during tug torque
    const updateHeights = (buildings, isPulling) => {
      for (const b of buildings) {
        if (b.pulse > 0) {
          b.pulse -= dt * 2.0;
          if (b.pulse < 0) b.pulse = 0;
        }
        const targetH = isPulling ? b.baseHeight * 1.35 : b.baseHeight;
        b.currentHeight += (targetH - b.currentHeight) * 0.12;
      }
    };

    updateHeights(this.leftBuildings, this.ropeOffset < -10);
    updateHeights(this.rightBuildings, this.ropeOffset > 10);

    this.confetti.update(dt);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.cameraShake > 0) {
      const sx = (Math.random() - 0.5) * this.cameraShake;
      const sy = (Math.random() - 0.5) * this.cameraShake;
      ctx.translate(sx, sy);
    }

    // 1. CLEAN GIT CITY BACKGROUND & ISOMETRIC VOID
    this.renderAtmosphere(ctx);

    // 2. ISOMETRIC 3D VOXEL DISTRICTS (LEFT & RIGHT)
    const platformY = this.height * 0.72;
    this.renderIsometricDistricts(ctx, platformY);

    // 3. CENTER CHASM & ARCHITECTURAL GUIDES
    this.renderCenterGuides(ctx, platformY);

    // 4. SUSPENDED STEEL CABLE & CONTENDERS
    this.renderCableAndFighters(ctx, platformY);

    // 5. CONFETTI BURST
    this.confetti.render(ctx);

    ctx.restore();
  }

  renderAtmosphere(ctx) {
    // Deep slate background matching Git City / GitHub Dark Mode
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle isometric horizon grid lines
    ctx.save();
    ctx.strokeStyle = "rgba(48, 54, 61, 0.25)";
    ctx.lineWidth = 1;

    const gridSpacing = 44;
    const startY = this.height * 0.4;
    for (let y = startY; y < this.height + 60; y += gridSpacing * 0.5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    for (let x = -this.height; x < this.width + this.height; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x + (this.height - startY) * 1.6, this.height);
      ctx.stroke();
    }
    ctx.restore();

    // Soft top-down ambient vignette
    const vigGrad = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.5,
      50,
      this.width / 2,
      this.height * 0.5,
      this.width * 0.65
    );
    vigGrad.addColorStop(0, "rgba(22, 27, 34, 0.4)");
    vigGrad.addColorStop(1, "rgba(12, 13, 16, 0.95)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Render 3D Extruded Voxel Block
   */
  renderVoxelBuilding(ctx, isoX, isoY, tileW, tileH, height, palette, pulse = 0) {
    const halfW = tileW / 2;
    const halfH = tileH / 2;
    const topY = isoY - height;

    ctx.save();

    // Pulse highlight: Git City warm amber/emerald illumination
    let topColor = palette.top;
    let leftColor = palette.left;
    let rightColor = palette.right;

    if (pulse > 0) {
      topColor = "#f0c060"; // Git City gold accent
      leftColor = "#b88a32";
      rightColor = "#d49f3e";
      ctx.shadowColor = "#f0c060";
      ctx.shadowBlur = pulse * 14;
    }

    // 1. LEFT FACE
    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(isoX - halfW, topY);
    ctx.lineTo(isoX, topY + halfH);
    ctx.lineTo(isoX, isoY + halfH);
    ctx.lineTo(isoX - halfW, isoY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(48, 54, 61, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 2. RIGHT FACE
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(isoX, topY + halfH);
    ctx.lineTo(isoX + halfW, topY);
    ctx.lineTo(isoX + halfW, isoY);
    ctx.lineTo(isoX, isoY + halfH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. TOP FACE (Rhombus)
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(isoX, topY - halfH);
    ctx.lineTo(isoX + halfW, topY);
    ctx.lineTo(isoX, topY + halfH);
    ctx.lineTo(isoX - halfW, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderIsometricDistricts(ctx, platformY) {
    const tileW = Math.min(32, (this.width * 0.32) / 7);
    const tileH = tileW * 0.52; // 2:1 isometric ratio

    // Render Left District (P1)
    const leftOriginX = this.width * 0.22;
    const leftOriginY = platformY;

    // Draw sorted from back to front for proper isometric depth
    const sortedLeft = [...this.leftBuildings].sort((a, b) => (a.row + a.col) - (b.row + b.col));
    for (const b of sortedLeft) {
      const isoX = leftOriginX + (b.col - b.row) * (tileW / 2);
      const isoY = leftOriginY + (b.col + b.row) * (tileH / 2);
      this.renderVoxelBuilding(ctx, isoX, isoY, tileW, tileH, b.currentHeight, b.palette, b.pulse);
    }

    // Render Right District (P2)
    const rightOriginX = this.width * 0.78;
    const rightOriginY = platformY;

    const sortedRight = [...this.rightBuildings].sort((a, b) => (a.row + a.col) - (b.row + b.col));
    for (const b of sortedRight) {
      const isoX = rightOriginX + (b.col - b.row) * (tileW / 2);
      const isoY = rightOriginY + (b.col + b.row) * (tileH / 2);
      this.renderVoxelBuilding(ctx, isoX, isoY, tileW, tileH, b.currentHeight, b.palette, b.pulse);
    }
  }

  renderCenterGuides(ctx, platformY) {
    const midX = this.width / 2;
    const maxShift = this.width * 0.26;

    ctx.save();

    // Center Chasm Grid Line
    ctx.strokeStyle = "rgba(240, 192, 96, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, platformY - 90);
    ctx.lineTo(midX, platformY + 60);
    ctx.stroke();

    // Left Threshold Line (P1 Boundary)
    ctx.strokeStyle = "rgba(88, 166, 255, 0.4)";
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(midX - maxShift * 0.85, platformY - 60);
    ctx.lineTo(midX - maxShift * 0.85, platformY + 40);
    ctx.stroke();

    // Right Threshold Line (P2 Boundary)
    ctx.strokeStyle = "rgba(248, 81, 73, 0.4)";
    ctx.beginPath();
    ctx.moveTo(midX + maxShift * 0.85, platformY - 60);
    ctx.lineTo(midX + maxShift * 0.85, platformY + 40);
    ctx.stroke();

    // Center Coordinate Readout
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8b949e";
    ctx.fillText("THRESHOLD — 0.00", midX, platformY + 75);

    ctx.restore();
  }

  renderCableAndFighters(ctx, platformY) {
    const midX = this.width / 2;
    const maxShift = this.width * 0.26;

    // Center ribbon / displacement bead position
    const ribbonX = midX + (this.ropeOffset / 100) * maxShift;

    // Contender positions atop their platforms
    const p1X = this.width * 0.22 + (this.ropeOffset / 100) * (maxShift * 0.55);
    const p2X = this.width * 0.78 + (this.ropeOffset / 100) * (maxShift * 0.55);
    const handsY = platformY - 55;

    // 1. STEEL INDUSTRIAL CABLE
    ctx.save();
    const maxSag = (1 - this.tension) * 32;
    const jitter = this.tension > 0.6 ? Math.sin(Date.now() * 0.09) * (this.tension * 3.5) : 0;
    const midSagY = handsY + maxSag + jitter;

    // Cable Dark Core Shadow
    ctx.strokeStyle = "#161b22";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p1X + 24, handsY);
    ctx.quadraticCurveTo(ribbonX, midSagY + 2, p2X - 24, handsY);
    ctx.stroke();

    // Cable Braided Steel Body
    ctx.strokeStyle = "#8b949e";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Cable Texture Segments
    ctx.strokeStyle = "#c9d1d9";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 7]);
    ctx.stroke();
    ctx.restore();

    // 2. MINIMALIST METALLIC BEACON (DISPLACEMENT MARKER)
    ctx.save();
    ctx.translate(ribbonX, midSagY);

    // Laser plumb line down to center track
    ctx.strokeStyle = "rgba(240, 192, 96, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, platformY + 45 - midSagY);
    ctx.stroke();

    // Sleek geometric beacon (Diamond/Voxel Marker)
    ctx.fillStyle = "#f0c060";
    ctx.shadowColor = "#f0c060";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // Steel Core
    ctx.fillStyle = "#0c0d10";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. RENDER CONTENDERS AT CABLE ENDS
    this.p1Character.render(ctx, p1X, platformY, { x: p1X + 24, y: handsY });
    this.p2Character.render(ctx, p2X, platformY, { x: p2X - 24, y: handsY });
  }

  startAnimationLoop() {
    let lastTime = performance.now();
    const animate = (currentTime) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}
