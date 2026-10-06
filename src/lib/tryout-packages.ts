// Public catalog only. Revision slugs are stable; revised sets need a new slug.
export const tryoutPackages = [
  {
    slug: "pk-01-v1",
    title: "PK — Paket 01",
    section: "PK",
    revision: 1,
    questionCount: 15,
    minutes: 30,
    access: "FREE",
    topics: ["rasio", "persen", "geometri"],
    description:
      "Rasio, persentase, dan geometri untuk menguji fondasi kuantitatif.",
  },
  {
    slug: "pm-01-v1",
    title: "PM — Paket 01",
    section: "PM",
    revision: 1,
    questionCount: 15,
    minutes: 30,
    access: "FREE",
    topics: ["aljabar", "peluang"],
    description: "Model aljabar, peluang, dan pencacahan dalam satu paket.",
  },
  {
    slug: "pu-01-v1",
    title: "PU — Paket 01",
    section: "PU",
    revision: 1,
    questionCount: 15,
    minutes: 30,
    access: "FREE",
    topics: ["statistika", "pola"],
    description:
      "Interpretasi data dan pola bilangan untuk penalaran kuantitatif.",
  },
] as const;
export function findTryoutPackage(slug: string | null) {
  return tryoutPackages.find((p) => p.slug === slug);
}
