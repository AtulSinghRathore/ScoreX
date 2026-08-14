export interface AppElements {
  sportsView: HTMLElement;
  adminView: HTMLElement;
  marketTitle: HTMLElement;
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
  emptySlip: HTMLElement;
  slipItems: HTMLElement;
  placePrediction: HTMLButtonElement;
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
  adminDialog: HTMLDialogElement;
  adminForm: HTMLFormElement;
  adminName: HTMLInputElement;
  adminEmail: HTMLInputElement;
  adminRole: HTMLSelectElement;
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
    emptySlip: required('emptySlip'),
    slipItems: required('slipItems'),
    placePrediction: required<HTMLButtonElement>('placePrediction'),
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
    adminDialog: required<HTMLDialogElement>('adminDialog'),
    adminForm: required<HTMLFormElement>('adminForm'),
    adminName: required<HTMLInputElement>('adminName'),
    adminEmail: required<HTMLInputElement>('adminEmail'),
    adminRole: required<HTMLSelectElement>('adminRole'),
    toast: required('toast')
  };
}
