const SPORTS = ['Cricket', 'Football', 'Basketball', 'Tennis'];
const SPORTSCORE_MATCHES_URL = 'https://sportscore.com/api/widget/matches/';
const REFRESH_INTERVAL_MS = 90_000;
const LIVE_CACHE_KEY = 'scorexSportScoreCacheV1';

let events = [];
let feedLoading = true;
let feedError = '';
let lastUpdatedAt = null;
let isRefreshing = false;
let selectedSport = 'All';
let viewMode = 'sports';
let liveOnly = false;
let selections = [];
let balance = Number(localStorage.getItem('scorexBalance') || 25000);
let openBets = JSON.parse(localStorage.getItem('scorexOpenBets') || '[]');
let admins = JSON.parse(localStorage.getItem('scorexAdmins') || JSON.stringify([
  {id: 1, name: 'Atul Singh', email: 'superadmin@scorex.demo', role: 'SUPER_ADMIN', active: true, last: 'Just now'},
  {id: 2, name: 'Priya Sharma', email: 'markets@scorex.demo', role: 'MARKET_MANAGER', active: true, last: '2 hours ago'},
  {id: 3, name: 'Rahul Verma', email: 'support@scorex.demo', role: 'SUPPORT_AGENT', active: true, last: 'Yesterday'}
]));
let audit = JSON.parse(localStorage.getItem('scorexAudit') || JSON.stringify([
  {action: 'Super Admin signed in to the local console', time: 'Just now'}
]));

const el = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
})[character]);

