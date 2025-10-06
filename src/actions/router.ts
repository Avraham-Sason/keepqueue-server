import express, { type Router } from "express";
import { S_login } from "./services";
import { businessesRouter } from "./businesses";

const actionsRouter: Router = express.Router();

actionsRouter.get("/", (req, res) => res.send("OK from actions"));

actionsRouter.post("/login", S_login);

actionsRouter.use("/businesses", businessesRouter);

export { actionsRouter };
