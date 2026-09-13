/**
 * GitHub API Client & Tug Power Metrics Calculator
 * Handles user fetching, commit estimation, smart caching, and rate-limit fallbacks.
 */

// Curated high-profile preset developers for instant epic matchups
export const PRESET_MATCHUPS = [
  {
    label: "Kernel vs Reactivity",
    p1: "torvalds",
    p2: "yyx990803",
    desc: "Linus Torvalds (Linux/Git) vs Evan You (Vue/Vite)"
  },
  {
    label: "Modern Web Titans",
    p1: "shadcn",
    p2: "leerob",
    desc: "shadcn (UI) vs Lee Robinson (Next.js)"
  },
  {
    label: "Open Source Powerhouses",
    p1: "antfu",
    p2: "sindresorhus",
    desc: "Anthony Fu (Vue/Vite core) vs Sindre Sorhus (1000+ npm packages)"
  },
  {
    label: "Framework Philosophers",
    p1: "Rich-Harris",
    p2: "gaearon",
    desc: "Rich Harris (Svelte) vs Dan Abramov (Redux/React)"
  }
];

// Fallback mock profiles in case unauthenticated GitHub API limit (60/hr) is reached
const MOCK_PROFILES = {
  torvalds: {
    login: "torvalds",
    name: "Linus Torvalds",
    avatar_url: "https://avatars.githubusercontent.com/u/1024025?v=4",
    bio: "Creator of Linux and Git.",
    public_repos: 7,
    followers: 245000,
    following: 0,
    created_at: "2011-09-03T15:26:22Z",
    stats: {
      commits: 12450,
      stars: 215000,
      repos: 7,
      velocity: 95,
      streak: 320,
      followers: 245000,
      tugPower: 14500
    }
  },
  yyx990803: {
    login: "yyx990803",
    name: "Evan You",
    avatar_url: "https://avatars.githubusercontent.com/u/499550?v=4",
    bio: "Creator of Vue.js and Vite.",
    public_repos: 82,
    followers: 104000,
    following: 78,
    created_at: "2010-11-28T01:05:40Z",
    stats: {
      commits: 9820,
      stars: 184000,
      repos: 82,
      velocity: 98,
      streak: 280,
      followers: 104000,
      tugPower: 12800
    }
  },
  shadcn: {
    login: "shadcn",
    name: "shadcn",
    avatar_url: "https://avatars.githubusercontent.com/u/124599?v=4",
    bio: "Building accessible, customizable UI components.",
    public_repos: 42,
    followers: 78000,
    following: 12,
    created_at: "2009-09-09T03:38:30Z",
    stats: {
      commits: 6420,
      stars: 112000,
      repos: 42,
      velocity: 92,
      streak: 190,
      followers: 78000,
      tugPower: 9200
    }
  },
  leerob: {
    login: "leerob",
    name: "Lee Robinson",
    avatar_url: "https://avatars.githubusercontent.com/u/9113740?v=4",
    bio: "VP of Product at Vercel.",
    public_repos: 94,
    followers: 58000,
    following: 110,
    created_at: "2014-10-09T18:47:50Z",
    stats: {
      commits: 5900,
      stars: 48000,
      repos: 94,
      velocity: 88,
      streak: 160,
      followers: 58000,
      tugPower: 8300
    }
  },
  antfu: {
    login: "antfu",
    name: "Anthony Fu",
    avatar_url: "https://avatars.githubusercontent.com/u/11247099?v=4",
    bio: "A full-time open sourcerer. Core team of Vue, Vite, Nuxt.",
    public_repos: 360,
    followers: 65000,
    following: 80,
    created_at: "2015-02-28T09:12:12Z",
    stats: {
      commits: 18900,
      stars: 94000,
      repos: 360,
      velocity: 100,
      streak: 450,
      followers: 65000,
      tugPower: 19500
    }
  },
  sindresorhus: {
    login: "sindresorhus",
    name: "Sindre Sorhus",
    avatar_url: "https://avatars.githubusercontent.com/u/170270?v=4",
    bio: "Full-time open-sourcerer. Maker of many things.",
    public_repos: 1100,
    followers: 62000,
    following: 50,
    created_at: "2009-12-20T22:57:04Z",
    stats: {
      commits: 22400,
      stars: 280000,
      repos: 1100,
      velocity: 96,
      streak: 510,
      followers: 62000,
      tugPower: 26000
    }
  },
  "Rich-Harris": {
    login: "Rich-Harris",
    name: "Rich Harris",
    avatar_url: "https://avatars.githubusercontent.com/u/1162160?v=4",
    bio: "Cheeky chappy at Vercel. Creator of Svelte & Rollup.",
    public_repos: 90,
    followers: 43000,
    following: 6,
    created_at: "2011-10-31T17:17:34Z",
    stats: {
      commits: 8400,
      stars: 96000,
      repos: 90,
      velocity: 86,
      streak: 210,
      followers: 43000,
      tugPower: 11000
    }
  },
  gaearon: {
    login: "gaearon",
    name: "dan",
    avatar_url: "https://avatars.githubusercontent.com/u/810438?v=4",
    bio: "Co-author of Redux and Create React App.",
    public_repos: 260,
    followers: 87000,
    following: 171,
    created_at: "2011-05-25T18:18:31Z",
    stats: {
      commits: 9300,
      stars: 175000,
      repos: 260,
      velocity: 84,
      streak: 240,
      followers: 87000,
      tugPower: 13500
    }
  }
};

