import { Request, Response, NextFunction } from "express";
import { Service } from "../types";

/**
 * Utility to handle async errors
 */
const asyncErrorHandler = (service: Service) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(service(req, res)).catch(next);
    };
};

/**
 * Global error-handling middleware.
 */
const errorHandler = (err: Error, req: Request, res: Response) => {
    console.error("Global Error Handler:", err.stack);

    res.status(500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
};

export { errorHandler, asyncErrorHandler };
