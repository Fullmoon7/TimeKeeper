import { create } from "zustand";
import { timeEntryBucket } from "@/database/timeEntryStorage";
import type { GlobalMeta, TimeCategory, TimeTag, UserPreferences } from "@/types/time";
import { DEFAULT_CATEGORIES, DEFAULT_PREFERENCES } from "@/types/time";

interface MetaStore {
  categories: TimeCategory[];
  tags: TimeTag[];
  preferences: UserPreferences;
  isLoading: boolean;

  loadMeta: () => Promise<void>;
  updateCategories: (categories: TimeCategory[]) => Promise<void>;
  addTag: (tag: TimeTag) => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
}

const DEFAULT_META_VALUE: GlobalMeta = {
  version: "1.0.0",
  categories: DEFAULT_CATEGORIES,
  tags: [],
  projects: [],
  goals: [],
  preferences: DEFAULT_PREFERENCES,
};

export const useMetaStore = create<MetaStore>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  tags: [],
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,

  loadMeta: async () => {
    set({ isLoading: true });

    try {
      const meta = await timeEntryBucket.getMeta();

      if (meta) {
        set({
          categories: meta.categories || DEFAULT_CATEGORIES,
          tags: meta.tags || [],
          preferences: meta.preferences || DEFAULT_PREFERENCES,
        });
      } else {
        // 首次使用，保存默认配置
        await timeEntryBucket.metaStorage.setValue(DEFAULT_META_VALUE);
      }

      set({ isLoading: false });
    } catch (error) {
      console.error("加载配置失败:", error);
      set({ isLoading: false });
    }
  },

  updateCategories: async (categories) => {
    try {
      const oldMeta = (await timeEntryBucket.getMeta()) || DEFAULT_META_VALUE;
      const newMeta: GlobalMeta = {
        ...oldMeta,
        categories,
      };
      await timeEntryBucket.metaStorage.setValue(newMeta);
      set({ categories });
    } catch (error) {
      console.error("更新分类失败:", error);
    }
  },

  addTag: async (tag) => {
    try {
      const { tags } = get();
      // 避免重复添加同名标签
      if (tags.some((t) => t.name === tag.name)) {
        return;
      }

      const newTags = [...tags, tag];

      const oldMeta = (await timeEntryBucket.getMeta()) || DEFAULT_META_VALUE;
      const newMeta: GlobalMeta = {
        ...oldMeta,
        tags: newTags,
      };
      await timeEntryBucket.metaStorage.setValue(newMeta);

      set({ tags: newTags });
    } catch (error) {
      console.error("添加标签失败:", error);
    }
  },

  updatePreferences: async (preferences) => {
    try {
      const oldMeta = (await timeEntryBucket.getMeta()) || DEFAULT_META_VALUE;
      const newMeta: GlobalMeta = {
        ...oldMeta,
        preferences,
      };
      await timeEntryBucket.metaStorage.setValue(newMeta);
      set({ preferences });
    } catch (error) {
      console.error("更新偏好设置失败:", error);
    }
  },
}));
