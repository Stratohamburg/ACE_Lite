# ACE_Lite

## GitHub Pages

项目现在已经适配 GitHub Pages：

- 本地开发仍然使用 `/` 作为站点根路径。
- 在 GitHub Actions 中构建时，会自动根据仓库名生成正确的 `base`。
- 如果仓库是 `<user>.github.io` 这种用户主页仓库，会自动回退到 `/`。
- 如果你要手动指定部署子路径，可以在构建前设置 `VITE_BASE_PATH`，例如 `VITE_BASE_PATH=/ACE_Lite/ npm run build`。

### 启用方式

1. 将仓库推送到 GitHub。
2. 打开仓库的 `Settings -> Pages`。
3. 在 `Source` 中选择 `GitHub Actions`。
4. 向 `main` 分支推送后，工作流会自动发布 `dist` 到 GitHub Pages。