function safeHttpsUrl(value) {
  try {
    const url = new URL(value, 'https://sportscore.com');
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function coin(value) {
  return `${Math.round(value).toLocaleString()} SXC`;
}

function save() {
  localStorage.setItem('scorexBalance', balance);
  localStorage.setItem('scorexOpenBets', JSON.stringify(openBets));
  localStorage.setItem('scorexAdmins', JSON.stringify(admins));
  localStorage.setItem('scorexAudit', JSON.stringify(audit));
}

function showToast(message) {
  el('toast').textContent = `✓ ${message}`;
  el('toast').classList.remove('hidden');
  setTimeout(() => el('toast').classList.add('hidden'), 2400);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function virtualMultipliers(sport, key) {
  const seed = hashString(`${sport}:${key}`);
  const home = +(1.55 + (seed % 135) / 100).toFixed(2);
  const away = +(1.55 + ((seed >>> 8) % 135) / 100).toFixed(2);
  if (sport === 'Football' || sport === 'Cricket') {
    const draw = +(3.10 + ((seed >>> 16) % 220) / 100).toFixed(2);
    return [home, draw, away];
  }
  return [home, 0, away];
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();
  if (['live', 'playing', 'inprogress', 'in_progress', 'in-play'].includes(status)) return 'live';
  if (['finished', 'ended', 'complete', 'completed', 'fulltime'].includes(status)) return 'finished';
  return 'upcoming';
}

function formatStartTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBC';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function mapSportScoreMatch(sport, match) {
  const status = normalizeStatus(match.status);
  const key = match.url || `${match.home}-${match.away}-${match.time}`;
  return {
    id: `${sport.toLowerCase()}-${hashString(key).toString(36)}`,
    sport,
    league: match.competition || 'Live sport',
    live: status === 'live',
    finished: status === 'finished',
    status,
    statusText: match.status_text || (status === 'live' ? 'Live' : status === 'finished' ? 'Finished' : 'Upcoming'),
    time: status === 'live' ? (match.status_text || 'Live') : formatStartTime(match.time),
    startTime: match.time || '',
    home: match.home || 'Home',
    away: match.away || 'Away',
    homeLogo: safeHttpsUrl(match.home_logo),
    awayLogo: safeHttpsUrl(match.away_logo),
    scoreA: match.home_score ?? '—',
    scoreB: match.away_score ?? '—',
    meta: status === 'live' ? 'Score supplied by SportScore' : match.status_text || 'Scheduled',
    markets: sport === 'Football' || sport === 'Cricket' ? 3 : 2,
    odds: virtualMultipliers(sport, key),
    suspended: status === 'finished',
    sourceUrl: safeHttpsUrl(match.url),
    source: 'SportScore'
  };
}

function sortEvents(items) {
  const rank = {live: 0, upcoming: 1, finished: 2};
  return [...items].sort((left, right) => {
    const statusDifference = rank[left.status] - rank[right.status];
    if (statusDifference) return statusDifference;
    return new Date(left.startTime || 0) - new Date(right.startTime || 0);
  });
}

function loadCachedScores() {
  try {
    const cached = JSON.parse(localStorage.getItem(LIVE_CACHE_KEY) || 'null');
    if (!cached || !Array.isArray(cached.events) || !cached.events.length) return false;
    events = sortEvents(cached.events);
    lastUpdatedAt = cached.updated ? new Date(cached.updated) : null;
    return true;
  } catch {
    return false;
  }
}

async function fetchSport(sport, signal) {
  const url = new URL(SPORTSCORE_MATCHES_URL);
  url.searchParams.set('sport', sport.toLowerCase());
  url.searchParams.set('limit', '30');
  url.searchParams.set('src', 'scorex');
  const response = await fetch(url, {
    signal,
    headers: {'Accept': 'application/json'}
  });
  if (!response.ok) throw new Error(`${sport} returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.matches)) throw new Error(`${sport} returned an invalid response`);
  return {sport, payload};
}

async function loadLiveData({manual = false} = {}) {
  if (isRefreshing) return;
  isRefreshing = true;
  feedLoading = true;
  feedError = '';
  renderFeedStatus();
  renderEvents();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const results = await Promise.allSettled(SPORTS.map(sport => fetchSport(sport, controller.signal)));
  clearTimeout(timeout);

  const successes = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const failures = results.filter(result => result.status === 'rejected');

  if (successes.length) {
    const refreshedSports = new Set(successes.map(result => result.sport));
    const refreshedEvents = successes.flatMap(({sport, payload}) =>
      payload.matches.map(match => mapSportScoreMatch(sport, match))
    );
    const retainedEvents = events.filter(event => !refreshedSports.has(event.sport));
    events = sortEvents([...refreshedEvents, ...retainedEvents]);
    const upstreamTimes = successes
      .map(({payload}) => new Date(payload.updated))
      .filter(date => !Number.isNaN(date.getTime()));
    lastUpdatedAt = upstreamTimes.length
      ? new Date(Math.max(...upstreamTimes.map(date => date.getTime())))
      : new Date();
    localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({
      updated: lastUpdatedAt.toISOString(),
      events
    }));
    if (failures.length) feedError = `${failures.length} sport feed${failures.length > 1 ? 's are' : ' is'} temporarily unavailable`;
    if (manual) showToast(failures.length ? 'Scores refreshed with partial coverage' : 'Live scores refreshed');
  } else {
    feedError = events.length
      ? 'Refresh failed — showing the last real SportScore update'
      : 'Live scores are temporarily unavailable';
    if (manual) showToast(feedError);
  }

  feedLoading = false;
  isRefreshing = false;
  renderAll();
}

function relativeUpdateTime(date) {
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for first update';
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.floor(minutes / 60)}h ago`;
}

function renderFeedStatus() {
  const hasData = events.length > 0;
  el('feedLabel').textContent = feedLoading
    ? (hasData ? 'REFRESHING LIVE DATA' : 'CONNECTING LIVE DATA')
    : feedError
      ? (hasData ? 'LIVE DATA · PARTIAL' : 'LIVE DATA UNAVAILABLE')
      : 'REAL LIVE SCORES';
  el('feedMessage').textContent = feedLoading
    ? 'Fetching football, basketball, cricket and tennis'
    : feedError || 'Scores refresh automatically every 90 seconds';
  el('lastUpdated').textContent = relativeUpdateTime(lastUpdatedAt);
  el('feedPulse').classList.toggle('error', Boolean(feedError));
  el('refreshScores').disabled = feedLoading;
  el('refreshScores').textContent = feedLoading ? 'Refreshing…' : 'Refresh scores';
}

function filtered() {
  return events.filter(event => {
    const sportMatches = selectedSport === 'All' || event.sport === selectedSport;
    const viewMatches = viewMode === 'results'
      ? event.finished
      : viewMode === 'live'
        ? event.live
        : !event.finished;
    return sportMatches && viewMatches && (!liveOnly || event.live);
  });
}

function currentHeading() {
  if (viewMode === 'results') return selectedSport === 'All' ? 'Recent results' : `${selectedSport} results`;
  if (viewMode === 'live' || liveOnly) return selectedSport === 'All' ? 'Live now' : `Live ${selectedSport}`;
  return selectedSport === 'All' ? 'Live & upcoming events' : selectedSport;
}

function teamRow(name, logo, score) {
  const logoMarkup = logo ? `<img class="team-logo" src="${escapeHtml(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : '<span class="team-logo fallback">•</span>';
  return `<div><span class="team-name">${logoMarkup}<strong>${escapeHtml(name)}</strong></span><b>${escapeHtml(score)}</b></div>`;
}

function renderEvents() {
  el('marketTitle').textContent = currentHeading();
  if (feedLoading && !events.length) {
    el('eventList').innerHTML = '<div class="feed-empty"><span class="loading-ring"></span><h3>Connecting to live sports</h3><p>Loading real match data from SportScore.</p></div>';
    return;
  }

  const visibleEvents = filtered();
  if (!visibleEvents.length) {
    const message = feedError && !events.length
      ? 'The live-score provider could not be reached. Try refreshing shortly.'
      : 'There are no matching live events in the current feed.';
    el('eventList').innerHTML = `<div class="feed-empty"><div>⌁</div><h3>No events to show</h3><p>${escapeHtml(message)}</p><button data-retry-feed>Try again</button></div>`;
    const retry = document.querySelector('[data-retry-feed]');
    if (retry) retry.onclick = () => loadLiveData({manual: true});
    return;
  }

  el('eventList').innerHTML = visibleEvents.map(event => {
    const statusLabel = event.live
      ? '<b class="live-label">● LIVE</b>'
      : event.finished
        ? '<b class="live-label finished-label">FINAL</b>'
        : '';
    const labels = event.sport === 'Football' || event.sport === 'Cricket' ? ['1', 'X', '2'] : ['1', '—', '2'];
    const priceButtons = event.odds.map((multiplier, index) => {
      if (!multiplier) return '<button class="price" disabled><small>—</small>—</button>';
      const pickId = `${event.id}::${index}`;
      const selected = selections.some(selection => selection.id === pickId) ? 'selected' : '';
      const disabled = event.suspended || event.finished ? 'disabled' : '';
      const value = disabled ? 'Closed' : `${multiplier.toFixed(2)}×`;
      return `<button class="price ${selected}" ${disabled} data-pick="${escapeHtml(pickId)}"><small>${labels[index]}</small>${value}</button>`;
    }).join('');
    const details = event.sourceUrl
      ? `<a class="market-count" href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener"><span>Match</span><small>details ↗</small></a>`
      : `<span class="market-count"><span>${event.markets}</span><small>SXC picks</small></span>`;
    return `<article class="event">
      <div>
        <div class="league"><span>${escapeHtml(event.sport)}</span>${escapeHtml(event.league)}${statusLabel}</div>
        <div class="teams">${teamRow(event.home, event.homeLogo, event.scoreA)}${teamRow(event.away, event.awayLogo, event.scoreB)}</div>
        <div class="meta">${escapeHtml(event.time)} · ${escapeHtml(event.meta)}</div>
      </div>
      ${priceButtons}${details}
    </article>`;
  }).join('');

  document.querySelectorAll('[data-pick]').forEach(button => {
    button.onclick = () => selectPick(button.dataset.pick);
  });
}

function selectPick(key) {
  const separatorIndex = key.lastIndexOf('::');
  const eventId = key.slice(0, separatorIndex);
  const index = Number(key.slice(separatorIndex + 2));
  const event = events.find(item => item.id === eventId);
  if (!event || event.finished || event.suspended || !event.odds[index]) return;
  const labels = event.sport === 'Football' || event.sport === 'Cricket'
    ? [event.home, event.sport === 'Cricket' ? 'Tie / draw' : 'Draw', event.away]
    : [event.home, '', event.away];
  const pick = {
    id: key,
    eventId,
    match: `${event.home} v ${event.away}`,
    label: labels[index],
    market: 'ScoreX match prediction',
    odds: event.odds[index]
  };
  selections = selections.some(selection => selection.id === key)
    ? selections.filter(selection => selection.id !== key)
    : [...selections.filter(selection => selection.eventId !== eventId), pick];
  renderEvents();
  renderSlip();
}

function renderSlip() {
  const stake = Number(el('stake').value || 0);
  const combinedMultiplier = selections.reduce((total, selection) => total * selection.odds, 1);
  const potential = selections.length ? stake * combinedMultiplier : 0;
  el('balance').textContent = coin(balance);
  el('slipCount').textContent = selections.length;
  el('potentialReturn').textContent = coin(potential);
  el('emptySlip').classList.toggle('hidden', selections.length > 0);
  el('slipItems').innerHTML = selections.map(selection => `<div class="slip-item">
    <button class="remove" data-remove="${escapeHtml(selection.id)}">×</button>
    <small>${escapeHtml(selection.market)}</small><strong>${escapeHtml(selection.label)}</strong>
    <p>${escapeHtml(selection.match)}</p><b>${selection.odds.toFixed(2)}×</b>
  </div>`).join('');
  el('placeBet').disabled = !selections.length || stake <= 0 || stake > balance;
  document.querySelectorAll('[data-remove]').forEach(button => {
    button.onclick = () => {
      selections = selections.filter(selection => selection.id !== button.dataset.remove);
      renderEvents();
      renderSlip();
    };
  });
}

function renderOpen() {
  el('openCount').textContent = openBets.length;
  el('openBets').innerHTML = openBets.length
    ? openBets.map(bet => `<article class="open-bet"><span>OPEN · VIRTUAL</span><strong>${escapeHtml(bet.label)} @ ${Number(bet.odds).toFixed(2)}×</strong><p>${escapeHtml(bet.match)}</p><small>Stake ${coin(bet.stake)} · Potential ${coin(bet.return)}</small></article>`).join('')
    : '<div class="empty"><div>⌁</div><h3>No open predictions</h3><p>Accepted SXC predictions appear here.</p></div>';
}

function placeBet() {
  const stake = Number(el('stake').value);
  const combinedMultiplier = selections.reduce((total, selection) => total * selection.odds, 1);
  balance -= stake;
  openBets.unshift({
    ...selections[0],
    label: selections.length > 1 ? `${selections.length}-fold accumulator` : selections[0].label,
    odds: combinedMultiplier,
    stake,
    return: stake * combinedMultiplier
  });
  audit.unshift({action: `Placed a ${selections.length}-selection SXC prediction`, time: 'Just now'});
  selections = [];
  save();
  renderEvents();
  renderSlip();
  renderOpen();
  showToast('Virtual prediction accepted');
  document.querySelector('[data-tab="open"]').click();
}

function log(action) {
  audit.unshift({action, time: 'Just now'});
  save();
  renderAdmin();
  showToast(action);
}

function renderAdmin() {
  el('liveCount').textContent = events.filter(event => event.live).length;
  el('activeMarketCount').textContent = events.filter(event => !event.finished && !event.suspended).reduce((total, event) => total + event.markets, 0);
  el('suspendedCount').textContent = events.filter(event => event.suspended && !event.finished).length;
  el('adminList').innerHTML = admins.map(admin => `<div class="admin-row"><div class="admin-avatar">${escapeHtml(admin.name.split(' ').map(part => part[0]).join('').slice(0, 2))}</div><div><strong>${escapeHtml(admin.name)}</strong><small>${escapeHtml(admin.email)} · Last login ${escapeHtml(admin.last)}</small></div><span class="badge ${admin.active ? '' : 'off'}">${admin.active ? escapeHtml(admin.role) : 'DEACTIVATED'}</span>${admin.role !== 'SUPER_ADMIN' ? `<button class="deactivate" data-admin="${admin.id}">${admin.active ? 'Deactivate' : 'Reactivate'}</button>` : ''}</div>`).join('');
  el('auditLog').innerHTML = audit.slice(0, 8).map(item => `<div class="audit-item">${escapeHtml(item.action)}<small>${escapeHtml(item.time)}</small></div>`).join('');
  const liveEvents = events.filter(event => event.live);
  el('marketControls').innerHTML = liveEvents.length
    ? liveEvents.map(event => `<div class="market-row"><div><strong>${escapeHtml(event.home)} v ${escapeHtml(event.away)}</strong><small>${escapeHtml(event.sport)} · ${escapeHtml(event.league)}</small></div><span class="badge ${event.suspended ? 'off' : ''}">${event.suspended ? 'SUSPENDED' : 'ACTIVE'}</span><button class="suspend" data-market="${escapeHtml(event.id)}">${event.suspended ? 'Resume' : 'Suspend'}</button></div>`).join('')
    : '<div class="feed-empty compact"><p>No live events are available for market control.</p></div>';
  document.querySelectorAll('[data-admin]').forEach(button => {
    button.onclick = () => {
      const admin = admins.find(item => item.id === Number(button.dataset.admin));
      admin.active = !admin.active;
      log(`${admin.active ? 'Reactivated' : 'Deactivated'} admin account: ${admin.email}`);
    };
  });
  document.querySelectorAll('[data-market]').forEach(button => {
    button.onclick = () => {
      const event = events.find(item => item.id === button.dataset.market);
      event.suspended = !event.suspended;
      log(`${event.suspended ? 'Suspended' : 'Resumed'} SXC market: ${event.home} v ${event.away}`);
      renderEvents();
    };
  });
}

function updateSportCounts() {
  document.querySelectorAll('[data-sport-count]').forEach(node => {
    const sport = node.dataset.sportCount;
    node.textContent = sport === 'All'
      ? events.filter(event => !event.finished).length
      : events.filter(event => event.sport === sport && !event.finished).length;
  });
}

function renderHero() {
  const featured = events.find(event => event.live) || events.find(event => !event.finished) || events[0];
  if (!featured) {
    el('heroMatchType').textContent = 'LIVE SPORTS';
    el('heroHome').textContent = 'Connecting…';
    el('heroRuns').textContent = '—';
    el('heroAway').textContent = 'Waiting for live data';
    el('heroAwayScore').textContent = '—';
    el('heroStatus').textContent = 'SportScore feed';
    return;
  }
  el('heroMatchType').textContent = `${featured.live ? 'LIVE' : featured.finished ? 'FINAL' : 'UPCOMING'} · ${featured.sport}`;
  el('heroHome').textContent = featured.home;
  el('heroRuns').textContent = featured.scoreA;
  el('heroAway').textContent = featured.away;
  el('heroAwayScore').textContent = featured.scoreB;
  el('heroStatus').textContent = `${featured.league} · ${featured.time}`;
}

function syncNavigation() {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === viewMode);
  });
}

