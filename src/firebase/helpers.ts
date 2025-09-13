import { performance } from "perf_hooks";
import firebase_admin from "firebase-admin";
import {
    OnSnapshotConfig,
    QueryDocument,
    QueryDocumentByConditions,
    QueryDocumentOptional,
    QueryDocuments,
    QueryDocumentsByConditions,
    Snapshot,
    SnapshotBulk,
} from "./types";
import { cache_manager, logger } from "../managers";
import { DecodedIdToken } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

// initial firebase
const required_env_vars = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "auth_uri",
    "token_uri",
    "auth_provider_x509_cert_url",
    "client_x509_cert_url",
    "universe_domain",
];
const env_data = init_env_variables(required_env_vars);
export const service_account_firebase = {
    type: env_data.type,
    project_id: env_data.project_id,
    private_key_id: env_data.private_key_id,
    private_key: env_data.private_key.replace(/\\n/g, "\n"),
    client_email: env_data.client_email,
    client_id: env_data.client_id,
    auth_uri: env_data.auth_uri,
    token_uri: env_data.token_uri,
    auth_provider_x509_cert_url: env_data.auth_provider_x509_cert_url,
    client_x509_cert_url: env_data.client_x509_cert_url,
    universe_domain: env_data.universe_domain,
};
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(service_account_firebase as firebase_admin.ServiceAccount),
    storageBucket: `${service_account_firebase.project_id}.appspot.com`,
});
export const db = firebase_admin.firestore();
export const messaging = firebase_admin.messaging();
export const auth = firebase_admin.auth();
import { init_env_variables } from "../helpers";
import { StringObject } from "../types";

/// extract
export const simple_extract_data = (doc: FirebaseFirestore.DocumentSnapshot, include_id: boolean = true): StringObject => {
    const doc_data = doc.data();
    const date = {
        ...doc_data,
    };
    if (include_id) {
        date.id = doc.id;
    }
    return date;
};

/// documents
export const get_all_documents = async (collection_path: string, include_id: boolean = true) => {
    try {
        const snapshot = await db.collection(collection_path).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return simple_extract_data(doc, include_id);
        });
        return documents;
    } catch (error) {
        logger.error("Error fetching documents:", error);
        throw error;
    }
};

export const query_documents: QueryDocuments = async (collection_path, field_name, operator, value) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        throw error;
    }
};

export const query_documents_by_conditions: QueryDocumentsByConditions = async (collection_path, where_conditions) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        throw error;
    }
};

export const query_document_by_conditions: QueryDocumentByConditions = async (collection_path, where_conditions, log = true) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        if (!documents[0]) {
            throw "no data returned from DB";
        }
        return documents[0];
    } catch (error) {
        if (log) {
            logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        }
        throw error;
    }
};

/// document
export const query_document: QueryDocument = async (collection_path, field_name, operator, value, ignore_log = false) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        if (documents.length < 1) {
            throw `No data to return from: collection: ${collection_path}, field_name: ${field_name}, operator: ${operator}, value:${value}`;
        }
        return documents[0];
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying document: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        throw error;
    }
};

export const query_document_optional: QueryDocumentOptional = async (collection_path, field_name, operator, value, ignore_log = true) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents[0] || null;
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying optional document: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        return null;
    }
};

export const get_document_by_id = async (collection_path: string, doc_id: string, include_id: boolean = true): Promise<StringObject> => {
    try {
        const docRef = db.collection(collection_path).doc(doc_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc, include_id);
    } catch (error) {
        logger.error("error from get_document_by_id", error);
        throw error;
    }
};

export const get_document_by_id_optional = async (
    collection_path: string,
    doc_id: string,
    include_id: boolean = true
): Promise<StringObject | null> => {
    try {
        const docRef = db.collection(collection_path).doc(doc_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc, include_id);
    } catch (error) {
        logger.error("error from get_document_by_id_optional", error);
        return null;
    }
};

export const set_document = async (collection_path: string, doc_id: string, data: {}, merge: boolean = true): Promise<void> => {
    try {
        await db
            .collection(collection_path)
            .doc(doc_id)
            .set({ ...data }, { merge });
    } catch (error) {
        logger.error(`failed to create document by id: ${doc_id} in collection: ${collection_path}`, error);
        throw `failed to create document by id ${doc_id} in collection ${collection_path}`;
    }
};

export const add_document = async (collection_path: string, data: {}, include_id = false, custom_id?: string): Promise<void> => {
    try {
        const new_document = custom_id ? db.collection(collection_path).doc(custom_id) : db.collection(collection_path).doc();
        const update = include_id ? { ...data, id: new_document.id } : data;
        await new_document.set(update);
    } catch (error) {
        logger.error(`failed to create document in collection: ${collection_path}`, error);
        throw `failed to create document in collection ${collection_path}`;
    }
};

