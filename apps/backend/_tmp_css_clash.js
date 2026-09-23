const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const row = await p.createAiDesign.findUnique({
    where: { designKey: "ca_mu13h83g_b724ca46fb" },
    select: { site: true, payload: true, brandName: true },
  });
  if (!row) {
    console.log("NOT_FOUND");
    await p.$disconnect();
    return;
  }
  const pages = row.site?.pages || [];
  const html = String(pages[0]?.html || "");
  const marks = [
    "data-create-ai-design-theme",
    "data-create-ai-hdr",
    "data-create-ai-wow-polish",
    "data-create-ai-premium-shell",
    "data-create-ai-design-tokens",
    "--cai-primary",
    "Abril",
    "display:flex!important",
    "display: flex !important",
    "inline-flex!important",
    "inline-flex !important",
  ];
  for (const m of marks) {
    const re = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    console.log(`${m}: ${(html.match(re) || []).length}`);
  }
  const theme = html.match(
    /<style[^>]*data-create-ai-design-theme[^>]*>[\s\S]*?<\/style>/i,
  );
  if (theme) console.log("\nTHEME_BLOCK:\n" + theme[0].slice(0, 1200));
  const hdr = html.match(
    /header\[data-create-ai-hdr[\s\S]{0,800}/i,
  );
  if (hdr) console.log("\nHDR_RULES:\n" + hdr[0].slice(0, 900));
  console.log(
    "\nprefs=",
    JSON.stringify(row.payload?.designPrefs || null),
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e.message);
  await p.$disconnect();
  process.exit(1);
});
