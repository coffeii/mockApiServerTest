# Mock API & Admin UI 프로젝트 정리

스타벅스 앱과 백엔드가 동시에 개발될 때, 통합 규격이 늦게 확정되거나 문서화되어도 곧바로 실제 서버를 띄워 테스트하기가 어렵습니다. 이 과정에서 앱 개발자는 “서버가 아직 준비되지 않아서” 반복 검증이 지연되거나, 뒤늦게 서버 쪽에서 구현 불가 사유가 나와 전체 일정이 크게 어긋나는 경우가 잦았습니다.

이를 해결하기 위해, 실제 서버 대신 언제든 사용할 수 있는 **Mock API 서버**와 이를 관리·등록할 수 있는 **Admin UI**를 구축했습니다.

---

## 1. 프로젝트 개요

- **목표**  
  Android 앱 테스트용 Mock API 서버와, 이를 관리·등록할 수 있는 웹 UI 구축

- **핵심 기능**  
  1. **동적 라우트 등록**  
     Method + Path → Status + JSON 응답을 UI에서 즉시 등록·수정·삭제  
  2. **앱 연동**  
     등록된 대로  
     ```
     https://비밀입니당~/{path}
     ```  
     호출  
  3. **관리 UI**  
     ```
     https://비밀입니당~
     ```  
     에서 모든 라우트 관리

---

## 2. 기술 선택 이유

| 컴포넌트  | 스택                                      | 선택 이유                                                       |
|---------|-----------------------------------------|--------------------------------------------------------------|
| Backend | Node.js + Express + Lowdb               | - 빠른 프로토타이핑<br>- 별도 DB 서버 불필요<br>- JSON 파일로 즉시 저장/버전 관리 가능 |
| Frontend| Vue 3 + Vite + TailwindCSS + DaisyUI    | - Vue 3 컴포지션 API로 간결한 상태 관리<br>- Vite 덕분에 초고속 HMR<br>- Tailwind/DaisyUI로 최소한의 CSS로 귀여운 UI |
| Hosting | Railway (API) / Netlify (UI)            | - 무료 티어에서 즉시 배포 가능<br>- GitHub 연동, HTTPS 자동 지원            |

---

## 3. 아키텍처 및 구성

- Backend (index.js)

    GET / → Health Check (200 OK)
    GET/POST/PUT/DELETE /admin/routes → Lowdb 기반 CRUD
    app.all('*') → 등록된 Method+Path 매칭 → Mock JSON 응답
    CORS: 개발(localhost:5173) & 프로덕션(UI 도메인) 허용
    저장소: db.json (Lowdb JSONFile)

- Frontend (App.vue)

    한 페이지 SPA:
    API 등록 섹션: Method, Path, Status, Response(JSON), Headers(JSON) 입력
    Registered APIs 테이블: 목록 조회 + 삭제버튼
    loadRoutes(), addRoute(), deleteRoute() → fetch 연동
    Vite Dev Proxy: /admin/* → localhost:3000 (로컬 CORS 회피)

- 배포
     ```
    Railway: 비밀입니당~

    FRONTEND_URL= 비밀입니당~
    Netlify: 비밀입니당~

    VITE_API_BASE_URL=비밀입니당~
     ```

## 4. 앱 개발자 관점 유용성
- 백엔드 완성 전에도 개발·검증 가능
- 정의된 스펙으로 Retrofit 연동 시작 → UI/UX, 데이터 모델, 예외 처리 미리 검증
- 다양한 시나리오 테스트
- 200/400/500 등 상태 코드 + 임의 페이로드 등록 → 앱의 에러 핸들링 로직 강화
- (추가 기능) 네트워크 지연 시뮬레이션 가능
- 환경 일관성 확보
- 로컬(localhost:3000) ↔ 프로덕션(.railway.app) 간 설정 한 줄 변경
- 팀원 간 동일한 Mock 데이터로 디버깅·회의
- 빠른 반복(Iteration) & 프로토타이핑
- 관리 UI에서 즉시 CRUD → 앱 재빌드 없이 loadRoutes()로 즉시 반영
- CI/CD 및 자동화 테스트 연동
- E2E 테스트 스크립트에서 Mock API 사용 → 실제 서버 부담 없이 회귀 검증
- Mock 데이터 seed 관리로 동일 시나리오 재현

## 5. 향후 확장 방안
- 데이터 저장소 업그레이드: Lowdb → PostgreSQL/MySQL (Prisma, TypeORM)
- 인증·인가 추가: JWT, OAuth, Role-based Access Control
- 고급 Mock 기능: 레이턴시 설정, 에러 주입, 순차 응답, 스크립팅
- 버전 관리 & 문서화: Swagger/OpenAPI, GitHub 연동 자동 커밋
- 모니터링 & 로깅: Prometheus, Grafana, Sentry
- UI 개선: 라우트 편집 모달, 검색·필터, Bulk import/export


이 구성을 통해 앱 개발팀은 실제 서버 준비 여부와 무관하게 안정적이고 일관된 개발·테스트 환경을 확보할 수 있습니다. 다양한 시나리오를 즉시 검증하며, 일정 지연 리스크를 최소화하세요!