function renderAll() {
  renderFeedStatus();
  renderEvents();
  renderHero();
  renderSlip();
  renderOpen();
  renderAdmin();
  updateSportCounts();
  syncNavigation();
}

document.querySelectorAll('.sport-filter').forEach(button => {
  button.onclick = () => {
    selectedSport = button.dataset.sport;
    document.querySelectorAll('.sport-filter').forEach(item => item.classList.toggle('selected', item === button));
    renderEvents();
  };
});

el('liveToggle').onchange = event => {
  liveOnly = event.target.checked;
  renderEvents();
};

el('liveOnlyButton').onclick = () => {
  viewMode = 'live';
  liveOnly = false;
  el('liveToggle').checked = false;
  renderAll();
};

el('heroLiveButton').onclick = el('liveOnlyButton').onclick;
el('clearFilterButton').onclick = () => {
  liveOnly = false;
  selectedSport = 'All';
  viewMode = 'sports';
  el('liveToggle').checked = false;
  document.querySelectorAll('.sport-filter').forEach(item => item.classList.toggle('selected', item.dataset.sport === 'All'));
  renderAll();
};

el('refreshScores').onclick = () => loadLiveData({manual: true});
document.querySelectorAll('[data-stake]').forEach(button => {
  button.onclick = () => {
    el('stake').value = button.dataset.stake;
    renderSlip();
  };
});
el('stake').oninput = renderSlip;
el('placeBet').onclick = placeBet;

