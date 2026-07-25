# Contributing

欢迎提交 Issue 和 Pull Request。

## 隐私要求

- 不要提交真实 Apple 健康 ZIP、XML、GPX 或 `routes.json`。
- 不要在 Issue、日志或截图中附带未经授权的坐标、设备名称和运动日期。
- 测试导入逻辑时，应在测试运行期间生成最小合成数据，不向仓库加入示例路线。

## 开发流程

```bash
npm ci
npm run check
```

提交前请确认：

- 改动只覆盖当前问题，不夹带无关重构。
- JavaScript 和 Python 测试通过。
- `npm run privacy-check` 通过。
- 普通 `npm run build` 的 `dist` 中不存在 `data/routes.json`。

涉及界面改动时，可以附上使用合成数据生成的截图；不要默认使用个人路线。
