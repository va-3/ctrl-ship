import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const SITES_DIR = path.join(DATA_DIR, "sites");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Sanitize slug to prevent path traversal
    const safe = slug.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = path.join(SITES_DIR, safe.endsWith(".html") ? safe : `${safe}.html`);

    const html = await readFile(filePath, "utf-8");

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Site Not Found</title>
      <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0e1a;color:#e8edf9}
      .box{text-align:center}h1{font-size:4rem;margin:0;opacity:0.3}p{color:#94a3b8}a{color:#8b5cf6}</style></head>
      <body><div class="box"><h1>404</h1><p>This site hasn't been deployed yet.</p><p><a href="/">← Back to CTRL+Ship</a></p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
