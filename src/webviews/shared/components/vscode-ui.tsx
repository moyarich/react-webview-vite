import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
};

type StatusTone = "neutral" | "success" | "error";

const primaryActionClass =
  "inline-flex min-h-9 items-center justify-center rounded-[var(--dependency-links-radius-sm)] bg-[var(--dependency-links-primary-bg)] px-3.5 py-2 text-sm font-medium text-[var(--dependency-links-primary-fg)] transition-colors hover:bg-[var(--dependency-links-primary-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dependency-links-focus)]";

const secondaryActionClass =
  "inline-flex min-h-9 items-center justify-center rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-secondary-bg)] px-3.5 py-2 text-sm font-medium text-[var(--dependency-links-secondary-fg)] transition-colors hover:bg-[var(--dependency-links-secondary-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dependency-links-focus)]";

export function VSCodeButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function VSCodeSecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${secondaryActionClass} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function VSCodeLinkButton({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`${primaryActionClass} no-underline ${className}`}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}

export function VSCodeSecondaryLinkButton({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`${secondaryActionClass} no-underline ${className}`}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}

export function VSCodeTextField({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border-strong)] bg-[var(--dependency-links-input-bg)] px-3 py-2.5 text-sm text-[var(--dependency-links-input-fg)] outline-none placeholder:text-[var(--dependency-links-input-placeholder)] focus:border-[var(--dependency-links-focus)] focus:ring-1 focus:ring-[var(--dependency-links-focus)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeTextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-y rounded-[var(--dependency-links-radius-md)] border border-[var(--dependency-links-border-strong)] bg-[var(--dependency-links-input-bg)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--dependency-links-input-fg)] outline-none placeholder:text-[var(--dependency-links-input-placeholder)] focus:border-[var(--dependency-links-focus)] focus:ring-1 focus:ring-[var(--dependency-links-focus)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeCard({ className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-[var(--dependency-links-radius-lg)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface)] p-5 shadow-[var(--dependency-links-shadow)] ${className}`}
    >
      {children}
    </section>
  );
}

export function WebviewHeader({
  eyebrow = "Dependency Links",
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
    <header className="flex flex-col gap-4 rounded-[var(--dependency-links-radius-lg)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface)] p-5 shadow-[var(--dependency-links-shadow)] md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dependency-links-muted-fg)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--dependency-links-muted-fg)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  title,
  meta,
}: {
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-base font-semibold tracking-tight">{title}</h2>
      {meta ? (
        <div className="text-xs text-[var(--dependency-links-muted-fg)]">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function StatusMessage({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const toneClass =
    tone === "error"
      ? "text-[var(--dependency-links-error)]"
      : tone === "success"
        ? "text-[var(--dependency-links-fg)]"
        : "text-[var(--dependency-links-muted-fg)]";

  return (
    <div
      className={`rounded-[var(--dependency-links-radius-sm)] border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] px-3 py-2 text-sm ${toneClass}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--dependency-links-radius-md)] border border-dashed border-[var(--dependency-links-border-strong)] p-6 text-center">
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--dependency-links-muted-fg)]">
        {description}
      </p>
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--dependency-links-border)] bg-[var(--dependency-links-surface-raised)] px-2.5 py-1 text-xs font-medium text-[var(--dependency-links-muted-fg)]">
      {children}
    </span>
  );
}
