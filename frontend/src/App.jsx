import { useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL;

function verdictFrom(prob, threshold) {
  return prob >= threshold ? "MALICIOUS" : "BENIGN";
}

function verdictStyles(verdict) {
  if (verdict === "MALICIOUS") {
    return {
      bg: "#FEE2E2",
      border: "#EF4444",
      text: "#991B1B",
      badgeBg: "#EF4444",
      badgeText: "white",
    };
  }
  return {
    bg: "#DCFCE7",
    border: "#22C55E",
    text: "#166534",
    badgeBg: "#22C55E",
    badgeText: "white",
  };
}

function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%" }} />
    </div>
  );
}

function ResultCard({ title = "Result", payload, prob, threshold, extra }) {
  const verdict = verdictFrom(prob, threshold);
  const s = verdictStyles(verdict);
  const pct = (prob * 100).toFixed(1);

  return (
    <div style={{ padding: 16, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: s.badgeBg,
            color: s.badgeText,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          {verdict}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        {/* <div style={{ fontSize: 13, color: s.text, marginBottom: 6 }}>
          Malicious probability: <b>{pct}%</b> (threshold: {(threshold * 100).toFixed(0)}%)
        </div> */}
        <PercentBar value={prob * 100} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Decoded payload</div>
        <div style={{ padding: 10, background: "rgba(255,255,255,0.65)", borderRadius: 10, wordBreak: "break-word" }}>
          {payload}
        </div>
      </div>

      {extra && <div style={{ marginTop: 10 }}>{extra}</div>}
    </div>
  );
}

export default function App() {
  const [payload, setPayload] = useState("");
  const [file, setFile] = useState(null);
  const [singleResult, setSingleResult] = useState(null); // from /api/predict
  const [imageResults, setImageResults] = useState(null); // from /api/scan-image
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function predictPayload(e) {
    e.preventDefault();
    setErr("");
    setSingleResult(null);
    setImageResults(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSingleResult(data);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  async function scanImage(e) {
    e.preventDefault();
    setErr("");
    setSingleResult(null);
    setImageResults(null);
    setLoading(true);

    if (!file) {
      setErr("Choose a QR image first.");
      setLoading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/api/scan-image`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      // backend returns: { results: [ {qr_type, payload, prob_malicious, label, threshold}, ... ] }
      setImageResults(data.results || []);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const hasAnyResult = useMemo(() => {
    return !!singleResult || (Array.isArray(imageResults) && imageResults.length > 0);
  }, [singleResult, imageResults]);

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "system-ui", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 6 }}>QR Malicious Detector</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Returns <b>1</b> = malicious, <b>0</b> = benign (based on threshold + probability).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <form onSubmit={predictPayload} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>1) Paste decoded payload</h2>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={6}
            style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            placeholder="https://example.com/login ..."
          />
          <button disabled={loading} style={{ marginTop: 10 }}>
            {loading ? "Working..." : "Predict"}
          </button>
        </form>

        <form onSubmit={scanImage} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>2) Upload QR image</h2>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div>
            <button disabled={loading} style={{ marginTop: 10 }}>
              {loading ? "Working..." : "Decode + Predict"}
            </button>
          </div>
        </form>
      </div>

      {err && (
        <div style={{ marginTop: 20, padding: 12, background: "#ffecec", border: "1px solid #ffb3b3", borderRadius: 10 }}>
          <b>Error:</b> {err}
        </div>
      )}

      {hasAnyResult && (
        <div style={{ marginTop: 22 }}>
          <h2>Result</h2>

          {singleResult && (
            <ResultCard
              title="Payload Prediction"
              payload={singleResult.payload}
              prob={singleResult.prob_malicious}
              threshold={singleResult.threshold}
              extra={
                <div style={{ fontSize: 13 }}>
                  Model output label: <b>{singleResult.label}</b>
                </div>
              }
            />
          )}

          {Array.isArray(imageResults) && imageResults.length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {imageResults.map((r, idx) => (
                <ResultCard
                  key={idx}
                  title={`QR Image Scan #${idx + 1} (${r.qr_type || "QRCODE"})`}
                  payload={r.payload}
                  prob={r.prob_malicious}
                  threshold={r.threshold}
                  extra={
                    <div style={{ fontSize: 13 }}>
                      Model output label: <b>{r.label}</b>
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {Array.isArray(imageResults) && imageResults.length === 0 && (
            <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
              No QR code detected in the image.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
