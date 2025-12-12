# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

TimeKeeper 是基于柳比歇夫时间管理法的 PWA 时间记录应用，采用无服务器架构，核心增量同步机制复用自 Cent 项目。

## 技术栈

- **框架**: React 19 + TypeScript 5.8
- **构建**: Vite 7 + pnpm
- **UI**: Tailwind CSS 4 + Radix UI
- **状态**: Zustand
- **存储**: IndexedDB (通过 idb 库)
- **同步**: 自定义增量同步机制 (StashBucket)

## 常用命令

```bash
# 开发
pnpm dev          # 启动开发服务器 (自动暴露到局域网)

# 构建和检查
pnpm build        # 先运行 lint，然后构建生产版本
pnpm lint         # 运行 TypeScript 类型检查和 Biome lint (仅 error 级别)
pnpm check        # 运行 Biome 并自动修复格式问题
pnpm analyze      # 构建并生成包大小分析

# 预览
pnpm preview      # 预览生产构建 (端口 5173)
```

## 核心架构

### 数据层 - 增量同步机制 (从 Cent 复用)

项目采用 **StashBucket** 架构实现增量同步，这是从 Cent 项目复用的核心机制:

1. **四层存储结构** (`src/database/stash.ts`):
   - `__stashes`: 增量操作记录 (Action 队列)
   - `__items`: 完整数据快照
   - `__meta`: 全局元数据 (分类、标签、项目、目标、用户偏好等)
   - `__config`: 本地配置

2. **操作类型**:
   - `Update<T>`: 新增/更新条目
   - `Delete<T>`: 删除条目 (仅存 ID)
   - `MetaUpdate`: 更新全局元数据

3. **关键概念**:
   - **Dense 操作**: 对同一 ID 的多次操作只保留最新的一次 (减少冗余)
   - **Overlap 标记**: 用于标识需要与远程同步合并的操作
   - **时间戳驱动**: 所有操作都带有时间戳，用于排序和冲突解决

4. **IndexedDB 实现** (`src/database/storage.ts`):
   - `TimeEntryIndexedDBStorage` 实现 `StashStorage` 接口
   - 为每个存储创建独立的 ObjectStore
   - 为 `startTime`, `endTime`, `creatorId` 创建索引以优化查询

### 状态管理 - Zustand Stores

**TimerStore** (`src/store/timerStore.ts`):
- 管理计时器状态 (运行/暂停/停止)
- 关键特性: `lastEndTime` 用于自动衔接上次活动的结束时间
- `stopTimer()` 会创建 `TimeEntry` 并通过 `timeEntryBucket.batch()` 保存到 IndexedDB

**TimeEntryStore** (`src/store/timeEntryStore.ts`):
- 管理时间条目的 CRUD 操作
- `loadTodayEntries()` 从 IndexedDB 加载今日所有活动
- `continueEntry()` 允许继续历史活动

**MetaStore** (`src/store/metaStore.ts`):
- 管理全局元数据 (分类、标签、项目、目标)
- 通过 `timeEntryBucket.metaStorage` 读写全局配置

### 类型系统 (`src/types/time.ts`)

核心类型定义:
- `TimeEntry`: 时间条目 (id, title, startTime, endTime, duration, categoryId, tagIds, 质量评分等)
- `TimeCategory`: 分类 (预设 15 个默认分类: 工作、学习、生活、娱乐、休息)
- `TimeTag`: 标签
- `Project`: 项目
- `TimeGoal`: 目标
- `GlobalMeta`: 全局元数据 (包含所有配置和偏好)
- `Full<T>`: 带有 `__create_at`, `__update_at`, `__delete_at` 的完整类型

### 路径别名

使用 `@/` 作为 `src/` 的别名:
```typescript
import { TimeEntry } from "@/types/time";
import { timeEntryBucket } from "@/database/timeEntryStorage";
```

## 代码规范 (Biome)

- **缩进**: 2 空格
- **引号**: 双引号
- **分号**: 必须
- **行宽**: 100 字符
- **尾逗号**: 始终添加
- `noExplicitAny`: 关闭 (允许 `any`)
- `noNonNullAssertion`: 警告级别

## PWA 配置

使用 `vite-plugin-pwa` 的 `injectManifest` 策略:
- Service Worker 源文件: `src/sw.ts`
- 自动更新模式
- 支持离线访问

## 重要注意事项

1. **数据持久化**: 所有 TimeEntry 操作都必须通过 `timeEntryBucket.batch()` 方法，而不是直接操作 IndexedDB
2. **时间戳**: 使用毫秒级时间戳 (`Date.now()`)，duration 使用秒
3. **ID 生成**: 使用 `crypto.randomUUID()` 或 `uuid.v4()` 生成唯一 ID
4. **默认分类**: 15 个预设分类定义在 `DEFAULT_CATEGORIES` 中，用户可自定义额外分类
5. **多用户**: 预留了 `creatorId` 字段用于未来多用户支持，当前使用 `"default-user"`
6. **同步机制**: 增量同步逻辑已从 Cent 项目复用，未来将集成 GitHub/Gitee/WebDAV 端点

## 未来集成计划

- **统计页面**: 使用 ECharts 显示时长统计、分类占比、时间趋势
- **同步端点**: `src/api/endpoints/` (GitHub/Gitee/WebDAV)
- **番茄钟**: `PomodoroConfig` 类型已定义，待实现 UI
- **目标管理**: `TimeGoal` 类型已定义，包含进度跟踪和提醒功能
