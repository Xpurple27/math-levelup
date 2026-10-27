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
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="vectra-left"
          x1="8"
          y1="12"
          x2="34"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5C7CFA" />
          <stop offset="0.55" stopColor="#3F8EFA" />
          <stop offset="1" stopColor="#39C6EE" />
        </linearGradient>
        <linearGradient
          id="vectra-up"
          x1="30"
          y1="57"
          x2="61"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#39C6EE" />
          <stop offset="0.48" stopColor="#00D1B2" />
          <stop offset="1" stopColor="#B7FF3C" />
        </linearGradient>
      </defs>
      <path d="M8 14H22.5L36.7 41.6 29.1 56.8 8 14Z" fill="url(#vectra-left)" />
      <path
        d="M21.5 31.4 27.2 42.4 36.7 41.6 31.2 30.8 21.5 31.4Z"
        fill="#42B7ED"
        fillOpacity="0.92"
      />
      <path
        d="M28.9 56.7 47.8 24.8 42.4 22.6 61.6 9.4 58.3 31.6 53 27.4 37.2 55.3 28.9 56.7Z"
        fill="url(#vectra-up)"
      />
      <path
        d="M30.8 53.5 37.2 55.3 44.7 41.8 39.1 39.5 30.8 53.5Z"
        fill="#00CDB7"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function VectraBrand({
  href = "/",
  compact = false,
  inverse = false,
  className = "",
}: BrandProps) {
  const content = (
    <>
      <span className="vectra-brand-mark">
        <VectraMark size={compact ? 30 : 38} />
      </span>
      <span className="vectra-wordmark-wrap">
        <span className={`vectra-wordmark ${inverse ? "inverse" : ""}`}>
          VECTRA<span className="vectra-dot">.</span>
        </span>
        {!compact && (
          <span className={`vectra-tagline ${inverse ? "inverse" : ""}`}>
            KNOW YOUR DIRECTION.
          </span>
        )}
      </span>
    </>
  );

  if (!href)
    return <span className={`vectra-brand ${className}`}>{content}</span>;
  return (
    <Link
      className={`vectra-brand ${className}`}
      href={href}
      aria-label="VECTRA — Know Your Direction"
    >
      {content}
    </Link>
  );
}
