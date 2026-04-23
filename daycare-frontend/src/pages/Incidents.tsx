import { useMemo, useState } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type IncidentEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";

export default function Incidents() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [category, setCategory] = useState<IncidentEntry["category"]>("incident");
  const [severity, setSeverity] = useState<IncidentEntry["severity"]>("low");
  const [note, setNote] = useState("");

  const entries = useMemo(
    () => store.incidents.filter((entry) => entry.group === selectedGroup),
    [selectedGroup, store.incidents]
  );

  const handleSubmit = (children: ChildRecord[]) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child || !note.trim()) {
      return;
    }

    const newEntry: IncidentEntry = {
      id: createCareEntryId("incident"),
      childId: child.id,
      childName: child.name,
      group: selectedGroup,
      category,
      severity,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      incidents: [newEntry, ...current.incidents],
    }));

    setChildId("");
    setCategory("incident");
    setSeverity("low");
    setNote("");
  };

  return (
    <CarePageLayout
      pageTitle="Incident / Accident"
      pageDescription="Record any incident or accident for the currently selected age group."
      accentLabel="Safety"
      selectedGroup={selectedGroup}
      onSelectGroup={setSelectedGroup}
      entries={entries}
      renderForm={(children) => (
        <form className="space-y-4" onSubmit={handleSubmit(children)}>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={childId}
            onChange={(event) => setChildId(event.target.value)}
            required
          >
            <option value="">Select child</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={category}
              onChange={(event) => setCategory(event.target.value as IncidentEntry["category"])}
            >
              <option value="incident">Incident</option>
              <option value="accident">Accident</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as IncidentEntry["severity"])}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Describe what happened"
          />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Save report
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.category} • {entry.severity}
              </p>
            </div>
            <p className="text-sm text-slate-500">{formatEntryTime(entry.createdAt)}</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">{entry.note}</p>
        </Card>
      )}
    />
  );
}
