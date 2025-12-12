import { Cloud, Download, ExternalLink, Loader2, LogOut, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SYNC_PROVIDERS, type SyncProvider } from "@/services/syncService";
import { useSyncStore } from "@/store/syncStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    provider: currentProvider,
    userInfo,
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    login,
    logout,
    syncToCloud,
    syncFromCloud,
  } = useSyncStore();

  const [selectedProvider, setSelectedProvider] = useState<SyncProvider>(currentProvider);
  const [inputToken, setInputToken] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  if (!isOpen) return null;

  const currentProviderConfig = SYNC_PROVIDERS.find((p) => p.id === currentProvider);

  const handleLogin = async () => {
    if (!inputToken.trim()) {
      toast.error("请输入 Token");
      return;
    }
    setIsLoginLoading(true);
    try {
      await login(inputToken.trim(), selectedProvider);
      setInputToken("");
    } catch (_error) {
      // Error handled in store
    } finally {
      setIsLoginLoading(false);
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return "从未";
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cloud className="text-blue-600" size={24} />
            云端同步
            {currentProviderConfig && (
              <span className="text-base font-normal text-gray-500">
                ({currentProviderConfig.icon} {currentProviderConfig.name})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4">
            {/* 端点选择器 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">选择同步端点</label>
              <div className="grid grid-cols-2 gap-3">
                {SYNC_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedProvider === provider.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{provider.icon}</div>
                    <div className="font-bold text-sm">{provider.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{provider.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Token 输入指南 */}
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
              <p className="font-medium">
                如何获取 {SYNC_PROVIDERS.find((p) => p.id === selectedProvider)?.name} Access
                Token?
              </p>
              <ol className="list-decimal list-inside space-y-1 opacity-90">
                {selectedProvider === "github" ? (
                  <>
                    <li>登录 GitHub 账号</li>
                    <li>进入 Settings &gt; Developer settings &gt; Personal access tokens</li>
                    <li>点击 "Generate new token (classic)"</li>
                    <li>
                      勾选 <b>repo</b> 权限（必须）
                    </li>
                    <li>复制生成的 Token 粘贴到下方</li>
                  </>
                ) : (
                  <>
                    <li>登录 Gitee 账号</li>
                    <li>进入 设置 &gt; 私人令牌</li>
                    <li>点击"生成新令牌"</li>
                    <li>
                      勾选 <b>projects</b> 权限（必须）
                    </li>
                    <li>复制生成的 Token 粘贴到下方</li>
                  </>
                )}
              </ol>
              <a
                href={SYNC_PROVIDERS.find((p) => p.id === selectedProvider)?.tokenUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 font-medium"
              >
                前往 {SYNC_PROVIDERS.find((p) => p.id === selectedProvider)?.name} 设置{" "}
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                私人令牌 (Access Token)
              </label>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="在此粘贴 Token..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoginLoading}
              className="w-full bg-black text-white h-12 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoginLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                `连接 ${SYNC_PROVIDERS.find((p) => p.id === selectedProvider)?.name}`
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 用户信息卡片 */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <img
                  src={userInfo?.avatar_url}
                  alt={userInfo?.name}
                  className="w-10 h-10 rounded-full border border-gray-200"
                />
                <div>
                  <div className="font-bold text-gray-900">{userInfo?.name}</div>
                  <div className="text-xs text-gray-500">@{userInfo?.login}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* 同步状态 */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">上次同步时间</p>
              <p className="font-mono font-medium text-gray-900">{formatTime(lastSyncTime)}</p>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={syncToCloud}
                disabled={isSyncing}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                <span className="font-bold text-sm">备份到云端</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("确定要从云端恢复吗？这将覆盖当前的本地数据！")) {
                    syncFromCloud();
                  }
                }}
                disabled={isSyncing}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Download size={24} />
                )}
                <span className="font-bold text-sm">从云端恢复</span>
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 px-4">
              数据将加密存储在您的 {currentProviderConfig?.name}{" "}
              私有仓库中，只有拥有 Token 的人才能访问。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
