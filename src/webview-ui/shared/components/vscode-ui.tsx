import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "default" | "secondary" | "ghost";
type BadgeVariant = "default" | "secondary" | "outline";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--dependency-links-radius)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dependency-links-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dependency-links-background)] disabled:pointer-events-none disabled:opacity-50";

function buttonVariant(variant: ButtonVariant) {
  if (variant === "secondary") {
    return "border border-[var(--dependency-links-border)] bg-[var(--dependency-links-secondary)] text-[var(--dependency-links-secondary-foreground)] hover:bg-[var(--dependency-links-secondary-hover)]";
  }
  if (variant === "ghost") {
    return "text-[var(--dependency-links-muted-foreground)] hover:bg-[var(--dependency-links-accent)] hover:text-[var(--dependency-links-accent-foreground)]";
  }
  return "bg-[var(--dependency-links-primary)] text-[var(--dependency-links-primary-foreground)] hover:bg-[var(--dependency-links-primary-hover)]";
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={cx(buttonBase, buttonVariant(variant), className)} {...props} />;
}

export function LinkButton({
  className,
  variant = "default",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }) {
  return (
    <a
      className={cx(buttonBase, buttonVariant(variant), "no-underline", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "min-h-36 w-full resize-y rounded-[var(--dependency-links-radius)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-input)] px-3 py-3 font-mono text-[13px] leading-5 text-[var(--dependency-links-input-foreground)] shadow-[var(--dependency-links-shadow-sm)] outline-none placeholder:text-[var(--dependency-links-placeholder)] focus-visible:ring-2 focus-visible:ring-[var(--dependency-links-ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx(
        "rounded-xl border border-[var(--dependency-links-border)] bg-[var(--dependency-links-card)] text-[var(--dependency-links-card-foreground)] shadow-[var(--dependency-links-shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("p-5 pt-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx("m-0 text-base font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx(
        "m-0 text-sm leading-5 text-[var(--dependency-links-muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "secondary",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variantClass =
    variant === "outline"
      ? "border border-[var(--dependency-links-border)] bg-transparent"
      : variant === "default"
        ? "bg-[var(--dependency-links-primary)] text-[var(--dependency-links-primary-foreground)]"
        : "bg-[var(--dependency-links-muted)] text-[var(--dependency-links-muted-foreground)]";
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={cx("h-px w-full bg-[var(--dependency-links-border)]", className)}
      role="separator"
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--dependency-links-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <div className="mb-2 text-xs font-medium text-[var(--dependency-links-muted-foreground)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="m-0 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--dependency-links-muted-foreground)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--dependency-links-border)] bg-[var(--dependency-links-muted)]/40 px-6 py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-[var(--dependency-links-border)] bg-[var(--dependency-links-card)] text-lg">
        ↗
      </div>
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-5 text-[var(--dependency-links-muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

export function StatusLine({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      className={cx(
        "text-xs",
        error
          ? "text-[var(--dependency-links-error)]"
          : "text-[var(--dependency-links-muted-foreground)]",
      )}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
