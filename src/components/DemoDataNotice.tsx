export function DemoDataNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-amber-400"
        aria-hidden="true"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-300">Demo data — sample matches only</p>
        <p className="mt-0.5 text-xs text-amber-200/70">
          The match history shown here is placeholder data used to demonstrate the interface. It is
          not your real match history. Connect your Riot account to populate actual match data.
        </p>
      </div>
    </div>
  );
}
