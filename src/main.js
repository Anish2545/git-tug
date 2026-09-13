/**
 * GitTug Arena - Main Controller & Bootstrap
 */

import { fetchGitHubFighter, PRESET_MATCHUPS } from "./api/github.js";
import { sounds } from "./engine/audio.js";
import { TugEngine, BATTLE_STATES } from "./engine/tugEngine.js";
import { Commentator } from "./engine/commentator.js";
import { ArenaCanvas } from "./visual/arenaCanvas.js";
import { renderFighterCard } from "./components/fighterCard.js";
import { showVictoryModal, hideVictoryModal } from "./components/battleModal.js";

// Global app state
const state = {
  p1: null,
  p2: null,
  mode: "auto",
  isLoadingP1: false,
  isLoadingP2: false
};

// DOM Elements
const canvasEl = document.getElementById("arena-canvas");
const commentaryEl = document.getElementById("commentary-text");
const roundIndicatorEl = document.getElementById("round-indicator");
const gaugeMarkerEl = document.getElementById("hud-gauge-marker");
const tensionFillEl = document.getElementById("hud-tension-fill");
const tensionValEl = document.getElementById("hud-tension-val");

const hudP1Avatar = document.getElementById("hud-p1-avatar");
const hudP1Name = document.getElementById("hud-p1-name");
const hudP1Score = document.getElementById("hud-p1-score");

const hudP2Avatar = document.getElementById("hud-p2-avatar");
const hudP2Name = document.getElementById("hud-p2-name");
const hudP2Score = document.getElementById("hud-p2-score");

const cornerP1Container = document.getElementById("corner-p1-container");
const cornerP2Container = document.getElementById("corner-p2-container");

const btnStartBattle = document.getElementById("btn-start-battle");
const btnSwapFighters = document.getElementById("btn-swap-fighters");
const btnRandomFighters = document.getElementById("btn-random-fighters");

const btnSoundToggle = document.getElementById("btn-sound-toggle");
const soundIconOn = document.getElementById("sound-icon-on");
const soundIconOff = document.getElementById("sound-icon-off");

const modeAutoBtn = document.getElementById("mode-auto");
const modeMashBtn = document.getElementById("mode-mash");
const mashOverlay = document.getElementById("mash-overlay");
const btnMashP1 = document.getElementById("btn-mash-p1");
const btnMashP2 = document.getElementById("btn-mash-p2");
const presetChipsContainer = document.getElementById("preset-chips");

// Initialize Arena Canvas
const arena = new ArenaCanvas(canvasEl);
arena.startAnimationLoop();

// Initialize Commentator
const commentator = new Commentator(({ text, tone }) => {
  commentaryEl.textContent = text;
  commentaryEl.classList.remove("flash");
  void commentaryEl.offsetWidth; // trigger reflow
  commentaryEl.classList.add("flash");
});

// Initialize Tug-of-War Engine
const engine = new TugEngine({
  commentator,
  onStateChange: (battleState) => {
    const launchLabel = btnStartBattle.querySelector(".launch-label");
    if (battleState === BATTLE_STATES.BATTLING) {
      btnStartBattle.disabled = true;
      btnStartBattle.classList.add("battling");
      if (launchLabel) launchLabel.textContent = "PULL IN PROGRESS...";
      if (state.mode === "mash") {
        mashOverlay.style.display = "flex";
      }
    } else if (battleState === BATTLE_STATES.COUNTDOWN) {
      btnStartBattle.disabled = true;
      roundIndicatorEl.textContent = "COUNTDOWN...";
    } else if (battleState === BATTLE_STATES.FINISHED) {
      btnStartBattle.disabled = false;
      btnStartBattle.classList.remove("battling");
      if (launchLabel) launchLabel.textContent = "PULL THE ROPE";
      mashOverlay.style.display = "none";
      roundIndicatorEl.textContent = "MATCH CONCLUDED";

      // Show victory modal after brief moment for players to enjoy final pull
      setTimeout(() => {
        const winner = engine.ropeOffset < 0 ? state.p1 : state.p2;
        const loser = engine.ropeOffset < 0 ? state.p2 : state.p1;
        showVictoryModal({
          winner,
          loser,
          p1: state.p1,
          p2: state.p2,
          onRematch: () => {
            engine.reset();
            engine.startBattle();
          },
          onNewMatch: () => {
            engine.reset();
            hideVictoryModal();
          }
        });
      }, 1400);
    } else {
      btnStartBattle.disabled = false;
      btnStartBattle.classList.remove("battling");
      if (launchLabel) launchLabel.textContent = "PULL THE ROPE";
      mashOverlay.style.display = state.mode === "mash" ? "flex" : "none";
      roundIndicatorEl.textContent = "STANDBY";
    }
  },

  onPhysicsUpdate: (physics) => {
    arena.updatePhysics(physics);

    // Update HUD gauge marker: -100 to +100 mapped to 0% to 100%
    const markerPos = 50 + (physics.ropeOffset / 2);
    gaugeMarkerEl.style.left = `${Math.max(5, Math.min(95, markerPos))}%`;

    // Update Tension meter
    const tensionPct = Math.round(physics.tension * 100);
    tensionFillEl.style.width = `${tensionPct}%`;
    tensionValEl.textContent = `${tensionPct}%`;

    // Shake camera during violent tugs
    if (Math.abs(physics.velocity) > 2.5) {
      arena.triggerShake(Math.min(10, Math.abs(physics.velocity) * 1.8));
    }
  },

  onRoundUpdate: ({ index, total, round }) => {
    roundIndicatorEl.textContent = `PHASE ${index + 1}/${total}: ${round.name.toUpperCase()}`;
  }
});

