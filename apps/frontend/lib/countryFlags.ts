/** Map common country labels → ISO 3166-1 alpha-2 for flagcdn.com */

const COUNTRY_FLAG_CODES: Array<{ pattern: RegExp; code: string }> = [
  {
    pattern: /^(uae|dubai|united arab emirates|emirates)$/i,
    code: "ae",
  },
  {
    pattern: /^(uk|u\.?k\.?|united kingdom|britain|great britain|england)$/i,
    code: "gb",
  },
  {
    pattern:
      /^(usa|u\.?s\.?a\.?|us|u\.?s\.?|united states|united states of america|america)$/i,
    code: "us",
  },
  { pattern: /^(india|bharat|in)$/i, code: "in" },
  { pattern: /^(canada|ca)$/i, code: "ca" },
  { pattern: /^(ireland|ie|eire)$/i, code: "ie" },
  { pattern: /^(qatar|qa)$/i, code: "qa" },
  { pattern: /^(singapore|sg)$/i, code: "sg" },
  { pattern: /^(australia|austrealia|australai|au|oz)$/i, code: "au" },
  { pattern: /^(saudi arabia|ksa|saudi)$/i, code: "sa" },
  { pattern: /^(germany|de)$/i, code: "de" },
  { pattern: /^(france|fr)$/i, code: "fr" },
  { pattern: /^(japan|jp)$/i, code: "jp" },
  { pattern: /^(china|cn)$/i, code: "cn" },
  { pattern: /^(pakistan|pk)$/i, code: "pk" },
  { pattern: /^(bangladesh|bd)$/i, code: "bd" },
  { pattern: /^(nepal|np)$/i, code: "np" },
  { pattern: /^(sri lanka|lk)$/i, code: "lk" },
  { pattern: /^(malaysia|my)$/i, code: "my" },
  { pattern: /^(indonesia|id)$/i, code: "id" },
  { pattern: /^(philippines|ph)$/i, code: "ph" },
  { pattern: /^(thailand|th)$/i, code: "th" },
  { pattern: /^(vietnam|vn)$/i, code: "vn" },
  { pattern: /^(south africa|za)$/i, code: "za" },
  { pattern: /^(nigeria|ng)$/i, code: "ng" },
  { pattern: /^(egypt|eg)$/i, code: "eg" },
  { pattern: /^(turkey|turkiye|tr)$/i, code: "tr" },
  { pattern: /^(brazil|br)$/i, code: "br" },
  { pattern: /^(mexico|mx)$/i, code: "mx" },
  { pattern: /^(spain|es)$/i, code: "es" },
  { pattern: /^(italy|it)$/i, code: "it" },
  { pattern: /^(netherlands|holland|nl)$/i, code: "nl" },
  { pattern: /^(new zealand|nz)$/i, code: "nz" },
  { pattern: /^(hong kong|hk)$/i, code: "hk" },
  { pattern: /^(oman|om)$/i, code: "om" },
  { pattern: /^(kuwait|kw)$/i, code: "kw" },
  { pattern: /^(bahrain|bh)$/i, code: "bh" },
];

export const resolveCountryFlagCode = (name: string): string => {
  const value = name.trim();
  if (!value) return "";
  for (const entry of COUNTRY_FLAG_CODES) {
    if (entry.pattern.test(value)) return entry.code;
  }
  return "";
};

export const resolveCountryFlagImage = (name: string): string => {
  const code = resolveCountryFlagCode(name);
  return code ? `https://flagcdn.com/w80/${code}.png` : "";
};
