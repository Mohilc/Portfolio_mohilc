const GITHUB_CACHE_PREFIX = 'mohilc_gh_cache_v3_';
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Curated snapshot fallback derived from Mohilc's public GitHub profile & repositories
 * so the portfolio remains rich and interactive even when offline or API rate-limited.
 */
export const MOHILC_FALLBACK_SNAPSHOT = {
  profile: {
    login: 'Mohilc',
    name: 'mohil c',
    avatar_url: 'https://avatars.githubusercontent.com/u/176016365?v=4',
    html_url: 'https://github.com/Mohilc',
    bio: 'CSE-AI Undergraduate · AI/ML, Computer Vision, Full-Stack Web & UAV Robotics',
    public_repos: 49,
    followers: 12,
    following: 15,
    location: 'India',
  },
  profileReadme: `# Hi, I'm Mohil C
CSE-AI Undergraduate | AI/ML | Computer Vision | Full-Stack Development | UAV & Robotics

Turning ideas into working projects — from AI-powered computer vision systems to web applications, drones, and embedded hardware (ESP32, ESP32-CAM, Raspberry Pi).`,
  repos: [
    {
      name: 'Portfolio_mohilc',
      full_name: 'Mohilc/Portfolio_mohilc',
      description: 'Interactive 3D Pixel-Art Open-World Portfolio built with Three.js and live GitHub sync.',
      language: 'JavaScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: 'https://mohilc.github.io/Portfolio_mohilc/',
      html_url: 'https://github.com/Mohilc/Portfolio_mohilc',
      pushed_at: '2026-11-27T16:36:55Z',
      topics: ['threejs', 'portfolio', 'webgl'],
    },
    {
      name: 'meiyonpersonalai',
      full_name: 'Mohilc/meiyonpersonalai',
      description: 'Personal AI assistant workflow & intelligent task automation.',
      language: 'Python',
      stargazers_count: 2,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/meiyonpersonalai',
      pushed_at: '2026-11-27T15:44:35Z',
      topics: ['ai', 'python', 'assistant'],
    },
    {
      name: 'crackwise-ai',
      full_name: 'Mohilc/crackwise-ai',
      description: 'AI-based structural crack detection & severity analysis using YOLOv8, OpenCV & ESP32-CAM.',
      language: 'TypeScript',
      stargazers_count: 3,
      forks_count: 1,
      homepage: 'https://crackwise-ai.vercel.app',
      html_url: 'https://github.com/Mohilc/crackwise-ai',
      pushed_at: '2026-02-09T15:45:09Z',
      topics: ['computer-vision', 'yolov8', 'esp32-cam'],
    },
    {
      name: 'AgriVision-AI-Crop-Damage-Intelligence-Farmer-Assistant',
      full_name: 'Mohilc/AgriVision-AI-Crop-Damage-Intelligence-Farmer-Assistant',
      description: 'AI crop damage intelligence & computer-vision assistant for farmers.',
      language: 'Python',
      stargazers_count: 2,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/AgriVision-AI-Crop-Damage-Intelligence-Farmer-Assistant',
      pushed_at: '2026-09-29T04:13:47Z',
      topics: ['ai', 'computer-vision', 'agriculture'],
    },
    {
      name: 'VisionSafeAIRoadAssistant',
      full_name: 'Mohilc/VisionSafeAIRoadAssistant',
      description: 'VisionSafeAIRoadAssistant — AI road safety and driver hazard detection assistant.',
      language: 'TypeScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/VisionSafeAIRoadAssistant',
      pushed_at: '2025-12-21T15:28:23Z',
      topics: ['vision', 'road-safety', 'ai'],
    },
    {
      name: 'VisionAidAISafetygent',
      full_name: 'Mohilc/VisionAidAISafetygent',
      description: 'VisionAidAISafetygent — intelligent visual safety agent.',
      language: 'TypeScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/VisionAidAISafetygent',
      pushed_at: '2025-12-21T14:45:01Z',
      topics: ['vision', 'safety', 'agent'],
    },
    {
      name: 'resucerovermain',
      full_name: 'Mohilc/resucerovermain',
      description: 'Embedded robotics & rescue rover control stack with sensors and telemetry.',
      language: 'JavaScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/resucerovermain',
      pushed_at: '2026-09-15T15:46:11Z',
      topics: ['robotics', 'esp32', 'uav'],
    },
    {
      name: 'looptroopnasa2025',
      full_name: 'Mohilc/looptroopnasa2025',
      description: 'NASA Space Apps 2025 interactive Earth & space exploration web application.',
      language: 'TypeScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: 'https://nasa2025-virid.vercel.app',
      html_url: 'https://github.com/Mohilc/looptroopnasa2025',
      pushed_at: '2025-10-13T12:26:27Z',
      topics: ['nasa', 'hackathon', 'space'],
    },
    {
      name: 'nasa-project',
      full_name: 'Mohilc/nasa-project',
      description: 'Space visualization and astronomy showcase.',
      language: 'CSS',
      stargazers_count: 0,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/nasa-project',
      pushed_at: '2024-09-19T17:31:27Z',
      topics: ['nasa', 'space'],
    },
    {
      name: 'agenticemail',
      full_name: 'Mohilc/agenticemail',
      description: 'Autonomous agentic email triage, summarization, and workflow responder.',
      language: 'JavaScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: 'https://agenticemail.vercel.app',
      html_url: 'https://github.com/Mohilc/agenticemail',
      pushed_at: '2026-09-27T13:05:09Z',
      topics: ['agents', 'llm', 'web'],
    },
    {
      name: 'elrics-task',
      full_name: 'Mohilc/elrics-task',
      description: 'Interactive task orchestration and productivity web app.',
      language: 'JavaScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/elrics-task',
      pushed_at: '2026-11-10T09:47:34Z',
      topics: ['javascript', 'productivity'],
    },
    {
      name: 'fossmbccet_bot',
      full_name: 'Mohilc/fossmbccet_bot',
      description: 'FOSS MBCCET community automation and utility bot.',
      language: 'Python',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/fossmbccet_bot',
      pushed_at: '2026-10-11T12:12:22Z',
      topics: ['bot', 'foss', 'python'],
    },
    {
      name: '-HackSphere3.0hackathon',
      full_name: 'Mohilc/-HackSphere3.0hackathon',
      description: 'HackSphere 3.0 hackathon prototype combining AI inference and rapid web UI.',
      language: 'Python',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/-HackSphere3.0hackathon',
      pushed_at: '2026-10-27T17:48:15Z',
      topics: ['hackathon', 'ai'],
    },
    {
      name: 'house-price-flask-magic',
      full_name: 'Mohilc/house-price-flask-magic',
      description: 'Real-estate valuation ML model wrapped in a sleek TypeScript & Flask interface.',
      language: 'TypeScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: 'https://house-price-flask-magic.vercel.app',
      html_url: 'https://github.com/Mohilc/house-price-flask-magic',
      pushed_at: '2025-06-12T14:43:58Z',
      topics: ['ml', 'flask', 'real-estate'],
    },
    {
      name: 'munnar',
      full_name: 'Mohilc/munnar',
      description: 'Munnar Hill Station tourism & attractions interactive web guide.',
      language: 'HTML',
      stargazers_count: 0,
      forks_count: 0,
      homepage: 'https://munnar.vercel.app',
      html_url: 'https://github.com/Mohilc/munnar',
      pushed_at: '2025-01-29T12:00:12Z',
      topics: ['tourism', 'munnar', 'web'],
    },
    {
      name: 'earth-bloom-web',
      full_name: 'Mohilc/earth-bloom-web',
      description: 'Environmental and eco-analytics web experience.',
      language: 'TypeScript',
      stargazers_count: 1,
      forks_count: 0,
      homepage: 'https://earth-bloom-web.vercel.app',
      html_url: 'https://github.com/Mohilc/earth-bloom-web',
      pushed_at: '2025-04-13T06:11:19Z',
      topics: ['web', 'eco', 'typescript'],
    },
    {
      name: 'Hoshiko',
      full_name: 'Mohilc/Hoshiko',
      description: 'Hoshiko creative web experience & themed showcase.',
      language: 'CSS',
      stargazers_count: 0,
      forks_count: 0,
      homepage: 'https://hoshiko-phi.vercel.app',
      html_url: 'https://github.com/Mohilc/Hoshiko',
      pushed_at: '2024-10-06T12:47:44Z',
      topics: ['design', 'web'],
    },
    {
      name: 'Team_Protein',
      full_name: 'Mohilc/Team_Protein',
      description: 'EmojiStories — playful interactive storytelling web experiment.',
      language: 'HTML',
      stargazers_count: 0,
      forks_count: 0,
      homepage: 'https://emojistories.vercel.app',
      html_url: 'https://github.com/Mohilc/Team_Protein',
      pushed_at: '2024-11-03T02:10:35Z',
      topics: ['stories', 'web'],
    },
    {
      name: 'uselesss7',
      full_name: 'Mohilc/uselesss7',
      description: 'Useless Project 3.0 creative hackathon build.',
      language: 'JavaScript',
      stargazers_count: 0,
      forks_count: 0,
      homepage: 'https://uslessproject3-0.vercel.app',
      html_url: 'https://github.com/Mohilc/uselesss7',
      pushed_at: '2026-09-11T22:31:58Z',
      topics: ['useless-project', 'hackathon'],
    },
    {
      name: 'UselessProjectmbccet',
      full_name: 'Mohilc/UselessProjectmbccet',
      description: 'TinkerHub MBCCET Useless Project quirky build.',
      language: 'TypeScript',
      stargazers_count: 0,
      forks_count: 0,
      homepage: 'https://useless-projectmbccet.vercel.app',
      html_url: 'https://github.com/Mohilc/UselessProjectmbccet',
      pushed_at: '2025-07-25T14:56:15Z',
      topics: ['tinkerhub', 'useless-project'],
    },
    {
      name: 'mohil-c-mbc-pookalam-24',
      full_name: 'Mohilc/mohil-c-mbc-pookalam-24',
      description: 'Digital Onam Pookalam floral geometric art code project.',
      language: 'HTML',
      stargazers_count: 0,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/mohil-c-mbc-pookalam-24',
      pushed_at: '2024-09-20T07:17:34Z',
      topics: ['art', 'pookalam'],
    },
    {
      name: 'code-hut-py',
      full_name: 'Mohilc/code-hut-py',
      description: 'Python utilities, algorithms, and developer experimentation lab.',
      language: 'Python',
      stargazers_count: 1,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/code-hut-py',
      pushed_at: '2026-09-25T05:40:31Z',
      topics: ['python'],
    },
    {
      name: 'chatbotgemini',
      full_name: 'Mohilc/chatbotgemini',
      description: 'Gemini-powered conversational AI chatbot in Python.',
      language: 'Python',
      stargazers_count: 0,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/chatbotgemini',
      pushed_at: '2025-07-24T13:44:51Z',
      topics: ['gemini', 'ai', 'chatbot'],
    },
    {
      name: 'food-order',
      full_name: 'Mohilc/food-order',
      description: 'Restaurant & food ordering interface.',
      language: 'HTML',
      stargazers_count: 0,
      forks_count: 0,
      homepage: '',
      html_url: 'https://github.com/Mohilc/food-order',
      pushed_at: '2024-09-16T15:26:36Z',
      topics: ['food', 'web'],
    },
  ],
  events: [
    { type: 'PushEvent', repo: { name: 'Mohilc/Portfolio_mohilc' }, created_at: '2026-11-27T16:36:55Z' },
    { type: 'PushEvent', repo: { name: 'Mohilc/meiyonpersonalai' }, created_at: '2026-11-27T15:44:35Z' },
    { type: 'PushEvent', repo: { name: 'Mohilc/elrics-task' }, created_at: '2026-11-10T09:47:34Z' },
    { type: 'PushEvent', repo: { name: 'Mohilc/-HackSphere3.0hackathon' }, created_at: '2026-10-27T17:48:15Z' },
  ],
};

