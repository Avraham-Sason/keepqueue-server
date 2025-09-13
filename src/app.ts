import main_router from "./main_router";
import package_json from "../package.json";
import { start_server } from "./helpers";

const init = async () => {
    const version = package_json.version;
    await start_server(main_router, "nx-cloudwise", version);
};

init().catch((e) => {
    process.exit(1);
});
