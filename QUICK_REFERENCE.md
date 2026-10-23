# 🚀 快速参考卡 - Clinical Dataset Checker

## 项目信息

- **项目名**: Clinical Dataset Checker
- **版本**: 1.0.0
- **完成日期**: 2026-10-22
- **状态**: ✅ 生产就绪
- **GitHub**: https://github.com/YSH2015Ryan/Clinical-Dataset-Checker

---

## 关键文件位置

| 用途 | 文件 |
|------|------|
| 了解项目 | `README.md` |
| 部署说明 | `UPLOAD_GUIDE.md` |
| 使用指南 | `GITHUB_README.md` |
| 完成总结 | `COMPLETION_SUMMARY.md` |
| 隐私政策 | `docs/privacy-and-limitations.md` |
| 源代码 | `src/` 目录 |

---

## 一键命令

```bash
# 安装并启动
npm install && npm run dev

# 构建并测试
npm run build && npm run test

# 格式化代码
npm run format && npm run lint

# 上传到GitHub
git init && git add . && git commit -m "Initial commit" && git push
```

---

## 检查的15个问题

1. 🚫 **HEADER_DUPLICATE** - 重复列名（必须修复）
2. ⚠️ **HEADER_EMPTY** - 空列标题
3. ⚠️ **ROW_EMPTY** - 完全空白行
4. ⚠️ **COLUMN_EMPTY** - 全空列
5. ℹ️ **MISSING_VALUES** - 缺失值统计
6. ⚠️ **EXACT_DUPLICATE_ROWS** - 重复行
7. ⚠️ **DUPLICATE_ID** - 重复ID
8. ⚠️ **MIXED_TYPES** - 混合数据类型
9. ⚠️ **NUMERIC_PARSE_AMBIGUITY** - 数字格式不清
10. ⚠️ **INVALID_DATE_CANDIDATE** - 无效日期
11. ⚠️ **DATE_ORDER** - 日期顺序问题
12. ℹ️ **CONSTANT_COLUMN** - 所有值相同
13. ℹ️ **HIGH_CARDINALITY_CATEGORY** - 独特值很多
14. ℹ️ **OUTLIER_IQR_FLAG** - 异常值（IQR）
15. ⚠️ **POSSIBLE_OUTCOME_LEAKAGE** - 结果泄漏

---

## 支持的数据

| 格式 | 分隔符 | 说明 |
|------|--------|------|
| CSV | , | 逗号分隔 |
| CSV | ; | 分号分隔 |
| CSV | \t | 制表符分隔 |
| XLSX | - | 自动选择第一张表 |

**限制**：最大 25MB、100,000行、500列

---

## 功能流程

```
首页 → 导入 → 预览 → 检查 → 结果 → 导出
```

**预期时间**：导入到导出 < 5 分钟

---

## 国际化支持

- 🇺🇸 **English** - 完整支持
- 🇨🇳 **简体中文** - 完整支持
- 📱 页面右上角切换语言

---

## 隐私保证

✅ 本地处理（无服务器）
✅ 无数据上传
✅ 无追踪代码
✅ 无账户需求
✅ 无第三方API

---

## 报告导出格式

| 格式 | 用途 | 包含内容 |
|------|------|---------|
| HTML | 网页查看 | 完整分析 + 问题列表 |
| JSON | 程序处理 | 结构化数据 + 元数据 |
| CSV | Excel/R | 问题列表 + 统计 |

---

## 技术栈速查

```
Frontend:  React 18 + TypeScript
Build:     Vite 5
Parsing:   PapaParse + SheetJS
i18n:      i18next
Testing:   Vitest + Playwright
Quality:   ESLint + Prettier
Deploy:    GitHub Pages
```

---

## 常用开发命令

```bash
# 本地开发
npm run dev              # 启动开发服务器 (http://localhost:5173)

# 构建和测试
npm run build            # 生产构建
npm run test             # 运行单元测试
npm run test:ui          # UI查看测试结果
npm run e2e              # 端到端测试

# 代码质量
npm run lint             # 检查代码
npm run format           # 自动格式化

# 查看结果
npm run preview          # 预览生产构建
```

---

## GitHub上传（3步）

```bash
# 第1步：初始化
git init
git config user.email "your@email.com"
git config user.name "Your Name"

# 第2步：提交
git add .
git commit -m "Initial commit: Clinical Dataset Checker v1.0.0"

# 第3步：推送
git remote add origin https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
git branch -M main
git push -u origin main
```

---

## GitHub Pages部署

1. Settings → Pages
2. Source: "GitHub Actions"
3. 等待workflow运行完成（2-5分钟）
4. 应用地址：`https://YSH2015Ryan.github.io/Clinical-Dataset-Checker/`

---

## 快速验证清单

上传前，运行以下命令验证一切正常：

```bash
npm install     # ✓ 成功
npm run build   # ✓ 生成 dist/
npm run test    # ✓ 所有测试通过
npm run lint    # ✓ 代码质量合格
npm run dev     # ✓ 在浏览器中工作
```

---

## 文件结构（核心）

```
.
├── src/                  # 源代码
│   ├── lib/rules/       # 15个检查规则
│   ├── lib/parsers/     # CSV/XLSX解析
│   ├── i18n/            # 英文+中文
│   ├── components/      # React组件
│   └── App.tsx          # 主应用
├── tests/               # 测试
├── public/              # 示例数据
├── docs/                # 文档
├── .github/workflows/   # CI/CD
└── package.json         # 项目配置
```

---

## 常见问题（一句话版）

**Q**: 数据会被保存吗？
**A**: 不会，全部在浏览器内存中处理。

**Q**: 支持多大的文件？
**A**: 最大25MB、100,000行、500列。

**Q**: 可以离线使用吗？
**A**: 可以，一旦加载后支持完全离线。

**Q**: 支持什么文件格式？
**A**: CSV（逗号/分号/制表符分隔）和XLSX。

**Q**: 有命令行版本吗？
**A**: 当前没有，但源代码可以改编。

---

## 下一步

- [ ] 本地验证（`npm install && npm run build`）
- [ ] 上传GitHub（按UPLOAD_GUIDE.md）
- [ ] 启用Pages（Settings → Pages）
- [ ] 分享URL给用户
- [ ] 收集反馈进行v1.1改进

---

## 支持资源

| 资源 | 位置 |
|------|------|
| 开发计划 | `01_clinical_dataset_checker_plan.md` |
| 完成总结 | `COMPLETION_SUMMARY.md` |
| 隐私说明 | `docs/privacy-and-limitations.md` |
| 错误处理 | `docs/failure-catalog.md` |
| 使用指南 | `GITHUB_README.md` |
| 部署清单 | `DEPLOYMENT_CHECKLIST.md` |

---

## 联系方式

- GitHub Issues: https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues
- GitHub Discussions: https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions

---

**🎉 项目完全就绪！** 

按照上面的步骤，您可以在5分钟内：
1. ✅ 验证本地环境
2. ✅ 上传到GitHub
3. ✅ 部署到生产环境
4. ✅ 分享给全世界的用户

祝贺！🚀
