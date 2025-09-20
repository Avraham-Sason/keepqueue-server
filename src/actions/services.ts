import { jsonOK } from "../helpers";
import { RouterService } from "../types";

export const S_login: RouterService = async (req, res, next) => {
    try {
        res.json(jsonOK("ok login"));
    } catch (error) {
        next(error);
    }
};
