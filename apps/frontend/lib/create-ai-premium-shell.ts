/**
 * Premium base shell — fonts + Tailwind (preflight OFF) + Lucide.
 *
 * Critical: `tailwind.config` MUST load BEFORE cdn.tailwindcss.com.
 * Config-after-CDN left preflight ON and wiped AI margins (cramped nav).
 */

const SHELL_MARK = 'data-create-ai-premium-shell="1"';

export function hasCreateAiPremiumShell(html: string): boolean {
  return /data-create-ai-premium-shell=["']1["']/i.test(html || "");
}

/** Remove prior shell injects so we can re-stamp with correct Tailwind order. */
export function stripCreateAiPremiumShell(html: string): string {
  if (!html) return html;
  let out = html;
  out = out.replace(/<!--\s*create-ai premium shell\s*-->/gi, "");
  out = out.replace(
    /<link\b[^>]*data-create-ai-premium-shell=["']1["'][^>]*>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*data-create-ai-premium-shell=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*data-create-ai-premium-shell=["']1["'][^>]*\/>/gi,
    "",
  );
  out = out.replace(
    /<style\b[^>]*data-create-ai-premium-shell=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  // Orphan Tailwind play CDN / config from older injects
  out = out.replace(
    /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*>\s*tailwind\.config\s*=\s*\{[\s\S]*?preflight:\s*false[\s\S]*?<\/script>/gi,
    "",
  );
  return out;
}

/**
 * Inject fonts + Tailwind (config BEFORE CDN) + Lucide.
 * Always rewrites prior shell so broken CDN stamps are healed.
 */
export function injectCreateAiPremiumShell(html: string): string {
  if (!html) return html;
  let out = stripCreateAiPremiumShell(html);

  // Order matters: config → CDN. Otherwise preflight resets margins/gaps.
  const headBits = `<!-- create-ai premium shell -->
<link rel="preconnect" href="https://fonts.googleapis.com" ${SHELL_MARK} />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" ${SHELL_MARK} />
<script ${SHELL_MARK}>
  tailwind = window.tailwind || {};
  tailwind.config = {
    corePlugins: { preflight: false },
    important: false
  };
</script>
<script src="https://cdn.tailwindcss.com" ${SHELL_MARK}></script>
<script src="https://unpkg.com/lucide@latest" ${SHELL_MARK}></script>
<style ${SHELL_MARK}>
  html { scroll-behavior: smooth; }
</style>`;

  const boot = `<script ${SHELL_MARK}>
(function(){try{if(window.lucide&&lucide.createIcons)lucide.createIcons();}catch(e){}})();
</script>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${headBits}\n</head>`);
  } else if (/<html\b[^>]*>/i.test(out)) {
    out = out.replace(/<html\b[^>]*>/i, (open) => `${open}\n<head>${headBits}</head>`);
  } else {
    out = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>${headBits}</head><body>${out}${boot}</body></html>`;
    return out;
  }

  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${boot}\n</body>`);
  } else {
    out = `${out}\n${boot}`;
  }
  return out;
}
