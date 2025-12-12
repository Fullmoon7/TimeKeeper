import { Clock, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimeEntryStore } from "@/store/timeEntryStore";
import type { TimeEntry } from "@/types/time";
import { DEFAULT_CATEGORIES } from "@/types/time";

interface TimeEntryListProps {
  entries: TimeEntry[];
  isLoading: boolean;
}

export function TimeEntryList({ entries, isLoading }: TimeEntryListProps) {
  const { deleteEntry, continueEntry } = useTimeEntryStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    return category || { icon: "📝", name: "未分类", color: "#gray" };
  };

  const getTotalDuration = () => {
    return entries.reduce((total, entry) => total + entry.duration, 0);
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await deleteEntry(selectedEntry.id);
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Clock className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium">今日还没有活动记录</p>
          <p className="text-sm text-muted-foreground">开始你的第一个活动吧！</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* 统计信息 */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">今日共计</span>
              <span className="text-2xl font-bold">{formatDuration(getTotalDuration())}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">活动数</span>
              <span className="font-medium">{entries.length} 个</span>
            </div>
          </div>
        </Card>

        {/* 活动列表 */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {entries.map((entry, index) => {
            const category = getCategoryInfo(entry.categoryId);
            return (
              <Card
                key={entry.id}
                className="p-4 group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-label="分类图标">
                        {category.icon}
                      </span>
                      <span className="font-semibold text-base truncate">{entry.title}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDuration(entry.duration)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                          borderColor: `${category.color}30`,
                        }}
                      >
                        {category.name}
                      </Badge>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => continueEntry(entry)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>继续此活动</TooltipContent>
                    </Tooltip>

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedEntry(entry)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>确认删除</DialogTitle>
                          <DialogDescription>
                            确定要删除活动 "{selectedEntry?.title}" 吗？此操作无法撤销。
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            取消
                          </Button>
                          <Button variant="destructive" onClick={handleDelete}>
                            删除
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
