import { useEffect, useState } from "react";
import { Activity, CalendarDays, Droplets, Flower2, History } from "lucide-react";
import { api } from "../api";
import EstimateCard from "../components/EstimateCard";
import MiniCalendar from "../components/MiniCalendar";
export default function Dashboard() {
  const [e, setE] = useState(null), [cycles, setCycles] = useState([]), [symptoms, setSymptoms] = useState([]);
  useEffect(() => {
    Promise.all([api("/estimate"), api("/cycles"), api("/symptoms")])
      .then(([a, b, c]) => { setE(a); setCycles(b); setSymptoms(c); })
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <p className="dashboard-eyebrow"><Flower2 size={16} aria-hidden="true" /> Dashboard</p>
        <h1>Your cycle, with context.</h1>
        <p className="dashboard-subtitle">Personal history presented as a range—not a promise.</p>
        <Flower2 className="dashboard-flower" strokeWidth={1} aria-hidden="true" />
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-estimate" aria-labelledby="dashboard-estimate-title">
          <div className="dashboard-panel-heading">
            <span className="dashboard-icon dashboard-icon-pink"><Droplets size={21} aria-hidden="true" /></span>
            <h2 id="dashboard-estimate-title">Cycle estimate</h2>
          </div>
          <EstimateCard estimate={e} />
        </section>

        <section className="dashboard-panel dashboard-history" aria-labelledby="dashboard-history-title">
          <div className="dashboard-panel-heading">
            <span className="dashboard-icon dashboard-icon-lavender"><History size={21} aria-hidden="true" /></span>
            <h2 id="dashboard-history-title">History snapshot</h2>
          </div>
          <div className="dashboard-history-grid">
            <div className="dashboard-stat dashboard-stat-cycles">
              <Droplets size={21} strokeWidth={1.5} aria-hidden="true" />
              <p className="dashboard-stat-value">{cycles.length}</p>
              <p className="dashboard-stat-label">recorded cycles</p>
            </div>
            <div className="dashboard-stat dashboard-stat-symptoms">
              <Activity size={21} strokeWidth={1.5} aria-hidden="true" />
              <p className="dashboard-stat-value">{symptoms.length}</p>
              <p className="dashboard-stat-label">symptom records</p>
            </div>
          </div>
        </section>

        <section className="dashboard-panel dashboard-calendar" aria-labelledby="dashboard-calendar-title">
          <div className="dashboard-panel-heading">
            <span className="dashboard-icon dashboard-icon-peach"><CalendarDays size={21} aria-hidden="true" /></span>
            <h2 id="dashboard-calendar-title">Calendar preview</h2>
          </div>
          <MiniCalendar />
        </section>
      </div>
    </div>
  );
}
