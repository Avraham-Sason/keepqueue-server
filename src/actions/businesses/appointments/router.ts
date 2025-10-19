import express, { type Router } from "express";
import { SCancelAppointment, SConfirmAppointment, SCreateAppointment } from "./services";
import { validateBody } from "../../../middlewares";
import { cancelAppointmentSchema, confirmAppointmentSchema, createAppointmentSchema } from "./schemes";

const appointmentsRouter: Router = express.Router();

// Appointments
appointmentsRouter.post("/create", validateBody(createAppointmentSchema), SCreateAppointment);
appointmentsRouter.post("/cancel", validateBody(cancelAppointmentSchema), SCancelAppointment);
appointmentsRouter.post("/confirm", validateBody(confirmAppointmentSchema), SConfirmAppointment);

export { appointmentsRouter };
