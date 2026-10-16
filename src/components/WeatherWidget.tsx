import { useState } from "react";
import { describeWeather, useWeather } from "./weather/weatherStore";

/** iOS 16-style weather card. Hydrate with client:visible. */
export default function WeatherWidget() {
  const w = useWeather();
  const [open, setOpen] = useState(false);

  if (w.status === "idle" || w.status === "loading") {
    return (
      <div className="jk-wx jk-wx--cloud-day jk-wx--skeleton" aria-busy="true" aria-label="Loading weather">
        <div className="jk-wx-shimmer" />
      </div>
    );
  }

  if (w.status === "error" || !w.weather || !w.loc) {
    return (
      <div className="jk-wx jk-wx--cloud-night" role="status">
        <p style={{ fontSize: 15, fontWeight: 600 }}>Weather unavailable</p>
        <p className="jk-wx-note">We couldn't reach the forecast service.</p>
        <button className="jk-wx-retry" onClick={w.retry}>
          Try again
        </button>
      </div>
    );
  }

  const x = w.weather;
  const d = describeWeather(x.code, x.isDay);

  return (
    <div className={`jk-wx jk-wx--${d.theme}`} role="region" aria-label={`Weather in ${w.loc.name}`}>
      <div className="jk-wx-fx" aria-hidden="true" />
      <div className="jk-wx-top">
        <div>
          <button
            className="jk-wx-loc"
            onClick={w.precise ? undefined : w.refine}
            disabled={w.refining}
            title={w.precise ? "Using your current location" : "Use my precise location"}
            style={{ cursor: w.precise ? "default" : "pointer" }}
          >
            {w.loc.name}
            <svg
              className="jk-ic"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: 12, height: 12, fill: w.precise ? "#fff" : "none", opacity: w.refining ? 0.5 : 1 }}
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </button>
          <div className="jk-wx-temp">{x.temp}°</div>
        </div>
        <div className="jk-wx-cond">
          <span className="jk-wx-emoji" aria-hidden="true">
            {d.icon}
          </span>
          <span>{d.label}</span>
          <span className="jk-wx-hl">
            H:{x.hi}° L:{x.lo}°
          </span>
        </div>
      </div>

      <div className="jk-wx-hours">
        {x.hours.map((h, i) => (
          <div className="jk-wx-hour" key={i}>
            <span className="jk-wx-hour-t">{h.label}</span>
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
              {describeWeather(h.code, h.isDay).icon}
            </span>
            <span>{h.temp}°</span>
          </div>
        ))}
      </div>

      <div className={`jk-wx-more ${open ? "is-open" : ""}`}>
        <div>
          <div className="jk-wx-stats">
            <div className="jk-wx-stat">
              Feels like<b>{x.feels}°</b>
            </div>
            <div className="jk-wx-stat">
              Humidity<b>{x.humidity}%</b>
            </div>
            <div className="jk-wx-stat">
              Wind<b>{x.wind} km/h</b>
            </div>
          </div>
        </div>
      </div>

      {w.geoError && (
        <p className="jk-wx-note">
          {w.geoError === "denied"
            ? "Location access is blocked — showing your approximate area."
            : "Couldn't get your precise location."}
        </p>
      )}
      {!w.precise && !w.geoError && (
        <p className="jk-wx-note">Approximate location · tap the name to use GPS</p>
      )}

      <button
        className="jk-wx-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? "Hide details" : "Show details"}
      >
        <svg className="jk-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
