interface BrandLogoProps {
  collapsed?: boolean;
}

export function BrandLogo({ collapsed = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-app">
        <span className="text-lg font-bold tracking-tight text-accent">A</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-ink">Aventas</span>
          <span className="text-[11px] tracking-wide text-ink-muted">Companion</span>
        </div>
      )}
    </div>
  );
}
