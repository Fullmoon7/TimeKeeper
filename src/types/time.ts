/** 地理位置类型 */
export type GeoLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  name?: string;
};

/** 时间条目 - 核心数据结构 */
export type TimeEntry = {
  /** 唯一标识 */
  id: string;

  /** 活动名称/描述 */
  title: string;

  /** 活动详细说明 */
  description?: string;

  /** 开始时间戳 (毫秒) */
  startTime: number;

  /** 结束时间戳 (毫秒) */
  endTime: number;

  /** 持续时长（秒），由 endTime - startTime 计算得出 */
  duration: number;

  /** 分类 ID */
  categoryId: string;

  /** 标签 ID 数组 */
  tagIds?: string[];

  /** 创建者 ID（多用户协作时使用） */
  creatorId: number | string;

  /** 时间记录的质量评分（1-5 星） */
  quality?: 1 | 2 | 3 | 4 | 5;

  /** 是否为计划内活动 */
  isPlanned?: boolean;

  /** 关联的项目 ID */
  projectId?: string;

  /** 备注 */
  notes?: string;

  /** 地理位置（可选） */
  location?: GeoLocation;

  /** 附件（如任务截图等） */
  attachments?: (File | string)[];
};

/** 分类类型 */
export type CategoryType = "work" | "study" | "life" | "entertainment" | "rest" | "custom";

/** 时间分类 */
export type TimeCategory = {
  /** 分类 ID */
  id: string;

  /** 分类名称 */
  name: string;

  /** 分类图标 */
  icon: string;

  /** 分类颜色 */
  color: string;

  /** 父分类 ID（支持二级分类） */
  parentId?: string;

  /** 分类类型 */
  type: CategoryType;

  /** 是否为自定义分类 */
  isCustom: boolean;

  /** 排序权重 */
  order?: number;

  /** 描述 */
  description?: string;
};

/** 时间标签 */
export type TimeTag = {
  /** 标签 ID */
  id: string;

  /** 标签名称 */
  name: string;

  /** 标签颜色 */
  color?: string;

  /** 标签图标 */
  icon?: string;

  /** 描述 */
  description?: string;
};

/** 目标类型 */
export type GoalType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

/** 时间目标 */
export type TimeGoal = {
  /** 目标 ID */
  id: string;

  /** 目标标题 */
  title: string;

  /** 目标描述 */
  description?: string;

  /** 目标类型 */
  type: GoalType;

  /** 目标时长（秒） */
  targetDuration: number;

  /** 适用的分类 ID（如果为空则表示总时长目标） */
  categoryIds?: string[];

  /** 适用的标签 ID */
  tagIds?: string[];

  /** 开始日期 */
  startDate: number;

  /** 结束日期 */
  endDate: number;

  /** 是否启用 */
  isActive: boolean;

  /** 创建者 ID */
  creatorId: number | string;

  /** 提醒设置 */
  reminder?: {
    enabled: boolean;
    /** 当进度低于此百分比时提醒 */
    threshold: number;
    /** 提醒时间（每天的特定时刻，如 20:00） */
    time?: string;
  };
};

/** 项目状态 */
export type ProjectStatus = "active" | "completed" | "archived";

/** 项目 */
export type Project = {
  /** 项目 ID */
  id: string;

  /** 项目名称 */
  name: string;

  /** 项目描述 */
  description?: string;

  /** 项目颜色 */
  color: string;

  /** 项目图标 */
  icon?: string;

  /** 项目状态 */
  status: ProjectStatus;

  /** 预计总时长（秒） */
  estimatedDuration?: number;

  /** 开始日期 */
  startDate?: number;

  /** 截止日期 */
  deadline?: number;

  /** 创建者 ID */
  creatorId: number | string;
};

/** 番茄钟配置 */
export type PomodoroConfig = {
  enabled: boolean;
  /** 工作时长（分钟） */
  workDuration: number;
  /** 短休息时长（分钟） */
  shortBreak: number;
  /** 长休息时长（分钟） */
  longBreak: number;
  /** 完成的番茄数 */
  completedPomodoros: number;
};

/** 计时器状态 */
export type TimerState = {
  /** 是否正在计时 */
  isRunning: boolean;

  /** 当前活动标题 */
  currentTitle?: string;

  /** 当前分类 ID */
  currentCategoryId?: string;

  /** 当前标签 IDs */
  currentTagIds?: string[];

  /** 当前项目 ID */
  currentProjectId?: string;

  /** 开始时间戳 */
  startTime?: number;

  /** 暂停的累计时长（秒） */
  pausedDuration: number;

  /** 暂停记录 */
  pauseHistory?: Array<{
    pauseTime: number;
    resumeTime: number;
  }>;

  /** 番茄钟模式 */
  pomodoroMode?: PomodoroConfig;
};

