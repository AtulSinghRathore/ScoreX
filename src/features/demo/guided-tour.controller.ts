import type {AppElements} from '../../ui/elements';

interface TourStep {
  title: string;
  body: string;
  selectors: readonly string[];
}

const STEPS: readonly TourStep[] = [
  {
    title: 'Start with the schedule',
    body: 'Open Upcoming to browse matches grouped by date. Every kick-off or start time is shown in your local timezone.',
    selectors: ['[data-tour="upcoming-nav"]', '#heroUpcomingButton', '#upcomingButton']
  },
  {
    title: 'Choose a virtual outcome',
    body: 'Select any available SXC multiplier. These numbers are generated for the virtual demo and are not bookmaker odds.',
    selectors: ['[data-tour="price"]:not(:disabled)', '[data-tour="event-board"]']
  },
  {
    title: 'Set your SXC stake',
    body: 'Enter an SXC stake or use the quick-add buttons. Your demo balance is stored locally in this browser.',
    selectors: ['[data-tour="stake-box"]']
  },
  {
    title: 'Review, then place',
    body: 'Check your selections, combined multiplier and potential virtual return. The button activates after a valid pick and stake.',
    selectors: ['[data-tour="place-button"]']
  },
  {
    title: 'Follow your prediction',
    body: 'Placed virtual predictions appear under Open predictions. No deposit, payment or withdrawal is involved.',
    selectors: ['[data-tab="open"]']
  }
];

export class GuidedTourController {
  private stepIndex = 0;
  private target: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor(
    private readonly elements: AppElements,
    private readonly prepare: () => void
  ) {}

  bind(): void {
    this.elements.tourNext.addEventListener('click', () => this.next());
    this.elements.tourBack.addEventListener('click', () => this.back());
    this.elements.tourClose.addEventListener('click', () => this.close());
    window.addEventListener('resize', () => this.position());
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !this.elements.tourLayer.classList.contains('hidden')) this.close();
    });
  }

  start(): void {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.prepare();
    this.stepIndex = 0;
    this.elements.tourLayer.classList.remove('hidden');
    this.elements.tourLayer.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
      this.showStep();
      this.elements.tourNext.focus();
    });
  }

  close(): void {
    this.target?.classList.remove('tour-target');
    this.target = null;
    this.elements.tourLayer.classList.add('hidden');
    this.elements.tourLayer.setAttribute('aria-hidden', 'true');
    this.previousFocus?.focus();
  }

  private next(): void {
    if (this.stepIndex >= STEPS.length - 1) {
      this.close();
      return;
    }
    this.stepIndex += 1;
    this.showStep();
  }

  private back(): void {
    if (this.stepIndex === 0) return;
    this.stepIndex -= 1;
    this.showStep();
  }

  private showStep(): void {
    const step = STEPS[this.stepIndex];
    if (!step) return;
    this.target?.classList.remove('tour-target');
    this.target = this.findVisibleTarget(step.selectors);
    this.target?.classList.add('tour-target');
    this.target?.scrollIntoView({behavior: 'smooth', block: 'center'});
    this.elements.tourProgress.textContent = `Step ${this.stepIndex + 1} of ${STEPS.length}`;
    this.elements.tourTitle.textContent = step.title;
    this.elements.tourBody.textContent = step.body;
    this.elements.tourBack.disabled = this.stepIndex === 0;
    this.elements.tourNext.textContent = this.stepIndex === STEPS.length - 1 ? 'Finish' : 'Next';
    window.setTimeout(() => this.position(), 220);
  }

  private findVisibleTarget(selectors: readonly string[]): HTMLElement | null {
    for (const selector of selectors) {
      const target = [...document.querySelectorAll<HTMLElement>(selector)]
        .find(element => element.getClientRects().length > 0);
      if (target) return target;
    }
    return null;
  }

  private position(): void {
    const card = this.elements.tourCard;
    const targetRect = this.target?.getBoundingClientRect();
    const gap = 14;
    const cardWidth = Math.min(360, window.innerWidth - 24);
    card.style.width = `${cardWidth}px`;
    if (!targetRect) {
      card.style.left = `${Math.max(12, (window.innerWidth - cardWidth) / 2)}px`;
      card.style.top = `${Math.max(12, (window.innerHeight - card.offsetHeight) / 2)}px`;
      return;
    }
    const below = targetRect.bottom + gap;
    const top = below + card.offsetHeight <= window.innerHeight - 12
      ? below
      : Math.max(12, targetRect.top - card.offsetHeight - gap);
    const left = Math.min(
      window.innerWidth - cardWidth - 12,
      Math.max(12, targetRect.left + targetRect.width / 2 - cardWidth / 2)
    );
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }
}
