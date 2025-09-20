import { jsonOK } from "../helpers";
import { RouterService } from "../types";

export const S_getCollection: RouterService = async (req, res, next) => {
    try {
        const { collectionName } = req.body;
        res.json(jsonOK(`ok ${collectionName}`));
    } catch (error) {
        next(error);
    }
};
