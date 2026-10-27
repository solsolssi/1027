// api/kma.js – Vercel 서버 함수 (F-07)
// GET /api/kma?region=대전 → DB(wx_tasks) 일정 + 기상청 날씨 + 판단
// 키는 Vercel 환경변수에만 둠 : KMA_KEY, SUPABASE_URL, SUPABASE_KEY(공개용)

const { judge, REGIONS, kmaBase, buildKmaUrl, parseKma } = require('../logic.js');

// DB에서 그 지역 일정 읽기 (공개용 키, 읽기만)
async function readTasks(region) {
  const url = process.env.SUPABASE_URL + '/rest/v1/wx_tasks'
    + '?select=title,region,kind,owner&order=created_at.asc'
    + '&region=eq.' + encodeURIComponent(region);
  const key = process.env.SUPABASE_KEY;
  const res = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!res.ok) throw new Error('DB HTTP ' + res.status);
  return res.json();
}

// 기상청 날씨 받기 (실패하면 null → 판단은 '날씨 확인 전')
async function readWeather(region, testMode) {
  try {
    const now = new Date();
    const res = await fetch(buildKmaUrl(region, process.env.KMA_KEY || '', now));
    if (!res.ok) throw new Error('KMA HTTP ' + res.status);
    const w = parseKma(await res.json(), kmaBase(now).today, testMode);
    return { weather: { ...w, source: 'KMA' }, weatherError: null };
  } catch (err) {
    return { weather: null, weatherError: err.message };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const region = String(req.query.region || '').trim();
  const testMode = req.query.test;

  if (!REGIONS[region]) {
    return res.status(400).json({ error: '지역을 확인해 주세요', allowed: Object.keys(REGIONS) });
  }

  let tasks;
  try {
    tasks = await readTasks(region);
  } catch (err) {
    return res.status(502).json({ error: 'DB를 읽지 못했습니다', detail: err.message });
  }

  const { weather, weatherError } = await readWeather(region, testMode);
  const t = kmaBase(new Date()).today;

  res.status(200).json({
    region,
    date: t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8),
    weather,
    ...(weatherError ? { weatherError } : {}),
    ...(testMode === 'wind' ? { test: 'wind (풍속 12m/s)' } : {}),
    tasks: tasks.map(x => {
      const r = judge(x.kind, weather);
      return { title: x.title, kind: x.kind, owner: x.owner, judge: r.text, level: r.level };
    }),
  });
};
