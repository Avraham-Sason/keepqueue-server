import express, { type Router } from "express";
import { S_getBusiness, S_getCollection, S_getAvailabilityByServiceId, S_getBusinessCustomers, S_getUserById } from "./services";
import { getBusinessSchema, getCollectionSchema, getAvailabilityByServiceIdSchema, getBusinessCustomersSchema, getUserByIdSchema } from "./schemes";
import { validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getCollection", validateBody(getCollectionSchema), S_getCollection);

dataRouter.post("/getBusiness", validateBody(getBusinessSchema), S_getBusiness);

dataRouter.post("/getAvailabilityByServiceId", validateBody(getAvailabilityByServiceIdSchema), S_getAvailabilityByServiceId);

dataRouter.post("/getBusinessCustomers", validateBody(getBusinessCustomersSchema), S_getBusinessCustomers);

dataRouter.post("/getUserById", validateBody(getUserByIdSchema), S_getUserById);

export { dataRouter };
