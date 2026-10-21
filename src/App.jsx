import { useState, useEffect, useRef } from "react";
import "./App.css";

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const beep = () => {
  try {
    const c = new AudioContext(),
      o = c.createOscillator();
    o.connect(c.destination);
    o.frequency.value = 660;
    o.start();
    o.stop(c.currentTime + 0.4);
  } catch {}
};

function Group({ slots, done, cur, p, size }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      {Array.from({ length: slots }, (_, i) => {
        const pos =
          i === 4
            ? { x1: 2, y1: 46, x2: 58, y2: 14 }
            : { x1: 10 + i * 13, y1: 8, x2: 10 + i * 13, y2: 52 };
        return (
          <g key={i}>
            <line {...pos} className="ghost" />
            {i < done && <line {...pos} className="done" pathLength="1" />}
            {i === cur && (
              <line
                {...pos}
                className="live"
                pathLength="1"
                style={{ strokeDashoffset: 1 - p }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function App() {
  const [minutes, setMinutes] = useState(5);
  const [sets, setSets] = useState(2);
  const [per, setPer] = useState(5);
  const [done, setDone] = useState(0);
  const [left, setLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const end = useRef(0);
  const total = sets * per;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((end.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        beep();
        setDone(done + 1);
        if (done + 1 >= total) setRunning(false);
        else {
          end.current = Date.now() + minutes * 60000;
          setLeft(minutes * 60);
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, done, total, minutes]);

  useEffect(() => {
    document.title = running ? `${fmt(left)} · Focus` : "Tally Focus";
  }, [left, running]);

  const toggle = () => {
    if (running) return setRunning(false);
    if (done >= total) return;
    end.current = Date.now() + left * 1000;
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setDone(0);
    setLeft(minutes * 60);
  };
  const num = (set, v) => {
    set(Math.max(1, +v || 1));
    setRunning(false);
    setDone(0);
  };

  const finished = done >= total;
  const size = sets <= 1 ? 84 : sets <= 4 ? 64 : 48;
  const p = finished ? 0 : 1 - left / (minutes * 60);
  const status = finished
    ? "All sets complete. Great focus!"
    : running
      ? `Focusing… set ${Math.floor(done / per) + 1} of ${sets}, line ${(done % per) + 1} of ${per}`
      : done
        ? "Paused. Press Start to continue"
        : "Press Start to begin drawing your first line";

  return (
    <main style={{ maxWidth: sets > 1 ? 980 : 560 }}>
      <h1>Tally Focus</h1>
      <div className="time">{finished ? "🎉 Done!" : fmt(left)}</div>
      <p className="sub">
        {done * minutes} / {total * minutes} min focused in total
      </p>
      <div className="btns">
        <button onClick={toggle} disabled={finished}>
          {running ? "Pause" : "Start"}
        </button>
        <button className="ghost" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="status">{status}</p>
      <p className="hint">
        Every {minutes} min of focus = 1 stroke. 4 strokes + 1 crossing line = a
        bundle of 5.
      </p>
      <div className="sets">
        {Array.from({ length: sets }, (_, s) => {
          const d = Math.min(per, Math.max(0, done - s * per));
          const active = !finished && Math.floor(done / per) === s;
          const complete = d === per;
          return (
            <section
              key={s}
              className={`card${active ? " active" : ""}${complete ? " complete" : ""}`}
            >
              <header>
                <b>
                  Set {s + 1}
                  {complete ? " ✓" : ""}
                </b>
                <span>
                  {d} / {per} lines · {d * minutes} / {per * minutes} min
                </span>
              </header>
              <div className="groups">
                {Array.from({ length: Math.ceil(per / 5) }, (_, g) => (
                  <Group
                    key={g}
                    size={size}
                    slots={Math.min(5, per - g * 5)}
                    done={Math.min(5, Math.max(0, d - g * 5))}
                    cur={
                      active && Math.floor((done - s * per) / 5) === g
                        ? (done - s * per) % 5
                        : -1
                    }
                    p={p}
                  />
                ))}
              </div>
              <div className="bar">
                <i
                  style={{ width: `${((d + (active ? p : 0)) / per) * 100}%` }}
                />
              </div>
            </section>
          );
        })}
      </div>
      <div className="settings">
        <label>
          Minutes/line
          <input
            type="number"
            min="1"
            value={minutes}
            disabled={running}
            onChange={(e) => {
              const m = Math.max(1, +e.target.value || 1);
              setMinutes(m);
              setLeft(m * 60);
              setDone(0);
            }}
          />
        </label>
        <label>
          Lines/set
          <input
            type="number"
            min="1"
            value={per}
            disabled={running}
            onChange={(e) => num(setPer, e.target.value)}
          />
        </label>
        <label>
          Sets
          <input
            type="number"
            min="1"
            value={sets}
            disabled={running}
            onChange={(e) => num(setSets, e.target.value)}
          />
        </label>
      </div>
    </main>
  );
}
