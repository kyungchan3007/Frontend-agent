export const STANDARD = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '제2외국어', '기타'];
export const NAME_MAX = 12;
export const SUBJECT_MAX = 20;
export const OFFLINE_MSG = '인터넷 연결을 확인해 주세요';
export const ERR = {
  long: '이름은 12자까지 쓸 수 있어요. 조금 줄여 주세요',
  taken: '같은 이름의 과목이 이미 있어요. 다른 이름을 써 주세요',
  limit: '과목은 20개까지 만들 수 있어요. 안 쓰는 과목은 보관해 주세요',
};

export async function api(method, path, body) {
  const res = await fetch(`/api/v2${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function errorFor(code) {
  if (code === 'SUBJECT_NAME_TAKEN') return ERR.taken;
  if (code === 'SUBJECT_LIMIT') return ERR.limit;
  if (code === 'SUBJECT_NAME_TOO_LONG') return ERR.long;
  return null;
}
