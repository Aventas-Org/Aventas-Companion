interface BrandLogoProps {
  collapsed?: boolean;
}

export function BrandLogo({ collapsed = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
        <span className="text-lg font-bold text-white">A</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-white">Aventas</span>
          <span className="text-xs text-slate-400">Companion</span>
        </div>
      )}
    </div>
  );
}
