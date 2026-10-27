// app.js – 화면 동작 (목록 그리기, 일정 추가)

// 04 단원 : 일정은 Supabase 표(wx_tasks)에서 읽고 추가도 거기에 저장
// DB에 연결하지 못하면 data/tasks.json 을 보기 전용으로 보여 줌
let tasks = [];
let weatherByRegion = {};   // 03 단원에서 지역별 날씨를 넣음
let db = null;              // Supabase 연결 (config.js 가 비어 있으면 null)
let dbOk = false;

function showMsg(text) {
  document.getElementById('msgBox').textContent = text;
}

function connectDb() {
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

// 일정 읽기 : DB → 실패하면 JSON(보기 전용)
async function loadTasks() {
  if (db) {
    const { data, error } = await db.from('wx_tasks')
      .select('title, region, kind, owner')
      .order('created_at', { ascending: true });
    if (!error) {
      tasks = data;
      dbOk = true;
      return;
    }
  }
  dbOk = false;
  try {
    const res = await fetch('data/tasks.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    tasks = await res.json();
    showMsg('DB에 연결하지 못했습니다. 기본 일정만 보기 전용으로 보여 줍니다.');
  } catch (err) {
    tasks = [];
    showMsg('DB에 연결하지 못했습니다. 배포 주소로 열어 주세요.');
  }
}

function weatherText(w) {
  return w ? w.tempMax + '℃ · ' + w.windMax + 'm/s · ' + w.rainProb + '%' : '-';
}

function renderTasks() {
  const body = document.getElementById('taskList');
  body.innerHTML = '';
  for (const t of tasks) {
    const w = weatherByRegion[t.region];
    const r = judge(t.kind, w);
    const tr = document.createElement('tr');
    for (const v of [t.title, t.region, t.kind, t.owner, weatherText(w)]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    }
    const td = document.createElement('td');
    td.textContent = r.text;
    td.className = r.level;
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

async function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  if (!dbOk) {
    showMsg('DB에 연결되지 않아 일정을 추가할 수 없습니다.');
    return;
  }
  const { error } = await db.from('wx_tasks').insert(t);
  if (error) {
    showMsg('추가하지 못했습니다 (' + error.message + ')');
    return;
  }
  showMsg('');
  e.target.reset();
  await loadTasks();
  renderTasks();
}

// 제목 아래에 오늘 날짜(YYYY-MM-DD) 표시
function showToday() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  document.getElementById('todayBox').textContent = d.getFullYear() + '-' + mm + '-' + dd;
}

// 날씨 불러오기 (실패해도 목록은 그대로 보임)
async function loadWeather() {
  const box = document.getElementById('weatherBox');
  const testMode = new URLSearchParams(location.search).get('test');
  box.textContent = '날씨 불러오는 중…';
  try {
    const res = await fetch(buildWeatherUrl());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    weatherByRegion = parseWeather(await res.json(), testMode);
    box.textContent = Object.keys(weatherByRegion)
      .map(name => name + ' ' + weatherText(weatherByRegion[name]))
      .join('  |  ') + (testMode === 'wind' ? '  (시험: 풍속 12m/s)' : '');
    renderTasks();
  } catch (err) {
    box.textContent = '날씨를 불러오지 못했습니다 (' + err.message + ')';
  }
}

async function start() {
  showToday();
  connectDb();
  await loadTasks();
  renderTasks();
  loadWeather();
}

document.getElementById('taskForm').addEventListener('submit', addTask);
start();
