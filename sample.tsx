import { ChevronRight, Clock, Play, Plus, Settings, Tag, X } from "lucide-react";
import React, { useEffect, useState } from "react";

// --- Types ---
type TimeLog = {
  id: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number; // Stored in seconds for easy calc
  description: string;
  tags: string[];
};

type TagOption = {
  id: string;
  label: string;
  color: string;
};

// --- Mock Data / Defaults ---
const DEFAULT_TAGS: TagOption[] = [
  { id: "1", label: "Work", color: "bg-blue-100 text-blue-800" },
  { id: "2", label: "Study", color: "bg-purple-100 text-purple-800" },
  { id: "3", label: "Rest", color: "bg-green-100 text-green-800" },
  { id: "4", label: "Commute", color: "bg-orange-100 text-orange-800" },
];

export default function RetroTimeTracker() {
  // --- State ---
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [lastLogTime, setLastLogTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [pendingEndTime, setPendingEndTime] = useState<Date | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // --- Timer Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastLogTime.getTime()) / 1000);
      setElapsedSeconds(diffInSeconds);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastLogTime]);

  // --- Format Helpers ---
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatTotalForHeader = () => {
    const totalSeconds = logs.reduce((acc, log) => acc + log.durationSeconds, 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // --- Handlers ---

  const handleLogClick = () => {
    const now = new Date();
    // Freeze the specific moment the button was clicked
    setPendingEndTime(now);
    setPendingDuration(elapsedSeconds);
    setIsModalOpen(true);
  };

  const handleSaveLog = () => {
    if (!pendingEndTime) return;

    const newLog: TimeLog = {
      id: Date.now().toString(),
      startTime: lastLogTime,
      endTime: pendingEndTime,
      durationSeconds: pendingDuration,
      description: description || "Untitled Activity",
      tags: selectedTags.length > 0 ? selectedTags : ["Uncategorized"],
    };

    setLogs([newLog, ...logs]); // Add to top of list
    setLastLogTime(pendingEndTime); // The end of this task is the start of the next

    // Reset Form
    setDescription("");
    setSelectedTags([]);
    setIsModalOpen(false);
  };

  const toggleTag = (tagLabel: string) => {
    if (selectedTags.includes(tagLabel)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagLabel));
    } else {
      setSelectedTags([...selectedTags, tagLabel]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim()) {
      toggleTag(customTagInput.trim());
      setCustomTagInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto border-x border-gray-200 shadow-xl">
      {/* --- HEADER --- */}
      <header className="px-6 py-5 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Today</h1>
          <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {formatTotalForHeader()}
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Tracked
            </span>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
          <Settings size={20} />
        </button>
      </header>

      {/* --- MAIN CONTENT (Timeline) --- */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {logs.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <p>No logs yet. Start your day!</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 group">
              {/* Time Column */}
              <div className="flex flex-col items-end min-w-[60px] pt-1">
                <span className="text-xs font-mono text-gray-500">{formatTime(log.endTime)}</span>
                <div className="h-full w-px bg-gray-200 my-1 mx-auto relative group-last:bg-transparent">
                  <div className="absolute top-0 right-[-3px] w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                </div>
              </div>

              {/* Card */}
              <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-800">{log.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {log.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-blue-600">
                    {formatDuration(log.durationSeconds)}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatTime(log.startTime)} - {formatTime(log.endTime)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- STICKY BOTTOM BAR --- */}
      <div className="bg-white border-t border-gray-200 p-4 pb-8 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {/* Live Timer Display */}
        <div className="flex justify-between items-end mb-3 px-2">
          <div>
            <span className="text-xs text-gray-400 block mb-1">Current Session</span>
            <span className="text-3xl font-mono font-bold text-gray-800">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">Since {formatTime(lastLogTime)}</div>
        </div>

        {/* Main Action Button */}
        <button
          onClick={handleLogClick}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <ChevronRight size={24} className="text-gray-400" />
          Log & Switch Task
        </button>
      </div>

      {/* --- MODAL (Data Entry) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-gray-500">Activity Duration</p>
                <h2 className="text-4xl font-mono font-bold text-blue-600 mt-1">
                  {formatDuration(pendingDuration)}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What did you do?
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Deep Work, Read emails..."
                  autoFocus
                  className="w-full text-lg border-b-2 border-gray-200 focus:border-black outline-none py-2 bg-transparent placeholder:text-gray-300 transition-colors"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DEFAULT_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.label)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                        selectedTags.includes(tag.label)
                          ? "border-black bg-black text-white shadow-md"
                          : "border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
                {/* Custom Tag Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomTag()}
                      placeholder="New tag..."
                      className="w-full bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  {customTagInput && (
                    <button onClick={handleAddCustomTag} className="bg-gray-200 p-2 rounded-lg">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveLog}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-lg mt-4 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
