import { encode, decode } from "js-base64";

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

const GITHUB_API_BASE = "https://api.github.com";
const BACKUP_REPO_NAME = "timekeeper-backup";
const BACKUP_FILENAME = "backup.json";

/**
 * GitHubService - 使用 GitHub Contents API
 * 与 GiteeService 保持一致的接口
 */
export class GitHubService {
  private token: string;
  private userInfo?: { id: number; login: string };

  constructor(token: string) {
    this.token = token;
  }

  private get headers(): HeadersInit {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  /**
   * 处理 API 响应错误
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      console.error(
        `GitHub API ${response.status} ${response.statusText}:`,
        text,
      );
      throw new Error(
        `GitHub API Error: ${response.status} ${response.statusText} - ${text}`,
      );
    }
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  /**
   * 验证 Token 有效性并获取用户信息
   */
  async getUser(): Promise<GitHubUser> {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      method: "GET",
      headers: this.headers,
    });
    const user = await this.handleResponse<GitHubUser>(response);
    this.userInfo = { id: user.id, login: user.login };
    return user;
  }

  /**
   * 获取或缓存用户信息
   */
  private async getCurrentUserInfo(): Promise<{ id: number; login: string }> {
    if (!this.userInfo) {
      await this.getUser();
    }
    return this.userInfo!;
  }

  /**
   * 查找备份仓库
   */
  async findBackupRepo(): Promise<GitHubRepo | null> {
    const user = await this.getCurrentUserInfo();
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${user.login}/${BACKUP_REPO_NAME}`,
        {
          method: "GET",
          headers: this.headers,
        },
      );
      if (!response.ok) {
        return null;
      }
      return this.handleResponse<GitHubRepo>(response);
    } catch {
      return null;
    }
  }

  /**
   * 创建备份仓库
   */
  async createBackupRepo(): Promise<GitHubRepo> {
    const response = await fetch(`${GITHUB_API_BASE}/user/repos`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        name: BACKUP_REPO_NAME,
        description: "TimeKeeper Data Backup (Auto-created, do not delete)",
        private: true,
        auto_init: false,
      }),
    });
    return this.handleResponse<GitHubRepo>(response);
  }

  /**
   * 获取远程文件的 SHA（用于更新时）
   */
  private async getRemoteFileSha(
    owner: string,
    repo: string,
    path: string,
    branch: string,
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
        {
          method: "GET",
          headers: this.headers,
        },
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.sha;
    } catch {
      return null;
    }
  }

  /**
   * 创建或更新备份文件
   */
  async saveBackup(content: string): Promise<void> {
    const user = await this.getCurrentUserInfo();
    let repo = await this.findBackupRepo();

    // 如果仓库不存在，先创建
    if (!repo) {
      repo = await this.createBackupRepo();
      // 等待仓库初始化完成
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const owner = user.login;
    const repoName = BACKUP_REPO_NAME;
    const branch = repo.default_branch || "main";

    // 将内容转换为 base64
    const base64Content = encode(content);

    // 检查文件是否已存在
    const remoteSha = await this.getRemoteFileSha(
      owner,
      repoName,
      BACKUP_FILENAME,
      branch,
    );

    const body = {
      message: `[TimeKeeper] Update backup at ${new Date().toISOString()}`,
      content: base64Content,
      branch,
      ...(remoteSha && { sha: remoteSha }),
    };

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}/contents/${encodeURIComponent(BACKUP_FILENAME)}`,
      {
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify(body),
      },
    );

    await this.handleResponse(response);
  }

  /**
   * 获取备份内容
   */
  async getBackup(): Promise<string> {
    const user = await this.getCurrentUserInfo();
    const repo = await this.findBackupRepo();

    if (!repo) {
      throw new Error("备份仓库不存在");
    }

    const owner = user.login;
    const repoName = BACKUP_REPO_NAME;
    const branch = repo.default_branch || "main";

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}/contents/${encodeURIComponent(BACKUP_FILENAME)}?ref=${branch}`,
      {
        method: "GET",
        headers: this.headers,
      },
    );

    const data = await this.handleResponse<{ content: string }>(response);

    if (!data.content) {
      throw new Error("备份文件内容为空");
    }

    // 解码 base64 内容（GitHub 返回的 base64 可能包含换行符）
    return decode(data.content.replace(/\n/g, ""));
  }
}
