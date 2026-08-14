import {APP_CONFIG} from '../config/app';
import {sortEvents} from '../domain/live-event.mapper';
import type {AdminRole, PersistedSession, SportFilter, ViewMode} from '../domain/types';
import {auditEntry, createAdmin, toggleAdmin, toggleMarket} from '../features/admin/admin.service';
import {createOpenPrediction, toggleSelection} from '../features/predictions/prediction.service';
import {BrowserStorage} from '../services/browser-storage';
import {SportScoreClient} from '../services/sportscore.client';
import {createState} from '../state/create-state';
import {getAppElements, type AppElements} from '../ui/elements';
import {renderAdmin} from '../ui/render/admin.renderer';
import {renderEvents, renderSportFilters, isSupportedSport} from '../ui/render/events.renderer';
import {renderFeed, renderHero} from '../ui/render/feed.renderer';
import {renderNavigation} from '../ui/render/navigation.renderer';
import {renderOpenPredictions, renderPredictionSlip} from '../ui/render/predictions.renderer';

const VIEW_MODES: ViewMode[] = ['sports', 'live', 'results', 'admin'];
const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MARKET_MANAGER', 'SUPPORT_AGENT', 'VIEWER'];

export class ScoreXApp {
  private readonly storage = new BrowserStorage();
  private readonly client = new SportScoreClient();
  private readonly elements: AppElements = getAppElements();
  private readonly state = createState(this.storage);
  private toastTimer: number | undefined;

  start(): void {
    this.bindInteractions();
    this.render();
    void this.refreshScores();
    window.setInterval(() => {
      if (!document.hidden) void this.refreshScores();
    }, APP_CONFIG.refreshIntervalMs);
    document.addEventListener('visibilitychange', () => {
      const lastUpdate = this.state.feed.lastUpdatedAt?.getTime() ?? 0;
      if (!document.hidden && Date.now() - lastUpdate > APP_CONFIG.refreshIntervalMs) {
        void this.refreshScores();
      }
    });
  }

  private bindInteractions(): void {
    document.querySelectorAll<HTMLButtonElement>('.sport-filter').forEach(button => {
      button.addEventListener('click', () => {
        const sport = button.dataset.sport;
        if (sport === 'All' || isSupportedSport(sport)) {
          this.state.selectedSport = sport as SportFilter;
          this.render();
        }
      });
    });

    this.elements.liveToggle.addEventListener('change', () => {
      this.state.liveOnly = this.elements.liveToggle.checked;
      this.render();
    });
    document.getElementById('liveOnlyButton')?.addEventListener('click', () => this.changeView('live'));
    document.getElementById('heroLiveButton')?.addEventListener('click', () => this.changeView('live'));
    document.getElementById('clearFilterButton')?.addEventListener('click', () => {
      this.state.selectedSport = 'All';
      this.state.liveOnly = false;
      this.changeView('sports');
    });
    this.elements.refreshScores.addEventListener('click', () => void this.refreshScores(true));

    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => {
      button.addEventListener('click', () => {
        const view = button.dataset.view as ViewMode | undefined;
        if (view && VIEW_MODES.includes(view)) this.changeView(view);
      });
    });
    document.getElementById('backToSports')?.addEventListener('click', () => this.changeView('sports'));

    document.querySelectorAll<HTMLButtonElement>('[data-stake]').forEach(button => {
      button.addEventListener('click', () => {
        this.elements.stake.value = button.dataset.stake || '0';
        renderPredictionSlip(this.elements, this.state);
      });
    });
    this.elements.stake.addEventListener('input', () => renderPredictionSlip(this.elements, this.state));
    this.elements.placePrediction.addEventListener('click', () => this.placePrediction());

    document.querySelectorAll<HTMLButtonElement>('.tab').forEach(button => {
      button.addEventListener('click', () => this.selectPredictionTab(button));
    });
    this.elements.eventList.addEventListener('click', event => this.handleEventBoardClick(event));
    this.elements.slipItems.addEventListener('click', event => this.handleSlipClick(event));
    this.elements.adminList.addEventListener('click', event => this.handleAdminClick(event));
    this.elements.marketControls.addEventListener('click', event => this.handleMarketClick(event));

