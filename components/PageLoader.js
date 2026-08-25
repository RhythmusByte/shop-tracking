export default function PageLoader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 animate-fade-in">
      {/* Orbiting-dot loader in the brand gradient, built to feel distinct
          rather than a generic spinner ring. */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 to-purple-600 opacity-20 animate-pulse-slow" />
        <div className="absolute inset-0 animate-spin-slow">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-gradient-to-br from-brand-400 to-purple-600 shadow-lg shadow-brand-500/40" />
        </div>
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-brand-200 dark:border-[#3a2a52] animate-spin-reverse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 tracking-wide">
        {label}
        <span className="inline-flex w-6 justify-start">
          <span className="animate-dot-1">.</span>
          <span className="animate-dot-2">.</span>
          <span className="animate-dot-3">.</span>
        </span>
      </p>
    </div>
  );
}
