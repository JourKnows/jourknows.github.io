import { describeWeather, useWeather } from "./weather/weatherStore";

/** Tiny "☀️ 31°C Manila" chip for the dateline strip. Hydrate with client:load. */
export default function WeatherChip() {
  const w = useWeather();
  if (w.status !== "ready" || !w.weather || !w.loc) {
    return <span className="jk-wxchip" aria-hidden="true" />;
  }
  const d = describeWeather(w.weather.code, w.weather.isDay);
  return (
    <span className="jk-wxchip" title={`${d.label} in ${w.loc.name}`}>
      <span aria-hidden="true">{d.icon}</span>
      <b>{w.weather.temp}°C</b>
      <span className="jk-wxchip-loc">{w.loc.name}</span>
    </span>
  );
}
