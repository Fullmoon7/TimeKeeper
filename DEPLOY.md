# TimeKeeper 部署到 Cloudflare Pages

## 📦 准备工作

1. **确保项目可以本地构建**：
   ```bash
   pnpm install
   pnpm build:prod
   ```

2. **创建 GitHub 仓库**（如果还没有）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/timekeeper.git
   git push -u origin main
   ```

## 🚀 方法一：通过 Cloudflare Pages Dashboard 部署（推荐）

### 1. 登录 Cloudflare Pages

访问 [Cloudflare Pages](https://pages.cloudflare.com/) 并登录。

### 2. 创建新项目

1. 点击 **"Create a project"**
2. 选择 **"Connect to Git"**
3. 授权 Cloudflare 访问你的 GitHub 账号
4. 选择 `timekeeper` 仓库

### 3. 配置构建设置

在构建设置页面填写：

| 配置项 | 值 |
|--------|-----|
| **Project name** | `timekeeper`（或自定义名称） |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `pnpm build:prod` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |
| **Node version** | `20` 或更高 |

### 4. 环境变量（可选）

如果需要，可以添加环境变量：
- 目前 TimeKeeper 不需要额外的环境变量

### 5. 开始部署

点击 **"Save and Deploy"**，Cloudflare 会自动：
1. 拉取代码
2. 安装依赖
3. 构建项目
4. 部署到全球 CDN

### 6. 部署完成

部署成功后，你会获得一个 URL：
```
https://timekeeper-xxx.pages.dev
```

## 🛠️ 方法二：使用 Wrangler CLI 本地部署

### 1. 安装 Wrangler

```bash
pnpm add -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 构建项目

```bash
pnpm build:prod
```

### 4. 部署

```bash
wrangler pages deploy dist --project-name=timekeeper
```

## 🔧 自定义域名（可选）

### 1. 在 Cloudflare Pages Dashboard 中

1. 进入你的项目
2. 点击 **"Custom domains"**
3. 点击 **"Set up a custom domain"**
4. 输入你的域名（例如：`timekeeper.yourdomain.com`）
5. 按照提示添加 DNS 记录

### 2. DNS 配置

Cloudflare 会自动配置 DNS，你只需要：
- 如果域名在 Cloudflare：自动完成
- 如果域名在其他服务商：添加 CNAME 记录指向 `timekeeper-xxx.pages.dev`

## ⚙️ CI/CD 自动部署

使用 GitHub 集成后，每次推送到 `main` 分支都会自动触发部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Cloudflare 会自动：
1. 检测到推送
2. 触发构建
3. 部署新版本
4. 保留之前的版本（可回滚）

## 🔍 预览部署

每个 Pull Request 都会自动创建预览部署：
- URL 格式：`https://<commit-hash>.timekeeper-xxx.pages.dev`
- 用于测试新功能，不影响生产环境

## 📊 监控和分析

在 Cloudflare Pages Dashboard 可以查看：
- 部署历史
- 构建日志
- 访问分析
- 错误日志

## 🐛 常见问题

### 1. 构建失败：找不到 pnpm

**解决方案**：在项目根目录创建 `.nvmrc` 文件：
```
20
```

或在 Cloudflare Pages 设置中设置环境变量：
```
NODE_VERSION=20
```

### 2. Service Worker 无法注册

**解决方案**：确保 HTTPS 协议。Cloudflare Pages 自动提供 HTTPS。

### 3. IndexedDB 数据丢失

**原因**：IndexedDB 是浏览器本地存储，切换设备会丢失数据。
**解决方案**：使用 GitHub/Gitee 同步功能定期备份数据。

### 4. PWA 无法离线访问

**检查**：
1. Service Worker 是否正确注册
2. 浏览器控制台是否有错误
3. Application > Service Workers 查看状态

### 5. 路由 404 错误

**解决方案**：`public/_redirects` 文件已配置 SPA 路由支持，确保该文件已包含在构建输出中。

## 🎯 性能优化建议

### 1. 启用 Auto Minify

在 Cloudflare Dashboard > Speed > Optimization：
- ✅ Auto Minify HTML
- ✅ Auto Minify CSS
- ✅ Auto Minify JavaScript

### 2. 启用 Brotli 压缩

Cloudflare 自动启用，无需配置。

### 3. 缓存策略

已在 `public/_headers` 中配置：
- 静态资源：1 年缓存
- HTML/Service Worker：不缓存，每次重新验证

## 📱 PWA 安装

部署成功后，用户可以：

### 桌面端
1. 访问网站
2. 浏览器地址栏会显示安装按钮
3. 点击安装

### 移动端
1. 访问网站
2. Safari/Chrome 菜单 > "添加到主屏幕"
3. 应用图标会出现在主屏幕

## 🔐 安全性

Cloudflare Pages 自动提供：
- ✅ HTTPS（Let's Encrypt）
- ✅ DDoS 防护
- ✅ Bot 防护
- ✅ 全球 CDN 加速

## 📈 后续优化

1. **添加 Web Analytics**（Cloudflare 提供免费分析）
2. **配置 CSP**（内容安全策略）
3. **添加 Rate Limiting**（API 频率限制）
4. **设置告警**（构建失败通知）

## 🎉 完成！

现在你的 TimeKeeper 应用已经部署到全球 CDN，可以在任何地方访问了！

**示例 URL**：
- 生产环境：`https://timekeeper.pages.dev`
- 自定义域名：`https://time.yourdomain.com`

---

**问题反馈**：如有部署问题，请查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/) 或提交 Issue。
