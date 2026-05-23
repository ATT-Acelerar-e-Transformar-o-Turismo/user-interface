import { useEffect, useState } from 'react';
import { LuSun, LuMoon, LuCloudSun, LuCloudMoon, LuCloud, LuCloudFog, LuCloudDrizzle, LuCloudRain, LuCloudSnow, LuCloudLightning } from 'react-icons/lu';

const LOCATIONS = [
  { name: 'Ílhavo', lat: 40.605, lon: -8.670 },
  { name: 'Barra', lat: 40.640, lon: -8.745 },
];

const ROTATE_MS = 5000;
const CACHE_TTL_MS = 15 * 60 * 1000;

// Group Open-Meteo WMO weather codes into a small set of icon buckets.
function iconFor(code, isDay) {
  if (code == null) return 'sun';
  if (code === 0) return isDay ? 'sun' : 'moon';
  if (code === 1 || code === 2) return isDay ? 'sun-cloud' : 'moon-cloud';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95 && code <= 99) return 'storm';
  return 'sun';
}

const ICONS = {
  sun: LuSun,
  moon: LuMoon,
  'sun-cloud': LuCloudSun,
  'moon-cloud': LuCloudMoon,
  cloud: LuCloud,
  fog: LuCloudFog,
  drizzle: LuCloudDrizzle,
  rain: LuCloudRain,
  snow: LuCloudSnow,
  storm: LuCloudLightning,
};

function WeatherIcon({ kind }) {
  const Icon = ICONS[kind] || LuSun;
  return <Icon className="w-5 h-5 text-[#171717]" strokeWidth={1.75} aria-hidden="true" />;
}

export default function Weather({ className = '' }) {
  const [readings, setReadings] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = 'weather:multi:v1';
    const cached = (() => {
      try { return JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); }
      catch { return null; }
    })();
    if (Array.isArray(cached?.value) && cached.value.length > 0 && Date.now() - cached.ts < CACHE_TTL_MS) {
      setReadings(cached.value);
      return;
    }
    (async () => {
      const settled = await Promise.allSettled(LOCATIONS.map(async (loc) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,is_day`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const current = json?.current;
        if (typeof current?.temperature_2m !== 'number') throw new Error('Missing current temperature');
        return {
          name: loc.name,
          temperature: Math.round(current.temperature_2m),
          code: current.weather_code,
          isDay: current.is_day === 1,
        };
      }));
      if (cancelled) return;
      const filtered = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (filtered.length === 0) return;
      setReadings(filtered);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ value: filtered, ts: Date.now() })); } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (readings.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % readings.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [readings.length]);

  if (readings.length === 0) return null;
  const current = readings[index] || readings[0];

  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <WeatherIcon kind={iconFor(current.code, current.isDay)} />
      {/* Reserve enough width for the widest label ("Ílhavo 99ºC") so the
          navbar layout doesn't shift when the city rotates between Ílhavo
          and Barra — the surrounding nav items used to get squeezed every
          5 seconds when the text length changed. */}
      <span className="font-['Onest'] font-medium text-[17px] text-[#171717] tracking-[0.085px] whitespace-nowrap inline-block min-w-[112px]">
        {current.name} {current.temperature}ºC
      </span>
    </div>
  );
}
