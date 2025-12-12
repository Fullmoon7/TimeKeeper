import { type DBSchema, deleteDB, type IDBPDatabase, openDB } from "idb";
import type { TimeEntry } from "@/types/time";
import {
  type Action,
  type ArrayableStorageFactory,
  type Full,
  StashBucket,
  type StashStorage,
  type StorageFactory,
} from "./stash";

const DB_VERSION = 2;

export interface TimeKeeperDBSchema extends DBSchema {
  [StashBucket.STASH_NAME]: {
    key: string;
    value: Action<Full<TimeEntry>>;
    indexes: {
      timestamp: string;
    };
  };
  [StashBucket.ITEM_NAME]: {
    key: string;
    value: Full<TimeEntry>;
    indexes: {
      startTime: number;
      endTime: number;
      creatorId: string;
    };
  };
  [StashBucket.META_NAME]: {
    key: string;
    value: { id: "metaKey"; value: any };
  };
  [StashBucket.CONFIG_NAME]: {
    key: string;
    value: { id: "metaKey"; value: any };
  };
}

export class TimeEntryIndexedDBStorage implements StashStorage {
  public readonly dbName: string;
  private dbPromise: Promise<IDBPDatabase<TimeKeeperDBSchema>> | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<TimeKeeperDBSchema>(this.dbName, DB_VERSION, {
        upgrade: (db) => {
          if (!db.objectStoreNames.contains(StashBucket.STASH_NAME)) {
            const store = db.createObjectStore(StashBucket.STASH_NAME, {
              autoIncrement: true,
              keyPath: "id",
            });
            store.createIndex("timestamp", "timestamp");
          }
          if (!db.objectStoreNames.contains(StashBucket.ITEM_NAME)) {
            const store = db.createObjectStore(StashBucket.ITEM_NAME, {
              keyPath: "id",
            });
            store.createIndex("startTime", "startTime");
            store.createIndex("endTime", "endTime");
            store.createIndex("creatorId", "creatorId");
          }
          if (!db.objectStoreNames.contains(StashBucket.META_NAME)) {
            db.createObjectStore(StashBucket.META_NAME, {
              autoIncrement: true,
              keyPath: "id",
            });
          }
          if (!db.objectStoreNames.contains(StashBucket.CONFIG_NAME)) {
            db.createObjectStore(StashBucket.CONFIG_NAME, {
              autoIncrement: true,
              keyPath: "id",
            });
          }
        },
      });
    }
    return this.dbPromise;
  }

  createArrayableStorage: ArrayableStorageFactory = (name) => {
    return {
      put: async (...v) => {
        const db = await this.getDB();
        const tx = db.transaction(name, "readwrite");
        const store = tx.objectStore(name);
        await Promise.all(v.map((item) => store.put(item as any)));
        await tx.done;
      },
      delete: async (...ids) => {
        const db = await this.getDB();
        const tx = db.transaction(name, "readwrite");
        const store = tx.objectStore(name);
        await Promise.all(ids.map((id) => store.delete(id)));
        await tx.done;
      },
      clear: async () => {
        const db = await this.getDB();
        await db.clear(name);
      },
      toArray: async (limit?: number) => {
        const db = await this.getDB();
        const { index } = (() => {
          if (name === StashBucket.STASH_NAME) {
            const store = db
              .transaction(StashBucket.STASH_NAME)
              .objectStore(StashBucket.STASH_NAME);
            const index = store.index("timestamp");
            return {
              index,
            };
          }
          const store = db.transaction(StashBucket.ITEM_NAME).objectStore(StashBucket.ITEM_NAME);
          const index = store.index("startTime");
          return {
            index,
          };
        })();
        const direction = "prev";

        const localItems: any[] = [];
        const range = IDBKeyRange.bound(-Infinity, Infinity);
        let cursor = await index.openCursor(range, direction);
        while (cursor) {
          localItems.push(cursor.value);
          if (limit !== undefined && localItems.length >= limit) {
            break;
          }
          cursor = await cursor.continue();
        }
        return localItems;
      },
    };
  };

  createStorage: StorageFactory = (name) => {
    return {
      setValue: async (v) => {
        const db = await this.getDB();
        const tx = db.transaction(name, "readwrite");
        const store = tx.objectStore(name);
        await store.put({ id: "metaKey", value: v });
        await tx.done;
      },
      getValue: async () => {
        const db = await this.getDB();
        const tx = db.transaction(name, "readonly");
        const store = tx.objectStore(name);
        const value = await store.get("metaKey");
        await tx.done;
        return value?.value;
      },
    };
  };
  dangerousClearAll = async () => {
    const db = await this.getDB();
    db.close();
    this.dbPromise = null;
    return deleteDB(this.dbName);
  };
}
