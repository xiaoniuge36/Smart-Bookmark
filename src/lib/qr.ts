import QRCode from "qrcode";

export type QrFormat = "png" | "svg";

// 预览与导出统一黑码白底（标准、便于扫码/打印/分享），不随深色模式反色。
const COLOR = { dark: "#000000", light: "#ffffff" };
const EC_LEVEL = "M";
const MARGIN = 1;

// PNG 下载分辨率随二维码复杂度自适应：以 BASE_PPM（每模块像素数）为基准，出图边长
// 夹在 [MIN_PX, MAX_PX] —— 简单码抬 ppm 到不低于 MIN_PX，密集码压 ppm 到不超过 MAX_PX。
// ppm 取整数（≥1）以保证每模块整数像素、边缘锐利。
const BASE_PPM = 8;
const MIN_PX = 256;
const MAX_PX = 1024;

/** 预览用 PNG data URL（固定 width，缩放到显示尺寸更锐）。 */
export async function toDataUrl(text: string, size = 320): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: EC_LEVEL,
    margin: MARGIN,
    width: size,
    color: COLOR,
  });
}

/** 下载用 PNG data URL：分辨率按复杂度自适应（见 BASE_PPM / MIN_PX / MAX_PX）。 */
export async function toDownloadPng(text: string): Promise<string> {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: EC_LEVEL });
  const total = modules.size + MARGIN * 2;
  let ppm = BASE_PPM;
  if (total * ppm < MIN_PX) ppm = Math.ceil(MIN_PX / total);
  else if (total * ppm > MAX_PX) ppm = Math.max(1, Math.floor(MAX_PX / total));
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: EC_LEVEL,
    margin: MARGIN,
    scale: ppm,
    color: COLOR,
  });
}

/** 下载用 SVG 字符串（矢量，无损缩放，与分辨率无关）。 */
export async function toSvgString(text: string, size = 512): Promise<string> {
  return await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: EC_LEVEL,
    margin: MARGIN,
    width: size,
    color: COLOR,
  });
}
