/**
 * Morning-quality finish rails — Instrument Serif + Manrope + linen/espresso system.
 * Elevates Flash HTML toward the polished abhishek-mishra-home reference level.
 */

const FINISH_MARK = 'data-create-ai-ref-finish="1"';

export function stripCreateAiReferenceFinish(html: string): string {
  if (!html) return html;
  let out = html;
  out = out.replace(
    /<link\b[^>]*data-create-ai-ref-finish=["']1["'][^>]*>/gi,
    "",
  );
  out = out.replace(
    /<style\b[^>]*data-create-ai-ref-finish=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  return out;
}

/** Inject reference-level tokens + section polish (idempotent). */
export function injectCreateAiReferenceFinish(html: string): string {
  if (!html) return html;
  let out = stripCreateAiReferenceFinish(html);

  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com" ${FINISH_MARK} />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin ${FINISH_MARK} />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" ${FINISH_MARK} />`;

  const css = `<style ${FINISH_MARK}>
:root{
  --cai-primary:#C2410C;
  --cai-primary-hover:#9A3412;
  --cai-accent:#FB923C;
  --cai-accent-soft:#FFEDD5;
  --cai-espresso:#1C1917;
  --cai-linen:#FFF7ED;
  --cai-linen-card:#FAF2EA;
  --cai-surface:#FFFFFF;
  --cai-text:#1C1917;
  --cai-muted:#6B615B;
  --cai-border:#E7DBCE;
  --cai-font-heading:'Instrument Serif',Georgia,serif;
  --cai-font-body:'Manrope',system-ui,sans-serif;
  --cai-shadow-sm:0 2px 8px rgba(28,25,23,.04);
  --cai-shadow-md:0 12px 32px rgba(28,25,23,.08);
  --cai-shadow-lg:0 24px 48px rgba(28,25,23,.12);
  --cai-radius-md:16px;
  --cai-radius-lg:24px;
}
html{scroll-behavior:smooth}
body{
  font-family:var(--cai-font-body)!important;
  background:var(--cai-linen)!important;
  color:var(--cai-text)!important;
  line-height:1.65!important;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{
  font-family:var(--cai-font-heading)!important;
  font-weight:400!important;
  color:var(--cai-espresso)!important;
  line-height:1.15!important;
  letter-spacing:-.01em;
}
p{color:var(--cai-muted);font-size:1.05rem}
section{
  scroll-margin-top:88px;
  padding:clamp(3.5rem,7vw,5.5rem) clamp(1rem,3vw,1.75rem)!important;
}
section > .container,
section > [class*="wrap"],
section > [class*="inner"]{
  max-width:1240px;
  margin-left:auto;
  margin-right:auto;
}
/* Header — clean sticky bar */
header[data-create-ai-hdr="1"]{
  background:rgba(255,247,237,.92)!important;
  backdrop-filter:blur(12px);
  border-bottom:1px solid var(--cai-border)!important;
  color:var(--cai-espresso)!important;
}
header[data-create-ai-hdr="1"] [data-cai-brand-label]{
  color:inherit!important;
  max-width:none!important;
  overflow:visible!important;
  text-overflow:clip!important;
}
@media (max-width:900px){
  header[data-create-ai-hdr="1"] [data-cai-brand-label]{
    max-width:min(58vw,200px)!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
}
header[data-create-ai-hdr="1"] a[data-cai-btn="hdr-cta"],
header[data-create-ai-hdr="1"] .header-actions a.btn,
header[data-create-ai-hdr="1"] .header-actions a.btn-primary,
header[data-create-ai-hdr="1"] a.btn,
header[data-create-ai-hdr="1"] a[style*="padding"][style*="border-radius"]{
  background:var(--cai-primary)!important;
  color:#fff!important;
  border-radius:999px!important;
  font-family:var(--cai-font-body)!important;
  font-weight:700!important;
  box-shadow:var(--cai-shadow-sm);
  border-bottom:none!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:12px 22px!important;
  line-height:1.2!important;
  text-decoration:none!important;
  white-space:nowrap!important;
}
header[data-create-ai-hdr="1"] a[data-cai-btn="hdr-cta"]:hover{
  background:var(--cai-primary-hover)!important;
}
/* Hero */
#home,#hero,section.hero,[id*="hero"]{
  background:linear-gradient(165deg,var(--cai-linen) 0%,#FFE8D6 55%,var(--cai-linen-card) 100%)!important;
}
#home h1,#hero h1,section.hero h1{
  font-size:clamp(2.2rem,5.5vw,3.75rem)!important;
  max-width:18ch;
}
#home h1 .highlight,#hero h1 span,#home h1 em{
  color:var(--cai-primary)!important;
  font-style:italic;
}
/* Badges / eye brows */
.badge,[class*="badge"],
section p:first-child[style*="letter-spacing"],
section > div > p:first-of-type[style*="uppercase"]{
  display:inline-flex!important;
  align-items:center;
  gap:.5rem;
  padding:.35rem 1rem!important;
  background:var(--cai-accent-soft)!important;
  color:var(--cai-primary)!important;
  border-radius:999px!important;
  font-size:.8rem!important;
  font-weight:700!important;
  letter-spacing:.08em!important;
  text-transform:uppercase!important;
  border:1px solid rgba(194,65,12,.2)!important;
  width:fit-content;
  margin-bottom:.85rem!important;
}
/* Cards */
#services article,#services [class*="card"],
#testimonials article,#about article,
section [class*="service-card"],section [class*="testimonial"]{
  background:var(--cai-surface)!important;
  border:1px solid var(--cai-border)!important;
  border-radius:var(--cai-radius-lg)!important;
  box-shadow:var(--cai-shadow-md)!important;
  padding:1.6rem!important;
  transition:transform .28s ease,box-shadow .28s ease;
}
#services article:hover,#testimonials article:hover,
section [class*="service-card"]:hover{
  transform:translateY(-6px);
  box-shadow:var(--cai-shadow-lg)!important;
}
/* Gallery tiles */
#gallery img,section#gallery img{
  border-radius:var(--cai-radius-md)!important;
  aspect-ratio:4/3;
  object-fit:cover!important;
  width:100%;
  box-shadow:var(--cai-shadow-sm);
  transition:transform .45s ease;
}
#gallery img:hover{transform:scale(1.03)}
/* Contact */
#contact,[data-create-ai-contact="1"]{
  background:linear-gradient(180deg,#FFF7ED 0%,#F5E6D8 100%)!important;
}
#contact form input,#contact form textarea,
[data-create-ai-contact-form="1"] input,
[data-create-ai-contact-form="1"] textarea{
  background:#fff!important;
  border:1px solid var(--cai-border)!important;
  border-radius:12px!important;
  font-family:var(--cai-font-body)!important;
}
#contact form button[type="submit"],
[data-create-ai-contact-form="1"] button[type="submit"]{
  background:var(--cai-primary)!important;
  color:#fff!important;
  border-radius:999px!important;
  font-weight:700!important;
  padding:.9rem 1.75rem!important;
  border:0!important;
}
/* Footer */
footer[data-create-ai-footer="1"],footer[data-cai-footer-polish="1"]{
  background:linear-gradient(165deg,#1C1917 0%,#2A2421 100%)!important;
  color:#FAF2EA!important;
  border-top:0!important;
}
footer[data-create-ai-footer="1"] a{color:#FFEDD5!important}
footer[data-create-ai-footer="1"] a:hover{color:#FB923C!important}
footer[data-create-ai-footer="1"] strong{
  font-family:var(--cai-font-heading)!important;
  font-weight:400!important;
}
/* Buttons in content */
a.btn-primary,.btn-primary,
a[href="#contact"][style*="padding"]{
  transition:background .25s ease,transform .25s ease;
}
@media (max-width:900px){
  #home h1,#hero h1{font-size:clamp(1.85rem,8vw,2.4rem)!important;max-width:none}
  section{padding:2.75rem 1rem!important}
}
</style>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${fonts}\n${css}\n</head>`);
  } else if (/<body\b/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (open) => `${open}${fonts}${css}`);
  } else {
    out = `${fonts}${css}${out}`;
  }
  return out;
}
