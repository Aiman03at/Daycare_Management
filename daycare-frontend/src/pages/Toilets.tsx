import { useMemo, useState } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type ToiletEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";

export default function Toilets() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [type, setType] = useState<ToiletEntry["type"]>("diaper");
  const [status, setStatus] = useState<ToiletEntry["status"]>("changed");
  const [note, setNote] = useState("");

  const entries = useMemo(
    () => store.toilets.filter((entry) => entry.group === selectedGroup),
    [selectedGroup, store.toilets]
  );

  const handleSubmit = (children: ChildRecord[]) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child) {
      return;
    }

    const newEntry: ToiletEntry = {
      id: createCareEntryId("toilet"),
      childId: child.id,
      childName: child.name,
      group: selectedGroup,
      type,
      status,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      toilets: [newEntry, ...current.toilets],
    }));

    setChildId("");
    setType("diaper");
    setStatus("changed");
    setNote("");
  };

  return (
    <CarePageLayout
      pageTitle="Toilets / Diapers"
      pageDescription="Log diaper changes, toilet attempts, and successful bathroom routines by age group."
      accentLabel="Daily care"
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
              value={type}
              onChange={(event) => setType(event.target.value as ToiletEntry["type"])}
            >
              <option value="diaper">Diaper</option>
              <option value="toilet">Toilet</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={status}
              onChange={(event) => setStatus(event.target.value as ToiletEntry["status"])}
            >
              <option value="changed">Changed</option>
              <option value="wet">Wet</option>
              <option value="dry">Dry</option>
              <option value="success">Success</option>
              <option value="attempt">Attempt</option>
            </select>
          </div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Toileting note"
          />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Save record
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.type} • {entry.status}
              </p>
            </div>
            <p className="text-sm text-slate-500">{formatEntryTime(entry.createdAt)}</p>
          </div>
          {entry.note && <p className="mt-3 text-sm text-slate-600">{entry.note}</p>}
        </Card>
      )}
    />
  );
}
