// Script de linha de comando para rodar a ingestao manualmente.
// Uso: npm run ingest

import { runIngestion } from "@/lib/ingest/run";

async function main() {
  const result = await runIngestion({ triggeredBy: "manual" });
  console.log("Ingestion finished:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
