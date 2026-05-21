import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow disabled:opacity-50",
  secondary:
    "bg-foreground text-background hover:bg-foreground/90 font-semibold disabled:opacity-50",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-accent/40 disabled:opacity-50",
  outline:
    "border border-border text-foreground hover:bg-accent/40 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  title,
  badge,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className={[
        "bg-surface border border-border rounded-xl shadow-card",
        className,
      ].join(" ")}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {title && <h2 className="text-base font-medium">{title}</h2>}
            {badge}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Pill({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "warning" | "success" | "muted";
}) {
  const tones = {
    primary:
      "bg-primary/10 text-primary border-primary/20",
    warning:
      "bg-warning/10 text-warning border-warning/20",
    success:
      "bg-success/10 text-success border-success/20",
    muted: "bg-accent text-muted-foreground border-border",
  } as const;
  return (
    <span
      className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
