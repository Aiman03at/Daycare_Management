import { useMemo, useState } from "react";
import Card from "./Card";
import AgeGroupSelector from "./AgeGroupSelector";
import {
  getAgeGroup,
  getAgeGroupDefinition,
  normalizeChild,
  type AgeGroupKey,
  type ChildRecord,
} from "../data/ageGroups";
import { api } from "../api/client";
import { useEffect } from "react";

interface CarePageLayoutProps<TEntry> {
  pageTitle: string;
  pageDescription: string;
  accentLabel: string;
  selectedGroup: AgeGroupKey;
  onSelectGroup: (group: AgeGroupKey) => void;
  entries: TEntry[];
  renderForm: (children: ChildRecord[]) => React.ReactNode;
  renderEntry: (entry: TEntry) => React.ReactNode;
}

export default function CarePageLayout<TEntry>({
  pageTitle,
  pageDescription,
  accentLabel,
  selectedGroup,
  onSelectGroup,
  entries,
  renderForm,
  renderEntry,
}: CarePageLayoutProps<TEntry>) {
  const [children, setChildren] = useState<ChildRecord[]>([]);

  useEffect(() => {
    api.get("/children").then((response) => {
      setChildren(response.data.map(normalizeChild));
    });
  }, []);

  const filteredChildren = useMemo(
    () => children.filter((child) => getAgeGroup(child.age) === selectedGroup),
    [children, selectedGroup]
  );

  const groupDetails = getAgeGroupDefinition(selectedGroup);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${groupDetails.accent}`} />
        <div className="space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {accentLabel}
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">{pageTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{pageDescription}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${groupDetails.badge}`}>
              {groupDetails.label.trim()}
            </span>
          </div>

          <AgeGroupSelector selectedGroup={selectedGroup} onSelect={onSelectGroup} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <Card>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-slate-900">Add record</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose a child from the selected group, then save the entry.
            </p>
          </div>
          {renderForm(filteredChildren)}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">Group children</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${groupDetails.badge}`}>
                {filteredChildren.length} children
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {filteredChildren.length === 0 && (
                <p className="text-sm text-slate-500">No children found in this age group yet.</p>
              )}
              {filteredChildren.map((child) => (
                <div key={child.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{child.name}</p>
                  <p className="text-sm text-slate-500">Age {child.age}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {entries.length === 0 && (
              <Card>
                <p className="text-sm text-slate-500">
                  No records for this age group yet. Add the first one from the form.
                </p>
              </Card>
            )}
            {entries.map((entry, index) => (
              <div key={index}>{renderEntry(entry)}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
