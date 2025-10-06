import { z } from "zod";

const { object, string, number, enum: zenum } = z as unknown as typeof z & { enum: any };

export const createAppointmentSchema = object({
    businessId: string().min(1),
    userId: string().min(1),
    start: z.union([number().int().positive()]),
    end: z.union([number().int().positive()]),
    source: zenum(["web", "admin", "import"]),
    type: zenum(["VACATION", "HOLIDAY", "OTHER", "APPOINTMENT"]),
    serviceId: string().min(1).optional(),
    notes: string().max(2000).optional(),
});

export type CreateAppointmentModel = z.infer<typeof createAppointmentSchema>;

export const confirmAppointmentSchema = object({
    calendarEventId: string().min(1),
});

export type ConfirmAppointmentModel = z.infer<typeof confirmAppointmentSchema>;

export const cancelAppointmentSchema = object({
    calendarEventId: string().min(1),
    reason: string().max(1000).optional(),
});

export type CancelAppointmentModel = z.infer<typeof cancelAppointmentSchema>;
