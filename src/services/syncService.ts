import { GitHubService } from "./githubService";
import { GiteeService } from "./giteeService";

/**
 * 统一的同步服务接口
 * 支持 GitHub 和 Gitee 两种端点
 */

export type SyncProvider = "github" | "gitee";

export interface SyncUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

export interface SyncRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

/**
 * 同步服务接口
 */
export interface ISyncService {
  /**
   * 获取用户信息
   */
  getUser(): Promise<SyncUser>;

  /**
   * 查找备份仓库
   */
  findBackupRepo(): Promise<SyncRepo | null>;

  /**
   * 创建备份仓库
   */
  createBackupRepo(): Promise<SyncRepo>;

  /**
   * 保存备份
   */
  saveBackup(content: string): Promise<void>;

  /**
   * 获取备份
   */
  getBackup(): Promise<string>;
}

/**
 * 同步服务工厂
 */
export class SyncServiceFactory {
  static create(provider: SyncProvider, token: string): ISyncService {
    switch (provider) {
      case "github":
        return new GitHubService(token);
      case "gitee":
        return new GiteeService(token);
      default:
        throw new Error(`Unsupported sync provider: ${provider}`);
    }
  }
}

/**
 * 同步端点配置
 */
export const SYNC_PROVIDERS = [
  {
    id: "github" as const,
    name: "GitHub",
    icon: "🐙",
    tokenUrl: "https://github.com/settings/tokens/new?scopes=repo&description=TimeKeeper%20Sync",
    description: "使用 GitHub 仓库同步数据",
  },
  {
    id: "gitee" as const,
    name: "Gitee",
    icon: "🦊",
    tokenUrl: "https://gitee.com/profile/personal_access_tokens/new",
    description: "使用 Gitee 仓库同步数据（国内访问更快）",
  },
] as const;
