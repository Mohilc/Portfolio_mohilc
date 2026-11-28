import { describe, expect, it } from 'vitest';
import {
  categorizeRepos,
  computeLanguageStats,
  decodeBase64Utf8,
  loadGithubPortfolio,
} from '../src/services/githubService.js';

describe('githubService', () => {
  it('decodes UTF-8 base64 README payloads without corrupting unicode', () => {
    const sample = 'Hi 👋 Mohil C — AI & UAV';
    const b64 = Buffer.from(sample, 'utf-8').toString('base64');
    expect(decodeBase64Utf8(b64)).toBe(sample);
  });

  it('categorizes repos into room & world district buckets and computes language percentages', () => {
    const repos = [
      { name: 'crackwise-ai', language: 'TypeScript', homepage: 'https://crackwise-ai.vercel.app', topics: ['yolov8'] },
      { name: 'meiyonpersonalai', language: 'Python', homepage: '', topics: ['ai'] },
      { name: '-HackSphere3.0hackathon', language: 'Python', homepage: '', topics: ['hackathon'] },
      { name: 'AgriVision-AI-Crop-Damage-Intelligence-Farmer-Assistant', language: 'Python', homepage: '', topics: ['agriculture'] },
      { name: 'looptroopnasa2025', language: 'TypeScript', homepage: 'https://nasa2025-virid.vercel.app', topics: ['nasa'] },
      { name: 'Hoshiko', language: 'CSS', homepage: 'https://hoshiko-phi.vercel.app', topics: ['web'] },
    ];

    const cats = categorizeRepos(repos);
    expect(cats.aiHardware.map((r) => r.name)).toContain('meiyonpersonalai');
    expect(cats.webMedia.map((r) => r.name)).toContain('crackwise-ai');
    expect(cats.hackathons.map((r) => r.name)).toContain('-HackSphere3.0hackathon');
    expect(cats.agriEco.map((r) => r.name)).toContain('AgriVision-AI-Crop-Damage-Intelligence-Farmer-Assistant');
    expect(cats.spaceVision.map((r) => r.name)).toContain('looptroopnasa2025');
    expect(cats.cafeFood.map((r) => r.name)).toContain('Hoshiko');

    const stats = computeLanguageStats(repos);
    expect(stats[0].language).toBe('Python');
    expect(stats[0].count).toBe(3);
  });

  it('falls back gracefully to Mohilc snapshot when offline / API errors occur', async () => {
    const failingFetch = async () => ({ ok: false, status: 403 });
    const data = await loadGithubPortfolio('Mohilc', 'mohilc', {
      fetchImpl: failingFetch,
      storage: null,
    });

    expect(data.source).toBe('snapshot');
    expect(data.profile.login).toBe('Mohilc');
    expect(data.repos.length).toBeGreaterThan(5);
  });
});
