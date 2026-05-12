import { useMemo, useState, useEffect } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { useCareStore, type HealthEntry } from "../data/careRecords";
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

export default function Health() {
  useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [category, setCategory] = useState<HealthEntry["category"]>("check");
  const [status, setStatus] = useState<HealthEntry["status"]>("normal");
  const [note, setNote] = useState("");
  const [dbHealth, setDbHealth] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get(`/health?group=${selectedGroup}`);
        const formatted: HealthEntry[] = response.data.map((row: any) => ({
          id: String(row.id),
          childId: row.child_id,
          childName: row.child_name,
          group: row.group_key as AgeGroupKey,
          category: row.category as HealthEntry["category"],
          status: row.status as HealthEntry["status"],
          note: row.note,
          createdAt: row.created_at,
        }));
        setDbHealth(formatted);
      } catch (error) {
        console.error("Failed to fetch health logs:", error);
      }
    };

    fetchHealth();
  }, [selectedGroup]);

  const entries = useMemo(() => dbHealth, [dbHealth]);

  const handleSubmit = (children: ChildRecord[]) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((item) => item.id === Number(childId));
    if (!child || !note.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/health",
        {
          childId: child.id,
          childName: child.name,
          groupKey: selectedGroup,
          category,
          status,
          note: note.trim(),
        }
      );

      const row = response.data;
      const created: HealthEntry = {
        id: String(row.id),
        childId: row.child_id,
        childName: row.child_name,
        group: row.group_key as AgeGroupKey,
        category: row.category as HealthEntry["category"],
        status: row.status as HealthEntry["status"],
        note: row.note,
        createdAt: row.created_at,
      };

      setDbHealth((prev) => [created, ...prev]);

      setChildId("");
      setCategory("check");
      setStatus("normal");
      setNote("");
    } catch (error) {
      console.error("Error saving health log:", error);
      alert("Failed to save health log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarePageLayout
      pageTitle="Health"
      pageDescription="Keep health checks, medication notes, and symptom updates grouped by classroom age."
      accentLabel="Wellness"
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
          <button disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : "Save health log"}
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
