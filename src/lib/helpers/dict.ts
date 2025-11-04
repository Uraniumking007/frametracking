// Cached, multi-language dictionary resolver with graceful fallbacks
// Preference order:
// 1) oracle.browse.wf/dicts/{lang}.json (fast CDN)
// 2) raw GitHub dict.{lang}.json (public export plus)
// 3) empty object

const dictCache = new Map<string, Record<string, string>>();

function getOracleUrl(lang: string) {
  return `https://oracle.browse.wf/dicts/${lang}.json`;
}

function getGithubUrl(lang: string) {
  return `https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/dict.${lang}.json`;
}

async function tryFetchJson(
  url: string
): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, string>;
    return data || null;
  } catch {
    return null;
  }
}

export async function fetchDictionary(
  language: string = "en"
): Promise<Record<string, string>> {
  const lang = (language || "en").toLowerCase();
  if (dictCache.has(lang)) return dictCache.get(lang) as Record<string, string>;

  const oracle = await tryFetchJson(getOracleUrl(lang));
  if (oracle) {
    dictCache.set(lang, oracle);
    return oracle;
  }

  const github = await tryFetchJson(getGithubUrl(lang));
  if (github) {
    dictCache.set(lang, github);
    return github;
  }

  dictCache.set(lang, {});
  return {};
}

export async function resolveLocalizedText(
  key: string,
  language: string = "en"
): Promise<string> {
  if (!key || typeof key !== "string") return "";
  if (!key.startsWith("/Lotus/Language/")) return key;

  const dict = await fetchDictionary(language);

  // Direct lookup first
  if (dict[key]) {
    return dict[key];
  }

  // Browse.wf-style fallback patterns
  const fallbackPatterns = [
    // Try without the full path
    key.split("/").pop() || "",
    // Try with common variations
    key.replace("/Lotus/Language/", ""),
    // Try with simplified path
    key.replace(/^\/Lotus\/Language\/[^\/]+\//, ""),
  ];

  // Try fallback patterns
  for (const pattern of fallbackPatterns) {
    if (pattern && dict[pattern]) {
      return dict[pattern];
    }
  }

  // Try partial matching (browse.wf methodology)
  const keyParts = key.split("/");
  const lastPart = keyParts[keyParts.length - 1];

  if (lastPart) {
    // Look for keys that end with the same part
    for (const [dictKey, value] of Object.entries(dict)) {
      if (
        dictKey.endsWith(lastPart) ||
        lastPart.includes(dictKey.split("/").pop() || "")
      ) {
        return value;
      }
    }
  }

  // Final fallback - return the key itself
  return key;
}

export function clearDictionaryCache() {
  dictCache.clear();
}
