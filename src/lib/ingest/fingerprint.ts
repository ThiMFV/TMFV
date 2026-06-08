import { createHash } from "node:crypto";

export function fingerprintOf(url: string, title: string) {
  const normUrl = url.trim().toLowerCase().split("#")[0];
  const normTitle = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha1").update(`${normUrl}::${normTitle}`).digest("hex");
}
