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

// 지역 좌표 (시청 · 군청 근처 대략값)
const REGIONS = {
  '세종': { lat: 36.48, lon: 127.29 },
  '대전': { lat: 36.35, lon: 127.38 },
  '태안': { lat: 36.75, lon: 126.30 },
  '보령': { lat: 36.33, lon: 126.61 },
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

if (typeof module !== 'undefined') module.exports = { RULES, judge, REGIONS, buildWeatherUrl, parseWeather };
