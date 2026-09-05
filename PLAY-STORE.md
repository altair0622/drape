# 플레이 스토어 등록 절차 (PWABuilder → Google Play)

드레이프 미러를 Google Play에 올리는 순서. 하나 끝내면 체크하고 다음으로.

배포 URL: https://altair0622.github.io/drape/
개인정보처리방침: https://altair0622.github.io/drape/privacy.html

## 0. 원리 한 줄

PWABuilder는 우리 사이트를 여는 얇은 안드로이드 앱(TWA, Trusted Web Activity)을 만든다.
앱 안에 코드가 들어가는 게 아니라 **Chrome이 우리 URL을 전체화면으로 여는 것**이므로,
사이트를 고쳐 push하면 스토어 재심사 없이 앱도 바뀐다.
대신 "이 앱과 이 사이트는 같은 주인"임을 증명하는 파일(`assetlinks.json`)이 사이트에 있어야
주소창 없이 열린다. 이게 빠지면 앱 위에 브라우저 주소창이 뜬다.

## 1. 사전 준비 (사람이 해야 하는 일)

- [ ] **Google Play 개발자 계정** — https://play.google.com/console, 등록비 $25 1회.
      본인 확인(신분증, 전화)에 하루 이틀 걸릴 수 있다. Claude가 대신 못 한다.
- [ ] **개인 계정 주의**: 2023-11 이후 만든 개인 개발자 계정은 프로덕션 출시 전에
      **비공개 테스트를 14일간 최소 인원(Console 화면이 알려 주는 수, 12~20명) 이상**으로 돌려야 한다.
      테스터 이메일(Gmail)을 미리 모아 둘 것. 이게 실제로 가장 오래 걸리는 단계다.

## 2. PWABuilder로 패키지 만들기

1. https://www.pwabuilder.com 접속 → URL에 `https://altair0622.github.io/drape/` 입력 → Start.
2. 점수 화면에서 빨간 항목이 있으면 매니페스트를 고친다 (아래 §5 참고). 노란(권장)은 무시해도 패키징된다.
3. **Package for stores → Android → Generate Package**. 옵션:

   | 항목 | 값 | 이유 |
   |---|---|---|
   | Package ID | `io.github.altair0622.drape` | 소유한 도메인을 뒤집어 쓰는 관례. `com.example.*`은 Play가 거부. **한번 올리면 못 바꾼다.** |
   | App name | 드레이프 미러 | 스토어 표시명 |
   | Launcher name | 드레이프 | 홈 화면 아이콘 밑 글자, 12자 이내 |
   | App version / code | 1.0.0 / 1 | 올릴 때마다 version code를 1씩 올린다 |
   | Display mode | Standalone | 매니페스트와 동일 |
   | Signing key | **Create new** | 처음이니 새로 만든다. 아래 3번 참고 |
   | Include source code | 켜기 | 나중에 Android Studio에서 손볼 수 있게 |

4. 내려받은 zip 안에는 대략 이런 파일이 있다:
   - `*.aab` — Play에 올리는 파일 (Android App Bundle)
   - `*.apk` — 폰에 직접 설치해 테스트하는 파일
   - `signing.keystore` + `signing-key-info.txt` — **서명 키와 비밀번호**
   - `assetlinks.json` — 사이트에 올릴 소유 증명 파일

## 3. 서명 키 보관 — 가장 중요

`signing.keystore`와 `signing-key-info.txt`를 잃으면 **같은 앱을 다시 업데이트할 수 없다.**
새 앱으로 다시 올려야 하고 기존 사용자는 업데이트를 못 받는다.

- 보관 위치: **Dropbox** (자료 창고 원칙). 예: `Dropbox/99 drape/keys/`
- **git에 절대 넣지 않는다.** 이 저장소는 공개(public)다. `.gitignore`에 `*.keystore`가 들어 있다.

## 4. assetlinks.json 올리기

1. zip에서 `assetlinks.json`을 꺼내 저장소의 `.well-known/assetlinks.json`에 넣고 push.
   (`.nojekyll` 파일이 있어서 GitHub Pages가 `.well-known` 폴더를 그대로 서빙한다.)
