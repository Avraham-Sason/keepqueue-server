import { z } from "zod";
const { object, string, array } = z;

export const getCollectionSchema = object({
    collectionName: string().min(4).max(20),
    conditions: array(
        object({
            fieldName: string(),
            operator: string(),
            value: string(),
        })
    ).optional(),
});

export type GetCollectionSchema = z.infer<typeof getCollectionSchema>;
