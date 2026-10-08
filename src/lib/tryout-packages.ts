// Assessment builder is deliberately outside C1–C4. No active/retired seed packages.
export type TryoutPackage = {
  slug: string;
  title: string;
  section: string;
  revision: number;
  questionCount: number;
  minutes: number;
  access: "FREE";
  topics: string[];
  description: string;
};
export const tryoutPackages: TryoutPackage[] = [];
export const legacyTryoutPackages: TryoutPackage[] = [];
export function findTryoutPackage(slug: string | null) {
  return tryoutPackages.find((p) => p.slug === slug);
}
