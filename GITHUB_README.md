# GitHub 快速开始指南

## 简介

**Clinical Dataset Checker** 是一个为临床研究者设计的本地数据质量预检工具。

- ✅ 完全本地处理：所有数据处理在浏览器中进行，永不上传
- ✅ 隐私优先：无服务器、无账户、无追踪
- ✅ 15个全面检查规则：覆盖常见的数据质量问题
- ✅ 多语言支持：英文和简体中文
- ✅ 轻量级：仅包含必要功能，加载速度快

## 快速使用

### 在线使用（推荐）

访问部署地址：https://YSH2015Ryan.github.io/Clinical-Dataset-Checker/

### 本地开发

1. **克隆仓库**
```bash
git clone https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
cd Clinical-Dataset-Checker
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```
然后在浏览器中打开 http://localhost:5173

## 使用流程

1. **导入数据**
   - 上传CSV或XLSX文件（最大25MB）
   - 指定标题行位置
   - 选择ID列（可选）
   - 标记缺失值代码

2. **预览数据**
   - 查看前20行数据
   - 确认格式正确

3. **运行检查**
   - 自动检查15个规则
   - 识别数据质量问题

4. **查看结果**
   - 按严重程度分类（阻塞/警告/信息）
   - 查看受影响的行和列
   - 获得改进建议

5. **导出报告**
   - HTML版本（可在浏览器中查看）
   - JSON格式（机器可读）
   - CSV格式（导入Excel或R）

## 检查规则

### 阻塞性问题（必须修复）

1. **HEADER_DUPLICATE** - 重复的列名

### 警告（应该检查）

2. **HEADER_EMPTY** - 空列标题
3. **ROW_EMPTY** - 完全空白行
4. **COLUMN_EMPTY** - 全空列
5. **EXACT_DUPLICATE_ROWS** - 完全相同的行
6. **DUPLICATE_ID** - 重复的ID值
7. **MIXED_TYPES** - 混合数据类型
8. **NUMERIC_PARSE_AMBIGUITY** - 数字格式不清楚
9. **POSSIBLE_OUTCOME_LEAKAGE** - 可能的结果泄漏

### 信息性问题（仅供参考）

10. **MISSING_VALUES** - 缺失值统计
11. **CONSTANT_COLUMN** - 所有值相同的列
12. **HIGH_CARDINALITY_CATEGORY** - 独特值很多的列
13. **OUTLIER_IQR_FLAG** - 潜在的异常值
14. **INVALID_DATE_CANDIDATE** - 无法解析的日期
15. **DATE_ORDER** - 日期逻辑问题

## 支持的数据格式

### CSV
- 逗号分隔（,）
- 分号分隔（;）
- 制表符分隔（\t）
- 自动检测分隔符

### XLSX
- 单工作表
- 自动选择第一个工作表

## 限制与免责

⚠️ **这个工具不**：

- 提供医学诊断或解释
- 自动修复数据
- 验证数据符合任何特定标准
- 处理超过100,000行或500列的数据
- 处理超过25MB的文件

✅ **这个工具仅**：

- 检查数据结构和质量
- 识别常见问题
- 提供改进建议
- 帮助预检查工作流程

## 开发

### 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run test         # 运行单元测试
npm run test:ui      # UI方式查看测试
npm run e2e          # 运行端到端测试
npm run e2e:ui       # UI方式查看E2E测试
npm run lint         # 代码质量检查
npm run format       # 自动格式化代码
```

### 项目结构

```
.
├── src/
│   ├── components/       # React组件
│   ├── lib/
│   │   ├── rules/        # 数据质量检查规则
│   │   └── parsers/      # CSV/XLSX解析器
│   ├── i18n/             # 国际化配置
│   ├── types/            # TypeScript类型定义
│   ├── App.tsx           # 主应用
│   ├── main.tsx          # 应用入口
│   └── *.css             # 样式文件
├── tests/
│   ├── unit/             # 单元测试
│   └── fixtures/         # 测试数据
├── public/               # 静态资源
├── docs/                 # 文档
├── .github/workflows/    # CI/CD配置
├── package.json          # 项目配置
├── vite.config.ts        # Vite配置
└── index.html            # HTML模板
```

### 技术栈

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 5
- **Parsing**: PapaParse + SheetJS
- **i18n**: i18next + react-i18next
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier

## 贡献

欢迎提交Issue和Pull Request！

### 报告Bug

请在 Issues 中详细描述：
- 操作步骤
- 期望结果
- 实际结果
- 使用的文件格式
- 浏览器和操作系统

### 功能建议

有想法？请打开一个Discussion或Issue来讨论！

## 隐私政策

- ✅ **完全本地处理**：所有数据在浏览器中处理
- ✅ **无数据上传**：没有任何数据发送到服务器
- ✅ **无追踪**：不使用Google Analytics或其他追踪工具
- ✅ **无Cookie**：不保存任何用户数据
- ✅ **无账户**：无需登录或创建账户

你可以在浏览器开发者工具（F12 → Network标签页）验证这一点。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 常见问题

### Q: 我的数据会被保存吗？
A: 不会。所有数据仅在您的浏览器中处理。关闭页面后，数据被立即丢弃。

### Q: 支持多少行数据？
A: 最多100,000行。对于更大的数据集，建议在R、Python或SQL中进行分析。

### Q: 可以处理Excel文件吗？
A: 是的，支持.xlsx文件。只能处理第一个工作表。

### Q: 有命令行版本吗？
A: 目前没有，但源代码可以轻松改编为Node.js CLI工具。

### Q: 可以自定义检查规则吗？
A: 当前版本不支持自定义规则。欢迎提交功能请求！

### Q: 离线可以使用吗？
A: 是的！工具完全本地运行。一旦加载，即使离线也可以工作。

## 获取帮助

- 📖 [文档](./docs/)
- 🐛 [Issue追踪](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues)
- 💬 [讨论](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions)

## 致谢

该项目旨在为临床研究社区提供一个简单、可靠、隐私友好的工具。

---

**开发者**：Clinical Research Team
**最后更新**：2026-10-22
**版本**：1.0.0
