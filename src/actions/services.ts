import { jsonOK } from "../helpers";
import { RouterService } from "../types";

export const SLogin: RouterService = async (req, res, next) => {
    try {
        res.json(jsonOK("ok login"));
    } catch (error) {
        next(error);
    }
};
