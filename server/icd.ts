const NLM_API = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search";

export async function lookupIcdCode(description: string): Promise<string> {
  try {
    const url = `${NLM_API}?sf=code,name&terms=${encodeURIComponent(description)}&maxList=1`;
    const res = await fetch(url);
    if (!res.ok) return "Z99.9";
    const data = await res.json();
    const rows: Array<[string, string]> = data[3] ?? [];
    return rows[0]?.[0] ?? "Z99.9";
  } catch {
    return "Z99.9";
  }
}
