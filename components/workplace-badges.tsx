import type { EmployerProfile } from "@/lib/metrics";

// Flexible work schemes and government certifications reported in MHLW data.
export function WorkplaceBadges({ profile }: { profile: EmployerProfile }) {
  const badges: { label: string; help: string }[] = [];
  if (profile.telework) {
    badges.push({ label: "Remote work", help: "Has a remote work / work-from-home scheme." });
  }
  if (profile.flextime) {
    badges.push({ label: "Flextime", help: "Has a flexible working hours scheme." });
  }
  if (profile.eruboshi) {
    badges.push({
      label: profile.eruboshi === "platinum" ? "Platinum Eruboshi" : `Eruboshi level ${profile.eruboshi}`,
      help: "えるぼし: government certification for advancing women in the workplace (levels 1–3, Platinum is the highest).",
    });
  }
  if (profile.kurumin) {
    badges.push({
      label: profile.kurumin === "platinum" ? "Platinum Kurumin" : "Kurumin",
      help: "くるみん: government certification for supporting employees raising children.",
    });
  }

  if (badges.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        {profile.hasMhlw
          ? "No flexible work schemes or certifications listed in MHLW data."
          : "This company has not published data in the MHLW database."}
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
