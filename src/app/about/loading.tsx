export default function AboutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-3.5" role="status">
      <div className="flex gap-[7px]">
        <div className="loader-dot" />
        <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
        <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-dim">
        Loading...
      </span>
    </div>
  );
}
