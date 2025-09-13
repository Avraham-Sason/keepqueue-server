import express, { Router } from "express";
import { MainRouter } from "./types";
const root_router: Router = express.Router();

root_router.get("/", (req, res) => res.status(200).send("OK from root"));
// root_router.use("/api/", (req, res) => res.status(200).send("OK from api root"));

const main_router: MainRouter = (app) => {
    app.use(root_router);
};

export default main_router;
