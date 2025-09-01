export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>R2 Signed URL API</h1>
      <p>API route:</p>
      <pre>
        <code>/api/getPlayableLink?key=path/to/file.mp4&amp;ttl=600</code>
      </pre>
      <p>
        Configure environment variables in <code>.env.local</code> or Vercel
        project settings.
      </p>
    </main>
  );
}
