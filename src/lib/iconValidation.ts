/**
 * 验证图标图像是否有效
 * 防止全透明或纯色块图标被误判为有效图标
 */
export function validateIconImage(image: HTMLImageElement): boolean {
  const validSize = image.naturalWidth >= 16 && image.naturalHeight >= 16;
  if (!validSize) {
    return false;
  }

  // 像素有效性检测：防止全透明或纯色块图标
  try {
    const canvas = document.createElement('canvas');
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return true; // 无法检测，保守接受
    }

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    const totalPixels = w * h;
    let opaqueCount = 0;
    const alphaValues = new Set<number>();
    const colors = new Set<string>();

    // 遍历所有像素
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      alphaValues.add(a);

      if (a > 10) {
        opaqueCount++;
        colors.add(`${r},${g},${b}`);
      }
    }

    // 检查1: 至少 3% 可见像素
    const opaqueRatio = opaqueCount / totalPixels;
    if (opaqueRatio < 0.03) {
      return false; // 几乎全透明
    }

    // 检查2: alpha 多样性（图案边界特征）
    // 至少 3 种不同的 alpha → 说明有渐变或边界
    const hasAlphaVariety = alphaValues.size >= 3;

    // 检查3: 颜色多样性
    // 至少 2 种颜色 → 多色图标
    const hasColorVariety = colors.size >= 2;

    // 决策逻辑
    if (hasAlphaVariety) {
      // 有 alpha 变化 → 图案边界 → 单色图案 OK
      return true;
    } else if (hasColorVariety) {
      // alpha 单一但多色 → 多色图标 OK
      return true;
    } else {
      // alpha 单一 + 颜色单一 → 纯色块
      return false;
    }
  } catch (err) {
    // CORS 错误，保守接受
    return true;
  }
}
