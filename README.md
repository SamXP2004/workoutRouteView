# Workout Route View

把 Apple 健康导出的 GPX 轨迹整理成一个本地、只读的跑步、骑车、徒步和登山路线查看器。地图支持在 Leaflet 与 [mapcn](https://github.com/AnmolSaini16/mapcn)（MapLibre GL）之间切换。

## 功能

- 按运动类型、年份和日期或来源筛选轨迹
- 查看距离、时长、爬升和配速
- 高亮所选路线及起终点
- Leaflet 默认加载，mapcn 按需加载
- 桌面和移动端自适应布局
- Apple 健康数据只在本机解析

## 环境

- Node.js 20 或更高版本
- Python 3.10 或更高版本
- Apple 健康导出目录，其中包含 `导出.xml`（或 `export.xml`）及 `workout-routes/*.gpx`

## 本地运行

```bash
npm install
npm run import-health -- /path/to/apple_health_export
npm run dev
```

打开终端显示的本地地址即可。

## 检查

```bash
npm run check
python3 -m py_compile scripts/import_apple_health.py
```

`npm run check` 会依次运行 Node 测试、TypeScript 检查和生产构建。GitHub Actions 会对每次 push 和 pull request 执行同样的检查。

## 数据与隐私

- 原始 Apple 健康导出不会被修改或复制。
- 导入脚本只读取含 `WorkoutRoute/FileReference` 的户外运动和对应 GPX。
- `public/data/routes.json` 包含精确坐标、日期和运动元数据，已加入 `.gitignore`，不会提交到 GitHub。
- 含真实路线的本地 QA 预览图同样不会提交。
- 地图底图来自 CARTO / OpenStreetMap，查看底图时需要联网；轨迹数据不会发送给底图服务。

## 数据口径

- 分类来自 Apple Health 的 `workoutActivityType`。
- 距离、时长来自 Workout 记录；爬升由 GPX 海拔点估算。
- GPX 坐标使用 Ramer-Douglas-Peucker 算法简化，默认容差约 6 米。
- Leaflet 与 mapcn 共用同一份筛选结果和轨迹数据。
- `src/components/ui/map.tsx` 通过 mapcn 官方 shadcn 注册表安装；mapcn 使用 MIT License。

## 更新数据

重新导出 Apple 健康数据后，再次运行：

```bash
npm run import-health -- /path/to/new/apple_health_export
```