const cache = new Map();

/**
 * Generate simulated stats based on username hash for unauthenticated/rate-limited cases
 */
function generateDeterministicStats(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  
  const repos = 12 + (seed % 65);
  const commits = 350 + (seed % 4500) + repos * 24;
  const stars = 40 + (seed % 1200);
  const followers = 15 + (seed % 800);
  const velocity = 50 + (seed % 48);
  const streak = 15 + (seed % 180);
  
  const tugPower = Math.round(
    commits * 0.55 + 
    repos * 18 + 
    stars * 0.4 + 
    followers * 0.3 + 
    velocity * 8
  );

  return {
    login: username,
    name: username,
    avatar_url: `https://github.com/${username}.png`,
    bio: `GitHub battle contender (${username})`,
    public_repos: repos,
    followers: followers,
    following: Math.round(followers * 0.4),
    created_at: new Date(Date.now() - (seed % 3000) * 86400000).toISOString(),
    isSimulated: true,
    stats: {
      commits,
      stars,
      repos,
      velocity,
      streak,
      followers,
      tugPower
    }
  };
}

/**
 * Fetch GitHub user profile and estimate battle metrics
 */
export async function fetchGitHubFighter(rawUsername) {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!username) throw new Error("Username cannot be empty");

  // Check in-memory cache
  if (cache.has(username.toLowerCase())) {
    return cache.get(username.toLowerCase());
  }

  // Check known mock profiles if rate limited
  const lowerName = username.toLowerCase();
  for (const [key, mockData] of Object.entries(MOCK_PROFILES)) {
    if (key.toLowerCase() === lowerName) {
      cache.set(lowerName, mockData);
      return mockData;
    }
  }

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github.v3+json" }
    });

    if (userRes.status === 404) {
      throw new Error(`GitHub user "@${username}" not found! Check spelling.`);
    }

    if (userRes.status === 403 || userRes.status === 429) {
      console.warn(`GitHub API rate limit reached for ${username}. Using simulated arena stats.`);
      const fallback = generateDeterministicStats(username);
      cache.set(lowerName, fallback);
      return fallback;
    }

    const userData = await userRes.json();

    // Fetch public events to sample recent commit volume & push velocity
    let pushCommits = 0;
    let pushCount = 0;
    try {
      const eventsRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        for (const evt of events) {
          if (evt.type === "PushEvent" && evt.payload?.commits) {
            pushCommits += evt.payload.commits.length;
            pushCount++;
          }
        }
      }
    } catch {
      // Non-critical, fallback to estimation
    }

    // Fetch user repositories to sum stars and calculate repo strength
    let totalStars = 0;
    let repoCommitsBonus = 0;
    try {
      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=60&sort=pushed`, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });
      if (reposRes.ok) {
        const repos = await reposRes.json();
        if (Array.isArray(repos)) {
          for (const r of repos) {
            totalStars += r.stargazers_count || 0;
            // Larger repos represent more commits
            repoCommitsBonus += Math.min(150, Math.round((r.size || 10) / 100));
          }
        }
      }
    } catch {
      // Non-critical
    }

    // Account age in days
    const daysActive = Math.max(
      30,
      Math.round((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate realistic estimated commits
    // Baseline: repo size bonus + push events extrapolation + account age factor
    const estimatedDailyCommitRate = pushCount > 0 ? (pushCommits / 30) : 0.8;
    const estimatedCommits = Math.max(
      50,
      Math.round(
        repoCommitsBonus +
        (userData.public_repos * 15) +
        Math.min(daysActive * estimatedDailyCommitRate * 1.5, 35000)
      )
    );

    const velocity = Math.min(100, Math.max(20, Math.round(pushCommits * 3.5 + 40)));
    const streak = Math.min(365, Math.max(10, Math.round(velocity * 1.8 + (daysActive % 45))));

    // Composite Tug Power Index (TPI)
    // Commits provide the massive bulk force, repos provide anchor, stars provide crowd gravity
    const tugPower = Math.round(
      estimatedCommits * 0.55 +
      userData.public_repos * 20 +
      totalStars * 0.35 +
      userData.followers * 0.25 +
      velocity * 10
    );

    const fighter = {
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      bio: userData.bio || "GitHub warrior ready to pull.",
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
      isSimulated: false,
      stats: {
        commits: estimatedCommits,
        stars: totalStars,
        repos: userData.public_repos,
        velocity,
        streak,
        followers: userData.followers,
        tugPower
      }
    };

    cache.set(lowerName, fighter);
    return fighter;
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      throw err;
    }
    console.warn("Using fallback profile for", username, err);
    const fallback = generateDeterministicStats(username);
    cache.set(lowerName, fallback);
    return fallback;
  }
}
