export const metadata = {
  title: "R2 Signed URL API",
  description: "Minimal Next.js app exposing an API to generate signed URLs for Cloudflare R2 via S3 API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
