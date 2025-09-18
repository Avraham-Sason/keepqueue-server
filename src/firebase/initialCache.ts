import { cacheManager, CacheStore, logger } from "../managers";
import { Audit, Business, CalendarEvent, DocBase, MessageTemplate, NotificationLog, Review, Service, User, WaitItem } from "../types";
import { snapshotBulk } from "./helpers";
import { OnSnapshotConfig } from "./types";

export const initSnapshot = async () => {
    const config: OnSnapshotConfig[] = [
        parseDocuments<User>("users", { debug: { onFirstTime: false, onAdd: true, onModify: true, onRemove: true } }),
        // parseDocuments<Business>("businesses", { debug: { onFirstTime: true, onAdd: true, onModify: true, onRemove: true } }),
        // parseDocuments<Service>("services", { debug: { onFirstTime: true, onAdd: true, onModify: true, onRemove: true } }),
        // parseDocuments<CalendarEvent>("calendar", { debug: { onFirstTime: true, onAdd: true, onModify: true, onRemove: true } }),
        // parseDocuments<MessageTemplate>("message_templates", { debug: { onFirstTime: true, onAdd: true, onModify: true, onRemove: true } }),
        // parseDocuments<NotificationLog>("notification_logs"),
        // parseDocuments<WaitItem>("waitlist"),
        // parseDocuments<Review>("reviews"),
        // parseDocuments<Audit>("audits"),
    ];
    await snapshotBulk(config);
};

interface ParseDocumentsOptions {
    debug?: {
        onFirstTime?: boolean;
        onAdd?: boolean;
        onModify?: boolean;
        onRemove?: boolean;
    };
    withoutMap?: boolean;
}

const parseDocuments = <T extends DocBase>(collectionName: keyof CacheStore, options?: ParseDocumentsOptions): OnSnapshotConfig => {
    const cacheMapKey = `${collectionName}Map` as keyof CacheStore;
    return {
        collectionName,
        onFirstTime: (documents: T[]) => {
            cacheManager.set(collectionName, documents);
            if (options?.debug?.onFirstTime) {
                console.log(`ℹ️${collectionName} - onFirstTime array`, cacheManager.get(collectionName));
            }
            if (options?.withoutMap) {
                return;
            }
            const documentsMap = new Map<string, T>();
            documents.forEach((document) => {
                documentsMap.set(document.id!, document);
            });
            cacheManager.set(cacheMapKey, documentsMap);
            if (options?.debug?.onFirstTime) {
                console.log(`ℹ️  ${collectionName} - onFirstTime documentsMap`, cacheManager.get(cacheMapKey));
            }
        },
        onAdd: (documents: T[]) => {
            cacheManager.set(collectionName, documents, { merge: true });
            if (options?.debug?.onAdd) {
                console.log(`ℹ️ ${collectionName} - onAdd array`, cacheManager.get(collectionName));
            }
            if (options?.withoutMap) {
                return;
            }
            cacheManager.set(cacheMapKey, documents, { merge: true });
            if (options?.debug?.onAdd) {
                console.log(`ℹ️ ${collectionName} - onAdd documentsMap`, cacheManager.get(cacheMapKey));
            }
        },
        onModify: (documents: T[]) => {
            cacheManager.set(collectionName, documents, { merge: true, replacePrevValues: true });
            if (options?.debug?.onModify) {
                console.log(`ℹ️ ${collectionName} - onModify array`, cacheManager.get(collectionName));
            }
            if (options?.withoutMap) {
                return;
            }
            cacheManager.set(cacheMapKey, documents, { merge: true, replacePrevValues: true });
            if (options?.debug?.onModify) {
                console.log(`ℹ️ ${collectionName} - onModify documentsMap`, cacheManager.get(cacheMapKey));
            }
        },
        onRemove: (documents: T[]) => {
            documents.forEach((document) => {
                cacheManager.delete(collectionName, document.id);
                if (options?.debug?.onRemove) {
                    console.log(`ℹ️ ${collectionName} - onRemove array`, cacheManager.get(collectionName));
                }
                if (options?.withoutMap) {
                    return;
                }
                cacheManager.delete(cacheMapKey, document.id);
                if (options?.debug?.onRemove) {
                    console.log(`ℹ️ ${collectionName} - onRemove documentsMap`, cacheManager.get(cacheMapKey));
                }
            });
        },
    };
};
// const parseDocuments = <T extends DocBase>(collectionName: keyof CacheStore, options?: ParseDocumentsOptions): OnSnapshotConfig => {
//     const cacheMapKey = `${collectionName}Map` as keyof CacheStore;
//     return {
//         collectionName,
//         onFirstTime: (documents: T[]) => {
//             cacheManager.set(collectionName, documents);
//             if (options?.debug?.onFirstTime) {
//                 logger.log(`${collectionName} - onFirstTime array`, cacheManager.get(collectionName));
//             }
//             if (options?.withoutMap) {
//                 return;
//             }
//             const documentsMap = new Map<string, T>();
//             documents.forEach((document) => {
//                 documentsMap.set(document.id!, document);
//             });
//             cacheManager.set(cacheMapKey, documentsMap);
//             if (options?.debug?.onFirstTime) {
//                 logger.log(`${collectionName} - onFirstTime documentsMap`, cacheManager.get(cacheMapKey));
//             }
//         },
//         onAdd: (documents: T[]) => {
//             cacheManager.set(collectionName, documents, { merge: true });
//             if (options?.debug?.onAdd) {
//                 logger.log(`${collectionName} - onAdd array`, cacheManager.get(collectionName));
//             }
//             if (options?.withoutMap) {
//                 return;
//             }
//             cacheManager.set(cacheMapKey, documents, { merge: true });
//             if (options?.debug?.onAdd) {
//                 logger.log(`${collectionName} - onAdd documentsMap`, cacheManager.get(cacheMapKey));
//             }
//         },
//         onModify: (documents: T[]) => {
//             cacheManager.set(collectionName, documents, { merge: true, replacePrevValues: true });
//             if (options?.debug?.onModify) {
//                 logger.log(`${collectionName} - onModify array`, cacheManager.get(collectionName));
//             }
//             if (options?.withoutMap) {
//                 return;
//             }
//             cacheManager.set(cacheMapKey, documents, { merge: true, replacePrevValues: true });
//             if (options?.debug?.onModify) {
//                 logger.log(`${collectionName} - onModify documentsMap`, cacheManager.get(cacheMapKey));
//             }
//         },
//         onRemove: (documents: T[]) => {
//             documents.forEach((document) => {
//                 cacheManager.delete(collectionName, document.id);
//                 if (options?.debug?.onRemove) {
//                     logger.log(`${collectionName} - onRemove array`, cacheManager.get(collectionName));
//                 }
//                 if (options?.withoutMap) {
//                     return;
//                 }
//                 cacheManager.delete(cacheMapKey, document.id);
//                 if (options?.debug?.onRemove) {
//                     logger.log(`${collectionName} - onRemove documentsMap`, cacheManager.get(cacheMapKey));
//                 }
//             });
//         },
//     };
// };