    document.getElementById('newAdminButton')?.addEventListener('click', () => this.elements.adminDialog.showModal());
    document.getElementById('closeAdminDialog')?.addEventListener('click', () => this.elements.adminDialog.close());
    this.elements.adminForm.addEventListener('submit', event => this.createAdminAccount(event));
  }

  private async refreshScores(manual = false): Promise<void> {
    if (this.state.feed.refreshing) return;
    this.state.feed.loading = true;
    this.state.feed.refreshing = true;
    this.state.feed.error = '';
    this.render();

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), APP_CONFIG.requestTimeoutMs);
    try {
      const result = await this.client.fetchAll(controller.signal);
      if (result.successfulSports.length) {
        const refreshedSports = new Set(result.successfulSports);
        const retainedEvents = this.state.events.filter(event => !refreshedSports.has(event.sport));
        this.state.events = sortEvents([...result.events, ...retainedEvents]);
        this.state.feed.lastUpdatedAt = result.updatedAt;
        if (result.updatedAt) {
          this.storage.saveLiveCache({
            updated: result.updatedAt.toISOString(),
            events: this.state.events
          });
        }
        this.state.feed.error = result.failedSports.length
          ? `${result.failedSports.length} sport feed${result.failedSports.length > 1 ? 's are' : ' is'} temporarily unavailable`
          : '';
        if (manual) this.showToast(result.failedSports.length ? 'Scores refreshed with partial coverage' : 'Live scores refreshed');
      } else {
        this.state.feed.error = this.state.events.length
          ? 'Refresh failed — showing the last real SportScore update'
          : 'Live scores are temporarily unavailable';
        if (manual) this.showToast(this.state.feed.error);
      }
    } finally {
      window.clearTimeout(timeout);
      this.state.feed.loading = false;
      this.state.feed.refreshing = false;
      this.render();
    }
  }

  private handleEventBoardClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'retry-feed') {
      void this.refreshScores(true);
      return;
    }
    if (target.dataset.action !== 'select-pick') return;
    const sportEvent = this.state.events.find(item => item.id === target.dataset.eventId);
    const outcomeIndex = Number(target.dataset.outcomeIndex);
    if (!sportEvent || !Number.isInteger(outcomeIndex)) return;
    this.state.selections = toggleSelection(this.state.selections, sportEvent, outcomeIndex);
    this.render();
  }

  private handleSlipClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action="remove-pick"]');
    const selectionId = target?.dataset.selectionId;
    if (!selectionId) return;
    this.state.selections = this.state.selections.filter(selection => selection.id !== selectionId);
    this.render();
  }

  private handleAdminClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action="toggle-admin"]');
    const adminId = Number(target?.dataset.adminId);
    const current = this.state.admins.find(admin => admin.id === adminId);
    if (!current || current.role === 'SUPER_ADMIN') return;
    this.state.admins = toggleAdmin(this.state.admins, adminId);
    this.state.audit.unshift(auditEntry(`${current.active ? 'Deactivated' : 'Reactivated'} admin account: ${current.email}`));
    this.persistSession();
    this.showToast(`${current.active ? 'Deactivated' : 'Reactivated'} ${current.email}`);
    this.render();
  }

  private handleMarketClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action="toggle-market"]');
    const eventId = target?.dataset.eventId;
    const current = this.state.events.find(item => item.id === eventId);
    if (!eventId || !current || current.status === 'finished') return;
    this.state.events = toggleMarket(this.state.events, eventId);
    this.state.audit.unshift(auditEntry(`${current.suspended ? 'Resumed' : 'Suspended'} SXC market: ${current.home} v ${current.away}`));
    this.persistSession();
    this.showToast(`${current.suspended ? 'Market resumed' : 'Market suspended'}`);
    this.render();
  }

  private createAdminAccount(event: SubmitEvent): void {
    event.preventDefault();
    const name = this.elements.adminName.value.trim();
    const email = this.elements.adminEmail.value.trim().toLowerCase();
    const role = this.elements.adminRole.value as AdminRole;
    if (!name || !email || !ADMIN_ROLES.includes(role)) return;
    if (this.state.admins.some(admin => admin.email.toLowerCase() === email)) {
      this.showToast('An admin with this email already exists');
      return;
    }
    const admin = createAdmin(name, email, role);
    this.state.admins.push(admin);
    this.state.audit.unshift(auditEntry(`Created ${admin.role} account: ${admin.email}`));
    this.persistSession();
    this.elements.adminDialog.close();
    this.elements.adminForm.reset();
    this.showToast(`Created ${admin.role} account`);
    this.render();
  }

  private placePrediction(): void {
    const stake = Number(this.elements.stake.value);
    if (!this.state.selections.length || stake <= 0 || stake > this.state.balance) return;
    const prediction = createOpenPrediction(this.state.selections, stake);
    this.state.balance -= stake;
    this.state.openPredictions.unshift(prediction);
    this.state.audit.unshift(auditEntry(`Placed a ${this.state.selections.length}-selection SXC prediction`));
    this.state.selections = [];
    this.persistSession();
    this.showToast('Virtual prediction accepted');
    const openTab = document.querySelector<HTMLButtonElement>('[data-tab="open"]');
    if (openTab) this.selectPredictionTab(openTab);
    this.render();
  }

  private changeView(viewMode: ViewMode): void {
    this.state.viewMode = viewMode;
    this.state.liveOnly = false;
    this.render();
  }

  private selectPredictionTab(selected: HTMLButtonElement): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach(button => {
      button.classList.toggle('active', button === selected);
    });
    const showSlip = selected.dataset.tab === 'slip';
    this.elements.slipPanel.classList.toggle('hidden', !showSlip);
    this.elements.openPanel.classList.toggle('hidden', showSlip);
  }

  private persistSession(): void {
    const session: PersistedSession = {
      balance: this.state.balance,
      openPredictions: this.state.openPredictions,
      admins: this.state.admins,
      audit: this.state.audit
    };
    this.storage.saveSession(session);
  }

  private showToast(message: string): void {
    this.elements.toast.textContent = `✓ ${message}`;
    this.elements.toast.classList.remove('hidden');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.elements.toast.classList.add('hidden'), 2400);
  }

  private render(): void {
    renderFeed(this.elements, this.state);
    renderHero(this.elements, this.state);
    renderEvents(this.elements, this.state);
    renderSportFilters(this.state);
    renderPredictionSlip(this.elements, this.state);
    renderOpenPredictions(this.elements, this.state);
    renderAdmin(this.elements, this.state);
    renderNavigation(this.elements, this.state);
  }
}
