import { readFileSync, writeFileSync } from "fs";

const path = "src/components/LanguageProvider/LanguageProvider.tsx";
let t = readFileSync(path, "utf8");
const start = t.indexOf("  fa: {");
const end = t.indexOf("export function LanguageProvider");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}
// Find the closing of translations object just before export
const closeIdx = t.lastIndexOf("};", end);
t =
  t.slice(0, start) +
  "  // Unused while UI is English-only\n  fa: {},\n" +
  t.slice(closeIdx);
writeFileSync(path, t);
console.log("LanguageProvider fa block cleared");
