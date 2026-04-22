# 图标

`icon.svg` 是源矢量图标（书签 + 勾）。构建时需要四个 PNG：

- `icon-16.png` (16×16)
- `icon-32.png` (32×32)
- `icon-48.png` (48×48)
- `icon-128.png` (128×128)

## 推荐：直接跑脚本（已集成）

```bash
npm run icons     # 单独生成
npm run build     # 构建前会自动 icons + tsc + vite + postbuild
```

脚本位于 `scripts/icons.mjs`，使用 `sharp` 从 `icon.svg` 批量导出。

## 其他方式

**ImageMagick**

```bash
for s in 16 32 48 128; do
  magick -background none icon.svg -resize ${s}x${s} icon-${s}.png
done
```

**在线**：[realfavicongenerator.net](https://realfavicongenerator.net) / [cloudconvert](https://cloudconvert.com/svg-to-png)。

生成好 4 张 PNG 后，`npm run build` 会把 `public/icons/` 自动复制到 `dist/icons/`。
