import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function VSCodeButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded px-3 py-1.5 text-sm font-medium text-[var(--vscode-button-foreground,#fff)] bg-[var(--vscode-button-background,#0e639c)] hover:bg-[var(--vscode-button-hoverBackground,#1177bb)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder,#007fd4)] ${className}`}
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
      className={`rounded px-3 py-1.5 text-sm font-medium text-[var(--vscode-button-secondaryForeground,#fff)] bg-[var(--vscode-button-secondaryBackground,#3a3d41)] hover:bg-[var(--vscode-button-secondaryHoverBackground,#45494e)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder,#007fd4)] ${className}`}
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
      className={`w-full rounded border border-[var(--vscode-input-border,#3c3c3c)] bg-[var(--vscode-input-background,#3c3c3c)] px-3 py-2 text-sm text-[var(--vscode-input-foreground,#f0f0f0)] placeholder:text-[var(--vscode-input-placeholderForeground,#a0a0a0)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder,#007fd4)] ${className}`}
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
      className={`min-h-24 w-full rounded border border-[var(--vscode-input-border,#3c3c3c)] bg-[var(--vscode-input-background,#3c3c3c)] px-3 py-2 text-sm text-[var(--vscode-input-foreground,#f0f0f0)] placeholder:text-[var(--vscode-input-placeholderForeground,#a0a0a0)] focus:outline focus:outline-1 focus:outline-[var(--vscode-focusBorder,#007fd4)] ${className}`}
      {...props}
    />
  );
}

export function VSCodeCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--vscode-panel-border,#3c3c3c)] bg-[var(--vscode-sideBar-background,#252526)] p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
