import { cn } from "@/lib/utils";

// Self-contained SVG product art so drops render crisp visuals with no external
// image hosting and zero broken-image risk.
export function ProductArt({
  kind,
  accent,
  className,
}: {
  kind: string;
  accent: string;
  className?: string;
}) {
  const a = `hsl(${accent})`;
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 120% at 30% 10%, hsl(${accent} / 0.35), transparent 60%), hsl(240 24% 8%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(hsl(0 0% 100% / 0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <svg viewBox="0 0 200 200" className="relative h-3/5 w-3/5 drop-shadow-2xl">
        {kind === "sneaker" ? <Sneaker a={a} /> : null}
        {kind === "tee" ? <Tee a={a} /> : null}
        {kind === "vinyl" ? <Vinyl a={a} /> : null}
        {kind !== "sneaker" && kind !== "tee" && kind !== "vinyl" ? (
          <Box a={a} />
        ) : null}
      </svg>
    </div>
  );
}

function Sneaker({ a }: { a: string }) {
  return (
    <g>
      <path
        d="M20 120 C30 95 55 92 78 100 L120 116 C140 122 170 120 182 132 C188 138 188 150 178 152 L40 152 C26 152 18 142 20 120 Z"
        fill={a}
        opacity="0.95"
      />
      <path d="M78 100 L92 78 C96 72 104 72 108 80 L120 116 Z" fill="white" opacity="0.85" />
      <circle cx="150" cy="138" r="5" fill="white" opacity="0.8" />
      <rect x="40" y="150" width="142" height="6" rx="3" fill="white" opacity="0.5" />
      <path d="M86 92 l10 16 M98 88 l10 18 M110 90 l8 16" stroke="white" strokeWidth="3" opacity="0.6" />
    </g>
  );
}

function Tee({ a }: { a: string }) {
  return (
    <g>
      <path
        d="M60 50 L40 70 L52 86 L66 74 L66 160 L134 160 L134 74 L148 86 L160 70 L140 50 L116 50 C112 64 88 64 84 50 Z"
        fill={a}
      />
      <path d="M84 50 C88 64 112 64 116 50" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
      <circle cx="100" cy="110" r="20" fill="white" opacity="0.18" />
    </g>
  );
}

function Vinyl({ a }: { a: string }) {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#0c0c12" />
      <circle cx="100" cy="100" r="78" fill="none" stroke={a} strokeWidth="2" opacity="0.5" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="white" strokeWidth="1" opacity="0.15" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="white" strokeWidth="1" opacity="0.15" />
      <circle cx="100" cy="100" r="30" fill={a} />
      <circle cx="100" cy="100" r="6" fill="#0c0c12" />
    </g>
  );
}

function Box({ a }: { a: string }) {
  return (
    <g>
      <path d="M100 36 L164 70 L100 104 L36 70 Z" fill={a} opacity="0.95" />
      <path d="M36 70 L100 104 L100 168 L36 134 Z" fill={a} opacity="0.6" />
      <path d="M164 70 L100 104 L100 168 L164 134 Z" fill={a} opacity="0.4" />
    </g>
  );
}
