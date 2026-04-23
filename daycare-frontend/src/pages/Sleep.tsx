import { useMemo, useState } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type SleepEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";

export default function Sleep() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState<SleepEntry["quality"]>("asleep");
  const [note, setNote] = useState("");

  const entries = useMemo(
    () => store.sleep.filter((entry) => entry.group === selectedGroup),
    [selectedGroup, store.sleep]
  );

  const handleSubmit = (children: ChildRecord[]) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child || !duration.trim()) {
      return;
    }

    const newEntry: SleepEntry = {
      id: createCareEntryId("sleep"),
      childId: child.id,
      childName: child.name,
      group: selectedGroup,
      duration: duration.trim(),
      quality,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      sleep: [newEntry, ...current.sleep],
    }));

    setChildId("");
    setDuration("");
    setQuality("asleep");
    setNote("");
  };

  return (
    <CarePageLayout
      pageTitle="Sleep"
      pageDescription="Track naps and rest periods for the selected age group."
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
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Example: 1h 20m"
            />
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={quality}
              onChange={(event) => setQuality(event.target.value as SleepEntry["quality"])}
            >
              <option value="asleep">Asleep well</option>
              <option value="resting">Resting only</option>
              <option value="woke-early">Woke early</option>
            </select>
          </div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Sleep note"
          />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Save sleep log
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.duration} • {entry.quality}
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
