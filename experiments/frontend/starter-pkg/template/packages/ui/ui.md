# @app/ui 사용법

`import { Button, ... } from '@app/ui'`

- `<Button variant="primary|secondary|ghost|danger" size="L|M|S" disabled onClick>` 기본 primary · L
- `<Pressable onClick aria-label>` 모양 없는 버튼. 줄 · 링크 · 뒤로 가기
- `<Chip selected onClick>` 선택되면 어두운 배경, 아니면 테두리
- `<TextField value onChange={(문자열)=>…} error="문구" trailing={…} type id placeholder aria-label />`
- `<Toggle checked onChange={(boolean)=>…} aria-label />` `role="switch"`
- `<SubjectDot color="blue|cyan|amber|violet|green|rose|slate" />`
- `<ColorPicker value onChange={(색 키)=>…} />`
- `<BottomSheet title>내용</BottomSheet>` 부모(`relative`)를 덮는 어두운 배경 + 아래 시트
- `<Toast>문구</Toast>` 부모 위쪽에 뜨는 안내
- `<OfflineBanner>문구</OfflineBanner>` 오프라인 줄
