import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-cyan">
        404
      </p>
      <h2 className="font-sans text-[clamp(28px,4vw,52px)] font-bold text-white leading-none">
        Page Not Found
      </h2>
      <p className="text-[rgba(240,244,255,0.5)] text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="font-sans text-sm font-medium text-white border border-[rgba(240,244,255,0.2)] px-10 py-3 rounded-full transition-all hover:border-cyan hover:text-cyan"
      >
        Back to home
      </Link>
    </div>
  );
}
