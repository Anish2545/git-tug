/**
 * Dynamic play-by-play commentary announcer for GitTug (Git City / Terminal Style)
 * Zero emoji clutter, clean developer-focused terminology.
 */

export class Commentator {
  constructor(onMessageCallback) {
    this.onMessage = onMessageCallback;
  }

  say(text, tone = "info") {
    if (this.onMessage) {
      this.onMessage({ text, tone, timestamp: Date.now() });
    }
  }

  announceMatchStart(p1, p2, mode) {
    const lines = [
      `ARENA INITIALIZED: @${p1.login} (${p1.stats.commits.toLocaleString()} commits) vs @${p2.login} (${p2.stats.commits.toLocaleString()} commits). Cable engaged.`,
      `SHOWDOWN COMMENCED: Contrasting commit graph vectors for @${p1.login} and @${p2.login}.`,
      `ENGAGED: @${p1.login} and @${p2.login} anchor on isometric contribution blocks.`
    ];
    this.say(lines[Math.floor(Math.random() * lines.length)], "hype");
  }

  announceRound(roundNumber, roundName, statKey, p1, p2) {
    const v1 = p1.stats[statKey];
    const v2 = p2.stats[statKey];
    const roundLabels = {
      commits: `ROUND 1: COMMIT VOLUME ANALYSIS — ${v1.toLocaleString()} vs ${v2.toLocaleString()} commits`,
      repos: `ROUND 2: REPOSITORY ARCHITECTURE — ${v1} vs ${v2} public repositories`,
      stars: `ROUND 3: STARGAZER GRAVITAS — ${v1.toLocaleString()} vs ${v2.toLocaleString()} stars`,
      velocity: `ROUND 4: PUSH CADENCE & VELOCITY — ${v1}% vs ${v2}% momentum`,
      suddenDeath: `FINAL PHASE: OVERDRIVE DISPLACEMENT SURGE`
    };

    const text = roundLabels[statKey] || `ROUND ${roundNumber}: ${roundName.toUpperCase()}`;
    this.say(text, "round");
  }

  announceTugSurge(puller, opponent, statName, margin, ropePos) {
    const phrases = [
      `@${puller.login} applies sustained ${statName.toLowerCase()} torque. Cable shifts direction.`,
      `DISPLACEMENT SURGE: @${puller.login} leans into contribution baseline. @${opponent.login}'s platform destabilizes.`,
      `@${puller.login} leverages code volume differential (+${margin.toLocaleString()}). Cable tautness spiking.`,
      `MOMENTUM ACCELERATION: @${puller.login} gains directional traction on isometric grid.`
    ];
    this.say(phrases[Math.floor(Math.random() * phrases.length)], "tug");
  }

  announceComeback(puller, opponent) {
    const phrases = [
      `COUNTER-TRACTION: @${puller.login} stabilizes platform footing and checks the cable advance.`,
      `REACTIVE SURGE: @${puller.login} halts deceleration and pulls cable back toward center.`,
      `RESURGENCE: @${puller.login} generates rapid counter-torque against opposing momentum.`
    ];
    this.say(phrases[Math.floor(Math.random() * phrases.length)], "hype");
  }

  announceVictory(winner, loser, margin) {
    const lines = [
      `DECISIVE VICTORY: @${winner.login} pulls the cable past the platform perimeter. Dominant performance over @${loser.login}.`,
      `MATCH TERMINATED: @${winner.login} claims arena supremacy via commit graph superiority.`,
      `CABLE LOCK: @${winner.login} completes the pull. Final platform margin secured against @${loser.login}.`
    ];
    this.say(lines[Math.floor(Math.random() * lines.length)], "victory");
  }
}
