import Link from "next/link";

type BrandProps = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function VectraMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vectra-mark-gradient" x1="10" y1="48" x2="54" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5C7CFA" />
          <stop offset="0.52" stopColor="#00D1B2" />
          <stop offset="1" stopColor="#B7FF3C" />
        </linearGradient>
      </defs>
      <path d="M9 15h12l12 23 9-15 7 4-17 29L9 15Z" fill="url(#vectra-mark-gradient)" />
      <path d="M33 35 51 9l-1 12 10-2-27 27V35Z" fill="url(#vectra-mark-gradient)" />
    </svg>
  );
}

export function VectraBrand({ href = "/", compact = false, inverse = false, className = "" }: BrandProps) {
  const content = (
    <>
      <span className="vectra-brand-mark"><VectraMark size={compact ? 30 : 38} /></span>
      <span className="vectra-wordmark-wrap">
        <span className={`vectra-wordmark ${inverse ? "inverse" : ""}`}>VECTRA<span className="vectra-dot">.</span></span>
        {!compact && <span className={`vectra-tagline ${inverse ? "inverse" : ""}`}>KNOW YOUR DIRECTION.</span>}
      </span>
    </>
  );

  if (!href) return <span className={`vectra-brand ${className}`}>{content}</span>;
  return (
    <Link className={`vectra-brand ${className}`} href={href} aria-label="VECTRA — Know Your Direction">
      {content}
    </Link>
  );
}
