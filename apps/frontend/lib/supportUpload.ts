import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function backendPublicUrl() {
  return (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
}

function backendUploadsRoot() {
  // apps/frontend|admin -> apps/backend/uploads
  return path.join(process.cwd(), "..", "backend", "uploads", "support");
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "file";
}

export type UploadedSupportAttachment = {
  name: string;
  url: string;
  size: number;
  mimeType: string;
};

export async function saveSupportAttachments(
  files: File[],
  ticketId: string,
): Promise<UploadedSupportAttachment[]> {
  if (files.length > MAX_FILES) {
    throw new Error(`You can attach up to ${MAX_FILES} files.`);
  }

  const dir = path.join(backendUploadsRoot(), safeName(ticketId || "general"));
  await mkdir(dir, { recursive: true });

  const saved: UploadedSupportAttachment[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      throw new Error(
        "Allowed files: images, PDF, TXT, DOC, DOCX (max 8MB each).",
      );
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each file must be 8MB or smaller.");
    }
    const ext = path.extname(file.name || "") || "";
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
    const absolute = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    const relative = `/uploads/support/${safeName(ticketId || "general")}/${filename}`;
    saved.push({
      name: file.name || filename,
      url: `${backendPublicUrl()}${relative}`,
      size: file.size,
      mimeType: file.type,
    });
  }
  return saved;
}

export function filesFromFormData(form: FormData): File[] {
  const collected: File[] = [];
  for (const value of form.getAll("files")) {
    if (value instanceof File && value.size > 0) collected.push(value);
  }
  const single = form.get("file");
  if (single instanceof File && single.size > 0) collected.push(single);
  return collected;
}
