import { Timestamp } from "firebase-admin/firestore";
import { cacheManager } from "../../../managers";
import { AvailabilitySlot, Business, CalendarEvent, OperationSchedule, TS } from "../../../types";

export const parseTs = (value: number): Timestamp => {
    return Timestamp.fromMillis(value);
};

export const getServiceById = (serviceId?: string) => {
    if (!serviceId) return null;
    const servicesMap = cacheManager.get("servicesMap", new Map());
    return servicesMap.get(serviceId) || null;
};

export const isOverlap = (startA: Timestamp, endA: Timestamp, startB: Timestamp, endB: Timestamp): boolean => {
    return endA.toMillis() > startB.toMillis() && startA.toMillis() < endB.toMillis();
};

export const hasCalendarOverlapInCache = (businessId: string, start: Timestamp, end: Timestamp): boolean => {
    const calendarEvents = cacheManager.get("calendar", []) 
    return calendarEvents.some((event) => {
        if (event.businessId !== businessId) return false;
        if (["CANCELLED", "DONE", "NO_SHOW"].includes(event.status)) return false;
        return isOverlap(event.start, event.end, start, end);
    });
};

const MINUTE_MS = 60 * 1000;

const toMidnight = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const makeTs = (ms: number): TS => Timestamp.fromMillis(ms);

const subtractBusyFromInterval = (
    freeStart: number,
    freeEnd: number,
    busyIntervals: { start: number; end: number }[],
): { start: number; end: number }[] => {
    if (freeEnd <= freeStart) return [];
    if (busyIntervals.length === 0) return [{ start: freeStart, end: freeEnd }];

    const busySorted = [...busyIntervals]
        .filter((b) => b.end > freeStart && b.start < freeEnd)
        .sort((a, b) => a.start - b.start);

    const result: { start: number; end: number }[] = [];
    let cursor = freeStart;

    for (const b of busySorted) {
        if (b.start > cursor) {
            result.push({ start: cursor, end: Math.min(b.start, freeEnd) });
        }
        if (b.end > cursor) {
            cursor = Math.max(cursor, b.end);
        }
        if (cursor >= freeEnd) break;
    }

    if (cursor < freeEnd) {
        result.push({ start: cursor, end: freeEnd });
    }
    return result.filter((i) => i.end > i.start);
};

const getBlockingEventsForDay = (businessId: string, dayStartMs: number, dayEndMs: number): { start: number; end: number }[] => {
    const events: CalendarEvent[] = cacheManager.get("calendar", []);
    return events
        .filter((e) => {
            if (e.businessId !== businessId) return false;
            if (["CANCELLED", "DONE", "NO_SHOW"].includes(e.status)) return false;
            const s = e.start.toMillis();
            const en = e.end.toMillis();
            return en > dayStartMs && s < dayEndMs;
        })
        .map((e) => ({ start: e.start.toMillis(), end: e.end.toMillis() }));
};

const buildDailyFreeIntervals = (
    dayMidnight: Date,
    operationSchedule: OperationSchedule[],
): { start: number; end: number }[] => {
    const weekday = dayMidnight.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dayRules = operationSchedule.find((r) => r.day === weekday);
    if (!dayRules || !dayRules.intervals || dayRules.intervals.length === 0) return [];

    const baseMs = dayMidnight.getTime();
    return dayRules.intervals
        .filter((tr) => tr.endMin > tr.startMin)
        .map((tr) => ({ start: baseMs + tr.startMin * MINUTE_MS, end: baseMs + tr.endMin * MINUTE_MS }));
};

export const computeBusinessAvailability = (
    business: Business,
    operationSchedule: OperationSchedule[],
    fromTs?: TS,
    toTs?: TS,
): AvailabilitySlot[] => {
    const now = new Date();
    const fromDate = fromTs ? new Date(fromTs.toMillis()) : now;
    const toDate = toTs ? new Date(toTs.toMillis()) : addDays(now, 90);

    let cursor = toMidnight(fromDate);
    const endDate = toMidnight(toDate);

    const availability: AvailabilitySlot[] = [];
    while (cursor.getTime() <= endDate.getTime()) {
        const dayStartMs = cursor.getTime();
        const dayEndMs = dayStartMs + 24 * 60 * MINUTE_MS;
        const dailyFree = buildDailyFreeIntervals(cursor, operationSchedule);
        if (dailyFree.length > 0) {
            const busy = getBlockingEventsForDay(business.id!, dayStartMs, dayEndMs);
            for (const free of dailyFree) {
                const remaining = subtractBusyFromInterval(free.start, free.end, busy);
                for (const r of remaining) {
                    availability.push({ start: makeTs(r.start), end: makeTs(r.end) });
                }
            }
        }
        cursor = addDays(cursor, 1);
    }

    return availability;
};
