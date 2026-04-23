import { AGE_GROUPS, type AgeGroupKey } from "../data/ageGroups";

interface AgeGroupSelectorProps {
  selectedGroup: AgeGroupKey;
  onSelect: (group: AgeGroupKey) => void;
}

export default function AgeGroupSelector({
  selectedGroup,
  onSelect,
}: AgeGroupSelectorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {AGE_GROUPS.map((group) => {
        const isActive = group.key === selectedGroup;

        return (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelect(group.key)}
            className={`rounded-3xl border p-5 text-left transition ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-70">
              Age group
            </p>
            <h3 className="mt-3 text-2xl font-bold">{group.label.trim()}</h3>
            <p className="mt-2 text-sm opacity-80">{group.ageRange}</p>
            <p className="mt-3 text-sm opacity-90">{group.description}</p>
          </button>
        );
      })}
    </div>
  );
}
