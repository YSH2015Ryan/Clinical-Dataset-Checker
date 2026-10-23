# 临床数据集检查器 (Clinical Dataset Checker)

[English](README.md) | **简体中文**

[![GitHub License](https://img.shields.io/github/license/YSH2015Ryan/Clinical-Dataset-Checker)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/YSH2015Ryan/Clinical-Dataset-Checker?style=social)](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker)
[![GitHub Issues](https://img.shields.io/github/issues/YSH2015Ryan/Clinical-Dataset-Checker)](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues)

**一款隐私优先、完全本地运行的临床研究数据质量预检工具。**

**[在线试用 →](https://ysh2015ryan.github.io/Clinical-Dataset-Checker/)**

---

## 价值主张

在开始统计分析之前，研究人员往往需要花费数小时手工检查数据中的：

- 缺失值及不统一的缺失代码
- 重复记录和重复的受试者 ID
- 格式问题（日期、数值、分类变量）
- 混合类型与异常取值

**Clinical Dataset Checker** 通过 **15 条确定性规则** 自动完成这一繁琐过程，几秒内识别常见的数据质量问题——全程无需上传任何数据。

### 核心优势

| 特性           | 说明                                             |
| -------------- | ------------------------------------------------ |
| **本地处理**   | 数据永不离开你的设备——无服务器上传               |
| **隐私优先**   | 零追踪、零分析统计、无需注册账号                 |
| **15 条规则**  | 全面覆盖常见的结构性问题                         |
| **双语界面**   | 完整支持英文与简体中文                           |
| **多格式**     | 支持 CSV 与 XLSX，分隔符自动识别                 |
| **报告导出**   | HTML、JSON、CSV 三种格式                         |

---

## 快速开始

### 方式一：在线使用（推荐）

访问 **<https://ysh2015ryan.github.io/Clinical-Dataset-Checker/>**——无需安装，数据不上传。

### 方式二：本地运行

```bash
git clone https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
cd Clinical-Dataset-Checker
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

### 方式三：生产构建

```bash
npm run build
# 输出到 dist/ —— 可部署到任意静态托管服务
```

---

## 使用说明（分步详解）

应用按五个页面引导你完成流程：**首页 → 导入 → 预览 → 结果 → 导出**。

### 第 1 步 —— 首页

两个入口：

- **Try Sample Dataset（试用示例数据）**——加载内置的 `sample-clinical-data.csv`，其中包含故意埋入的问题（重复记录、缺失值、重复 ID 等）。首次使用推荐从这里开始。
- **Check My File（检查我的文件）**——上传你自己的 CSV 或 XLSX 文件。

页头的语言切换按钮可随时在 English 与简体中文之间切换。

### 第 2 步 —— 导入与配置

拖拽文件到上传区（或点击选择）。限制：**25 MB**、**100,000 行**、**500 列**。

解析完成后，配置文件解读方式：

| 选项                                   | 作用                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Worksheet 工作表**（仅 XLSX）        | 选择要分析的工作表。                                                                                          |
| **Separator 分隔符**（仅 CSV）         | 字段分隔符。默认自动识别（逗号、分号或制表符）；识别错误时可手动覆盖。                                        |
| **Header Row 表头行**                  | 列名所在的行（默认第 1 行）。若文件顶部有说明性元数据行，可增大该值。                                         |
| **ID Column ID 列**（可选）            | 标识受试者的列。设置后启用重复 ID 检查。                                                                      |
| **Study Design 研究设计**              | 若为纵向数据（一名受试者对应多行），勾选 "Is this longitudinal data?"。重复 ID 将从"阻断"降级为"警告"。       |
| **Analysis Unit 分析单元**             | 自由文本描述分析单元（如 `per-participant`、`per-visit`），会被记录在报告中便于追溯。                         |
| **Missing Data Markers 缺失标记**      | 除空单元格外，视为缺失的自定义代码，逗号分隔。默认：`NA, N/A, NULL, unknown, -`。匹配不区分大小写。           |
| **Date Columns 日期列**                | 勾选应包含日期的列。期望格式为 ISO `YYYY-MM-DD`（或 `YYYY/MM/DD`），其他取值会被标记。                        |
| **Start / End Date Column 起止日期列**（可选） | 设置后，结束日期早于开始日期的行会被标记。                                                              |

解析警告也会在此显示，例如：

- **公式警告**（XLSX）：单元格包含公式——只读取缓存值，可能是过期值。如数值异常，请在 Excel 中重新保存后再导入。
- **CSV 解析警告**：解析器报告的格式异常行。

点击 **Preview Data（预览数据）** 继续。

### 第 3 步 —— 预览

检查前确认：

- 文件名、大小、总行数与总列数
- 前 20 行的表格渲染
- 所有解析警告

如发现问题（分隔符错误、表头行错误等），点击 **Back to Import（返回导入）** 调整配置。确认无误后点击 **Start Quality Check（开始质量检查）**。

### 第 4 步 —— 查看结果

结果页面包含：

1. **Data Summary 数据概览**——总行数、总列数、缺失单元格数、总单元格数、缺失率。
2. **按严重程度分组的问题列表：**
   - **Blockers 阻断**（红色）——当前配置下数据无法被可靠解读（如重复列名）。优先处理。
   - **Warnings 警告**（黄色）——需要复核的问题（如重复 ID、非法日期）。
   - **Information 提示**（蓝色）——值得了解的事实（如缺失值统计、潜在离群值）。
3. **Filter by severity 按严重程度筛选**，一次聚焦一个级别。

点击任意问题卡片可展开查看：

- **Columns 涉及列**
- **Affected Rows 受影响行数**
- **Sample data rows 示例行号**（从 1 开始的行号，便于在源文件中定位）
- **Suggested action 建议操作**——具体的核查或修复指引

若存在阻断级问题，页面顶部会出现横幅，提醒导出前必须先复核。

### 第 5 步 —— 导出报告

三种格式可选：

| 格式             | 内容                                                          | 适用场景               |
| ---------------- | ------------------------------------------------------------- | ---------------------- |
| **HTML Report**  | 人类可读报告：概览、严重程度分区、问题详情                    | 分享给协作者、归档     |
| **JSON Data**    | 机器可读报告（含 `schemaVersion`）；**不含原始数据行**        | 流水线集成、审计留痕   |
| **Issues (CSV)** | 每条问题详情一行，兼容电子表格                                | 在 Excel 中跟踪修复    |

若存在阻断级问题，必须勾选 **"I have reviewed the blocker issues and want to export anyway"（我已复核阻断问题，仍要导出）** 才能下载。导出的报告会被标记为"含未解决的阻断问题"。

报告中**只包含检查结果——绝不包含你的原始数据集**。

---

## 检查内容

### 严重问题（阻断）

- **Duplicate Column Names 重复列名**——归一化后无法唯一标识的列

### 重要警告

- **Empty Headers 空表头**——缺失的列名
- **Empty Rows / Columns 空行 / 空列**——完全空白的记录或字段
- **Exact Duplicate Rows 完全重复行**——多次出现的相同记录
- **Duplicate IDs 重复 ID**——不唯一的受试者标识（非纵向数据时为阻断，纵向时为警告）
- **Mixed Data Types 混合类型**——单列同时包含数值、文本和/或日期
- **Numeric Format Ambiguity 数值格式歧义**——小数点/千分位分隔符不明（如 `1,234` 与 `1.234`）
- **Invalid Dates 非法日期**——声明的日期列中无法解析的取值
- **Date Order Issues 日期顺序问题**——结束日期早于开始日期
- **Possible Outcome Leakage 疑似结局泄漏**——列名暗示可能包含结局信息

### 提示信息

- **Missing Values 缺失值**——每列的缺失计数与百分比
- **Constant Columns 常量列**——只有一个唯一值的列
- **High-Cardinality Categories 高基数分类**——唯一值占比 >50% 的文本列
- **Outlier Detection 离群值检测**——IQR 法（超出 Q1 − 1.5×IQR 或 Q3 + 1.5×IQR 的值，采用 R Type 7 分位数定义）

所有规则均为**确定性规则**：相同文件与相同配置必然产生相同结果。

---

## 隐私与安全

- **100% 本地处理**——所有解析与分析均在浏览器的 JavaScript 引擎中完成
- **零传输**——不向外部服务器发起任何 `fetch`/XHR/WebSocket 请求；无文件上传
- **零追踪**——无分析统计、无 Cookie、无账号体系
- **数据生命周期**：加载 → 内存中分析 → 展示 → 导出到你的设备 → 关闭页面即销毁

**可自行验证**：打开开发者工具（F12）→ Network 标签页，导入文件，确认没有任何外部请求。

---

## 支持的格式

| 格式 | 说明                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| CSV  | 逗号 / 分号 / 制表符分隔，自动识别；支持 UTF-8（含 BOM）                      |
| XLSX | 支持工作表选择；表头行可配置；公式单元格读取缓存值                            |

**不支持：** XLS、SAV、DTA、Parquet、数据库。限制：25 MB / 100,000 行 / 500 列。

---

## 本工具不做什么

- **不做医学解读**——不评估临床意义
- **不做自动修复**——绝不修改你的数据
- **不提供统计建议**——不推荐分析方法
- **不做合规认证**——不验证 HIPAA/GDPR/21 CFR Part 11 等合规性
- **不适用于监管申报**——不是经过验证的 FDA/EMA 申报软件

请将本工具用作正式分析前的**初步质量检查**，并结合你的专业判断与数据管理规范。

---

## 故障排查

| 错误信息                                       | 原因与解决办法                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| "This file format is not supported"            | 仅接受 `.csv` 和 `.xlsx`。请先转换其他格式。                           |
| "File exceeds 25 MB limit"                     | 拆分文件或删除不需要的列。                                             |
| "This file contains no data"                   | 文件为空，或表头行设置过大导致所有行被当作表头。                       |
| "Data exceeds limits: 100,000 rows or 500 columns" | 请先对数据取子集。                                                 |
| "Duplicate column names found"                 | 在源文件中重命名重复列后再导入。                                       |
| "Unable to read this file"                     | 文件损坏或编码错误。请重新导出为 UTF-8 CSV 或在 Excel 中另存。         |
| "Invalid header row index"                     | 表头行号大于文件总行数。                                               |
| 公式警告（XLSX）                               | 公式不会被重算；请在 Excel 中打开、重新保存后再导入。                  |
| 整表被解析成一列（CSV）                        | 分隔符错误——返回并手动选择正确的分隔符。                               |

---

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 可用脚本

```bash
npm run dev        # Vite 开发服务器（http://localhost:5173）
npm run build      # 生产构建 → dist/
npm run preview    # 本地预览生产构建
npm run test       # 单元测试（Vitest，120+ 用例）
npm run e2e        # 端到端测试（Playwright，Chromium + Firefox）
npm run lint       # ESLint
npm run format     # Prettier
```

### 技术栈

React 18 · TypeScript（严格模式）· Vite 5 · PapaParse · SheetJS · i18next · Vitest · Playwright

### 项目结构

```
src/
├── lib/
│   ├── rules/        # 15 条确定性质量规则
│   ├── parsers/      # CSV/XLSX 解析
│   └── export/       # HTML/JSON/CSV 报告生成
├── components/       # React 页面（首页、导入、预览、结果、导出等）
├── i18n/             # en.json + zh-CN.json
└── types/            # TypeScript 类型定义

tests/
├── unit/             # Vitest 单元测试（规则、解析器、导出）
├── e2e/              # Playwright 端到端测试
└── fixtures/         # 测试数据集（干净数据、缺失代码、坏表头等）

docs/                 # 隐私政策、故障目录
.github/workflows/    # CI（测试）+ CD（部署到 GitHub Pages）
```

---

## 部署（GitHub Pages）

`deploy` 工作流使用 [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)，会将 `dist/` 发布到 **`gh-pages` 分支**。因此：

1. 推送到 `main`——工作流会自动构建并推送 `gh-pages` 分支。
2. 进入 **Settings → Pages → Source 选 "Deploy from a branch" → Branch 选 `gh-pages`**（根目录），保存。
3. 一两分钟后站点上线：`https://<用户名>.github.io/<仓库名>/`。

> **不要**把 Pages 源选为 "GitHub Actions"——该模式对应另一种部署流程，`gh-pages` 分支的内容不会被服务。

---

## 测试

```bash
npm run test   # 120+ 单元测试：规则预言值、Type-7 分位数、解析器边界情况、
               # 导出安全性（不含原始数据、XSS 转义）、确定性验证
npm run e2e    # 5 条端到端流程：示例→检查→导出、语言切换、
               # 静态页面、"零外部请求"隐私断言
```

---

## 常见问题

**问：我的数据安全吗？**
安全——所有处理均在本地完成。可通过 DevTools → Network 验证：零外部请求。

**问：能处理大数据集吗？**
上限 100,000 行 × 500 列。更大数据请使用 R/Python/SQL 工具链。

**问：支持哪些语言？**
英文与简体中文。欢迎贡献其他语言的翻译。

**问：规则可以自定义吗？**
v1.0 不支持——规则固定。功能需求请提交 Issue。

**问：可以离线使用吗？**
可以——克隆仓库后 `npm install && npm run dev`，或在本地托管构建产物 `dist/`。

**问：能用于监管申报吗？**
不能。它是预检辅助工具，不是经过验证的 FDA/EMA 申报软件。

---

## 文档

| 文档                                                           | 用途                     |
| -------------------------------------------------------------- | ------------------------ |
| [docs/privacy-and-limitations.md](docs/privacy-and-limitations.md) | 数据处理政策、工具边界 |
| [docs/failure-catalog.md](docs/failure-catalog.md)             | 错误信息与故障排查       |
| [01_clinical_dataset_checker_plan.md](01_clinical_dataset_checker_plan.md) | v1.0 完整规格说明（中文） |

---

## 参与贡献

欢迎贡献——缺陷报告、功能建议、翻译与 Pull Request。开发准则：

- TypeScript 严格模式，禁止 `any`
- 新规则必须附带单元测试且保持确定性
- 禁止引入外部 API 依赖（隐私要求）
- 面向用户的文案需同时更新 `en.json` 与 `zh-CN.json`

---

## 许可证

MIT——详见 [LICENSE](LICENSE)。

---

## 相关链接

- **在线应用**: <https://ysh2015ryan.github.io/Clinical-Dataset-Checker/>
- **问题反馈**: <https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues>
- **讨论区**: <https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions>
