import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { error_handler } from "../middlewares/error_handling";
import { trim_body_middleware } from "../middlewares";
import { MainRouter, StringObject } from "../types";
import { readFileSync } from "fs";

export const init_env_variables = (required_vars: string[] = []) => {
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
            process.exit(1);
        }
    });
    const env_vars: StringObject<string> = {};
    Object.keys(process.env).forEach((var_name) => {
        const env_val = <string>process.env[var_name];
        env_vars[var_name] = env_val;
    });
    return env_vars;
};

export const start_server = async (main_router: MainRouter, project_name: string, version: string, port?: number): Promise<Express> => {
    const app: Express = express();
    let env_data = init_env_variables(["mode"]);
    port = port || Number(env_data.port);
    app.use(cors());
    app.use(express.json());
    app.use(trim_body_middleware());
    main_router(app);
    app.use(error_handler);

    return new Promise<Express>((resolve, reject) => {
        app.listen(port, () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { project_name, version, environment: env_data.mode });
            resolve(app);
        });
    });
};

export const trim_strings = <T>(input: any): any => {
    if (typeof input === "string") {
        return input.trim();
    }

    if (Array.isArray(input)) {
        return input.map(trim_strings);
    }

    if (input instanceof Date || input instanceof RegExp || input instanceof Map || input instanceof Set) {
        return input;
    }

    if (input !== null && typeof input === "object") {
        const trimmed_object: Record<string, any> = {};
        for (const key of Object.getOwnPropertyNames(input)) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                trimmed_object[key] = trim_strings(input[key]);
            }
        }
        return trimmed_object;
    }

    return input;
};

export const parse_error = (error: any) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};

export const get_version = (packageJsonPath: string): string => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};
