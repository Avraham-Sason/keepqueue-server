import { StringObject } from "../types";

export class CacheManager {
    private static instance: CacheManager;
    private data: StringObject<any[]> | StringObject = {};

    private constructor() {}

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public setArrayData(key: string, data: any[]): void {
        this.data[key] = data;
    }

    public getArrayData(key: string): any[] {
        if (!this.data[key]) {
            return [];
        }

        return this.data[key];
    }

    public setObjectData(key: string, data: any): void {
        this.data[key] = data;
    }

    public getObjectData(key: string, defaultValue: any = null): any {
        return this.data[key] || defaultValue;
    }
}

export const cacheManager: CacheManager = CacheManager.getInstance();
