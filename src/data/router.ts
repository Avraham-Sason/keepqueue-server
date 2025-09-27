import express, { type Router } from "express";
import { S_getBusiness, S_getCollection } from "./services";
import { getBusinessSchema, getCollectionSchema } from "./schemes";
import { validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getCollection", validateBody(getCollectionSchema), S_getCollection);

dataRouter.post("/getBusiness", validateBody(getBusinessSchema), S_getBusiness);

export { dataRouter };
