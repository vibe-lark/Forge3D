# Forge3D — GitHub 真实模型浏览器

从 GitHub 搜索公开仓库、扫描真实 `.glb` / `.gltf` 文件，并直接使用 Three.js 加载预览。

## 在线预览

[打开 Forge3D 妙笔在线版](https://magic.solutionsuite.cn/html-box/vpwMy2lUl3K)

当前精选库包含 71 个真实模型，其中 63 个优先通过妙笔 TOS 加载，并保留固定 GitHub commit 作为来源与回退。

## 运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173/`。

## 当前能力

- 加载固定 commit 的真实 GitHub GLB 模型
- 搜索 GitHub 仓库并扫描 repository tree 中的 `.glb` / `.gltf`
- 粘贴 GitHub `blob` 或 `raw.githubusercontent.com` 模型链接直接加载
- 支持普通 glTF、GLB、Draco、Meshopt 与 KTX2
- 自动居中、相机适配、动画播放、模型统计和截图
- 查看 GitHub 源文件、复制 Raw URL、下载真实模型文件
- 显示文件路径、大小、commit 和许可证风险提示
- GitHub API 限流时使用已索引的真实 GitHub 模型作为搜索结果

## GitHub API 限制

纯前端不能安全内置 GitHub Token。匿名 API 通常只有每个出口 IP 每小时 60 次请求，Repository Search 也有独立频率限制。正式产品应使用后端 GitHub App、缓存 repository tree、固定 commit，并建立真实模型索引。

## 许可说明

仓库许可证不等于其中每个 3D 模型的许可证。下载、商用或二次分发前，必须检查模型目录中的 `LICENSE`、README、署名和商标要求。
