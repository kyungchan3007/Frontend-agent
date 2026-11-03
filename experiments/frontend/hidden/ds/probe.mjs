// 계산된 스타일을 읽는다. 색은 표기와 상관없이 rgb로 맞춘다
export const PRIMARY = { sheet: /측정 시작$/, manage: '과목 추가하기', plan: '저장하기' };
export const SCREEN = { sheet: '/', manage: '/subjects', plan: '/plan' };

export function readStyle(el) {
  const c = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = c.backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { height: Math.round(el.getBoundingClientRect().height), radius: c.borderTopLeftRadius, bg: a ? `rgb(${r}, ${g}, ${b})` : 'transparent' };
}

export async function primaryStyle(page, screen) {
  const b = page.getByRole('button', { name: PRIMARY[screen] });
  await b.waitFor({ timeout: 5000 });
  return b.evaluate(readStyle);
}

// 칩이 button이 아니면 글자에서 가장 가까운 배경을 찾는다
export async function chipBg(page, text) {
  const t = page.getByText(text, { exact: true }).last();
  return t.evaluate((el, fn) => {
    const read = new Function(`return (${fn})`)();
    for (let e = el; e; e = e.parentElement) {
      const s = read(e);
      if (s.bg !== 'transparent') return s.bg;
    }
    return 'transparent';
  }, readStyle.toString());
}
