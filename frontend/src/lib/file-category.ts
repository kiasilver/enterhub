/** Classify files for workspace gallery filters. */
export type FileCategory = "image" | "video" | "pdf" | "document" | "audio" | "other";

export function fileCategory(mimeType?: string | null, fileName?: string | null): FileCategory {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();

  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name)) {
    return "image";
  }
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(name)) {
    return "video";
  }
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac)$/i.test(name)) {
    return "audio";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    mime.includes("document") ||
    mime.includes("sheet") ||
    mime.includes("presentation") ||
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    /\.(docx?|xlsx?|pptx?|txt|csv|rtf|odt)$/i.test(name)
  ) {
    return "document";
  }
  return "other";
}

export const GALLERY_CATEGORIES: {
  id: FileCategory | "all";
  label: string;
  color: string;
}[] = [
  { id: "all", label: "All", color: "#64748b" },
  { id: "image", label: "Images", color: "#ec4899" },
  { id: "video", label: "Videos", color: "#8b5cf6" },
  { id: "pdf", label: "PDF", color: "#ef4444" },
  { id: "document", label: "Docs", color: "#3b82f6" },
  { id: "audio", label: "Audio", color: "#06b6d4" },
  { id: "other", label: "Other", color: "#f59e0b" },
];

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
