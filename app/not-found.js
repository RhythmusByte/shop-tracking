import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-300 mb-2">404</p>
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-brand-50 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Link href="/" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
