// Public catalog only. Revision slugs are stable; revised sets need a new slug.
export const tryoutPackages = [
  {
    slug: "pk-01-v2",
    title: "PK — Paket 01",
    section: "PK",
    revision: 2,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["rasio", "persen", "geometri"],
    description:
      "Rasio, persentase, dan geometri untuk menguji fondasi kuantitatif.",
  },
  {
    slug: "pm-01-v2",
    title: "PM — Paket 01",
    section: "PM",
    revision: 2,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["aljabar", "peluang"],
    description: "Model aljabar, peluang, dan pencacahan dalam satu paket.",
  },
  {
    slug: "pu-01-v2",
    title: "PU — Paket 01",
    section: "PU",
    revision: 2,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["statistika", "pola"],
    description:
      "Interpretasi data dan pola bilangan untuk penalaran kuantitatif.",
  },
  {
    slug: "pk-02-v1",
    title: "PK — Paket 02",
    section: "PK",
    revision: 1,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["rasio", "persen", "geometri"],
    description:
      "Set kedua rasio, persentase, dan geometri dengan soal berbeda.",
  },
  {
    slug: "pm-02-v1",
    title: "PM — Paket 02",
    section: "PM",
    revision: 1,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["aljabar", "peluang"],
    description: "Set kedua pemodelan aljabar, peluang, dan pencacahan.",
  },
  {
    slug: "pu-02-v1",
    title: "PU — Paket 02",
    section: "PU",
    revision: 1,
    questionCount: 20,
    minutes: 20,
    access: "FREE",
    topics: ["statistika", "pola"],
    description: "Set kedua interpretasi data dan pola bilangan.",
  },
] as const;
// Keep metadata for historical results; legacy revisions are not in the catalog.
export const legacyTryoutPackages = tryoutPackages
  .filter((p) => p.slug.endsWith("-01-v2"))
  .map((p) => ({
    ...p,
    slug: p.slug.replace("-v2", "-v1"),
    revision: 1,
    questionCount: 15,
    minutes: 30,
  }));
export function findTryoutPackage(slug: string | null) {
  return [...tryoutPackages, ...legacyTryoutPackages].find(
    (p) => p.slug === slug,
  );
}