export const LANGUAGE_COLORS = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  'Jupyter Notebook': '#DA5B0B',
  'C++': '#f34b7d',
  C: '#555555',
  Rust: '#dea584',
  Go: '#00ADD8',
  Default: '#7b8cde',
};

export function decodeBase64Utf8(base64Str) {
  const clean = (base64Str || '').replace(/\s+/g, '');
  if (!clean) return '';
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }
  return Buffer.from(clean, 'base64').toString('utf-8');
}

export function categorizeRepos(repos) {
  const aiHardware = [];
  const webMedia = [];
  const hackathons = [];
  const agriEco = [];
  const spaceVision = [];
  const cafeFood = [];
  const funUseless = [];

  for (const repo of repos) {
    const haystack = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
    if (
      repo.language === 'Python' ||
      repo.language === 'Jupyter Notebook' ||
      /ai|ml|vision|yolo|drone|uav|rover|crack|agri|bot|deep|esp32|gemini/.test(haystack)
    ) {
      aiHardware.push(repo);
    }
    if (repo.homepage || /web|html|css|typescript|javascript|react|flask|vercel/.test(haystack)) {
      webMedia.push(repo);
    }
    if (/hack|nasa|foss|trophy|contest|bot|tinkerhub|useless/.test(haystack)) {
      hackathons.push(repo);
    }
    if (/agri|crop|earth|bloom|munnar|pookalam/.test(haystack)) {
      agriEco.push(repo);
    }
    if (/nasa|space|vision|crack|road|safety/.test(haystack)) {
      spaceVision.push(repo);
    }
    if (/food|hoshiko|protein|emoji|price|house/.test(haystack)) {
      cafeFood.push(repo);
    }
    if (/useless|hack|tinker|elric|pookalam/.test(haystack)) {
      funUseless.push(repo);
    }
  }

  return {
    all: repos,
    aiHardware: aiHardware.length ? aiHardware : repos.slice(0, 6),
    webMedia: webMedia.length ? webMedia : repos.filter((r) => r.homepage).concat(repos).slice(0, 6),
    hackathons: hackathons.length ? hackathons : repos.slice(0, 4),
    agriEco: agriEco.length ? agriEco : repos.slice(0, 5),
    spaceVision: spaceVision.length ? spaceVision : repos.slice(0, 5),
    cafeFood: cafeFood.length ? cafeFood : repos.slice(0, 5),
    funUseless: funUseless.length ? funUseless : repos.slice(0, 5),
  };
}

