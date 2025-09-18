import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { errorHandler } from "../middlewares/error_handling";
import { trimBodyMiddleware } from "../middlewares";
import { MainRouter, StringObject } from "../types";
import { readFileSync } from "fs";
import packageJson from "../../package.json";

export const initEnvVariables = (requiredVars: string[] = []) => {
    requiredVars.forEach((varName) => {
        const envVal = process.env[varName];
        if (!envVal) {
            logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
            process.exit(1);
        }
    });
    const envVars: StringObject<string> = {};
    Object.keys(process.env).forEach((varName) => {
        const envVal = <string>process.env[varName];
        envVars[varName] = envVal;
    });
    return envVars;
};

export const startServer = async (mainRouter: MainRouter, port?: number): Promise<Express> => {
    const app: Express = express();
    const { version, name } = packageJson;
    let envData = initEnvVariables(["port"]);
    const resolvedPort = Number(port || process.env.PORT || envData.port);
    port = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : 9000;
    app.use(cors());
    app.use(express.json());
    app.use(trimBodyMiddleware());
    mainRouter(app);
    app.use(errorHandler);

    return new Promise<Express>((resolve, reject) => {
        app.listen(port, () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { name, version });
            resolve(app);
        });
    });
};

export const trimStrings = <T>(input: any): any => {
    if (typeof input === "string") {
        return input.trim();
    }

    if (Array.isArray(input)) {
        return input.map(trimStrings);
    }

    if (input instanceof Date || input instanceof RegExp || input instanceof Map || input instanceof Set) {
        return input;
    }

    if (input !== null && typeof input === "object") {
        const trimmedObject: Record<string, any> = {};
        for (const key of Object.getOwnPropertyNames(input)) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                trimmedObject[key] = trimStrings(input[key]);
            }
        }
        return trimmedObject;
    }

    return input;
};

export const parseError = (error: any) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};

export const getVersion = (packageJsonPath: string): string => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};