document.querySelectorAll('.tab').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === button));
    el('slipPanel').classList.toggle('hidden', button.dataset.tab !== 'slip');
    el('openPanel').classList.toggle('hidden', button.dataset.tab !== 'open');
  };
});

document.querySelectorAll('[data-view]').forEach(button => {
  button.onclick = () => {
    const adminView = button.dataset.view === 'admin';
    el('sports').classList.toggle('hidden', adminView);
    el('admin').classList.toggle('hidden', !adminView);
    viewMode = button.dataset.view;
    liveOnly = false;
    el('liveToggle').checked = false;
    renderAll();
  };
});

el('backToSports').onclick = () => document.querySelector('[data-view="sports"]').click();
el('newAdminButton').onclick = () => el('adminDialog').showModal();
el('adminForm').addEventListener('submit', event => {
  event.preventDefault();
  admins.push({
    id: Date.now(),
    name: el('adminName').value,
    email: el('adminEmail').value,
    role: el('adminRole').value,
    active: true,
    last: 'Never'
  });
  el('adminDialog').close();
  event.target.reset();
  log(`Created ${admins.at(-1).role} account: ${admins.at(-1).email}`);
});

loadCachedScores();
renderAll();
loadLiveData();
setInterval(() => {
  if (!document.hidden) loadLiveData();
}, REFRESH_INTERVAL_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && (!lastUpdatedAt || Date.now() - lastUpdatedAt.getTime() > REFRESH_INTERVAL_MS)) {
    loadLiveData();
  }
});
