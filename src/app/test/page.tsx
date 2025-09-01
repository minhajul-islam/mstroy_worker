"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TestPage() {
  const sp = useSearchParams();
  const initialKey = sp.get("key") ?? "";
  const [key, setKey] = useState(initialKey);
  const [ttl, setTtl] = useState("1200");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (key) q.set("key", key);
    if (ttl) q.set("ttl", ttl);
    return q.toString();
  }, [key, ttl]);

  const fetchUrl = useCallback(async () => {
    if (!key) {
      setError("Please enter an object key");
      return;
    }
    setLoading(true);
    setError(null);
    setSignedUrl(null);
    try {
      const res = await fetch(`/api/getPlayableLink?${query}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Request failed");
      setSignedUrl(data.url);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [key, query]);

  useEffect(() => {
    if (initialKey) {
      fetchUrl();
    }
  }, [initialKey, fetchUrl]);

  return (
    <main style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif", maxWidth: 960 }}>
      <h1>Test R2 Signed URL</h1>
      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <label>
          Object key
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="path/to/file.mp4"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label>
          TTL (seconds)
          <input
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            placeholder="3600"
            style={{ display: "block", width: 200, padding: 8, marginTop: 6 }}
          />
        </label>
        <button onClick={fetchUrl} disabled={loading || !key} style={{ padding: "10px 16px", width: 160 }}>
          {loading ? "Generating..." : "Get URL"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#b00020", marginTop: 12 }}>Error: {error}</p>
      )}

      {signedUrl && (
        <section style={{ marginTop: 24 }}>
          <h2>Signed URL</h2>
          <p style={{ wordBreak: "break-all" }}>
            <a href={signedUrl} target="_blank" rel="noreferrer">
              {signedUrl}
            </a>
          </p>
          <h3>Preview</h3>
          <video
            key={signedUrl}
            src={signedUrl}
            controls
            style={{ width: "100%", maxWidth: 640, background: "#000" }}
          />
        </section>
      )}
    </main>
  );
}
