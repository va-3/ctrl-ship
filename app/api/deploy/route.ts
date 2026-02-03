import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

export const maxDuration = 30;

// Store deployed sites in /app/data/sites (persistent across builds if Railway volume mounted)
// Falls back to /tmp/sites if /app/data isn't writable
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const SITES_DIR = path.join(DATA_DIR, "sites");
const REGISTRY_FILE = path.join(DATA_DIR, "sites-registry.json");

interface SiteEntry {
  slug: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

async function loadRegistry(): Promise<SiteEntry[]> {
  try {
    const raw = await readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveRegistry(entries: SiteEntry[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(REGISTRY_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { html, name } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const id = randomUUID().split("-")[0];
    const slug = name
      ? `${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 30)}-${id}`
      : id;

    // Ensure directory exists
    await mkdir(SITES_DIR, { recursive: true });

    // Write the HTML file
    await writeFile(path.join(SITES_DIR, `${slug}.html`), html, "utf-8");

    // Build the public URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const url = `${protocol}://${host}/sites/${slug}`;

    // Update registry
    const registry = await loadRegistry();
    registry.unshift({ slug, name: name || slug, url, size: html.length, createdAt: new Date().toISOString() });
    // Keep max 100 entries
    if (registry.length > 100) registry.length = 100;
    await saveRegistry(registry);

    console.log(`[deploy] Site deployed: ${slug} (${html.length} chars) → ${url}`);

    return NextResponse.json({
      success: true,
      url,
      slug,
      size: html.length,
    });
  } catch (error) {
    console.error("[deploy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deploy failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const registry = await loadRegistry();
    return NextResponse.json({ sites: registry });
  } catch {
    return NextResponse.json({ sites: [] });
  }
}
