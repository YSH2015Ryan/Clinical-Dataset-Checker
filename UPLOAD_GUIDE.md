# Clinical Dataset Checker — 上传到GitHub指南

由于工作空间权限限制，请按以下步骤手动上传项目到GitHub：

## 前置条件

1. 已创建GitHub仓库：https://github.com/YSH2015Ryan/Clinical-Dataset-Checker
2. 已安装Git
3. 已配置GitHub SSH密钥或HTTPS凭证

## 上传步骤

### 1. 初始化本地仓库

```bash
cd D:\DeepSeekHarness\Clinical Dataset Checker
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 首次提交

```bash
git commit -m "Initial commit: Clinical Dataset Checker v1.0.0 - Complete implementation

- TypeScript + React 18 + Vite setup
- 15 deterministic data quality check rules
- CSV/XLSX local file parsing
- English and Simplified Chinese UI
- Privacy-first: all processing local, no data transmission
- Comprehensive test suite with Vitest
- HTML/JSON/CSV export functionality
- Full documentation and failure catalog"
```

### 4. 添加远程仓库

```bash
git remote add origin https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
# 或使用SSH
git remote add origin git@github.com:YSH2015Ryan/Clinical-Dataset-Checker.git
```

### 5. 推送到GitHub

```bash
git branch -M main
git push -u origin main
```

## 完成后的验证

推送成功后，验证以下内容：

1. ✓ 所有源文件已上传到 `src/`
2. ✓ 测试文件在 `tests/` 目录
3. ✓ 配置文件已提交（package.json, vite.config.ts等）
4. ✓ 文档在 `docs/` 目录
5. ✓ GitHub Actions工作流在 `.github/workflows/`

## 后续步骤

1. 启用GitHub Pages部署（Settings > Pages > Source: GitHub Actions）
2. 验证workflow是否成功运行
3. 访问部署的应用：https://YSH2015Ryan.github.io/Clinical-Dataset-Checker/
