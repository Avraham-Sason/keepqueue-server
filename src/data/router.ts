import express, { type Router } from "express";
import { SGetBusiness, SGetCollection } from "./services";
import { getBusinessSchema, getCollectionSchema } from "./schemes";
import { validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getCollection", validateBody(getCollectionSchema), SGetCollection);

dataRouter.post("/getBusiness", validateBody(getBusinessSchema), SGetBusiness);

export { dataRouter };
