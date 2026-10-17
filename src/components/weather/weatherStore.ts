import { useEffect, useSyncExternalStore } from "react";

export interface Hour {
  label: string;
  temp: number;
  code: number;
  isDay: boolean;
}
export interface Weather {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: boolean;
  hi: number;
  lo: number;
  hours: Hour[];
}
export interface Loc {
  lat: number;
  lon: number;
  name: string;
}
export interface WxState {
  status: "idle" | "loading" | "ready" | "error";
  loc: Loc | null;
  precise: boolean;
  weather: Weather | null;
  updatedAt: number;
  refining: boolean;
  geoError: null | "denied" | "failed";
}

const CACHE_KEY = "jk_weather_v1";
const TTL = 15 * 60 * 1000;
const DEFAULT_LOC: Loc = { lat: 14.5995, lon: 120.9842, name: "Manila" };

const SERVER_STATE: WxState = {
  status: "idle",
  loc: null,
  precise: false,
  weather: null,
  updatedAt: 0,
  refining: false,
  geoError: null,
};

let store: WxState = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => store;
const getServerSnapshot = () => SERVER_STATE;
function setStore(patch: Partial<WxState>) {
  store = { ...store, ...patch };
  listeners.forEach(l => l());
}

function readCache(): Pick<WxState, "loc" | "precise" | "weather" | "updatedAt"> | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && c.weather && c.loc && Date.now() - c.updatedAt < TTL) return c;
  } catch {
    /* ignore */
  }
  return null;
}
function writeCache(c: object) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

async function fetchJson(url: string, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function getGps(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      reject,
      { timeout: 9000, maximumAge: 600000, enableHighAccuracy: false }
    );
  });
}

async function geoAlreadyGranted() {
  try {
    const p = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return p?.state === "granted";
  } catch {
    return false;
  }
}

async function locateByIp(): Promise<Loc> {
  const j = await fetchJson("https://get.geojs.io/v1/ip/geo.json");
  const lat = parseFloat(j.latitude);
  const lon = parseFloat(j.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) throw new Error("bad ip location");
  return { lat, lon, name: j.city || j.region || j.country || "Your area" };
}

async function reverseName(lat: number, lon: number) {
  try {
    const j = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      6000
    );
    return j.city || j.locality || j.principalSubdivision || "Current location";
  } catch {
    return "Current location";
  }
}

const hourLabel = (iso: string) => {
  const h = parseInt(iso.slice(11, 13), 10);
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};

async function fetchForecast({ lat, lon }: { lat: number; lon: number }): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m` +
    `&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=2`;
  const j = await fetchJson(url);
  const c = j.current;
  const nowHour = c.time.slice(0, 13) + ":00";
  let start = j.hourly.time.findIndex((t: string) => t >= nowHour);
  if (start < 0) start = 0;
  const hours: Hour[] = [];
  for (let i = start; i < Math.min(start + 6, j.hourly.time.length); i++) {
    hours.push({
      label: i === start ? "Now" : hourLabel(j.hourly.time[i]),
      temp: Math.round(j.hourly.temperature_2m[i]),
      code: j.hourly.weather_code[i],
      isDay: j.hourly.is_day[i] === 1,
    });
  }
  return {
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m),
    code: c.weather_code,
    isDay: c.is_day === 1,
    hi: Math.round(j.daily.temperature_2m_max[0]),
    lo: Math.round(j.daily.temperature_2m_min[0]),
    hours,
  };
}

async function init() {
  const cached = readCache();
  if (cached) {
    setStore({ status: "ready", ...cached });
    return;
  }
  setStore({ status: "loading" });
  try {
    let loc: Loc | null = null;
    let precise = false;
    if (await geoAlreadyGranted()) {
      try {
        const g = await getGps();
        loc = { ...g, name: await reverseName(g.lat, g.lon) };
        precise = true;
      } catch {
        /* fall through to IP */
      }
    }
    if (!loc) {
      try {
        loc = await locateByIp();
      } catch {
        loc = DEFAULT_LOC;
      }
    }
    const weather = await fetchForecast(loc);
    const next = { loc, precise, weather, updatedAt: Date.now() };
    writeCache(next);
    setStore({ status: "ready", ...next });
  } catch {
    setStore({ status: "error" });
  }
}

async function refine() {
  setStore({ refining: true, geoError: null });
  try {
    const g = await getGps();
    const loc = { ...g, name: await reverseName(g.lat, g.lon) };
    const weather = await fetchForecast(loc);
    const next = { loc, precise: true, weather, updatedAt: Date.now() };
    writeCache(next);
    setStore({ status: "ready", ...next, refining: false });
  } catch (e) {
    setStore({
      refining: false,
      geoError: (e as GeolocationPositionError)?.code === 1 ? "denied" : "failed",
    });
  }
}

function retry() {
  started = false;
  setStore({ status: "idle" });
  started = true;
  init();
}

export function useWeather() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!started) {
      started = true;
      init();
    }
  }, []);
  return { ...s, refine, retry };
}

/** WMO weather code → label, emoji (matches Apple's weather glyphs on iOS) and card theme. */
export function describeWeather(code: number, isDay: boolean) {
  if (code === 0)
    return isDay
      ? { label: "Sunny", icon: "☀️", theme: "clear-day" }
      : { label: "Clear", icon: "🌙", theme: "clear-night" };
  if (code === 1 || code === 2)
    return {
      label: code === 1 ? "Mostly clear" : "Partly cloudy",
      icon: isDay ? "🌤️" : "☁️",
      theme: isDay ? "cloud-day" : "cloud-night",
    };
  if (code === 3) return { label: "Cloudy", icon: "☁️", theme: isDay ? "cloud-day" : "cloud-night" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "🌫️", theme: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "🌦️", theme: "rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { label: code >= 80 ? "Showers" : "Rain", icon: "🌧️", theme: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: "Snow", icon: "❄️", theme: "snow" };
  if (code >= 95) return { label: "Thunderstorms", icon: "⛈️", theme: "storm" };
  return { label: "Cloudy", icon: "☁️", theme: isDay ? "cloud-day" : "cloud-night" };
}
