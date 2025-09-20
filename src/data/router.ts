import express, { type Router } from "express";
import { S_getCollection } from "./services";
import { getCollectionSchema } from "./schemes";
import { validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getCollection", validateBody(getCollectionSchema), S_getCollection);

export { dataRouter };