export function computeLanguageStats(repos) {
  const counts = new Map();
  for (const repo of repos) {
    const lang = repo.language || 'Markdown / Config';
    counts.set(lang, (counts.get(lang) || 0) + 1);
  }
  const total = repos.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({
      language,
      count,
      percent: Math.round((count / total) * 100),
      color: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default,
    }));
}

async function fetchJson(url, fetchImpl) {
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchRepoReadme(owner, repo, fetchImpl = globalThis.fetch) {
  const data = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/readme`, fetchImpl);
  return decodeBase64Utf8(data.content);
}

export async function loadGithubPortfolio(username = 'Mohilc', featuredRepo = null, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const storage =
    options.storage !== undefined
      ? options.storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;
  const cleanUser = (username || 'Mohilc').trim();
  const cacheKey = `${GITHUB_CACHE_PREFIX}${cleanUser.toLowerCase()}`;

  if (!options.forceRefresh && storage) {
    try {
      const cached = JSON.parse(storage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
        return { ...cached.payload, source: 'cache' };
      }
    } catch {
      // ignore corrupted cache
    }
  }

  try {
    const [profile, repos, events] = await Promise.all([
      fetchJson(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, fetchImpl),
      fetchJson(
        `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?sort=pushed&per_page=100`,
        fetchImpl
      ),
      fetchJson(
        `https://api.github.com/users/${encodeURIComponent(cleanUser)}/events/public?per_page=20`,
        fetchImpl
      ).catch(() => []),
    ]);

    const sortedRepos = [...repos].sort((a, b) => {
      if ((b.stargazers_count || 0) !== (a.stargazers_count || 0)) {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      }
      return new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime();
    });

    const readmeRepo = featuredRepo || cleanUser;
    let profileReadme = '';
    try {
      profileReadme = await fetchRepoReadme(cleanUser, readmeRepo, fetchImpl);
    } catch {
      if (sortedRepos[0]) {
        profileReadme = await fetchRepoReadme(cleanUser, sortedRepos[0].name, fetchImpl).catch(() => '');
      }
    }

    const payload = {
      profile,
      repos: sortedRepos,
      events,
      profileReadme,
      lastFetchedAt: Date.now(),
    };

    if (storage) {
      try {
        storage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload }));
      } catch {
        // ignore quota errors
      }
    }

    return { ...payload, source: 'live' };
  } catch (error) {
    if (storage) {
      try {
        const stale = JSON.parse(storage.getItem(cacheKey) || 'null');
        if (stale?.payload) {
          return { ...stale.payload, source: 'cache', error: error.message };
        }
      } catch {
        // ignore
      }
    }

    if (cleanUser.toLowerCase() === 'mohilc') {
      return {
        ...MOHILC_FALLBACK_SNAPSHOT,
        lastFetchedAt: Date.now(),
        source: 'snapshot',
        error: error.message,
      };
    }

    throw error;
  }
}
