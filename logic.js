// logic.js – 판단 규칙만 (화면을 다루는 코드 금지)

// 교육용 가상 기준 (실제 작업 중지 · 행사 취소 기준은 각 기관 규정을 따름)
const RULES = { wind: 10, rain: 60, heat: 33 };

// 일정 구분과 날씨로 판단 (w가 없으면 '날씨 확인 전')
function judge(kind, w) {
  if (!w) return { level: 'none', text: '날씨 확인 전' };
  if (kind === '실내') return { level: 'ok', text: '영향 없음' };
  if (kind === '고소' && w.windMax >= RULES.wind) return { level: 'stop', text: '중지 검토 (강풍)' };
  if (w.tempMax >= RULES.heat) return { level: 'warn', text: '폭염 휴식' };
  if (w.rainProb >= RULES.rain) return { level: 'warn', text: '우천 주의' };
  return { level: 'ok', text: '진행' };
}

// 지역 좌표 (시청 · 군청 근처 대략값) + 기상청 격자(nx, ny)
const REGIONS = {
  '세종': { lat: 36.48, lon: 127.29, nx: 66, ny: 103 },
  '대전': { lat: 36.35, lon: 127.38, nx: 67, ny: 100 },
  '태안': { lat: 36.75, lon: 126.30, nx: 48, ny: 109 },
  '보령': { lat: 36.33, lon: 126.61, nx: 54, ny: 100 },
};

// Open-Meteo 주소 만들기 (4개 지역을 한 번에, 오늘 하루 최댓값)
function buildWeatherUrl() {
  const names = Object.keys(REGIONS);
  return 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + names.map(n => REGIONS[n].lat).join(',')
    + '&longitude=' + names.map(n => REGIONS[n].lon).join(',')
    + '&daily=temperature_2m_max,wind_speed_10m_max,precipitation_probability_max'
    + '&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=1';
}

// 응답 해석 → { 세종: { tempMax, windMax, rainProb }, ... }
// testMode가 'wind'이면 풍속을 12로 바꿔 규칙을 시험
function parseWeather(json, testMode) {
  const list = Array.isArray(json) ? json : [json];
  const result = {};
  Object.keys(REGIONS).forEach((name, i) => {
    const d = list[i] && list[i].daily;
    if (!d) return;
    result[name] = {
      tempMax: Math.round(d.temperature_2m_max[0]),
      windMax: testMode === 'wind' ? 12 : Math.round(d.wind_speed_10m_max[0] * 10) / 10,
      rainProb: d.precipitation_probability_max[0] ?? 0,
    };
  });
  return result;
}

// 기상청 단기예보 발표 시각 (한국 시간 기준)
// 오늘 02시 발표(02:15 이후 받을 수 있음)를 쓰고, 그 전이면 어제 23시 발표를 씀
function kmaBase(now) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const today = ymd(kst);
  if (kst.getUTCHours() * 60 + kst.getUTCMinutes() >= 2 * 60 + 15) {
    return { today, baseDate: today, baseTime: '0200' };
  }
  return { today, baseDate: ymd(new Date(kst.getTime() - 24 * 3600 * 1000)), baseTime: '2300' };
}

// 기상청 단기예보 주소 만들기 (공공데이터포털, 일반 인증키)
function buildKmaUrl(region, key, now) {
  const r = REGIONS[region];
  const b = kmaBase(now);
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key);
  return 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
    + '?serviceKey=' + serviceKey
    + '&pageNo=1&numOfRows=1000&dataType=JSON'
    + '&base_date=' + b.baseDate + '&base_time=' + b.baseTime
    + '&nx=' + r.nx + '&ny=' + r.ny;
}

// 기상청 응답 해석 → { tempMax, windMax, rainProb } (오늘 자료만)
// TMX = 최고 기온, WSD = 풍속(시간별 → 최댓값), POP = 강수확률(시간별 → 최댓값)
function parseKma(json, today, testMode) {
  const header = json && json.response && json.response.header;
  if (!header || header.resultCode !== '00') {
    throw new Error('KMA ' + (header ? header.resultCode + ' ' + header.resultMsg : '응답 형식 오류'));
  }
  const items = json.response.body.items.item.filter(it => it.fcstDate === today);
  const values = cat => items.filter(it => it.category === cat).map(it => Number(it.fcstValue));
  const tmx = values('TMX'), wsd = values('WSD'), pop = values('POP');
  if (!tmx.length || !wsd.length || !pop.length) throw new Error('KMA 오늘 자료 없음');
  return {
    tempMax: Math.round(Math.max(...tmx)),
    windMax: testMode === 'wind' ? 12 : Math.max(...wsd),
    rainProb: Math.max(...pop),
  };
}

if (typeof module !== 'undefined') module.exports = { RULES, judge, REGIONS, buildWeatherUrl, parseWeather, kmaBase, buildKmaUrl, parseKma };
