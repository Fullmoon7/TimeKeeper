import { toast } from "sonner";
import { create } from "zustand";
import { timeEntryBucket } from "@/database/timeEntryStorage";
import type { TimeEntry } from "@/types/time";
import { useTimerStore } from "./timerStore";

interface TimeEntryStore {
  // 状态
  todayEntries: TimeEntry[]; // 今日活动列表
  isLoading: boolean;

  // 操作
  loadTodayEntries: () => Promise<void>;
  addEntry: (entry: TimeEntry) => Promise<void>;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  continueEntry: (entry: TimeEntry) => void; // 继续历史活动
}

export const useTimeEntryStore = create<TimeEntryStore>((set, get) => ({
  todayEntries: [],
  isLoading: false,

  loadTodayEntries: async () => {
    set({ isLoading: true });

    try {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);

      // 从 IndexedDB 加载所有条目
      const allEntries = await timeEntryBucket.getItems();

      // 筛选今日活动，并按开始时间排序
      const todayEntries = allEntries
        .filter((entry) => entry.startTime >= todayStart && entry.startTime <= todayEnd)
        .sort((a, b) => a.startTime - b.startTime);

      set({ todayEntries, isLoading: false });
    } catch (error) {
      console.error("加载今日活动失败:", error);
      toast.error("加载今日活动失败");
      set({ isLoading: false });
    }
  },

  addEntry: async (entry) => {
    try {
      await timeEntryBucket.batch([{ type: "update", value: entry }]);
      await get().loadTodayEntries();
      toast.success("活动已添加");
    } catch (error) {
      console.error("添加活动失败:", error);
      toast.error("添加活动失败");
    }
  },

  updateEntry: async (id, updates) => {
    try {
      const allEntries = await timeEntryBucket.getItems();
      const entry = allEntries.find((e) => e.id === id);
      if (!entry) {
        toast.error("找不到该活动");
        return;
      }

      const updated: TimeEntry = {
        ...entry,
        ...updates,
        // 如果更新了时间，重新计算时长
        duration:
          updates.startTime || updates.endTime
            ? Math.floor(
                ((updates.endTime || entry.endTime) - (updates.startTime || entry.startTime)) /
                  1000,
              )
            : entry.duration,
      };

      await timeEntryBucket.batch([{ type: "update", value: updated }]);
      await get().loadTodayEntries();
      toast.success("活动已更新");
    } catch (error) {
      console.error("更新活动失败:", error);
      toast.error("更新活动失败");
    }
  },

  deleteEntry: async (id) => {
    try {
      await timeEntryBucket.batch([{ type: "delete", value: id }]);
      await get().loadTodayEntries();
      toast.success("活动已删除");
    } catch (error) {
      console.error("删除活动失败:", error);
      toast.error("删除活动失败");
    }
  },

  continueEntry: (entry) => {
    // 调用 timerStore 开始计时，使用当前时间作为开始时间
    useTimerStore.getState().startTimer({
      title: entry.title,
      categoryId: entry.categoryId,
      startTime: Date.now(),
    });

    toast.success(`继续活动: ${entry.title}`);
  },
}));
