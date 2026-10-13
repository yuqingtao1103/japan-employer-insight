import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import type { EmployerProfile } from "@/lib/metrics";

// Flexible work schemes and government certifications reported in MHLW data.
export async function WorkplaceBadges({ profile }: { profile: EmployerProfile }) {
  const t = (await getDictionary()).badges;
  const badges: { label: string; help: string }[] = [];
  if (profile.telework) badges.push({ label: t.remoteWork, help: t.remoteWorkHelp });
  if (profile.flextime) badges.push({ label: t.flextime, help: t.flextimeHelp });
  if (profile.eruboshi) {
    badges.push({
      label:
        profile.eruboshi === "platinum"
          ? t.platinumEruboshi
          : fmt(t.eruboshiLevel, { level: profile.eruboshi }),
      help: t.eruboshiHelp,
    });
  }
  if (profile.kurumin) {
    badges.push({
      label: profile.kurumin === "platinum" ? t.platinumKurumin : t.kurumin,
      help: t.kuruminHelp,
    });
  }

  if (badges.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        {profile.hasMhlw ? t.none : t.noMhlw}
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <li
          key={b.label}
          title={b.help}
          className="rounded-full border border-sky-700/30 bg-sky-50 px-3 py-1 text-xs text-sky-900 dark:border-sky-400/30 dark:bg-sky-950 dark:text-sky-200"
        >
          {b.label}
        </li>
      ))}
    </ul>
  );
}
