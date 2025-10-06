import express, { type Router } from "express";
import { S_cancelAppointment, S_confirmAppointment, S_createAppointment } from "./services";
import { validateBody } from "../../../middlewares";
import { cancelAppointmentSchema, confirmAppointmentSchema, createAppointmentSchema } from "./schemes";

const appointmentsRouter: Router = express.Router();

// Appointments
appointmentsRouter.post("/create", validateBody(createAppointmentSchema), S_createAppointment);
appointmentsRouter.post("/cancel", validateBody(cancelAppointmentSchema), S_cancelAppointment);
appointmentsRouter.post("/confirm", validateBody(confirmAppointmentSchema), S_confirmAppointment);

export { appointmentsRouter };
