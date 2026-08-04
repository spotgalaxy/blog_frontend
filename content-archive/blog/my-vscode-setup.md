---
title: 我的 VS Code 配置分享
date: 2026-05-25
summary: 工欲善其事，必先利其器。分享我用了三年的 VS Code 配置……
tags: [工具]
---

工欲善其事，必先利其器。分享我用了三年的 VS Code 配置，包括主题、插件、快捷键和一些不为人知的小技巧。

## 主题与字体

配色用的是暖色调的 Gruvbox Material，长时间写代码眼睛不累。字体是 JetBrains Mono 搭配连字（ligatures），`=>` 和 `!==` 显示成连笔符号，可读性意外地好。

```json
{
  "editor.fontFamily": "'JetBrains Mono', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 14,
  "editor.lineHeight": 1.7
}
```

## 必装插件（只留 8 个）

- **Error Lens**：行内显示报错，省去悬停查看的步骤
- **GitLens**：行尾 blame 信息，读老代码时救命
- **Prettier**：保存自动格式化，团队统一风格的底线
- **ESLint**： lint 错误即写即知
- **Auto Rename Tag**：改开标签自动同步闭标签
- **Path Intellisense**：路径自动补全
- **Todo Tree**：集中管理代码里的 TODO
- **图标主题**：Material Icon Theme，找文件快很多

## 三个改变习惯的快捷键

`Ctrl+P` 按文件名跳转、`Ctrl+Shift+F` 全局搜索、`F12` 跳到定义——把这三个用熟，鼠标在编辑器里基本就退休了。

## 一个冷门但实用的设置

`"editor.stickyScroll.enabled": true`——滚动时把当前的函数/类名钉在顶部，读长文件时再也不会「忘了自己在哪个函数里」。
