import { useEffect, useState } from 'react';
import { LuSun, LuMoon, LuCloudSun, LuCloudMoon, LuCloud, LuCloudFog, LuCloudDrizzle, LuCloudRain, LuCloudSnow, LuCloudLightning } from 'react-icons/lu';

// Ílhavo, Portugal
const ILHAVO_LAT = 40.605;
const ILHAVO_LON = -8.670;

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
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = 'weather:ilhavo:v2';
    const cached = (() => {
      try { return JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); }
      catch { return null; }
    })();
    if (cached?.value && typeof cached.value.temperature === 'number' && Date.now() - cached.ts < 15 * 60 * 1000) {
      setData(cached.value);
      return;
    }
    (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${ILHAVO_LAT}&longitude=${ILHAVO_LON}&current=temperature_2m,weather_code,is_day`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const current = json?.current;
        if (cancelled || typeof current?.temperature_2m !== 'number') return;
        const value = {
          temperature: Math.round(current.temperature_2m),
          code: current.weather_code,
          isDay: current.is_day === 1,
        };
        setData(value);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ value, ts: Date.now() })); } catch (_) {}
      } catch (_) { /* network failure — silently hide */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <WeatherIcon kind={iconFor(data.code, data.isDay)} />
      <span className="font-['Onest'] font-medium text-[17px] text-[#171717] tracking-[0.085px] whitespace-nowrap">
        Ílhavo {data.temperature}ºC
      </span>
    </div>
  );
}
