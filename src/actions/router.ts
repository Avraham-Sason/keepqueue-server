import express, { type Router } from "express";
import { S_login } from "./services";

const actionsRouter: Router = express.Router();

actionsRouter.get("/", (req, res) => res.send("OK from actions"));

actionsRouter.post("/login", S_login);

export { actionsRouter };
