import { Suspense } from "react";
import { PublicStatus } from "./public-status";

export function PublicStatusWrapper() {
  return (
    <Suspense fallback={null}>
      <PublicStatus />
    </Suspense>
  );
}
