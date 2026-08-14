import {APP_CONFIG} from '../config/app';
import {currentAdmin, currentBalance, currentUser, usersForAdmin} from '../domain/account-selectors';
import {sortEvents} from '../domain/live-event.mapper';
import type {AccountKind, AdminRole, PersistedSession, ScheduleFilter, SportFilter, ViewMode} from '../domain/types';
import {adminValidationError, applyMarketSuspensions, auditEntry, createAdmin, suspendedEventIds, toggleAdmin, toggleMarket} from '../features/admin/admin.service';
import {authenticate, createClientUser, registrationValidationError} from '../features/auth/auth.service';
import {GuidedTourController} from '../features/demo/guided-tour.controller';
import {refreshCooldownRemainingMs} from '../features/live/feed-policy';
import {createOpenPrediction, normalizeStake, toggleSelection} from '../features/predictions/prediction.service';
import {applyWalletChange, createTopUpQrDataUrl, createTopUpRequest, resolveTopUpRequest} from '../features/wallet/wallet.service';
import {BrowserStorage} from '../services/browser-storage';
import {SportScoreClient} from '../services/sportscore.client';
import {createState} from '../state/create-state';
import {getAppElements, type AppElements} from '../ui/elements';
import {renderAccount} from '../ui/render/account.renderer';
import {renderAdmin} from '../ui/render/admin.renderer';
import {renderEvents, renderSportFilters, isSupportedSport} from '../ui/render/events.renderer';
import {renderFeed, renderHero} from '../ui/render/feed.renderer';
import {renderNavigation} from '../ui/render/navigation.renderer';
import {renderOpenPredictions, renderPredictionSlip} from '../ui/render/predictions.renderer';

const VIEW_MODES: ViewMode[] = ['sports', 'live', 'upcoming', 'results', 'admin'];
const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MARKET_MANAGER', 'SUPPORT_AGENT', 'VIEWER'];

export class ScoreXApp {
  private readonly storage = new BrowserStorage();
  private readonly client = new SportScoreClient();
  private readonly elements: AppElements = getAppElements();
  private readonly state = createState(this.storage);
  private readonly tour = new GuidedTourController(this.elements, () => {
    this.state.viewMode = 'upcoming';
    this.state.liveOnly = false;
    this.state.scheduleFilter = 'all';
    this.state.visibleEventLimit = APP_CONFIG.eventPageSize;
    this.render();
  });
  private toastTimer: number | undefined;

  start(): void {
    this.bindInteractions();
    this.tour.bind();
    this.render();
    void this.refreshScores();
    window.setInterval(() => {
      if (!document.hidden) void this.refreshScores();
    }, APP_CONFIG.refreshIntervalMs);
    document.addEventListener('visibilitychange', () => {
      const lastUpdate = this.state.feed.lastUpdatedAt?.getTime() ?? 0;
      if (!document.hidden && Date.now() - lastUpdate > APP_CONFIG.refreshIntervalMs) void this.refreshScores();
    });
  }

