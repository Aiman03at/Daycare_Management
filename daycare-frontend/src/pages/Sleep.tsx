import { useMemo, useState, useEffect } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { useCareStore, type SleepEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";
import { api } from "../api/client";

const formatEntryTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function Sleep() {
  useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState<SleepEntry["quality"]>("asleep");
  const [note, setNote] = useState("");
  const [dbSleep, setDbSleep] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSleep = async () => {
      try {
        const response = await api.get(`/sleep?group=${selectedGroup}`);
        const formatted: SleepEntry[] = response.data.map((row: any) => ({
          id: String(row.id),
          childId: row.child_id,
          childName: row.child_name,
          group: row.group_key as AgeGroupKey,
          duration: row.duration,
          quality: row.quality as SleepEntry["quality"],
          note: row.note,
          createdAt: row.created_at,
        }));
        setDbSleep(formatted);
      } catch (error) {
        console.error("Failed to fetch sleep logs:", error);
      }
    };

    fetchSleep();
  }, [selectedGroup]);

  const entries = useMemo(() => dbSleep, [dbSleep]);

  const handleSubmit = (children: ChildRecord[]) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child || !duration.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/sleep",
        {
          childId: child.id,
          childName: child.name,
          groupKey: selectedGroup,
          duration: duration.trim(),
          quality,
          note: note.trim(),
        }
      );

      const row = response.data;
      const created: SleepEntry = {
        id: String(row.id),
        childId: row.child_id,
        childName: row.child_name,
        group: row.group_key as AgeGroupKey,
        duration: row.duration,
        quality: row.quality as SleepEntry["quality"],
        note: row.note,
        createdAt: row.created_at,
      };

      setDbSleep((prev) => [created, ...prev]);

      setChildId("");
      setDuration("");
      setQuality("asleep");
      setNote("");
    } catch (error) {
      console.error("Error saving sleep log:", error);
      alert("Failed to save sleep log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarePageLayout
      pageTitle="Sleep"
      pageDescription="Track naps and rest periods for the selected age group."
      accentLabel="Daily care"
      selectedGroup={selectedGroup}
      onSelectGroup={setSelectedGroup}
      entries={entries}
      showChildrenList={false}
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
          <button disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : "Save sleep log"}
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
