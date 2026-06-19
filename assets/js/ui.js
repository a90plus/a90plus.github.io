/**
 * ui.js — shared UI utilities: nav, year selector, tooltip, state boxes.
 */

// ── Nav active link ──────────────────────────────────────────────────────────
function initNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('active');
  });
}

// ── Year selector ─────────────────────────────────────────────────────────────
function buildYearSelector(containerId, years, selected, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  years.forEach(y => {
    const btn = document.createElement('button');
    btn.className = 'year-btn' + (y === selected ? ' active' : '');
    btn.textContent = y;
    btn.addEventListener('click', () => {
      el.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update nav pill
      const pill = document.querySelector('.nav-year-pill');
      if (pill) pill.textContent = y;
      onChange(y);
    });
    el.appendChild(btn);
  });
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const Tooltip = (() => {
  let el = null;

  function ensure() {
    if (!el) {
      el = document.createElement('div');
      el.className = 'tooltip';
      document.body.appendChild(el);
    }
  }

  function show(html, x, y) {
    ensure();
    el.innerHTML = html;
    el.classList.add('visible');
    position(x, y);
  }

  function position(x, y) {
    if (!el) return;
    const pad = 12;
    let left = x + pad, top = y + pad;
    const rect = el.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - pad) left = x - rect.width - pad;
    if (top + rect.height > window.innerHeight - pad) top = y - rect.height - pad;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function hide() {
    if (el) el.classList.remove('visible');
  }

  return { show, hide, position };
})();

// ── Loading / error state helpers ─────────────────────────────────────────────
function showLoading(el) {
  el.innerHTML = `<div class="state-box"><div class="spinner"></div>Loading data…</div>`;
}

function showError(el, msg) {
  el.innerHTML = `<div class="state-box error"><div class="icon">⚠</div>${msg}</div>`;
}

function showEmpty(el, msg = 'No data available for this selection.') {
  el.innerHTML = `<div class="state-box"><div class="icon">○</div>${msg}</div>`;
}

// ── Flag emoji — covers ISO alpha-3 AND FIFA codes (scraper stores FIFA for some) ─
const ISO3_TO_EMOJI = {
  // ISO alpha-3
  ARG:'🇦🇷', AUS:'🇦🇺', BEL:'🇧🇪', BRA:'🇧🇷', CAN:'🇨🇦', CMR:'🇨🇲',
  COL:'🇨🇴', CRI:'🇨🇷', DEU:'🇩🇪', DNK:'🇩🇰', ECU:'🇪🇨', EGY:'🇪🇬',
  ESP:'🇪🇸', FRA:'🇫🇷', GBR:'🇬🇧', GHA:'🇬🇭', HRV:'🇭🇷', IRN:'🇮🇷',
  IRL:'🇮🇪', ISL:'🇮🇸', ITA:'🇮🇹', JPN:'🇯🇵', KOR:'🇰🇷', MAR:'🇲🇦',
  MEX:'🇲🇽', NGA:'🇳🇬', NLD:'🇳🇱', PAN:'🇵🇦', PER:'🇵🇪', POL:'🇵🇱',
  PRT:'🇵🇹', QAT:'🇶🇦', RUS:'🇷🇺', SAU:'🇸🇦', SEN:'🇸🇳', SRB:'🇷🇸',
  SWE:'🇸🇪', CHE:'🇨🇭', TUN:'🇹🇳', URY:'🇺🇾', USA:'🇺🇸', COD:'🇨🇩',
  SRB:'🇷🇸', MKD:'🇲🇰',
  // FIFA codes that appear in scraped data
  CRC:'🇨🇷', CRO:'🇭🇷', DEN:'🇩🇰', ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER:'🇩🇪', HOL:'🇳🇱',
  KSA:'🇸🇦', POR:'🇵🇹', SUI:'🇨🇭', URU:'🇺🇾', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  NIR:'🇬🇧', IVO:'🇨🇮', TRI:'🇹🇹', ALG:'🇩🇿', ZAI:'🇨🇩',
};

function flag(iso3) {
  return ISO3_TO_EMOJI[iso3] || '🏳';
}

// ── Stage display names ────────────────────────────────────────────────────────
const STAGE_NAMES = {
  GroupStage: 'Group Stage',
  RoundOf16: 'Round of 16',
  QuarterFinal: 'Quarter-Final',
  SemiFinal: 'Semi-Final',
  ThirdPlace: 'Third Place',
  Final: 'Final',
  Winner: 'Winner',
};

function stageName(s) { return STAGE_NAMES[s] || s; }

// ── Event type icons ───────────────────────────────────────────────────────────
const EVENT_ICONS = {
  'goal': '⚽', 'penalty-goal': '⚽(P)', 'own-goal': '⚽(OG)',
  'penalty-missed': '✗', 'assist': '🅰',
  'yellow-card': '🟨', 'second-yellow': '🟨🟥', 'red-card': '🟥',
  'substitution-on': '↑', 'substitution-off': '↓',
  'var-review': '📺',
};
function eventIcon(type) { return EVENT_ICONS[type] || '•'; }

// ── URL param helpers ─────────────────────────────────────────────────────────
function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}
function setParams(obj) {
  const p = new URLSearchParams(location.search);
  Object.entries(obj).forEach(([k,v]) => v != null ? p.set(k,v) : p.delete(k));
  history.replaceState(null, '', '?' + p.toString());
}

// ── Init on load ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initNav);
