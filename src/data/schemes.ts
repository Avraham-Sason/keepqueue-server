import { z } from "zod";

const { object, string, array, any } = z;

export const getCollectionSchema = object({
    collectionName: string().min(4).max(20),
    conditions: array(
        object({
            fieldName: string(),
            operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "in", "not-in", "array-contains"]),
            value: any(),
        })
    ).optional(),
    conditionsType: z.enum(["and", "or"]).optional(),
});

export type GetCollectionModel = z.infer<typeof getCollectionSchema>;

export const getBusinessSchema = object({
    businessId: string().optional(),
    ownerId: string().optional(),
});

export type GetBusinessModel = z.infer<typeof getBusinessSchema>;

export const getAvailabilityByServiceIdSchema = object({
    serviceId: string().min(5),
});

export type GetAvailabilityByServiceIdModel = z.infer<typeof getAvailabilityByServiceIdSchema>;

export const getBusinessCustomersSchema = object({
    businessId: string().min(5),
});

export type GetBusinessCustomersModel = z.infer<typeof getBusinessCustomersSchema>;

export const getUserByIdSchema = object({
    userId: string().min(5),
});

export type GetUserByIdModel = z.infer<typeof getUserByIdSchema>;