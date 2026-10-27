// app.js – 화면 동작 (목록 그리기, 일정 추가)

// 04 단원 : 기본 일정은 data/tasks.json, 화면에서 추가한 일정만 브라우저 저장(wx_added)
let baseTasks = [];
let tasks = [];
let weatherByRegion = {};   // 03 단원에서 지역별 날씨를 넣음

// 기본 일정 JSON 읽기 (더블클릭으로 열면 브라우저가 막아서 실패함)
async function loadBaseTasks() {
  try {
    const res = await fetch('data/tasks.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    baseTasks = await res.json();
  } catch (err) {
    baseTasks = [];
    document.getElementById('msgBox').textContent = '기본 일정을 읽지 못했습니다. 배포 주소로 열어 주세요.';
  }
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  tasks = baseTasks.concat(saved);
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

function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  saved.push(t);
  localStorage.setItem('wx_added', JSON.stringify(saved));
  e.target.reset();
  loadTasks();
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
  await loadBaseTasks();
  loadTasks();
  renderTasks();
  loadWeather();
}

document.getElementById('taskForm').addEventListener('submit', addTask);
start();
