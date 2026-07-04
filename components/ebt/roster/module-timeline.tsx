export function ModuleTimeline({
  lastCompleted,
  modulesCompleted,
  nextSuggested,
}: {
  lastCompleted: number | null
  modulesCompleted: number | null
  nextSuggested: number | null
}) {
  const cells = Array.from({ length: 6 }, (_, i) => i + 1) // modules 1..6 of the 3-year cycle
  const last = lastCompleted ?? 0
  return (
    <div>
      {/* Bare stats only — both call sites already wrap this in a card titled "EBT Module
          Progress" / "Module timeline", so repeating the name here just duplicated it. */}
      <div className="mb-2 text-xs text-slate-500 uppercase">
        {modulesCompleted ?? 0} of 6 completed
        {nextSuggested ? ` · next: M${nextSuggested}` : ''}
      </div>
      <div className="flex gap-2">
        {cells.map((m) => {
          const done = m <= last
          const isNext = m === (nextSuggested ?? -1)
          const cls = done
            ? 'bg-[#7c1d3f] text-white border-[#7c1d3f]'
            : isNext
              ? 'border-[#7c1d3f] text-[#7c1d3f]'
              : 'border-slate-200 text-slate-400'
          return (
            <div
              key={m}
              className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold ${cls}`}
            >
              {m}
            </div>
          )
        })}
      </div>
    </div>
  )
}
