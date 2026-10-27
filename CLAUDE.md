# CLAUDE.md – 현장 일정 날씨판 작업 규칙

## 프로젝트 개요
- 교육용 프로토타입이다. 무엇을 만들지는 PRD.md를 따른다.
- PRD.md에 없는 기능은 먼저 제안하고, 내가 승인한 뒤에만 구현한다.

## 기술 스택 (변경 금지)
- HTML + CSS + 순수 JavaScript만 사용한다. (React 등 프레임워크, 빌드 도구 사용 금지)
- 화면은 index.html 더블클릭으로 열리되, 데이터 파일(data/)은 배포 주소에서 읽는다.
- 외부 스크립트는 supabase-js 하나만 허용한다. (버전 고정, CDN)

## 폴더 구조
- index.html : 화면 구조
- style.css  : 디자인
- logic.js   : 판단 규칙만 (화면을 다루는 코드 금지)
- app.js     : 화면 동작 (목록 그리기, 일정 추가)
- config.js  : Supabase 연결 정보 (주소 · 공개용 키 두 줄만)
- setup.sql  : Supabase 표(wx_tasks) 만들기 (사람이 SQL Editor 에서 직접 실행)
- data/tasks.json : 기본 일정 원본 (DB 초기 데이터 · DB 연결 실패 시 보기 전용)
- PRD.md · CLAUDE.md · README.md : 문서

## 작업 방식
1. 코드를 고치기 전에 계획(수정할 파일과 이유)을 먼저 보여 주고 승인을 받는다.
2. 한 번에 한 가지만 고친다.
3. 끝나면 바꾼 파일, 내가 확인할 방법(T-번호), 남은 문제를 보고한다.

## 보안 · 데이터 규칙
- 가상 데이터만 사용한다. 실제 이름 · 연락처 · 기관 내부 자료를 넣지 않는다.
- 사용자가 입력한 글자는 textContent 로 표시한다.
- 일정은 Supabase 표 wx_tasks 에서 읽고, 추가도 거기에만 저장한다. 브라우저 저장(wx_added)은 쓰지 않는다.
- data/tasks.json 은 초기 데이터 원본으로만 두고, 화면에서 쓰지 않는다.
- 구분 · 지역 규칙은 화면뿐 아니라 DB(check 제약)에서도 막는다. 공개용 키로는 읽기 · 추가만 허용한다.
- 비밀 키는 코드 · 채팅 · GitHub 에 넣지 않는다.
- config.js 에는 주소 · 공개용(anon/publishable) 키 두 줄만 둔다. service_role(비밀) 키는 어디에도 넣지 않는다.
