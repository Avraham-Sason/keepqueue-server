import { jsonFailed, jsonOK } from "../../../helpers";
import { CalendarEvent, RouterService } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getServiceById, hasCalendarOverlapInCache, parseTs } from "./helpers";
import { CreateAppointmentModel } from "./schemes";

export const SCreateAppointment: RouterService = async (req, res, next) => {
    try {
        const { businessId, userId, serviceId, start, end, source, notes, type } = req.body as CreateAppointmentModel;

        const service = type === "APPOINTMENT" ? getServiceById(serviceId) : null;
        if (type === "APPOINTMENT" && !service) {
            res.json(jsonFailed("Service not found"));
            return;
        }

        const startTs = parseTs(start);
        const endTs = parseTs(end);

        const resultId = await db.runTransaction(async (tx) => {
            const calendarRef = db.collection("calendar");
            const hasOverlap = hasCalendarOverlapInCache(businessId, startTs, endTs);
            if (hasOverlap) {
                res.json(jsonFailed("Slot already booked"));
                return;
            }

            const newRef = calendarRef.doc();
            const eventDoc: CalendarEvent = {
                id: newRef.id,
                businessId,
                userId,
                serviceId: service ? service.id : undefined,
                type,
                status: "BOOKED",
                title: service?.name || type || "Event",
                start: startTs,
                end: endTs,
                source: source || "web",
                notes: notes || undefined,
                created: firebaseTimestamp(),
                timestamp: firebaseTimestamp(),
            };
            tx.set(newRef, eventDoc);
            return newRef.id;
        });

        res.json(jsonOK({ calendarEventId: resultId }));
    } catch (error: any) {
        next(error);
    }
};

export const SConfirmAppointment: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId } = req.body as any;
        const calendarRef = db.collection("calendar").doc(calendarEventId);
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw new Error("Appointment not found");
            const data: any = snap.data();
            if (data.status === "CANCELLED") throw new Error("Cannot confirm a cancelled appointment");
            tx.update(calendarRef, { status: "CONFIRMED", timestamp: firebaseTimestamp() });
        });
        res.json(jsonOK({ calendarEventId }));
    } catch (error) {
        next(error);
    }
};

export const SCancelAppointment: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId, reason } = req.body as any;
        const calendarRef = db.collection("calendar").doc(calendarEventId);
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw new Error("Appointment not found");
            const data: any = snap.data();
            if (data.status === "CANCELLED") return; // idempotent
            tx.update(calendarRef, { status: "CANCELLED", notes: reason || data.notes, timestamp: firebaseTimestamp() });
        });
        res.json(jsonOK({ calendarEventId }));
    } catch (error) {
        next(error);
    }
};
