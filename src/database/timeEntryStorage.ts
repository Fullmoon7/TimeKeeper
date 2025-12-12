import type { GlobalMeta, TimeEntry } from "@/types/time";
import { StashBucket } from "./stash";
import { TimeEntryIndexedDBStorage } from "./storage";

// 创建全局单例
export const timeEntryStorage = new TimeEntryIndexedDBStorage("timekeeper-db");

// 创建 StashBucket 实例
export const timeEntryBucket = new StashBucket<TimeEntry, GlobalMeta>(
  timeEntryStorage.createArrayableStorage,
  timeEntryStorage.createStorage,
);
