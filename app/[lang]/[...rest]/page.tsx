import { notFound } from "next/navigation";

// Unknown URLs under a language prefix (e.g. /zh/abc) show the localized 404.
export async function generateStaticParams() {
  return [{ rest: ["not-found"] }];
}

export default function CatchAll() {
  notFound();
}
