export default function Avatar({ url, name, size = 32 }) {
  const initials = (name || "A").trim().charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || "Profile"}
        width={size}
        height={size}
        className="rounded-full object-cover border border-slate-200 dark:border-[#3a2a52]"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
