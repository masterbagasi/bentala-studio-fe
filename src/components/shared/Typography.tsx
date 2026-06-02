import { HTMLAttributes } from "react";

function cx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Eyebrow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "font-sans text-meta tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5",
        className
      )}
      {...props}
    >
      <span className="w-7 h-px bg-cyan flex-shrink-0" />
      {children}
    </div>
  );
}

export function PageHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cx(
        "font-sans text-page leading-[0.88] tracking-[0.02em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cx(
        "font-sans text-[clamp(28px,3vw,42px)] leading-[1.05] font-bold tracking-[-0.01em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function StoryHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cx(
        "font-sans text-story tracking-[-0.01em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Body({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx("text-body font-light text-white", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function BodySmall({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx("text-body-sm font-light text-dim", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "font-sans text-label tracking-[0.24em] uppercase text-cyan",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "font-sans text-[24px] tracking-[-0.01em] text-white font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function MetaLabel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "font-sans text-meta tracking-[0.15em] uppercase text-dim",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
