"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function SignedOutNotice() {
  const params = useSearchParams();
  if (params.get("signed_out") !== "1") return null;

  return (
    <div className="signed-out-notice" role="status" aria-live="polite">
      <CheckCircle2 size={17} />
      <span>Berhasil keluar dari akun.</span>
    </div>
  );
}
