import { useMemo, useState } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type MealEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";

export default function Meals() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [mealType, setMealType] = useState<MealEntry["mealType"]>("lunch");
  const [status, setStatus] = useState<MealEntry["status"]>("all");
  const [note, setNote] = useState("");

  const entries = useMemo(
    () => store.meals.filter((entry) => entry.group === selectedGroup),
    [selectedGroup, store.meals]
  );

  const handleSubmit = (children: ChildRecord[]) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child) {
      return;
    }

    const newEntry: MealEntry = {
      id: createCareEntryId("meal"),
      childId: child.id,
      childName: child.name,
      group: selectedGroup,
      mealType,
      status,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      meals: [newEntry, ...current.meals],
    }));

    setChildId("");
    setMealType("lunch");
    setStatus("all");
    setNote("");
  };

  return (
    <CarePageLayout
      pageTitle="Meals"
      pageDescription="Track what each age group ate throughout the day."
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
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealEntry["mealType"])}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={status}
              onChange={(event) => setStatus(event.target.value as MealEntry["status"])}
            >
              <option value="all">Ate all</option>
              <option value="most">Ate most</option>
              <option value="some">Ate some</option>
              <option value="refused">Refused</option>
            </select>
          </div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Meal note"
          />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
            Save meal
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.mealType} • {entry.status}
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