export const delete_document = async (collection_path: string, doc_id: string): Promise<void> => {
    try {
        await db.collection(collection_path).doc(doc_id).delete();
    } catch (error) {
        throw `Failed to delete document with id ${doc_id} from collection ${collection_path}`;
    }
};

/// token
export const verify_token = async (authorization: string | undefined): Promise<DecodedIdToken> => {
    try {
        if (!authorization) {
            throw "Authorization token is required";
        }
        if (!authorization.toLowerCase().startsWith("bearer")) {
            throw "Invalid authorization token";
        }
        const token = authorization.split(/bearer\s+(.+)/i)[1];

        if (!token) {
            throw "validation error: Token not found";
        }
        const res = await firebase_admin.auth().verifyIdToken(token);
        if (!res) {
            throw "User not found";
        }
        return res;
    } catch (error) {
        logger.error("error from verify_token", error);
        throw error;
    }
};

/// parsers

export const parse_add_update__as_object = (documents: any[], config: OnSnapshotConfig, doc_key_property: string): void => {
    const data: StringObject = cache_manager.getObjectData(config.collection_name, {});
    documents.forEach((doc: StringObject) => {
        data[doc[doc_key_property]] = doc;
    });
    cache_manager.setObjectData(doc_key_property, data);
};

export const parse__delete__as_object = (documents: any[], config: OnSnapshotConfig, doc_key_property: string): void => {
    const data: StringObject = cache_manager.getObjectData(config.collection_name, {});
    documents.forEach((doc: StringObject) => {
        if (data[doc[doc_key_property]]) {
            delete data[doc[doc_key_property]];
        }
    });
    cache_manager.setObjectData(doc_key_property, data);
};

export const parse__add_update__as_array = (documents: any[], config: OnSnapshotConfig): void => {
    const { collection_name, custom_name = collection_name } = config;
    config.on_remove?.(documents, config);
    const existing_array: any[] = cache_manager.getArrayData(custom_name);
    const updated_array = [...existing_array, ...documents];
    cache_manager.setArrayData(custom_name, updated_array);
};

export const parse__delete__as_array = (documents: any[], config: OnSnapshotConfig): void => {
    const { collection_name, custom_name = collection_name } = config;
    const existing_array: any[] = cache_manager.getArrayData(custom_name);
    const keys_to_delete = documents.map((doc) => doc.id);
    const updated_array = existing_array.filter((doc) => !keys_to_delete.includes(doc.id));
    cache_manager.setArrayData(custom_name, updated_array);
};

/// snapshots
const snapshots_first_time: string[] = [];

export const snapshot: Snapshot = (config) => {
    return new Promise<void>(async (resolve) => {
        const { collection_name, custom_name = collection_name } = config;

        db.collection(config.collection_name).onSnapshot(
            (snapshot) => {
                if (!snapshots_first_time.includes(custom_name)) {
                    snapshots_first_time.push(custom_name);
                    const documents = snapshot.docs.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));

                    config.on_first_time?.(documents, config);
                    config.extra_parsers?.forEach((extra_parser) => {
                        extra_parser.on_first_time?.(documents, config);
                    });
                    resolve();
                } else {
                    const get_docs_from_snapshot = (action: string): StringObject[] => {
                        return snapshot
                            .docChanges()
                            .filter((change) => change.type === action)
                            .map((change) => simple_extract_data(change.doc));
                    };

                    config.on_add?.(get_docs_from_snapshot("added"), config);
                    config.on_modify?.(get_docs_from_snapshot("modified"), config);
                    config.on_remove?.(get_docs_from_snapshot("removed"), config);

                    config.extra_parsers?.forEach((extra_parser) => {
                        extra_parser.on_add?.(get_docs_from_snapshot("added"), config);
                        extra_parser.on_modify?.(get_docs_from_snapshot("modified"), config);
                        extra_parser.on_remove?.(get_docs_from_snapshot("removed"), config);
                    });
                }
            },
            (error) => {
                logger.error(`Error listening to collection: ${config.collection_name}`, error);
            }
        );
    });
};

export const snapshot_bulk: SnapshotBulk = async (snapshotsConfig, label = "custom snapshots") => {
    const start = performance.now();
    logger.log(`==> ${label} started... `);
    await Promise.all(snapshotsConfig.map(async (snapshotConfig) => await snapshot(snapshotConfig)));
    logger.log(`==> ${label} ended. It took ${(performance.now() - start).toFixed(2)} ms`);
};