// Sound Toggle Handler
function updateSoundIcon() {
  const isMuted = sounds.isMuted();
  if (soundIconOn && soundIconOff) {
    soundIconOn.style.display = isMuted ? "none" : "block";
    soundIconOff.style.display = isMuted ? "block" : "none";
  }
}
updateSoundIcon();

btnSoundToggle.addEventListener("click", () => {
  sounds.toggleMute();
  updateSoundIcon();
});

// Mode Switch Handler
function setMode(newMode) {
  state.mode = newMode;
  engine.setMode(newMode);

  if (newMode === "auto") {
    modeAutoBtn.classList.add("active");
    modeMashBtn.classList.remove("active");
    mashOverlay.style.display = "none";
    commentator.say("Mode: AUTO SIM — Cinematic rounds driven by real GitHub contribution data.");
  } else {
    modeAutoBtn.classList.remove("active");
    modeMashBtn.classList.add("active");
    mashOverlay.style.display = "flex";
    commentator.say("Mode: MANUAL TUG — P1 press [A] / P2 press [L] to apply cable tension.");
  }
}

modeAutoBtn.addEventListener("click", () => setMode("auto"));
modeMashBtn.addEventListener("click", () => setMode("mash"));

// Preset Chips
function renderPresetChips() {
  presetChipsContainer.innerHTML = "";
  PRESET_MATCHUPS.forEach((preset) => {
    const chip = document.createElement("button");
    chip.className = "preset-chip";
    chip.textContent = preset.label;
    chip.title = preset.desc;
    chip.addEventListener("click", () => {
      loadFighters(preset.p1, preset.p2);
    });
    presetChipsContainer.appendChild(chip);
  });
}
renderPresetChips();

// Fighter Loading
async function loadFighter(side, username) {
  try {
    commentator.say(`Scanning GitHub for @${username}...`);
    const fighter = await fetchGitHubFighter(username);

    if (side === "p1") {
      state.p1 = fighter;
      renderFighterCard(cornerP1Container, "p1", fighter, (newUsername) => {
        loadFighter("p1", newUsername);
      });
      hudP1Name.textContent = fighter.name || `@${fighter.login}`;
      hudP1Score.textContent = `${fighter.stats.commits.toLocaleString()} Commits`;
      hudP1Avatar.style.backgroundImage = `url(${fighter.avatar_url})`;
    } else {
      state.p2 = fighter;
      renderFighterCard(cornerP2Container, "p2", fighter, (newUsername) => {
        loadFighter("p2", newUsername);
      });
      hudP2Name.textContent = fighter.name || `@${fighter.login}`;
      hudP2Score.textContent = `${fighter.stats.commits.toLocaleString()} Commits`;
      hudP2Avatar.style.backgroundImage = `url(${fighter.avatar_url})`;
    }

    if (state.p1 && state.p2) {
      arena.setFighters(state.p1, state.p2);
      engine.setFighters(state.p1, state.p2);
      commentator.say(
        `Ready! @${state.p1.login} (${state.p1.stats.commits.toLocaleString()} commits) vs @${state.p2.login} (${state.p2.stats.commits.toLocaleString()} commits)`
      );
    }
  } catch (err) {
    commentator.say(`⚠️ ${err.message || "Failed to load fighter"}`);
  }
}

async function loadFighters(u1, u2) {
  engine.reset();
  hideVictoryModal();
  await Promise.all([loadFighter("p1", u1), loadFighter("p2", u2)]);
}

// Start Battle Click
btnStartBattle.addEventListener("click", () => {
  if (!state.p1 || !state.p2) {
    commentator.say("Select two valid fighters first!");
    return;
  }
  engine.startBattle();
});

// Swap Sides Click
btnSwapFighters.addEventListener("click", () => {
  if (state.p1 && state.p2) {
    const temp = state.p1;
    loadFighters(state.p2.login, temp.login);
  }
});

// Random Matchup Click
btnRandomFighters.addEventListener("click", () => {
  const randomPreset = PRESET_MATCHUPS[Math.floor(Math.random() * PRESET_MATCHUPS.length)];
  loadFighters(randomPreset.p1, randomPreset.p2);
});

// Keyboard Mash Controls
window.addEventListener("keydown", (e) => {
  if (engine.state !== BATTLE_STATES.BATTLING || state.mode !== "mash") return;

  if (e.code === "KeyA" || e.key === "a" || e.key === "A") {
    engine.handleMash(1);
    btnMashP1.classList.add("active");
    setTimeout(() => btnMashP1.classList.remove("active"), 80);
  } else if (e.code === "KeyL" || e.key === "l" || e.key === "L") {
    engine.handleMash(2);
    btnMashP2.classList.add("active");
    setTimeout(() => btnMashP2.classList.remove("active"), 80);
  }
});

// Screen Tap Mash Buttons (Mobile / Mouse Support)
btnMashP1.addEventListener("pointerdown", () => engine.handleMash(1));
btnMashP2.addEventListener("pointerdown", () => engine.handleMash(2));

// Initial bootstrap with Linus Torvalds vs Evan You
loadFighters("torvalds", "yyx990803");
