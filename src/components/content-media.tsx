"use client";
import Image from "next/image";
export function ContentMedia({
  media,
}: {
  media?: { id: string; url: string; alt: string; kind?: string }[];
}) {
  return media?.map((m) =>
    m.url ? (
      <figure key={m.id}>
        {m.kind === "DOCUMENT" ? (
          <a href={m.url} target="_blank" rel="noopener noreferrer">
            {m.alt}
          </a>
        ) : (
          <Image
            src={m.url}
            alt={m.alt}
            width={800}
            height={450}
            unoptimized
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
        <figcaption>{m.alt}</figcaption>
      </figure>
    ) : null,
  );
}
