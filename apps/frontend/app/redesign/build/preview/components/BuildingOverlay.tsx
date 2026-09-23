 export default function BuildingOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-white/55 backdrop-blur-[1px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--built-primary,#315ff4)]">
        <div className="h-full w-1/3 animate-pulse bg-white/70" />
      </div>
      <div className="flex h-full items-center justify-center">
        <span className="rounded-full bg-[#08132f]/85 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {label}
        </span>
      </div>
    </div>
  );
}
