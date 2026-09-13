/**
 * Fighter Setup Card Component - Git City Architectural Style
 */

export function renderFighterCard(container, side, fighter, onSearch) {
  const isP1 = side === "p1";
  const cornerTitle = isP1 ? "BLUE PLATFORM" : "RED PLATFORM";
  const cornerClass = isP1 ? "corner-blue" : "corner-red";

  const avatarUrl = fighter?.avatar_url || "";
  const name = fighter?.name || (isP1 ? "Challenger 1" : "Challenger 2");
  const login = fighter?.login || "";
  const bio = fighter?.bio || "Enter public GitHub username to summon contender...";

  const stats = fighter?.stats || {
    commits: 0,
    repos: 0,
    stars: 0,
    velocity: 0,
    tugPower: 0
  };

  container.innerHTML = `
    <div class="fighter-card ${cornerClass}" id="fighter-card-${side}">
      <div class="card-meta-bar">
        <span class="platform-tag">${cornerTitle}</span>
        ${fighter?.isSimulated ? `<span class="tag-simulated">ESTIMATED METRICS</span>` : `<span class="tag-live">VERIFIED API</span>`}
      </div>

      <div class="fighter-profile-row">
        <div class="profile-avatar-frame">
          ${avatarUrl ? `
            <img src="${avatarUrl}" alt="${login}" class="profile-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="profile-avatar-fallback" style="display:none;">${(login || "P").slice(0, 2).toUpperCase()}</div>
          ` : `
            <div class="profile-avatar-fallback">${(login || (isP1 ? "P1" : "P2")).slice(0, 2).toUpperCase()}</div>
          `}
        </div>
        <div class="profile-meta">
          <h3 class="profile-display-name">${name}</h3>
          <span class="profile-handle">${login ? `@${login}` : "Standby"}</span>
        </div>
      </div>

      <p class="profile-bio-text">${bio}</p>

      <form class="handle-input-form" id="form-${side}">
        <div class="handle-input-group">
          <span class="handle-prefix">github.com/</span>
          <input
            type="text"
            class="handle-input"
            id="input-${side}"
            placeholder="username"
            value="${login}"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" class="handle-submit-btn" title="Inspect Developer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </form>

      <!-- Metric Tiles with Sleek SVGs -->
      <div class="metrics-grid">
        <div class="metric-tile tile-primary" title="Primary Cable Pull Force">
          <div class="metric-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#39d353" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="21" y2="12"></line></svg>
          </div>
          <div class="metric-numbers">
            <span class="metric-number-val" id="${side}-commits">${stats.commits.toLocaleString()}</span>
            <span class="metric-number-label">Commits (60%)</span>
          </div>
        </div>

        <div class="metric-tile" title="Repository Structural Weight">
          <div class="metric-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>
          </div>
          <div class="metric-numbers">
            <span class="metric-number-val" id="${side}-repos">${stats.repos.toLocaleString()}</span>
            <span class="metric-number-label">Repositories</span>
          </div>
        </div>

        <div class="metric-tile" title="Total Stargazer Pull">
          <div class="metric-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f0c060" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="metric-numbers">
            <span class="metric-number-val" id="${side}-stars">${stats.stars.toLocaleString()}</span>
            <span class="metric-number-label">Stargazers</span>
          </div>
        </div>

        <div class="metric-tile" title="Recent Push Cadence">
          <div class="metric-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div class="metric-numbers">
            <span class="metric-number-val" id="${side}-velocity">${stats.velocity}%</span>
            <span class="metric-number-label">Push Cadence</span>
          </div>
        </div>
      </div>

      <!-- TPI Composite Progress -->
      <div class="tpi-container">
        <div class="tpi-meta">
          <span class="tpi-title">TUG POWER INDEX</span>
          <span class="tpi-val">${stats.tugPower.toLocaleString()}</span>
        </div>
        <div class="tpi-track">
          <div class="tpi-fill" style="width: ${Math.min(100, (stats.tugPower / 25000) * 100)}%;"></div>
        </div>
      </div>
    </div>
  `;

  // Attach search listener
  const form = container.querySelector(`#form-${side}`);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = container.querySelector(`#input-${side}`);
    const query = input.value.trim();
    if (query && onSearch) {
      onSearch(query);
    }
  });
}
