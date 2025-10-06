import { Timestamp } from "firebase-admin/firestore";
import { cacheManager } from "../../../managers";
import { CalendarEvent } from "../../../types";

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
