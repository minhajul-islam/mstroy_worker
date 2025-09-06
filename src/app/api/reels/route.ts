import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import ReelModel from "../../../models/Reel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function corsHeaders() {
  const allowOrigin = process.env.CORS_ALLOW_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q: any = {};
    if (category) q.categories = category;

    const reels = await ReelModel.find(q).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ reels }, { headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err?.message || String(err) }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Title is required" }, { status: 400, headers: corsHeaders() });
    }
    if (!body.thumbnail) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Thumbnail is required" }, { status: 400, headers: corsHeaders() });
    }
    if (!body.video) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Video is required" }, { status: 400, headers: corsHeaders() });
    }

    // Create reel document
    const doc = await ReelModel.create({
      title: body.title,
      description: body.description ?? "",
      categories: Array.isArray(body.categories) ? body.categories : [],
      thumbnail: body.thumbnail,
      video: body.video,
    });

    return NextResponse.json({ reel: { ...doc.toObject() } }, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    const status = /validation/i.test(err?.message) ? 400 : 500;
    return NextResponse.json({ error: status === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR", message: err?.message || String(err) }, { status, headers: corsHeaders() });
  }
}
