import { decode, encode } from "js-base64";

export interface GiteeUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

export interface GiteeRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

const GITEE_API_BASE = "https://gitee.com/api/v5";
const BACKUP_REPO_NAME = "timekeeper-backup";
const BACKUP_FILENAME = "backup.json";

/**
 * GiteeService - 参考 Cent 项目的 Giteeray 实现
 * 使用 Contents API 而不是 Gist API，更稳定可靠
 */
export class GiteeService {
  private token: string;
  private userInfo?: { id: number; login: string };

  constructor(token: string) {
    this.token = token;
  }

  private get headers(): HeadersInit {
    return {
      Accept: "application/json",
      Authorization: `token ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * 处理 API 响应错误
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      console.error(`Gitee API ${response.status} ${response.statusText}:`, text);
      throw new Error(`Gitee API Error: ${response.status} ${response.statusText} - ${text}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  /**
   * 验证 Token 有效性并获取用户信息
   */
  async getUser(): Promise<GiteeUser> {
    const response = await fetch(`${GITEE_API_BASE}/user`, {
      method: "GET",
      headers: this.headers,
    });
    const user = await this.handleResponse<GiteeUser>(response);
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
  async findBackupRepo(): Promise<GiteeRepo | null> {
    const user = await this.getCurrentUserInfo();
    try {
      const response = await fetch(`${GITEE_API_BASE}/repos/${user.login}/${BACKUP_REPO_NAME}`, {
        method: "GET",
        headers: this.headers,
      });
      if (!response.ok) {
        return null;
      }
      return this.handleResponse<GiteeRepo>(response);
    } catch {
      return null;
    }
  }

  /**
   * 创建备份仓库
   */
  async createBackupRepo(): Promise<GiteeRepo> {
    const response = await fetch(`${GITEE_API_BASE}/user/repos`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        name: BACKUP_REPO_NAME,
        description: "TimeKeeper Data Backup (Auto-created, do not delete)",
        private: true,
        auto_init: false,
      }),
    });
    return this.handleResponse<GiteeRepo>(response);
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
        `${GITEE_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
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
    const branch = repo.default_branch || "master";

    // 将内容转换为 base64
    const base64Content = encode(content);

    // 检查文件是否已存在
    const remoteSha = await this.getRemoteFileSha(owner, repoName, BACKUP_FILENAME, branch);

    const body = {
      message: `[TimeKeeper] Update backup at ${new Date().toISOString()}`,
      content: base64Content,
      branch,
      ...(remoteSha && { sha: remoteSha }),
    };

    const method = remoteSha ? "PUT" : "POST";
    const response = await fetch(
      `${GITEE_API_BASE}/repos/${owner}/${repoName}/contents/${encodeURIComponent(BACKUP_FILENAME)}`,
      {
        method,
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
    const branch = repo.default_branch || "master";

    const response = await fetch(
      `${GITEE_API_BASE}/repos/${owner}/${repoName}/contents/${encodeURIComponent(BACKUP_FILENAME)}?ref=${branch}`,
      {
        method: "GET",
        headers: this.headers,
      },
    );

    const data = await this.handleResponse<{ content: string }>(response);

    if (!data.content) {
      throw new Error("备份文件内容为空");
    }

    // 解码 base64 内容
    return decode(data.content);
  }
}