2. 확인: https://altair0622.github.io/drape/.well-known/assetlinks.json 이 JSON으로 열려야 한다.
3. **함정**: Play Console에 aab를 올리면 Google이 **자기 키로 다시 서명**한다(Play App Signing).
   그러면 사용자 폰에 설치되는 앱의 지문은 PWABuilder 키가 아니라 **Google 키**다.
   Play Console → 앱 → **설정 → 앱 무결성 → 앱 서명 키 인증서**의 SHA-256을 복사해
   `assetlinks.json`에 **두 지문 모두** 넣는다:

   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "io.github.altair0622.drape",
       "sha256_cert_fingerprints": [
         "PWABuilder가_준_지문",
         "Play_Console_앱_서명_키_지문"
       ]
     }
   }]
   ```
   지문이 하나라도 빠지면 그 경로로 설치된 앱에 주소창이 뜬다.

## 5. 매니페스트 점수 올리기 (선택)

PWABuilder가 노란 경고를 내는 항목. 없어도 패키징되지만 스토어 심사에서 스크린샷은 어차피 필요하다.

- `screenshots`: 폰 세로 스크린샷 2장 이상 (예: 1080×1920). `manifest.json`에 추가.
- `shortcuts`, `share_target` 등은 이 앱에 불필요.

## 6. Play Console 입력 항목

앱 만들기 → 기본 정보 → 왼쪽 메뉴 순서대로. 대부분 한 번만 한다.

| 항목 | 입력값 / 판단 |
|---|---|
| 앱 이름 | 드레이프 미러 |
| 기본 언어 | 한국어 |
| 앱/게임 | 앱 |
| 무료/유료 | 무료 (유료→무료는 되지만 반대는 안 된다) |
| **개인정보처리방침 URL** | https://altair0622.github.io/drape/privacy.html |
| 앱 액세스 권한 | 모든 기능이 제한 없이 사용 가능 |
| 광고 | 광고 없음 |
| 콘텐츠 등급 | 설문 → 전체이용가 예상 |
| 타겟 연령 | 18세 이상 (아동 대상으로 하면 정책 부담이 크게 늘어난다) |
| 뉴스 앱 | 아니요 |
| **데이터 보안** | **"데이터를 수집하거나 공유하지 않음"**. 카메라 영상은 기기 밖으로 나가지 않으므로 '수집'이 아니다. 저장 색 목록도 기기 안 localStorage. |
| 카테고리 | 뷰티 (또는 라이프스타일) |
| 연락처 이메일 | altair0622@gmail.com |

### 스토어 등록정보에 필요한 이미지

| 이미지 | 크기 | 비고 |
|---|---|---|
| 앱 아이콘 | 512×512 PNG | `icon-512.png` 그대로 사용 가능 |
| **그래픽 이미지(feature graphic)** | **1024×500** PNG/JPG | 필수. 아직 없음 → 만들어야 한다 |
| 휴대전화 스크린샷 | 2~8장, 세로 16:9 권장 (예 1080×1920) | 필수. 실제 폰에서 찍는다 |

### 짧은 설명 (80자) 초안
> 카메라에 비친 얼굴에 사계절 드레이프 색을 대보는 퍼스널컬러 미러

### 자세한 설명 초안
> 드레이프 미러는 퍼스널컬러 진단에서 쓰는 '드레이핑'을 폰 카메라로 해 보는 도구입니다.
> 봄·여름·가을·겨울 네 계절의 대표색을 얼굴 아래에 천처럼 대보고, 어울리는 색을 저장해 비교할 수 있습니다.
> 카메라 영상과 사진은 기기 안에서만 처리되며 어디에도 전송되지 않습니다.

## 7. 출시 순서

1. **테스트 → 내부 테스트**에 aab 업로드 → 본인 폰에 설치해 확인 (주소창이 안 떠야 정상).
2. **비공개 테스트** 트랙 만들고 테스터 이메일 목록 등록 → 14일 유지 (개인 계정 조건).
3. 조건 충족 후 **프로덕션 액세스 신청** → 승인되면 프로덕션에 같은 aab 승격.
4. 심사는 보통 며칠. 첫 앱은 더 걸릴 수 있다.

## 8. 이후 업데이트

- **사이트만 고칠 때**: push하면 끝. 스토어 작업 없음. `sw.js`의 `VERSION` 문자열을 바꿔야 캐시가 갈린다.
- **앱 껍데기를 고칠 때**(이름, 아이콘, 패키지 설정): PWABuilder에서 다시 생성.
  이때 **Signing key → Use mine**으로 Dropbox의 keystore를 넣고, version code를 올린다.
