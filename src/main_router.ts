import express, { Router } from "express";
import { MainRouter } from "./types";
const rootRouter: Router = express.Router();

rootRouter.get("/", (req, res) => res.status(200).send("OK from root"));
// rootRouter.use("/api/", (req, res) => res.status(200).send("OK from api root"));

const mainRouter: MainRouter = (app) => {
    app.use(rootRouter);
};

export default mainRouter;
