/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// 清理过期的缓存
cleanupOutdatedCaches();

// 预缓存并路由所有由 Vite 构建的资源
precacheAndRoute(self.__WB_MANIFEST);

// Service Worker 安装事件
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

// Service Worker 激活事件
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(self.clients.claim());
});

// 处理推送通知（可选，未来功能）
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "TimeKeeper";
  const options = {
    body: data.body || "时间记录提醒",
    icon: "/icon.png",
    badge: "/icon.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 处理通知点击事件
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow("/"),
  );
});