/** 用户偏好设置 */
export type UserPreferences = {
  /** 默认计时器模式 */
  defaultTimerMode: "normal" | "pomodoro";

  /** 时间显示格式 */
  timeFormat: "24h" | "12h";

  /** 周开始日 (0=周日, 1=周一) */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /** 每日工作开始时间 */
  workDayStart: string; // "09:00"

  /** 每日工作结束时间 */
  workDayEnd: string; // "18:00"

  /** 主题 */
  theme: "light" | "dark" | "auto";

  /** 语言 */
  locale: "zh-CN" | "en-US";

  /** 是否显示质量评分 */
  showQualityRating: boolean;

  /** 是否启用地理位置记录 */
  enableLocation: boolean;
};

/** 统计数据缓存 */
export type StatsCache = {
  lastUpdateTime: number;
  totalEntries: number;
  totalDuration: number;
  categoriesStats: Record<string, number>;
};

/** 全局元数据 */
export type GlobalMeta = {
  /** 版本号 */
  version: string;

  /** 默认分类列表 */
  categories: TimeCategory[];

  /** 标签列表 */
  tags: TimeTag[];

  /** 项目列表 */
  projects: Project[];

  /** 目标列表 */
  goals: TimeGoal[];

  /** 用户偏好设置 */
  preferences: UserPreferences;

  /** 统计数据缓存 */
  statsCache?: StatsCache;
};

/** 默认分类 */
export const DEFAULT_CATEGORIES: TimeCategory[] = [
  // 工作相关
  {
    id: "work-meeting",
    name: "会议",
    type: "work",
    icon: "👔",
    color: "#3B82F6",
    isCustom: false,
    order: 1,
  },
  {
    id: "work-coding",
    name: "编程",
    type: "work",
    icon: "💻",
    color: "#10B981",
    isCustom: false,
    order: 2,
  },
  {
    id: "work-reading",
    name: "阅读文档",
    type: "work",
    icon: "📖",
    color: "#6366F1",
    isCustom: false,
    order: 3,
  },
  {
    id: "work-planning",
    name: "规划",
    type: "work",
    icon: "📋",
    color: "#8B5CF6",
    isCustom: false,
    order: 4,
  },

  // 学习相关
  {
    id: "study-course",
    name: "课程学习",
    type: "study",
    icon: "🎓",
    color: "#8B5CF6",
    isCustom: false,
    order: 10,
  },
  {
    id: "study-practice",
    name: "练习",
    type: "study",
    icon: "✍️",
    color: "#EC4899",
    isCustom: false,
    order: 11,
  },
  {
    id: "study-reading",
    name: "阅读",
    type: "study",
    icon: "📚",
    color: "#F59E0B",
    isCustom: false,
    order: 12,
  },

  // 生活相关
  {
    id: "life-meal",
    name: "用餐",
    type: "life",
    icon: "🍽️",
    color: "#F59E0B",
    isCustom: false,
    order: 20,
  },
  {
    id: "life-exercise",
    name: "运动",
    type: "life",
    icon: "🏃",
    color: "#EF4444",
    isCustom: false,
    order: 21,
  },
  {
    id: "life-commute",
    name: "通勤",
    type: "life",
    icon: "🚗",
    color: "#64748B",
    isCustom: false,
    order: 22,
  },
  {
    id: "life-housework",
    name: "家务",
    type: "life",
    icon: "🧹",
    color: "#84CC16",
    isCustom: false,
    order: 23,
  },

  // 休息娱乐
  {
    id: "rest-sleep",
    name: "睡眠",
    type: "rest",
    icon: "😴",
    color: "#6B7280",
    isCustom: false,
    order: 30,
  },
  {
    id: "rest-break",
    name: "休息",
    type: "rest",
    icon: "☕",
    color: "#78716C",
    isCustom: false,
    order: 31,
  },
  {
    id: "entertainment-game",
    name: "游戏",
    type: "entertainment",
    icon: "🎮",
    color: "#F472B6",
    isCustom: false,
    order: 40,
  },
  {
    id: "entertainment-movie",
    name: "影视",
    type: "entertainment",
    icon: "🎬",
    color: "#A78BFA",
    isCustom: false,
    order: 41,
  },
  {
    id: "entertainment-social",
    name: "社交",
    type: "entertainment",
    icon: "👥",
    color: "#FB7185",
    isCustom: false,
    order: 42,
  },
];

/** 默认用户偏好 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultTimerMode: "normal",
  timeFormat: "24h",
  weekStartsOn: 1, // 周一
  workDayStart: "09:00",
  workDayEnd: "18:00",
  theme: "auto",
  locale: "zh-CN",
  showQualityRating: true,
  enableLocation: false,
};
