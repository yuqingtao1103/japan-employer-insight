import { OG_SIZE, OgFooter, ogDictionary, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Japan Employer Insight";

// Default link preview for every page without its own image.
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { t } = ogDictionary((await params).lang);
  const text = [t.site.name, t.site.description].join("");
  return renderOgImage(
    [
      <div key="title" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{t.site.name}</div>
        <div style={{ fontSize: 36, color: "#c8c8c8", lineHeight: 1.4, maxWidth: 1000 }}>{t.site.description}</div>
      </div>,
      <OgFooter key="footer" />,
    ],
    text,
  );
}
