# TimeKeeper - 时间管理应用

> 基于柳比歇夫时间管理法的 PWA 应用，支持 GitHub/Gitee 云端同步

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](./DEPLOY.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## 🎉 项目状态

✅ **功能完整** - 核心时间记录、云端同步、PWA 离线支持已实现

## ✨ 当前功能

- ⏱️ **实时计时器** - 开始/暂停/停止/继续功能
- 📝 **时间记录** - 活动名称、分类、标签、备注
- 📊 **今日统计** - 实时展示今日总时长
- 📋 **时间线** - 今日活动列表，支持编辑/删除/继续
- 🏷️ **分类管理** - 15 个预设分类 + 自定义分类
- 🎨 **主题支持** - 亮色/暗色主题自动切换
- ☁️ **云端同步** - 支持 GitHub 和 Gitee 双端点备份
- 📱 **PWA 支持** - 离线访问、添加到主屏幕
- 💾 **本地存储** - IndexedDB 持久化，数据不丢失

## 技术栈

- **框架**: React 19 + TypeScript 5.8
- **构建**: Vite 7 + pnpm
- **UI**: Tailwind CSS 4 + Radix UI
- **状态**: Zustand
- **存储**: IndexedDB (idb)
- **同步**: GitHub / Gitee Contents API
- **PWA**: vite-plugin-pwa + Workbox

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（自动暴露到局域网）
pnpm dev

# 构建生产版本
pnpm build:prod

# 代码检查
pnpm lint

# 代码格式化
pnpm check

# 预览生产构建
pnpm preview
```

### 部署到 Cloudflare Pages

详细步骤请查看 [部署文档](./DEPLOY.md)

**快速部署**：

1. 推送代码到 GitHub
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 连接 GitHub 仓库
4. 配置构建命令：`pnpm build:prod`
5. 输出目录：`dist`
6. 点击部署

部署完成后即可全球访问，支持：
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动部署（推送即更新）
- ✅ 预览部署（PR 自动预览）

## 项目结构

```
src/
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件 (Radix UI)
│   ├── timer/            # 计时器相关组件
│   ├── settings/         # 设置和同步页面
│   └── ThemeToggle.tsx   # 主题切换
├── database/             # 数据层
│   ├── stash.ts         # 增量同步核心
│   ├── storage.ts       # IndexedDB 封装
│   └── timeEntryStorage.ts  # TimeEntry 存储实例
├── services/             # 服务层
│   ├── githubService.ts # GitHub 同步服务
│   ├── giteeService.ts  # Gitee 同步服务
│   └── syncService.ts   # 统一同步接口
├── store/                # Zustand 状态管理
│   ├── timerStore.ts    # 计时器状态
│   ├── timeEntryStore.ts # 时间条目状态
│   ├── metaStore.ts     # 全局配置状态
│   └── syncStore.ts     # 同步状态
├── types/                # TypeScript 类型
│   └── time.ts          # 核心类型定义
├── sw.ts                 # Service Worker
└── App.tsx               # 主应用组件
```

## 📖 使用指南

### 1. 时间记录

1. 点击"开始"按钮开始计时
2. 输入活动名称（例如："深度工作 - 编写代码"）
3. 选择分类（例如："编程"）
4. 点击"停止"保存记录

### 2. 云端同步

#### GitHub 同步

1. 访问 [GitHub Token 设置](https://github.com/settings/tokens/new?scopes=repo&description=TimeKeeper%20Sync)
2. 勾选 **repo** 权限
3. 复制生成的 Token
4. 在应用设置中选择 GitHub，粘贴 Token
5. 点击"备份到云端"

#### Gitee 同步（国内推荐）

1. 访问 [Gitee 私人令牌](https://gitee.com/profile/personal_access_tokens/new)
2. 勾选 **projects** 权限
3. 复制生成的 Token
4. 在应用设置中选择 Gitee，粘贴 Token
5. 点击"备份到云端"

### 3. 多设备同步

- 在设备 A 上备份数据
- 在设备 B 上登录相同账号
- 点击"从云端恢复"
- 数据自动同步

## 🎯 特色功能

### 增量同步机制

借鉴 Cent 项目的 StashBucket 架构：
- **四层存储**：stashes（增量操作）+ items（完整快照）+ meta（全局配置）+ config（本地配置）
- **Dense 操作**：自动合并对同一条目的多次操作
- **时间戳驱动**：所有操作带时间戳，支持冲突解决

### PWA 离线支持

- Service Worker 预缓存核心资源
- IndexedDB 本地持久化
- 离线也能记录时间
- 有网络时自动同步

## 📝 License

MIT

## 🤝 参考项目

- [Cent](../Cent/) - 记账应用，本项目借鉴了其增量同步机制
