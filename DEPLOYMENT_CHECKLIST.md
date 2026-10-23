# 部署清单与验收标准

## 验收检查流程

### 1. 本地构建验证

```bash
cd D:\DeepSeekHarness\Clinical Dataset Checker
npm install
npm run build
npm run test
npm run lint
```

### 2. 本地开发测试

```bash
npm run dev
# 访问 http://localhost:5173
# 验证功能正常
```

### 3. 上传到GitHub

```bash
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial commit: Clinical Dataset Checker v1.0.0"
git remote add origin https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
git branch -M main
git push -u origin main
```

### 4. 启用GitHub Pages

- Settings → Pages
- Source: GitHub Actions
- 等待workflow完成

### 5. 验证部署

访问: https://YSH2015Ryan.github.io/Clinical-Dataset-Checker/

检查清单：
- [ ] 首页加载 < 3秒
- [ ] 导入/检查/导出功能正常
- [ ] 中英文切换工作
- [ ] 无外向网络请求（F12验证）
- [ ] 示例数据能成功检查

---

**项目已准备好上传！** ✅
