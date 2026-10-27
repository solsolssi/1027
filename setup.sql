-- setup.sql – Supabase SQL Editor 에서 직접 한 번 실행 (F-06)

-- 1. 일정 테이블 (구분 · 지역 규칙을 DB에서도 막음)
create table if not exists public.wx_tasks (
  id         bigint generated always as identity primary key,
  title      text not null check (char_length(trim(title)) between 1 and 50),
  region     text not null check (region in ('세종', '대전', '태안', '보령')),
  kind       text not null check (kind in ('야외', '고소', '실내')),
  owner      text not null check (char_length(trim(owner)) between 1 and 20),
  created_at timestamptz not null default now()
);

-- 2. 행 보안 : 공개용 키로는 읽기 · 추가만 (수정 · 삭제 정책 없음 = 막힘)
alter table public.wx_tasks enable row level security;

drop policy if exists "wx_tasks read" on public.wx_tasks;
create policy "wx_tasks read" on public.wx_tasks
  for select to anon, authenticated using (true);

drop policy if exists "wx_tasks insert" on public.wx_tasks;
create policy "wx_tasks insert" on public.wx_tasks
  for insert to anon, authenticated with check (true);

-- 3. 기본 일정 6건 (data/tasks.json 과 같은 가상 데이터, 비어 있을 때만)
insert into public.wx_tasks (title, region, kind, owner)
select * from (values
  ('다중이용시설 안전점검', '세종', '야외', '김안전'),
  ('시민 안전체험 행사 운영', '보령', '야외', '이행사'),
  ('옥상 태양광 설비 점검', '태안', '고소', '박설비'),
  ('하천 수위계 확인', '대전', '야외', '최현장'),
  ('청사 외벽 간판 보수', '세종', '고소', '정시설'),
  ('비상연락 훈련', '대전', '실내', '한상황')
) as v(title, region, kind, owner)
where not exists (select 1 from public.wx_tasks);

-- 규칙 시험 (실행하면 오류가 나야 정상)
-- insert into public.wx_tasks (title, region, kind, owner) values ('시험', '서울', '야외', '가상');
