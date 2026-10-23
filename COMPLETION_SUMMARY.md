# Clinical Dataset Checker — 当前状态（已核实）

> 本文档只记录**通过实际运行验证过**的事实。最后核实时间：2026-10-22。

## 已验证通过的检查

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 + 生产构建 | `npm run build` | ✅ 通过（tsc --noEmit + vite build，输出 dist/） |
| 单元测试 | `npm test` | ✅ 124 / 124 通过（rules、parsers、export 三个测试文件） |
| 代码风格 | `npm run lint` | ✅ ESLint + Prettier 均通过 |

## 功能完成度（对照 01_clinical_dataset_checker_plan.md）

### 已实现

- CSV/XLSX 本地解析，25MB / 100,000 行 / 500 列限制（parser 层强制，有测试）
- 工作表选择（XLSX）、标题行设置、ID 列选择、分隔符自动检测与手动覆盖、缺失标记配置、纵向数据声明、日期列指定
- 15 条确定性检查规则（含 INVALID_DATE_CANDIDATE、DATE_ORDER 的真实实现）
- IQR 异常值规则使用 R Type 7 分位数定义（有 oracle 测试固定期望值）
- 结果页：按 blocker/warning/info 分组、可展开详情、样例行号、建议操作
- 导出 HTML / JSON / CSV 报告；存在 blocker 时需用户显式确认后才能导出
- 示例数据一键加载（Try Sample Dataset）
- About / Privacy 页面
- 英文默认 + 简体中文切换
- tests/fixtures/ 8 类合成测试夹具
- GitHub Actions：test.yml（lint + build + test）、deploy.yml（GitHub Pages）
- package-lock.json 已锁定依赖版本

### 已知限制（诚实声明）

- 端到端测试（tests/e2e/app.spec.ts）需要本机安装 Playwright 浏览器后才能运行：`npx playwright install`
- XLSX 公式只读缓存值，导入时会显示警告，但不逐单元格标注
- 性能未做基准测试；README 中"< 2 秒"的说法未经验证，仅供参考

## 隐私验证方式

1. `npm run dev` 启动后打开浏览器开发者工具 Network 面板
2. 导入任意 CSV/XLSX 并完成检查与导出
3. 确认除本地静态资源外没有任何外向请求（e2e 中有对应的自动化断言）