  private bindInteractions(): void {
    document.querySelectorAll<HTMLButtonElement>('.sport-filter').forEach(button => {
      button.addEventListener('click', () => {
        const sport = button.dataset.sport;
        if (sport === 'All' || isSupportedSport(sport)) {
          this.state.selectedSport = sport as SportFilter;
          this.state.visibleEventLimit = APP_CONFIG.eventPageSize;
          this.render();
        }
      });
    });
    this.elements.liveToggle.addEventListener('change', () => {
      this.state.liveOnly = this.elements.liveToggle.checked;
      this.render();
    });
    document.getElementById('liveOnlyButton')?.addEventListener('click', () => this.changeView('live'));
    document.getElementById('upcomingButton')?.addEventListener('click', () => this.changeView('upcoming'));
    document.getElementById('heroLiveButton')?.addEventListener('click', () => this.changeView('live'));
    document.getElementById('heroUpcomingButton')?.addEventListener('click', () => this.changeView('upcoming'));
    document.getElementById('howItWorksButton')?.addEventListener('click', () => this.tour.start());
    document.getElementById('sidebarDemoButton')?.addEventListener('click', () => this.tour.start());
    document.getElementById('clearFilterButton')?.addEventListener('click', () => {
      this.state.selectedSport = 'All';
      this.state.liveOnly = false;
      this.changeView('sports');
    });
    this.elements.refreshScores.addEventListener('click', () => void this.refreshScores(true));

    document.querySelectorAll<HTMLButtonElement>('[data-schedule]').forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.schedule as ScheduleFilter | undefined;
        if (!filter || !['all', 'today', 'tomorrow', 'later'].includes(filter)) return;
        this.state.scheduleFilter = filter;
        this.state.visibleEventLimit = APP_CONFIG.eventPageSize;
        this.render();
      });
    });
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => {
      button.addEventListener('click', () => {
        const view = button.dataset.view as ViewMode | undefined;
        if (!view || !VIEW_MODES.includes(view)) return;
        if (view === 'admin' && !currentAdmin(this.state)) {
          this.openAuth('login', 'admin');
          return;
        }
        this.changeView(view);
      });
    });
    document.getElementById('backToSports')?.addEventListener('click', () => this.changeView('sports'));

    document.querySelectorAll<HTMLButtonElement>('[data-stake-add]').forEach(button => {
      button.addEventListener('click', () => {
        const balance = currentBalance(this.state);
        this.elements.stake.value = String(normalizeStake(Number(this.elements.stake.value || 0) + Number(button.dataset.stakeAdd || 0), balance));
        renderPredictionSlip(this.elements, this.state);
      });
    });
    document.querySelector<HTMLButtonElement>('[data-stake-max]')?.addEventListener('click', () => {
      const balance = currentBalance(this.state);
      this.elements.stake.value = String(normalizeStake(balance, balance));
      renderPredictionSlip(this.elements, this.state);
    });
    this.elements.stake.addEventListener('input', () => renderPredictionSlip(this.elements, this.state));
    this.elements.placePrediction.addEventListener('click', () => this.placePrediction());
    this.elements.clearSlip.addEventListener('click', () => {
      this.state.selections = [];
      this.render();
    });
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.tab === 'open' && !currentUser(this.state)) {
          this.openAuth('login', 'user');
          return;
        }
        this.selectPredictionTab(button);
      });
    });

    this.elements.eventList.addEventListener('click', event => this.handleEventBoardClick(event));
    this.elements.eventList.addEventListener('error', event => {
      const logo = (event.target as Element).closest<HTMLImageElement>('[data-team-logo]');
      if (logo) logo.hidden = true;
    }, true);
    this.elements.slipItems.addEventListener('click', event => this.handleSlipClick(event));
    this.elements.adminList.addEventListener('click', event => this.handleAdminClick(event));
    this.elements.marketControls.addEventListener('click', event => this.handleMarketClick(event));
    this.elements.linkedUserList.addEventListener('click', event => this.handleLinkedUserClick(event));
    this.elements.topUpRequestList.addEventListener('click', event => this.handleTopUpAdminClick(event));

    this.bindAuthAndProfile();
    this.bindWalletDialogs();
    this.bindAdminDialog();
  }

  private bindAuthAndProfile(): void {
    this.elements.loginButton.addEventListener('click', () => this.openAuth('login', 'user'));
    this.elements.registerButton.addEventListener('click', () => this.openAuth('register', 'user'));
    this.elements.accountButton.addEventListener('click', () => this.openProfile());
    this.elements.closeAuthDialog.addEventListener('click', () => this.elements.authDialog.close());
    document.querySelectorAll<HTMLButtonElement>('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => this.setAuthMode(button.dataset.authMode === 'register' ? 'register' : 'login'));
    });
    this.elements.loginForm.addEventListener('submit', event => void this.login(event));
    this.elements.registerForm.addEventListener('submit', event => void this.register(event));
    document.getElementById('closeProfileDialog')?.addEventListener('click', () => this.elements.profileDialog.close());
    this.elements.logoutButton.addEventListener('click', () => this.logout());
    this.elements.addCoinsButton.addEventListener('click', () => this.openTopUpDialog());
  }

  private bindWalletDialogs(): void {
    document.getElementById('closeTopUpDialog')?.addEventListener('click', () => this.elements.topUpDialog.close());
    document.getElementById('finishTopUpPreview')?.addEventListener('click', () => this.elements.topUpDialog.close());
    this.elements.topUpSxcAmount.addEventListener('input', () => this.renderTopUpConversion());
    this.elements.topUpForm.addEventListener('submit', event => void this.createTopUp(event));
    document.getElementById('closeWalletAdjustmentDialog')?.addEventListener('click', () => this.elements.walletAdjustmentDialog.close());
    this.elements.walletAdjustmentForm.addEventListener('submit', event => this.adjustWallet(event));
    this.elements.copyAdminId.addEventListener('click', () => void this.copyAdminPublicId());
  }

  private bindAdminDialog(): void {
    document.getElementById('newAdminButton')?.addEventListener('click', () => {
      if (currentAdmin(this.state)?.role !== 'SUPER_ADMIN') return;
      this.clearAdminError();
      this.elements.adminDialog.showModal();
      this.elements.adminName.focus();
    });
    document.getElementById('closeAdminDialog')?.addEventListener('click', () => {
      this.elements.adminDialog.close();
      this.elements.adminForm.reset();
      this.clearAdminError();
    });
    this.elements.adminForm.addEventListener('submit', event => this.createAdminAccount(event));
  }

  private async refreshScores(manual = false): Promise<void> {
    if (this.state.feed.refreshing) return;
    const remaining = refreshCooldownRemainingMs(this.state.feed.lastRequestAt, APP_CONFIG.minimumRequestIntervalMs);
    if (remaining > 0) {
      if (manual) this.showToast(`SportScore refresh available in ${Math.ceil(remaining / 1000)} seconds`);
      return;
    }
    this.state.feed.lastRequestAt = new Date();
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
        this.state.events = applyMarketSuspensions(sortEvents([...result.events, ...retainedEvents]), this.state.suspendedEventIds);
        this.state.feed.lastUpdatedAt = result.updatedAt;
        if (result.updatedAt) this.storage.saveLiveCache({updated: result.updatedAt.toISOString(), events: this.state.events});
        this.state.feed.error = result.failedSports.length
          ? `${result.failedSports.length} sport feed${result.failedSports.length > 1 ? 's are' : ' is'} temporarily unavailable`
          : '';
        if (manual) this.showToast(result.failedSports.length ? 'Scores refreshed with partial coverage' : 'Live scores refreshed');
      } else {
        this.state.feed.error = this.state.events.length ? 'Refresh failed — showing the last real SportScore update' : 'Live scores are temporarily unavailable';
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
    if (target.dataset.action === 'retry-feed') return void this.refreshScores(true);
    if (target.dataset.action === 'load-more') {
      this.state.visibleEventLimit += APP_CONFIG.eventPageSize;
      this.render();
      return;
    }
    if (target.dataset.action !== 'select-pick') return;
    if (!currentUser(this.state)) {
      this.openAuth('login', 'user');
      return;
    }
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
    const signedInAdmin = currentAdmin(this.state);
    if (signedInAdmin?.role !== 'SUPER_ADMIN') return;
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
    const admin = currentAdmin(this.state);
    if (!admin) return;
    const target = (event.target as Element).closest<HTMLElement>('[data-action="toggle-market"]');
    const eventId = target?.dataset.eventId;
    const current = this.state.events.find(item => item.id === eventId);
    if (!eventId || !current || current.status === 'finished') return;
    this.state.events = toggleMarket(this.state.events, eventId);
    this.state.suspendedEventIds = suspendedEventIds(this.state.events);
    this.state.audit.unshift(auditEntry(`${admin.publicId} ${current.suspended ? 'resumed' : 'suspended'} SXC market: ${current.home} v ${current.away}`));
    this.persistSession();
    this.showToast(current.suspended ? 'Market resumed' : 'Market suspended');
    this.render();
  }

  private handleLinkedUserClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action="adjust-wallet"]');
    if (target?.dataset.userId) this.openWalletAdjustment(target.dataset.userId);
  }

  private handleTopUpAdminClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>('[data-action]');
    const requestId = target?.dataset.requestId;
    if (!target || !requestId) return;
    const request = this.state.topUpRequests.find(item => item.id === requestId && item.status === 'pending');
    const admin = currentAdmin(this.state);
    if (!request || !admin || (admin.role !== 'SUPER_ADMIN' && request.adminPublicId !== admin.publicId)) return;
    if (target.dataset.action === 'credit-topup') this.openWalletAdjustment(request.userId, request.id);
    if (target.dataset.action === 'decline-topup') {
      this.state.topUpRequests = resolveTopUpRequest(this.state.topUpRequests, request.id, 'declined');
      this.state.audit.unshift(auditEntry(`${admin.publicId} declined top-up ${request.id}`));
      this.persistSession();
      this.showToast('Top-up request declined');
      this.render();
    }
  }

  private async login(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const kind = this.elements.loginKind.value as AccountKind;
    const session = await authenticate(kind, this.elements.loginEmail.value, this.elements.loginPassword.value, this.state.users, this.state.admins);
    if (!session) {
      this.showFormError(this.elements.loginError, 'Email, password or account type is incorrect.');
      return;
    }
    this.state.authSession = session;
    if (session.kind === 'admin') {
      this.state.admins = this.state.admins.map(admin => String(admin.id) === session.accountId ? {...admin, lastLogin: 'Just now'} : admin);
      const admin = currentAdmin(this.state);
      if (admin) this.state.audit.unshift(auditEntry(`${admin.publicId} signed in`));
    }
    this.elements.authDialog.close();
    this.elements.loginForm.reset();
    this.clearFormError(this.elements.loginError);
    this.persistSession();
    this.changeView(session.kind === 'admin' ? 'admin' : 'sports');
    this.showToast(`Logged in as ${session.kind}`);
  }

  private async register(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = this.elements.registerName.value.trim();
    const email = this.elements.registerEmail.value.trim().toLowerCase();
    const password = this.elements.registerPassword.value;
    const adminId = this.elements.registerAdminId.value;
    const error = registrationValidationError(name, email, password, adminId, this.state.users, this.state.admins);
    if (error) {
      this.showFormError(this.elements.registerError, error);
      return;
    }
    const user = await createClientUser(name, email, password, adminId);
    this.state.users.push(user);
    this.state.wallets.push({userId: user.id, balance: 0});
    this.state.authSession = {kind: 'user', accountId: user.id};
    this.state.audit.unshift(auditEntry(`User registered under ${user.adminPublicId}: ${user.email}`));
    this.elements.authDialog.close();
    this.elements.registerForm.reset();
    this.clearFormError(this.elements.registerError);
    this.persistSession();
    this.changeView('sports');
    this.showToast('Account created and linked to admin');
  }

  private logout(): void {
    this.state.authSession = null;
    this.state.selections = [];
    this.elements.profileDialog.close();
    this.persistSession();
    this.changeView('sports');
    this.showToast('Logged out');
  }

  private placePrediction(): void {
    const user = currentUser(this.state);
    if (!user) {
      this.openAuth('login', 'user');
      return;
    }
    const balance = currentBalance(this.state);
    const stake = normalizeStake(Number(this.elements.stake.value), balance);
    if (!this.state.selections.length || stake < 100 || stake > balance) return;
    const walletChange = applyWalletChange(this.state.wallets, user.id, -stake, 'SYSTEM', 'prediction_stake', `Prediction stake · ${this.state.selections[0]?.match ?? 'ScoreX pick'}`);
    if (!walletChange) return;
    this.elements.stake.value = String(stake);
    this.state.wallets = walletChange.wallets;
    this.state.walletTransactions.unshift(walletChange.transaction);
    this.state.predictions.unshift(createOpenPrediction(this.state.selections, stake, user.id));
    this.state.audit.unshift(auditEntry(`${user.email} placed a ${this.state.selections.length}-selection SXC prediction`));
    this.state.selections = [];
    this.persistSession();
    this.showToast('SXC prediction accepted');
    const openTab = document.querySelector<HTMLButtonElement>('[data-tab="open"]');
    if (openTab) this.selectPredictionTab(openTab);
    this.render();
  }

  private openAuth(mode: 'login' | 'register', kind: AccountKind): void {
    this.setAuthMode(mode);
    this.elements.loginKind.value = kind;
    if (!this.elements.authDialog.open) this.elements.authDialog.showModal();
    window.setTimeout(() => mode === 'login' ? this.elements.loginEmail.focus() : this.elements.registerName.focus(), 0);
  }

  private setAuthMode(mode: 'login' | 'register'): void {
    const login = mode === 'login';
    this.elements.loginForm.classList.toggle('hidden', !login);
    this.elements.registerForm.classList.toggle('hidden', login);
    document.querySelectorAll<HTMLButtonElement>('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    this.clearFormError(this.elements.loginError);
    this.clearFormError(this.elements.registerError);
  }

  private openProfile(): void {
    if (!currentUser(this.state) && !currentAdmin(this.state)) {
      this.openAuth('login', 'user');
      return;
    }
    this.render();
    if (!this.elements.profileDialog.open) this.elements.profileDialog.showModal();
  }

  private openTopUpDialog(): void {
    if (!currentUser(this.state)) return this.openAuth('login', 'user');
    this.elements.topUpForm.classList.remove('hidden');
    this.elements.topUpPreview.classList.add('hidden');
    this.elements.topUpSxcAmount.value = '1000';
    this.renderTopUpConversion();
    if (!this.elements.topUpDialog.open) this.elements.topUpDialog.showModal();
  }

  private renderTopUpConversion(): void {
    const sxc = Number(this.elements.topUpSxcAmount.value || 0);
    this.elements.topUpPaymentAmount.textContent = `₹${(sxc / APP_CONFIG.sxcPerRupee).toFixed(2)}`;
  }

  private async createTopUp(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const user = currentUser(this.state);
    const admin = user ? this.state.admins.find(item => item.publicId === user.adminPublicId && item.active) : null;
    if (!user || !admin) {
      this.showToast('Linked admin is unavailable');
      return;
    }
    const request = createTopUpRequest(user, admin, Number(this.elements.topUpSxcAmount.value));
    if (!request) {
      this.showToast('Enter at least 500 SXC in increments of 100');
      return;
    }
    this.state.topUpRequests.push(request);
    this.persistSession();
    this.elements.topUpQrImage.src = await createTopUpQrDataUrl(request, admin);
    this.elements.topUpPreviewAmount.textContent = `₹${request.paymentAmount.toFixed(2)} · ${request.sxcAmount.toLocaleString()} SXC`;
    this.elements.topUpUpiId.textContent = request.upiId;
    this.elements.topUpRequestId.textContent = `Request ${request.id}`;
    this.elements.topUpForm.classList.add('hidden');
    this.elements.topUpPreview.classList.remove('hidden');
    this.showToast('Top-up request sent to linked admin');
  }

  private openWalletAdjustment(userId: string, requestId = ''): void {
    const admin = currentAdmin(this.state);
    const user = this.state.users.find(item => item.id === userId);
    if (!admin || !user || !usersForAdmin(this.state, admin).some(item => item.id === userId)) return;
    const request = requestId ? this.state.topUpRequests.find(item => item.id === requestId && item.status === 'pending') : null;
    this.elements.walletAdjustmentUser.textContent = `Adjust ${user.name}'s wallet`;
    this.elements.walletAdjustmentUserId.value = user.id;
    this.elements.walletAdjustmentRequestId.value = request?.id ?? '';
    this.elements.walletAdjustmentType.value = 'credit';
    this.elements.walletAdjustmentAmount.value = request ? String(request.sxcAmount) : '1000';
    this.elements.walletAdjustmentNote.value = request ? `Payment confirmed · ${request.id}` : '';
    this.clearFormError(this.elements.walletAdjustmentError);
    if (!this.elements.walletAdjustmentDialog.open) this.elements.walletAdjustmentDialog.showModal();
  }

  private adjustWallet(event: SubmitEvent): void {
    event.preventDefault();
    const admin = currentAdmin(this.state);
    const userId = this.elements.walletAdjustmentUserId.value;
    if (!admin || !usersForAdmin(this.state, admin).some(user => user.id === userId)) return;
    const amountInput = Math.floor(Number(this.elements.walletAdjustmentAmount.value));
    const credit = this.elements.walletAdjustmentType.value === 'credit';
    const amount = credit ? amountInput : -amountInput;
    const result = applyWalletChange(this.state.wallets, userId, amount, admin.publicId, credit ? 'admin_credit' : 'admin_debit', this.elements.walletAdjustmentNote.value);
    if (!result) {
      this.showFormError(this.elements.walletAdjustmentError, 'Enter a valid amount. A wallet balance cannot become negative.');
      return;
    }
    this.state.wallets = result.wallets;
    this.state.walletTransactions.unshift(result.transaction);
    const requestId = this.elements.walletAdjustmentRequestId.value;
    if (requestId && credit) this.state.topUpRequests = resolveTopUpRequest(this.state.topUpRequests, requestId, 'credited');
    this.state.audit.unshift(auditEntry(`${admin.publicId} ${credit ? 'credited' : 'debited'} ${Math.abs(amount).toLocaleString()} SXC for user ${userId}`));
    this.persistSession();
    this.elements.walletAdjustmentDialog.close();
    this.showToast(`Wallet ${credit ? 'credited' : 'debited'}`);
    this.render();
  }

  private createAdminAccount(event: SubmitEvent): void {
    event.preventDefault();
    if (currentAdmin(this.state)?.role !== 'SUPER_ADMIN') return;
    const name = this.elements.adminName.value.trim();
    const email = this.elements.adminEmail.value.trim().toLowerCase();
    const role = this.elements.adminRole.value as AdminRole;
    if (!ADMIN_ROLES.includes(role)) return;
    const validationError = adminValidationError(name, email, role, this.state.admins);
    if (validationError) {
      this.showFormError(this.elements.adminFormError, validationError);
      return;
    }
    const admin = createAdmin(name, email, role);
    this.state.admins.push(admin);
    this.state.audit.unshift(auditEntry(`Created ${admin.role} account ${admin.email} · ${admin.publicId}`));
    this.persistSession();
    this.elements.adminDialog.close();
    this.elements.adminForm.reset();
    this.clearAdminError();
    this.showToast(`Admin created · temporary password ScoreX@2026`);
    this.render();
  }

  private async copyAdminPublicId(): Promise<void> {
    const admin = currentAdmin(this.state);
    if (!admin) return;
    try {
      await navigator.clipboard.writeText(admin.publicId);
      this.showToast('Admin ID copied');
    } catch {
      this.showToast(`Admin ID: ${admin.publicId}`);
    }
  }

  private changeView(viewMode: ViewMode): void {
    if (viewMode === 'admin' && !currentAdmin(this.state)) {
      this.openAuth('login', 'admin');
      return;
    }
    this.state.viewMode = viewMode;
    this.state.liveOnly = false;
    this.state.visibleEventLimit = APP_CONFIG.eventPageSize;
    this.render();
  }

  private selectPredictionTab(selected: HTMLButtonElement): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach(button => button.classList.toggle('active', button === selected));
    const showSlip = selected.dataset.tab === 'slip';
    this.elements.slipPanel.classList.toggle('hidden', !showSlip);
    this.elements.openPanel.classList.toggle('hidden', showSlip);
  }

  private persistSession(): void {
    const session: PersistedSession = {
      authSession: this.state.authSession,
      users: this.state.users,
      wallets: this.state.wallets,
      walletTransactions: this.state.walletTransactions,
      predictions: this.state.predictions,
      topUpRequests: this.state.topUpRequests,
      admins: this.state.admins,
      audit: this.state.audit,
      suspendedEventIds: this.state.suspendedEventIds
    };
    this.storage.saveSession(session);
  }

  private showToast(message: string): void {
    this.elements.toast.textContent = `✓ ${message}`;
    this.elements.toast.classList.remove('hidden');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.elements.toast.classList.add('hidden'), 2600);
  }

  private showFormError(element: HTMLElement, message: string): void {
    element.textContent = message;
    element.classList.remove('hidden');
  }

  private clearFormError(element: HTMLElement): void {
    element.textContent = '';
    element.classList.add('hidden');
  }

  private clearAdminError(): void {
    this.clearFormError(this.elements.adminFormError);
  }

  private render(): void {
    renderFeed(this.elements, this.state);
    renderHero(this.elements, this.state);
    renderEvents(this.elements, this.state);
    renderSportFilters(this.state);
    renderAccount(this.elements, this.state);
    renderPredictionSlip(this.elements, this.state);
    renderOpenPredictions(this.elements, this.state);
    renderAdmin(this.elements, this.state);
    renderNavigation(this.elements, this.state);
  }
}
