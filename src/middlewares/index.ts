import { trimStrings } from "../helpers";
import { MW } from "../types";

export * from "./error_handling";

export const trimBodyMiddleware = (): MW => (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = trimStrings(req.body);
    }
    return next();
};
