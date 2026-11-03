interface BrandLogoProps { collapsed?: boolean }

export function BrandLogo({ collapsed = false }: BrandLogoProps) {
  return <div className="flex min-w-0 items-center gap-3">
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-accent/30 bg-accent/10" aria-hidden="true">
      <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 23L14 4L24 23H19.5L14 12.2L8.5 23H4Z" fill="currentColor" className="text-ink"/>
        <path d="M12.3 19.3H23.4" stroke="currentColor" className="text-accent" strokeWidth="3"/>
        <path d="M5.2 3.8H10.6" stroke="currentColor" className="text-accent" strokeWidth="2"/>
      </svg>
    </div>
    {!collapsed && <div className="hidden min-w-0 flex-col xl:flex">
      <span className="font-display text-[16px] font-semibold leading-none tracking-[-0.035em] text-ink">AVENTAS</span>
      <span className="mt-1 text-[10px] font-medium tracking-[0.03em] text-ink-muted">Companion / Windows</span>
    </div>}
  </div>;
}
