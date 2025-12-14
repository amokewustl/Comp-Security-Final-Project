import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [payload, setPayload] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function predictPayload(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    try {
      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function scanImage(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!file) {
      setErr("Choose an image first.");
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
      setResult(data);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>QR Malicious Detector</h1>
      <p>Model returns <b>1</b> = malicious, <b>0</b> = benign (plus probability).</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <form onSubmit={predictPayload} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>1) Paste decoded payload</h2>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={6}
            style={{ width: "100%" }}
            placeholder="https://example.com/login ..."
          />
          <button style={{ marginTop: 10 }}>Predict</button>
        </form>

        <form onSubmit={scanImage} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>2) Upload QR image</h2>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button style={{ marginTop: 10 }}>Decode + Predict</button>
        </form>
      </div>

      {err && (
        <div style={{ marginTop: 20, padding: 12, background: "#ffecec", border: "1px solid #ffb3b3", borderRadius: 10 }}>
          <b>Error:</b> {err}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Result</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
