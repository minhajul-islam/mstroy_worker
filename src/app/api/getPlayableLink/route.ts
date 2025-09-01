import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function corsHeaders() {
  const allowOrigin = process.env.CORS_ALLOW_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getEndpoint(): string {
  const ep = process.env.R2_ENDPOINT?.trim();
  if (ep) return ep.replace(/\/$/, "");
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (!accountId) {
    throw new Error("Provide R2_ENDPOINT or R2_ACCOUNT_ID");
  }
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const ttlParam = searchParams.get("ttl");

    if (!key) {
      return NextResponse.json(
        { error: "Missing 'key' query parameter" },
        { status: 400, headers: corsHeaders() }
      );
    }

    let ttl = 3600; // seconds
    if (ttlParam) {
      const n = Number(ttlParam);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json(
          { error: "Invalid 'ttl' parameter" },
          { status: 400, headers: corsHeaders() }
        );
      }
      ttl = Math.min(Math.max(Math.floor(n), 1), 86400);
    }

    const endpoint = getEndpoint();
    const bucket = getRequiredEnv("R2_BUCKET");
    const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Determine the correct key by probing existence with HeadObject.
    const candidates: string[] = [];
    if (key) {
      candidates.push(key);
      if (key.startsWith(`${bucket}/`)) {
        // If the user incorrectly included the bucket name in the key, try stripping it.
        candidates.push(key.slice(bucket.length + 1));
      } else {
        // If the object may live under a folder named like the bucket, try adding it.
        candidates.push(`${bucket}/${key}`);
      }
    }

    let resolvedKey: string | null = null;
    for (const cand of candidates) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: cand }));
        resolvedKey = cand;
        break;
      } catch (e: any) {
        const status = e?.$metadata?.httpStatusCode;
        const code = e?.name || e?.Code;
        if (status === 404 || code === "NotFound" || code === "NoSuchKey") {
          // try next candidate
          continue;
        }
        // For other errors (auth, network), fail fast
        throw e;
      }
    }

    if (!resolvedKey) {
      return NextResponse.json(
        { error: "NoSuchKey", message: "The specified key does not exist.", tried: candidates },
        { status: 404, headers: corsHeaders() }
      );
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: resolvedKey });
    const url = await getSignedUrl(s3, command, { expiresIn: ttl });

    return NextResponse.json({ url, expiresIn: ttl, key: resolvedKey }, { headers: corsHeaders() });
  } catch (err: any) {
    const message = err?.message || "Internal Server Error";
    const code = /Missing env|Provide R2_ENDPOINT/.test(message) ? 500 : 500;
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message },
      { status: code, headers: corsHeaders() }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
