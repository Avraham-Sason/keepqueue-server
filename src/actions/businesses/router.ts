import express, { type Router } from "express";
import { appointmentsRouter } from "./appointments";

const businessesRouter: Router = express.Router();

businessesRouter.use("/appointments", appointmentsRouter);

export { businessesRouter };
