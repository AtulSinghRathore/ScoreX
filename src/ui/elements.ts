export interface AppElements {
  sportsView: HTMLElement;
  adminView: HTMLElement;
  marketTitle: HTMLElement;
  scheduleFilters: HTMLElement;
  eventSummary: HTMLElement;
  eventList: HTMLElement;
  feedLabel: HTMLElement;
  feedMessage: HTMLElement;
  feedPulse: HTMLElement;
  lastUpdated: HTMLElement;
  refreshScores: HTMLButtonElement;
  heroMatchType: HTMLElement;
  heroHome: HTMLElement;
  heroHomeScore: HTMLElement;
  heroAway: HTMLElement;
  heroAwayScore: HTMLElement;
  heroStatus: HTMLElement;
  liveToggle: HTMLInputElement;
  balance: HTMLElement;
  stake: HTMLInputElement;
  slipCount: HTMLElement;
  potentialReturn: HTMLElement;
  combinedMultiplier: HTMLElement;
  stakeHelp: HTMLElement;
  emptySlip: HTMLElement;
  slipItems: HTMLElement;
  placePrediction: HTMLButtonElement;
  clearSlip: HTMLButtonElement;
  openCount: HTMLElement;
  openPredictions: HTMLElement;
  slipPanel: HTMLElement;
  openPanel: HTMLElement;
  adminList: HTMLElement;
  auditLog: HTMLElement;
  marketControls: HTMLElement;
  liveCount: HTMLElement;
  activeMarketCount: HTMLElement;
  suspendedCount: HTMLElement;
  adminCount: HTMLElement;
  adminDialog: HTMLDialogElement;
  adminForm: HTMLFormElement;
  adminName: HTMLInputElement;
  adminEmail: HTMLInputElement;
  adminRole: HTMLSelectElement;
  adminFormError: HTMLElement;
  tourLayer: HTMLElement;
  tourCard: HTMLElement;
  tourProgress: HTMLElement;
  tourTitle: HTMLElement;
  tourBody: HTMLElement;
  tourBack: HTMLButtonElement;
  tourNext: HTMLButtonElement;
  tourClose: HTMLButtonElement;
  toast: HTMLElement;
}

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required element #${id} was not found`);
  return element as T;
}

export function getAppElements(): AppElements {
  return {
    sportsView: required('sports'),
    adminView: required('admin'),
    marketTitle: required('marketTitle'),
    scheduleFilters: required('scheduleFilters'),
    eventSummary: required('eventSummary'),
    eventList: required('eventList'),
    feedLabel: required('feedLabel'),
    feedMessage: required('feedMessage'),
    feedPulse: required('feedPulse'),
    lastUpdated: required('lastUpdated'),
    refreshScores: required<HTMLButtonElement>('refreshScores'),
    heroMatchType: required('heroMatchType'),
    heroHome: required('heroHome'),
    heroHomeScore: required('heroHomeScore'),
    heroAway: required('heroAway'),
    heroAwayScore: required('heroAwayScore'),
    heroStatus: required('heroStatus'),
    liveToggle: required<HTMLInputElement>('liveToggle'),
    balance: required('balance'),
    stake: required<HTMLInputElement>('stake'),
    slipCount: required('slipCount'),
    potentialReturn: required('potentialReturn'),
    combinedMultiplier: required('combinedMultiplier'),
    stakeHelp: required('stakeHelp'),
    emptySlip: required('emptySlip'),
    slipItems: required('slipItems'),
    placePrediction: required<HTMLButtonElement>('placePrediction'),
    clearSlip: required<HTMLButtonElement>('clearSlip'),
    openCount: required('openCount'),
    openPredictions: required('openPredictions'),
    slipPanel: required('slipPanel'),
    openPanel: required('openPanel'),
    adminList: required('adminList'),
    auditLog: required('auditLog'),
    marketControls: required('marketControls'),
    liveCount: required('liveCount'),
    activeMarketCount: required('activeMarketCount'),
    suspendedCount: required('suspendedCount'),
    adminCount: required('adminCount'),
    adminDialog: required<HTMLDialogElement>('adminDialog'),
    adminForm: required<HTMLFormElement>('adminForm'),
    adminName: required<HTMLInputElement>('adminName'),
    adminEmail: required<HTMLInputElement>('adminEmail'),
    adminRole: required<HTMLSelectElement>('adminRole'),
    adminFormError: required('adminFormError'),
    tourLayer: required('tourLayer'),
    tourCard: required('tourCard'),
    tourProgress: required('tourProgress'),
    tourTitle: required('tourTitle'),
    tourBody: required('tourBody'),
    tourBack: required<HTMLButtonElement>('tourBack'),
    tourNext: required<HTMLButtonElement>('tourNext'),
    tourClose: required<HTMLButtonElement>('tourClose'),
    toast: required('toast')
  };
}
