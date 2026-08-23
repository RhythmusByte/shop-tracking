export default function PageLoader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-[#3a2a52]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}...</p>
    </div>
  );
}
