import { getCompanyInfo } from "@/lib/company-index";
import { isEdinetCode } from "@/lib/edinet-code";
import { CORE_METRICS, isPlausible, METRICS, type EmployerProfile } from "@/lib/metrics";
import { OG_SIZE, OgFooter, ogDictionary, renderOgImage } from "@/lib/og";
import { getEmployerProfile } from "@/lib/profile";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Workplace figures";

// Link preview for a company: name, sector and the three mandatory figures.
export default async function Image({ params }: { params: Promise<{ lang: string; code: string }> }) {
  const { lang, code } = await params;
  const { t } = ogDictionary(lang);
  const company = isEdinetCode(code) ? await getCompanyInfo(code).catch(() => null) : null;
  const name = company ? company.name_en || company.name : t.site.name;
  const subtitle = company
    ? [company.name_ja, company.industry ? (t.industries[company.industry] ?? company.industry) : null]
        .filter(Boolean)
        .join(" · ")
    : "";

  let profile: EmployerProfile | undefined;
  try {
    profile = company ? await getEmployerProfile(code, company.corporate_number) : undefined;
  } catch {
    // No figures (e.g. daily API limit): show the name only.
  }
  const tiles = CORE_METRICS.map((key) => {
    const value = profile?.values[key];
    const shown = value && isPlausible(key, value.value) ? METRICS[key].format(value.value, t.units) : "—";
    return { label: t.metrics[key].label, value: shown };
  });

  const text = [name, subtitle, ...tiles.flatMap((tile) => [tile.label, tile.value])].join("");
  return renderOgImage(
    [
      <div key="title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontSize: 30, color: "#a1a1a1" }}>{subtitle}</div>
      </div>,
      <div key="tiles" style={{ display: "flex", gap: 24 }}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 12,
              padding: "28px 32px",
              border: "2px solid #333",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 26, color: "#c8c8c8" }}>{tile.label}</div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>{tile.value}</div>
          </div>
        ))}
      </div>,
      <OgFooter key="footer" />,
    ],
    text,
  );
}
