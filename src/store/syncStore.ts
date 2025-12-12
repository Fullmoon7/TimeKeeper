import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Full } from "@/database/stash";
import { timeEntryBucket } from "@/database/timeEntryStorage";
import {
  type SyncProvider,
  type SyncUser,
  SyncServiceFactory,
} from "@/services/syncService";
import { useMetaStore } from "@/store/metaStore";
import { useTimeEntryStore } from "@/store/timeEntryStore";
import type { GlobalMeta, TimeEntry } from "@/types/time";

interface BackupData {
  version: string;
  timestamp: number;
  meta: GlobalMeta;
  entries: Full<TimeEntry>[];
}

interface SyncStore {
  // 同步配置
  provider: SyncProvider;
  token: string | null;
  repoExists: boolean;
  lastSyncTime: number | null;
  userInfo: SyncUser | null;
  isSyncing: boolean;
  isAuthenticated: boolean;

  // 方法
  setProvider: (provider: SyncProvider) => void;
  login: (token: string, provider?: SyncProvider) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      provider: "gitee", // 默认使用 Gitee（国内访问更快）
      token: null,
      repoExists: false,
      lastSyncTime: null,
      userInfo: null,
      isSyncing: false,
      isAuthenticated: false,

      setProvider: (provider: SyncProvider) => {
        set({ provider });
      },

      login: async (token: string, provider?: SyncProvider) => {
        set({ isSyncing: true });
        try {
          const currentProvider = provider || get().provider;
          const service = SyncServiceFactory.create(currentProvider, token);
          const user = await service.getUser();

          // 检查备份仓库是否存在
          const existingRepo = await service.findBackupRepo();

          set({
            provider: currentProvider,
            token: token,
            userInfo: user,
            isAuthenticated: true,
            repoExists: !!existingRepo,
          });

          toast.success(`登录成功: ${user.name || user.login}`);
        } catch (error: any) {
          console.error(error);
          toast.error(`登录失败: ${error.message || "Token 无效或网络错误"}`);
          throw error;
        } finally {
          set({ isSyncing: false });
        }
      },

      logout: () => {
        set({
          token: null,
          repoExists: false,
          lastSyncTime: null,
          userInfo: null,
          isAuthenticated: false,
        });
        toast.success("已退出登录");
      },

      checkAuth: async () => {
        const { token, provider } = get();
        if (!token) return;

        try {
          const service = SyncServiceFactory.create(provider, token);
          const user = await service.getUser();
          set({ userInfo: user, isAuthenticated: true });
        } catch (error) {
          console.error("Auth check failed", error);
          set({ isAuthenticated: false }); // Token 可能失效
        }
      },

      syncToCloud: async () => {
        const { token, provider } = get();
        if (!token) {
          toast.error("请先登录");
          return;
        }

        set({ isSyncing: true });
        try {
          const service = SyncServiceFactory.create(provider, token);

          // 1. 获取本地数据
          const entries = await timeEntryBucket.itemStorage.toArray();
          const meta = await timeEntryBucket.getMeta();

          if (!meta) {
            throw new Error("无法读取本地配置");
          }

          const backupData: BackupData = {
            version: "1.0.0",
            timestamp: Date.now(),
            meta: meta,
            entries: entries,
          };

          const content = JSON.stringify(backupData, null, 2);

          // 2. 保存到云端仓库
          await service.saveBackup(content);

          // 3. 检查仓库状态
          const repo = await service.findBackupRepo();

          set({
            repoExists: !!repo,
            lastSyncTime: Date.now(),
          });

          toast.success("备份成功！");
        } catch (error: any) {
          console.error("Backup failed", error);
          toast.error(`备份失败: ${error.message || "未知错误"}`);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromCloud: async () => {
        const { token, provider } = get();
        if (!token) {
          toast.error("请先登录");
          return;
        }

        set({ isSyncing: true });
        try {
          const service = SyncServiceFactory.create(provider, token);

          // 1. 下载数据
          const content = await service.getBackup();
          const backupData: BackupData = JSON.parse(content);

          // 2. 验证数据
          if (!backupData.meta || !Array.isArray(backupData.entries)) {
            throw new Error("备份文件格式错误");
          }

          // 3. 恢复到本地
          // 恢复 Meta
          await timeEntryBucket.metaStorage.setValue(backupData.meta);

          // 恢复 Entries (全量覆盖)
          await timeEntryBucket.itemStorage.clear();
          const entriesToRestore = backupData.entries.map((entry) => ({
            ...entry,
            __create_at: entry.__create_at || Date.now(),
            __update_at: entry.__update_at || Date.now(),
          }));
          await timeEntryBucket.itemStorage.put(...entriesToRestore);

          // 4. 刷新 Store
          await useMetaStore.getState().loadMeta();
          await useTimeEntryStore.getState().loadTodayEntries();

          set({ lastSyncTime: backupData.timestamp });
          toast.success(`恢复成功！已导入 ${backupData.entries.length} 条记录`);
        } catch (error: any) {
          console.error("Restore failed", error);
          toast.error(`恢复失败: ${error.message || "未知错误"}`);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "timekeeper-sync-storage",
      partialize: (state) => ({
        provider: state.provider,
        token: state.token,
        repoExists: state.repoExists,
        lastSyncTime: state.lastSyncTime,
      }),
    },
  ),
);
