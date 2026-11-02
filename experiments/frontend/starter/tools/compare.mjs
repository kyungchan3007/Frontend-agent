// 시안과 지금 화면의 픽셀 차이. 위쪽 상태바와 배경은 빼고 잰다
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export const CROP_TOP = 340;

function crop(png) {
  const out = new PNG({ width: 390, height: 844 - CROP_TOP });
  PNG.bitblt(png, out, 0, CROP_TOP, 390, 844 - CROP_TOP, 0, 0);
  return out;
}

export function compare(designPath, shotPath, diffPath) {
  const a = crop(PNG.sync.read(fs.readFileSync(designPath)));
  const b = crop(PNG.sync.read(fs.readFileSync(shotPath)));
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.2 });
  if (diffPath) fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return (n / (a.width * a.height)) * 100;
}
