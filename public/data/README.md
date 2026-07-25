# 本地路线数据

本仓库不提供示例路线。

使用者需要自行导出 Apple 健康数据，然后执行：

```bash
npm run import-health -- "/path/to/apple_health_export"
```

生成的 `routes.json` 包含精确位置、日期和设备来源，因此不会提交到 Git。
