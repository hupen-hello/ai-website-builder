import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/** Dev-only: editor posts current design sections so agents can inspect quality. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body = await req.json();
    const dir = path.join(process.cwd(), ".tmp-redesign-debug");
    await mkdir(dir, { recursive: true });
    const id = String(body?.designId || "unknown").replace(/[^\w.-]+/g, "_");
    const file = path.join(dir, `${id}.json`);
    await writeFile(
      file,
      JSON.stringify(
        {
          savedAt: new Date().toISOString(),
          designId: body?.designId,
          theme: body?.theme ?? null,
          sectionCount: Array.isArray(body?.sections?.items) ? body.sections.items.length : 0,
          labels: (body?.sections?.items || []).map(
            (item: { id?: string; label?: string; html?: string }) => ({
              id: item.id,
              label: item.label,
              htmlLen: (item.html || "").length,
            }),
          ),
          sections: body?.sections ?? null,
        },
        null,
        2,
      ),
      "utf8",
    );
    return NextResponse.json({ ok: true, file });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fail" },
      { status: 500 },
    );
  }
}
