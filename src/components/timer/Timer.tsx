import { ChevronRight, Clock, Pencil, Plus, Settings, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useMetaStore } from "@/store/metaStore";
import { useSyncStore } from "@/store/syncStore";
import { useTimeEntryStore } from "@/store/timeEntryStore";
import { useTimerStore } from "@/store/timerStore";
import type { TimeEntry } from "@/types/time";
import { DEFAULT_CATEGORIES } from "@/types/time";

export function Timer() {
  const { startTimer, stopTimer } = useTimerStore();

  const { loadTodayEntries, todayEntries, isLoading, updateEntry, deleteEntry } =
    useTimeEntryStore();
  const { tags: globalTags, addTag, loadMeta } = useMetaStore();
  const { checkAuth } = useSyncStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [pendingEndTime, setPendingEndTime] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Edit Form State
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // 初始化：加载今日活动、全局配置并设置会话开始时间
  useEffect(() => {
    const init = async () => {
      await Promise.all([loadTodayEntries(), loadMeta(), checkAuth()]);

      // 从已加载的活动中获取最后结束时间
      const entries = useTimeEntryStore.getState().todayEntries;
      if (entries.length > 0) {
        // 找到最新的活动（按结束时间排序）
        const latestEntry = entries.reduce((latest, entry) =>
          entry.endTime > latest.endTime ? entry : latest,
        );
        setSessionStartTime(latestEntry.endTime);
      } else {
        // 如果没有活动，使用当前时间
        setSessionStartTime(Date.now());
      }
    };

    init();
  }, [loadTodayEntries, loadMeta, checkAuth]);

  // 计时器逻辑 - 持续计时
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Format Helpers
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const toLocalISOString = (timestamp: number) => {
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const formatTotalForHeader = () => {
    const totalSeconds = todayEntries.reduce((acc, entry) => acc + entry.duration, 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getCategoryInfo = (categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    return category || { icon: "📝", name: "未分类", color: "#gray" };
  };

  // Handlers
  const handleLogClick = () => {
    const now = Date.now();
    setPendingEndTime(now);
    setPendingDuration(elapsedSeconds);
    setDescription("");
    setSelectedTags([]);
    setIsModalOpen(true);
  };

  const handleEditClick = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setDescription(entry.title);
    setEditStartTime(toLocalISOString(entry.startTime));
    setEditEndTime(toLocalISOString(entry.endTime));

    // 加载标签：优先使用 tagIds，如果没有则使用 categoryId 对应的标签
    if (entry.tagIds && entry.tagIds.length > 0) {
      setSelectedTags(entry.tagIds);
    } else {
      const category = DEFAULT_CATEGORIES.find((c) => c.id === entry.categoryId);
      setSelectedTags(category ? [category.name] : []);
    }

    setIsEditModalOpen(true);
  };

  const handleSaveLog = async () => {
    if (!pendingEndTime) return;

    const title = description || "未命名活动";
    // 仍然计算一个主分类 ID，用于兼容性
    const categoryId =
      selectedTags.length > 0
        ? DEFAULT_CATEGORIES.find((cat) => selectedTags.includes(cat.name))?.id || "work-coding"
        : "work-coding";

    // 先开始计时器以记录时间
    startTimer({
      title,
      categoryId,
      tagIds: selectedTags, // 保存所有标签
      startTime: sessionStartTime,
    });

    // 立即停止以保存记录
    await stopTimer();

    // 重置表单
    setDescription("");
    setSelectedTags([]);
    setIsModalOpen(false);

    // 更新会话开始时间为刚刚结束的时间
    setSessionStartTime(pendingEndTime);

    // 重新加载今日活动
    await loadTodayEntries();
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    const title = description || "未命名活动";
    const categoryId =
      selectedTags.length > 0
        ? DEFAULT_CATEGORIES.find((cat) => selectedTags.includes(cat.name))?.id || "work-coding"
        : "work-coding";

    const startTime = new Date(editStartTime).getTime();
    const endTime = new Date(editEndTime).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      // toast.error("时间格式不正确");
      return;
    }

    if (startTime >= endTime) {
      // toast.error("结束时间必须晚于开始时间");
      return;
    }

    await updateEntry(editingEntry.id, {
      title,
      categoryId,
      tagIds: selectedTags, // 保存所有标签
      startTime,
      endTime,
    });

    setIsEditModalOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async () => {
    if (!editingEntry) return;
    if (confirm("确定要删除这条记录吗？")) {
      await deleteEntry(editingEntry.id);
      setIsEditModalOpen(false);
      setEditingEntry(null);
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleAddCustomTag = async () => {
    if (customTagInput.trim()) {
      const tagName = customTagInput.trim();
      toggleTag(tagName);

      // 保存到全局标签库
      await addTag({
        id: crypto.randomUUID(),
        name: tagName,
      });

      setCustomTagInput("");
    }
  };

  // Helper to render tag buttons
  const renderTagButtons = () => {
    // 1. 默认分类标签
    const defaultTagNames = DEFAULT_CATEGORIES.map((c) => c.name);

    // 2. 全局自定义标签
    const globalTagNames = globalTags.map((t) => t.name);

    // 3. 当前选中但尚未保存到全局的标签（理论上 handleAddCustomTag 已经保存了，但为了保险）
    const tempTags = selectedTags.filter(
      (t) => !defaultTagNames.includes(t) && !globalTagNames.includes(t),
    );

    // 合并所有要显示的标签，并去重
    const allDisplayTags = Array.from(
      new Set([...defaultTagNames, ...globalTagNames, ...tempTags]),
    );

    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {allDisplayTags.map((tagName) => (
          <button
            key={tagName}
            onClick={() => toggleTag(tagName)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedTags.includes(tagName)
                ? "bg-black text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tagName}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] w-full bg-background">
        {/* 头部统计 */}
        <div className="sticky top-0 z-10 px-6 py-6 bg-background/90 backdrop-blur-md border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              今日统计
            </h2>
            <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
              {formatTotalForHeader()}
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>

        {/* 主内容 - 时间线 */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 space-y-4 pb-40">
          {todayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
              <div className="p-4 bg-muted rounded-full">
                <Clock size={20} />
              </div>
              <p className="text-sm">点击底部按钮，记录你的第一个活动</p>
            </div>
          ) : (
            todayEntries.map((entry: TimeEntry, index: number) => {
              const category = getCategoryInfo(entry.categoryId);
              // 优先显示 tagIds，如果没有则显示 category.name
              const displayTags =
                entry.tagIds && entry.tagIds.length > 0 ? entry.tagIds : [category.name];

              return (
                <div
                  key={entry.id}
                  className="flex gap-3 group animate-in slide-in-from-bottom-2 duration-300 cursor-pointer"
                  onClick={() => handleEditClick(entry)}
                >
                  {/* 时间列 */}
                  <div className="flex flex-col items-end min-w-[80px] pt-2">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground">
                      {formatTime(entry.endTime)}
                    </span>
                    <div
                      className={`h-full w-[2px] bg-border my-1 mx-auto relative rounded-full ${
                        index === todayEntries.length - 1 ? "opacity-0" : ""
                      }`}
                    ></div>
                  </div>

                  {/* 卡片 */}
                  <div className="flex-1 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-sm flex justify-between items-start hover:shadow-md transition-shadow group-hover:border-primary/20">
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {entry.title}
                        <Pencil
                          size={12}
                          className="opacity-0 group-hover:opacity-50 transition-opacity"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {displayTags.map((tagName) => (
                          <span
                            key={tagName}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                          >
                            #{tagName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right pl-2 flex-shrink-0">
                      <div className="font-mono font-bold text-primary text-lg leading-none mb-1">
                        {formatDuration(entry.duration)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* 底部固定栏 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  正在进行
                </span>
                <div className="text-4xl font-mono font-bold text-foreground mt-1 tabular-nums tracking-tight">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-medium pb-1">
                开始于 {formatTime(sessionStartTime)}
              </div>
            </div>

            {/* 主操作按钮 */}
            <button
              onClick={handleLogClick}
              className="w-full bg-primary text-primary-foreground h-16 rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:translate-x-1 transition-transform">记录并切换</span>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* 记录模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">刚刚完成了</p>
                  <h2 className="text-3xl font-mono font-bold text-blue-600 mt-1">
                    {formatDuration(pendingDuration)}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                {/* 描述输入 */}
                <div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="刚才做了什么？"
                    autoFocus
                    className="w-full text-xl font-medium border-b-2 border-gray-100 focus:border-black outline-none py-2 bg-transparent placeholder:text-gray-300 transition-colors"
                  />
                </div>

                {/* 标签选择 */}
                <div>
                  {renderTagButtons()}

                  {/* 自定义标签输入 */}
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Tag size={14} className="text-gray-400" />
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomTag()}
                      placeholder="输入新标签..."
                      className="bg-transparent text-sm w-full outline-none placeholder:text-gray-300"
                    />
                    {customTagInput && (
                      <button
                        onClick={handleAddCustomTag}
                        className="hover:scale-110 transition-transform"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 保存按钮 */}
                <button
                  onClick={handleSaveLog}
                  className="w-full bg-blue-600 text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all mt-2"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑模态框 */}
        {isEditModalOpen && editingEntry && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">编辑记录</p>
                  <h2 className="text-3xl font-mono font-bold text-blue-600 mt-1">
                    {formatDuration(editingEntry.duration)}
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                {/* 描述输入 */}
                <div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="活动名称"
                    autoFocus
                    className="w-full text-xl font-medium border-b-2 border-gray-100 focus:border-black outline-none py-2 bg-transparent placeholder:text-gray-300 transition-colors"
                  />
                </div>

                {/* 时间编辑 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">开始时间</label>
                    <input
                      type="datetime-local"
                      step="1"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">结束时间</label>
                    <input
                      type="datetime-local"
                      step="1"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 标签选择 */}
                <div>{renderTagButtons()}</div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleDeleteEntry}
                    className="flex-1 bg-red-50 text-red-600 h-14 rounded-xl font-bold text-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    删除
                  </button>
                  <button
                    onClick={handleUpdateEntry}
                    className="flex-[2] bg-blue-600 text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                  >
                    更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 设置模态框 */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </>
  );
}
