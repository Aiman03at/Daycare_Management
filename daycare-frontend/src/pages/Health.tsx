import { useMemo, useState } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type HealthEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";

export default function Health() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [category, setCategory] = useState<HealthEntry["category"]>("check");
  const [status, setStatus] = useState<HealthEntry["status"]>("normal");
  const [note, setNote] = useState("");

  const entries = useMemo(
    () => store.health.filter((entry) => entry.group === selectedGroup),
    [selectedGroup, store.health]
  );

  const handleSubmit = (children: ChildRecord[]) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child || !note.trim()) {
      return;
    }

    const newEntry: HealthEntry = {
      id: createCareEntryId("health"),
      childId: child.id,
      childName: child.name,
      group: selectedGroup,
      category,
      status,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      health: [newEntry, ...current.health],
    }));

    setChildId("");
    setCategory("check");
    setStatus("normal");
    setNote("");
  };

  return (
    <CarePageLayout
      pageTitle="Health"
      pageDescription="Keep health checks, medication notes, and symptom updates grouped by classroom age."
      accentLabel="Wellness"
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
              onChange={(event) => setCategory(event.target.value as HealthEntry["category"])}
            >
              <option value="check">General check</option>
              <option value="medication">Medication</option>
              <option value="symptom">Symptom</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={status}
              onChange={(event) => setStatus(event.target.value as HealthEntry["status"])}
            >
              <option value="normal">Normal</option>
              <option value="watch">Watch</option>
              <option value="action-needed">Action needed</option>
            </select>
          </div>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Health note"
          />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Save health log
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.category} • {entry.status}
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
