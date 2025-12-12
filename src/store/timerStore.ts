import { toast } from "sonner";
import { create } from "zustand";
import { timeEntryBucket } from "@/database/timeEntryStorage";
import type { TimeEntry } from "@/types/time";

interface TimerStore {
  // 状态
  isRunning: boolean;
  startTime: number | null;
  currentTitle: string;
  currentCategoryId: string;
  currentTagIds: string[]; // 新增：当前标签
  pausedDuration: number;
  lastEndTime: number | null; // 上一次活动的结束时间（用于自动衔接）

  // 操作
  startTimer: (config: {
    title: string;
    categoryId?: string;
    tagIds?: string[]; // 新增
    startTime?: number; // 可选：手动设置开始时间
  }) => void;

  pauseTimer: () => void;
  resumeTimer: () => void;

  stopTimer: () => Promise<void>; // 停止并保存到 IndexedDB

  setLastEndTime: (time: number) => void;

  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // 初始状态
  isRunning: false,
  startTime: null,
  currentTitle: "",
  currentCategoryId: "work-coding",
  currentTagIds: [],
  pausedDuration: 0,
  lastEndTime: null,

  startTimer: (config) => {
    const { lastEndTime } = get();

    set({
      isRunning: true,
      currentTitle: config.title,
      currentCategoryId: config.categoryId || "work-coding",
      currentTagIds: config.tagIds || [],
      // 使用手动指定的时间，或者上次结束时间，或者当前时间
      startTime: config.startTime ?? lastEndTime ?? Date.now(),
      pausedDuration: 0,
    });
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  resumeTimer: () => {
    set({ isRunning: true });
  },

  stopTimer: async () => {
    const state = get();
    if (!state.startTime || !state.currentTitle.trim()) {
      toast.error("无法保存：缺少开始时间或活动名称");
      return;
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - state.startTime) / 1000);

    // 创建时间条目
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      title: state.currentTitle,
      startTime: state.startTime,
      endTime,
      duration,
      categoryId: state.currentCategoryId,
      tagIds: state.currentTagIds,
      creatorId: "default-user",
    };

    try {
      // 保存到 IndexedDB
      await timeEntryBucket.batch([{ type: "update", value: entry }]);

      // 更新最后结束时间
      set({
        lastEndTime: endTime,
        isRunning: false,
        startTime: null,
        currentTitle: "",
        currentCategoryId: "work-coding",
        currentTagIds: [],
        pausedDuration: 0,
      });

      toast.success(`已保存: ${entry.title} (${Math.floor(duration / 60)}分钟)`);
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败，请重试");
    }
  },

  setLastEndTime: (time) => {
    set({ lastEndTime: time });
  },

  reset: () => {
    set({
      isRunning: false,
      startTime: null,
      currentTitle: "",
      currentCategoryId: "work-coding",
      currentTagIds: [],
      pausedDuration: 0,
    });
  },
}));
