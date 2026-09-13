/**
 * Post-Match Victory Modal & Architecture Breakdown (Git City Style)
 */

export function showVictoryModal({ winner, loser, p1, p2, onRematch, onNewMatch }) {
  const isP1Winner = winner.login === p1.login;
  const commitDiff = winner.stats.commits - loser.stats.commits;

  let modalEl = document.getElementById("victory-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "victory-modal";
    modalEl.className = "victory-modal-overlay";
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-card animate-pop-in">
      <div class="modal-icon-badge">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f0c060" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
      </div>

      <h2 class="victory-heading">MATCH CONCLUDED</h2>
      <p class="victory-subtext">Dominant cable displacement secured by @${winner.login}</p>

      <div class="winner-profile-showcase">
        <div class="winner-avatar-frame ${isP1Winner ? "blue-accent" : "red-accent"}">
          <img src="${winner.avatar_url}" alt="${winner.login}" class="winner-avatar" />
        </div>
        <h3 class="winner-name">${winner.name || winner.login}</h3>
        <span class="winner-handle">@${winner.login}</span>
        <div class="winner-pill">TUG-OF-WAR CHAMPION</div>
      </div>

      <!-- Stat Comparison Matrix -->
      <div class="stat-comparison-matrix">
        <div class="matrix-header">
          <span class="player-col left-p">@${p1.login}</span>
          <span class="metric-col">STATISTIC</span>
          <span class="player-col right-p">@${p2.login}</span>
        </div>

        <div class="matrix-row ${p1.stats.commits > p2.stats.commits ? "win-left" : "win-right"}">
          <span class="val-left">${p1.stats.commits.toLocaleString()}</span>
          <span class="metric-label">Commits</span>
          <span class="val-right">${p2.stats.commits.toLocaleString()}</span>
        </div>

        <div class="matrix-row ${p1.stats.repos > p2.stats.repos ? "win-left" : "win-right"}">
          <span class="val-left">${p1.stats.repos.toLocaleString()}</span>
          <span class="metric-label">Repositories</span>
          <span class="val-right">${p2.stats.repos.toLocaleString()}</span>
        </div>

        <div class="matrix-row ${p1.stats.stars > p2.stats.stars ? "win-left" : "win-right"}">
          <span class="val-left">${p1.stats.stars.toLocaleString()}</span>
          <span class="metric-label">Stargazers</span>
          <span class="val-right">${p2.stats.stars.toLocaleString()}</span>
        </div>

        <div class="matrix-row ${p1.stats.velocity > p2.stats.velocity ? "win-left" : "win-right"}">
          <span class="val-left">${p1.stats.velocity}%</span>
          <span class="metric-label">Push Velocity</span>
          <span class="val-right">${p2.stats.velocity}%</span>
        </div>

        <div class="matrix-row ${p1.stats.tugPower > p2.stats.tugPower ? "win-left" : "win-right"}">
          <span class="val-left font-bold">${p1.stats.tugPower.toLocaleString()}</span>
          <span class="metric-label font-bold">Composite TPI</span>
          <span class="val-right font-bold">${p2.stats.tugPower.toLocaleString()}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="modal-actions">
        <button id="btn-share-result" class="btn-modal-action btn-share">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
          <span>Copy Match Card</span>
        </button>
        <button id="btn-rematch" class="btn-modal-action btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
          <span>Rematch</span>
        </button>
        <button id="btn-close-modal" class="btn-modal-action btn-secondary">
          <span>Change Contenders</span>
        </button>
      </div>
      <div id="share-toast" class="share-toast" style="display:none;">Match summary copied to clipboard.</div>
    </div>
  `;

  modalEl.style.display = "flex";

  const shareText = `GitTug 1v1 Match Result:\n\nWinner: @${winner.login} (${winner.stats.commits.toLocaleString()} commits)\nRunner-Up: @${loser.login} (${loser.stats.commits.toLocaleString()} commits)\nMargin: ${Math.abs(commitDiff).toLocaleString()} commit volume differential.\n\nSimulated via GitTug (Isometric Git City Arena).`;

  document.getElementById("btn-share-result").onclick = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      const toast = document.getElementById("share-toast");
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 2000);
    });
  };

  const closeModal = () => {
    modalEl.style.display = "none";
    if (onNewMatch) onNewMatch();
  };

  document.getElementById("btn-rematch").onclick = () => {
    modalEl.style.display = "none";
    if (onRematch) onRematch();
  };

  document.getElementById("btn-close-modal").onclick = closeModal;

  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && modalEl.style.display === "flex") {
      closeModal();
      window.removeEventListener("keydown", onKeyDown);
    }
  };
  window.addEventListener("keydown", onKeyDown);
}

export function hideVictoryModal() {
  const modalEl = document.getElementById("victory-modal");
  if (modalEl) modalEl.style.display = "none";
}
