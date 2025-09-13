import mainRouter from "./main_router";
import { startServer } from "./helpers";
import { getAllDocuments } from "./firebase/helpers";
import dotenv from "dotenv";
dotenv.config();
const init = async () => {
    await startServer(mainRouter);
    const users = await getAllDocuments("users");
    console.log("users", users);
};

init().catch((e) => {
    process.exit(1);
});
