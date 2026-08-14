import type {ScheduleFilter, SportEvent} from './types';
import {formatClockTime, formatCompactDate, localDateKey} from '../shared/format';

export interface EventScheduleDetails {
  groupKey: string;
  groupLabel: string;
  primary: string;
  secondary: string;
  overdue: boolean;
}

function parsedStart(event: SportEvent): Date | null {
  const date = new Date(event.startTime);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tomorrowFrom(now: Date): Date {
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export function scheduleDetails(
  event: SportEvent,
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
): EventScheduleDetails {
  if (event.status === 'live') {
    return {
      groupKey: '0-live',
      groupLabel: 'Live now',
      primary: event.statusText || 'Live now',
      secondary: 'Score supplied by SportScore',
      overdue: false
    };
  }

  const date = parsedStart(event);
  if (!date) {
    return {
      groupKey: event.status === 'finished' ? '9-results' : '8-tbc',
      groupLabel: event.status === 'finished' ? 'Recent results' : 'Time to be confirmed',
      primary: 'Time TBC',
      secondary: event.statusText || 'Schedule pending',
      overdue: false
    };
  }

  if (event.status === 'finished') {
    return {
      groupKey: `9-results-${localDateKey(date, timeZone)}`,
      groupLabel: formatCompactDate(date, timeZone),
      primary: `${formatCompactDate(date, timeZone)} · ${formatClockTime(date, timeZone)}`,
      secondary: event.statusText || 'Final',
      overdue: false
    };
  }

  const todayKey = localDateKey(now, timeZone);
  const tomorrowKey = localDateKey(tomorrowFrom(now), timeZone);
  const eventKey = localDateKey(date, timeZone);
  const differenceMs = date.getTime() - now.getTime();
  const overdue = differenceMs < -5 * 60 * 1000;
  const clock = formatClockTime(date, timeZone);

  if (overdue) {
    return {
      groupKey: '1-delayed',
      groupLabel: 'Delayed or awaiting update',
      primary: `Delayed · scheduled ${formatCompactDate(date, timeZone)}, ${clock}`,
      secondary: event.statusText || 'Awaiting provider update',
      overdue: true
    };
  }

  if (eventKey === todayKey) {
    const minutes = Math.max(1, Math.ceil(differenceMs / 60_000));
    const countdown = minutes < 60
      ? `Starts in ${minutes} min`
      : `Starts in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return {
      groupKey: '2-today',
      groupLabel: 'Today',
      primary: `Today · ${clock}`,
      secondary: countdown,
      overdue: false
    };
  }

  if (eventKey === tomorrowKey) {
    return {
      groupKey: '3-tomorrow',
      groupLabel: 'Tomorrow',
      primary: `Tomorrow · ${clock}`,
      secondary: event.statusText || 'Scheduled',
      overdue: false
    };
  }

  return {
    groupKey: `4-${eventKey}`,
    groupLabel: formatCompactDate(date, timeZone),
    primary: `${formatCompactDate(date, timeZone)} · ${clock}`,
    secondary: event.statusText || 'Scheduled',
    overdue: false
  };
}

export function matchesScheduleFilter(
  event: SportEvent,
  filter: ScheduleFilter,
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
): boolean {
  if (filter === 'all') return true;
  const details = scheduleDetails(event, now, timeZone);
  if (filter === 'today') return details.groupKey === '2-today' || details.groupKey === '1-delayed';
  if (filter === 'tomorrow') return details.groupKey === '3-tomorrow';
  return details.groupKey.startsWith('4-') || details.groupKey === '8-tbc';
}
