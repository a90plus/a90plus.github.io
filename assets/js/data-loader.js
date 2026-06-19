/**
 * data-loader.js
 * Fetches tournament JSON from jsDelivr CDN and caches in memory.
 * Falls back to local /data/ path for local development.
 */

const DataLoader = (() => {
  const CDN = 'https://cdn.jsdelivr.net/gh/a90plus/a90plus-data@main/tournaments';
  const LOCAL = '../data'; // fallback when served locally

  const cache = {};
  let manifest = null;

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  async function getManifest() {
    if (manifest) return manifest;
    // Try CDN first, fall back to local
    try {
      manifest = await fetchJSON(`${CDN}/index.json`);
    } catch {
      try {
        manifest = await fetchJSON(`${LOCAL}/index.json`);
      } catch {
        // Hard-coded fallback so the UI still works during development
        manifest = { years: [2018, 2022], latest: 2022 };
      }
    }
    return manifest;
  }

  async function getTournament(year) {
    if (cache[year]) return cache[year];

    let data = null;
    const urls = [
      `${CDN}/${year}.json`,
      `${LOCAL}/${year}.json`,
    ];

    for (const url of urls) {
      try {
        data = await fetchJSON(url);
        break;
      } catch { /* try next */ }
    }

    if (!data) throw new Error(`Tournament data for ${year} is not available.`);
    cache[year] = data;
    return data;
  }

  function getAvailableYears() {
    if (!manifest) return [];
    return [...manifest.years].sort((a, b) => a - b);
  }

  function getLatestYear() {
    if (!manifest) return null;
    return manifest.latest;
  }

  // Derive helpers — computed from event arrays, never stored
  function playerGoals(tournament, playerId) {
    let goals = 0;
    for (const m of tournament.matches) {
      for (const e of m.events) {
        if (e.playerId === playerId && ['goal','penalty-goal'].includes(e.type)) goals++;
      }
    }
    return goals;
  }

  function playerAssists(tournament, playerId) {
    let assists = 0;
    for (const m of tournament.matches) {
      for (const e of m.events) {
        if (e.playerId === playerId && e.type === 'assist') assists++;
      }
    }
    return assists;
  }

  function playerCards(tournament, playerId) {
    let yellow = 0, red = 0;
    for (const m of tournament.matches) {
      for (const e of m.events) {
        if (e.playerId !== playerId) continue;
        if (e.type === 'yellow-card' || e.type === 'second-yellow') yellow++;
        if (e.type === 'red-card' || e.type === 'second-yellow') red++;
      }
    }
    return { yellow, red };
  }

  function topScorers(tournament, limit = 10) {
    const goals = {};
    const names = {};
    const countries = {};
    for (const c of tournament.countries) {
      for (const p of c.squad) {
        names[p.playerId] = p.commonName || p.fullName;
        countries[p.playerId] = c.iso3;
      }
    }
    for (const m of tournament.matches) {
      for (const e of m.events) {
        if (['goal','penalty-goal'].includes(e.type)) {
          goals[e.playerId] = (goals[e.playerId] || 0) + 1;
        }
      }
    }
    return Object.entries(goals)
      .sort((a,b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pid, g]) => ({ playerId: pid, name: names[pid] || pid, iso3: countries[pid], goals: g }));
  }

  function countryTopScorer(tournament, iso3) {
    const country = tournament.countries.find(c => c.iso3 === iso3);
    if (!country) return null;
    const pids = new Set(country.squad.map(p => p.playerId));
    const goals = {};
    const names = {};
    for (const p of country.squad) names[p.playerId] = p.commonName || p.fullName;
    for (const m of tournament.matches) {
      for (const e of m.events) {
        if (pids.has(e.playerId) && ['goal','penalty-goal'].includes(e.type)) {
          goals[e.playerId] = (goals[e.playerId] || 0) + 1;
        }
      }
    }
    if (!Object.keys(goals).length) return null;
    const pid = Object.entries(goals).sort((a,b)=>b[1]-a[1])[0][0];
    return { playerId: pid, name: names[pid], goals: goals[pid] };
  }

  return { getManifest, getTournament, getAvailableYears, getLatestYear,
           playerGoals, playerAssists, playerCards, topScorers, countryTopScorer };
})();
