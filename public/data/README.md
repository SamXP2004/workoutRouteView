# 本地路线数据

本仓库不提供示例路线。

使用者需要自行导出 Apple 健康数据，然后执行：

```bash
npm run import-health -- "/path/to/apple_health_export"
```

脚本会生成：

```text
public/data/
  routes.json          路线索引、简化轨迹与指标摘要
  import-report.json   导入数量、跳过原因与校验结果
  metrics/
    <route-id>.json    单条路线的心率与海拔曲线
```

解析工具为独立项目 [Workout Route Importer](https://github.com/SamXP2004/workout-route-importer)。生成文件包含精确位置、日期、设备来源和健康指标，因此不会提交到 Git，也不应上传或公开分享。
