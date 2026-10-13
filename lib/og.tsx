import "server-only";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { zh } from "@/lib/i18n/dictionaries/zh";

// Shared pieces for the link preview images (Open Graph) shown when a page is
// shared on WeChat, LinkedIn, X, etc.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_HOST = "japan-employer-insight.vercel.app";
const FOOTER_CREDIT = "Powered by EDINET DB · MHLW";

// Metadata image routes get the locale from params (root params are not
// available there), so the dictionary is picked here.
export function ogDictionary(lang: string): { locale: Locale; t: Dictionary } {
  const locale = isLocale(lang) ? lang : "en";
  return { locale, t: locale === "zh" ? zh : en };
}

// Noto Sans SC covers Chinese and Japanese. Only the characters in `text` are
// downloaded (a few KB) because the full font is far over the image size limit.
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl, { cache: "force-cache" })).text();
    const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
    if (!fontUrl) return null;
    return await (await fetch(fontUrl, { cache: "force-cache" })).arrayBuffer();
  } catch {
    return null;
  }
}

// Every string shown in the image must be passed in `text` so its glyphs load.
// `parts` are stacked top to bottom with space between them. (The image
// renderer does not lay out React fragments, so parts are passed as an array.)
export async function renderOgImage(parts: ReactNode[], text: string): Promise<ImageResponse> {
  const font = await loadFont(text + OG_HOST + FOOTER_CREDIT);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: font ? "Noto Sans SC" : undefined,
        }}
      >
        {parts}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: font ? [{ name: "Noto Sans SC", data: font, weight: 700, style: "normal" }] : undefined,
    },
  );
}

export function OgFooter() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a1a1a1" }}>
      <span>{OG_HOST}</span>
      <span>{FOOTER_CREDIT}</span>
    </div>
  );
}
