import { useEffect, useState } from "react";
import { ShieldCheck, Database, Activity, NotebookText, User } from "lucide-react";
import { getPrivacySummary } from "../api";

export default function PrivacyCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPrivacyData();
  }, []);

  async function loadPrivacyData() {
    try {
      setLoading(true);
      setError("");

      const result = await getPrivacySummary();
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load privacy information.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <p className="eyebrow">CYCLEJOURNAL</p>
        <h1>Privacy Center</h1>
        <p>Loading your privacy information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p className="eyebrow">CYCLEJOURNAL</p>
        <h1>Privacy Center</h1>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">CYCLEJOURNAL</p>

      <h1>Privacy Center</h1>

      <p>
        View and manage information stored in your CycleJournal account.
      </p>

      <div style={{ marginTop: "32px" }}>
        <h2>Your Data</h2>

        <div className="privacy-grid">

          <div className="privacy-card">
            <Database size={26} />
            <h3>Cycle Records</h3>
            <strong>{data?.cycle_records ?? 0}</strong>
            <p>
              Period start and end dates associated with your account.
            </p>
          </div>

          <div className="privacy-card">
            <Activity size={26} />
            <h3>Symptoms</h3>
            <strong>{data?.symptoms ?? 0}</strong>
            <p>
              Symptoms, dates and severity levels you have recorded.
            </p>
          </div>

          <div className="privacy-card">
            <NotebookText size={26} />
            <h3>Journal Notes</h3>
            <strong>{data?.journal_notes ?? 0}</strong>
            <p>
              Personal journal notes associated with your account.
            </p>
          </div>

          <div className="privacy-card">
            <User size={26} />
            <h3>Account Information</h3>

            <p>
              <strong>{data?.account_information?.name}</strong>
            </p>

            <p>{data?.account_information?.email}</p>
          </div>

        </div>
      </div>

      <div className="privacy-info">
        <ShieldCheck size={28} />

        <div>
          <h2>How your data is stored</h2>

          <p>
            Cycle records, symptoms, journal notes and settings are stored
            in the CycleJournal application database and associated with
            your authenticated user account.
          </p>

          <p>
            Your password is stored as a password hash rather than as
            plain text.
          </p>

          <p>
            CycleJournal does not claim that stored health information is
            encrypted at rest.
          </p>
        </div>
      </div>
    </div>
  );
}