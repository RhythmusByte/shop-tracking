export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 dark:border-[#3a2a52] mt-10 py-6">
      <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>
          Made by{" "}
          <a
            href="https://akhilmahesh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-300 hover:underline"
          >
            Akhil Mahesh
          </a>
        </p>
        <p className="mt-1">© {year} Store Tracker. All rights reserved.</p>
      </div>
    </footer>
  );
}
