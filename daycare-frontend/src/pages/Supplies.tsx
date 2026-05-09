import { useMemo, useState, useEffect } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { useCareStore, type SupplyEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord } from "../data/ageGroups";
import { api } from "../api/client";

export default function Supplies() {
  useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [childId, setChildId] = useState("");
  const [item, setItem] = useState<SupplyEntry["item"]>("diapers");
  const [status, setStatus] = useState<SupplyEntry["status"]>("ok");
  const [note, setNote] = useState("");
  const [dbSupplies, setDbSupplies] = useState<SupplyEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        const response = await api.get(`/supplies?group=${selectedGroup}`);
        const formatted: SupplyEntry[] = response.data.map((row: any) => ({
          id: String(row.id),
          childId: row.child_id,
          childName: row.child_name,
          group: row.group_key as AgeGroupKey,
          item: row.item as SupplyEntry["item"],
          status: row.status as SupplyEntry["status"],
          note: row.note,
          createdAt: row.created_at,
        }));
        setDbSupplies(formatted);
      } catch (error) {
        console.error("Failed to fetch supplies:", error);
      }
    };

    fetchSupplies();
  }, [selectedGroup]);

  const entries = useMemo(() => dbSupplies, [dbSupplies]);

  const handleSubmit = (children: ChildRecord[]) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const child = children.find((itemRecord) => itemRecord.id === Number(childId));
    if (!child) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/supplies",
        {
          childId: child.id,
          childName: child.name,
          groupKey: selectedGroup,
          item,
          status,
          note: note.trim(),
        }
      );

      const row = response.data;
      const created: SupplyEntry = {
        id: String(row.id),
        childId: row.child_id,
        childName: row.child_name,
        group: row.group_key as AgeGroupKey,
        item: row.item as SupplyEntry["item"],
        status: row.status as SupplyEntry["status"],
        note: row.note,
        createdAt: row.created_at,
      };

      setDbSupplies((prev) => [created, ...prev]);

      setChildId("");
      setItem("diapers");
      setStatus("ok");
      setNote("");
    } catch (error) {
      console.error("Error saving supply update:", error);
      alert("Failed to save supply update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarePageLayout
      pageTitle="Supplies"
      pageDescription="Track low supplies and restocks for each selected age group."
      accentLabel="Inventory"
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
              value={item}
              onChange={(event) => setItem(event.target.value as SupplyEntry["item"])}
            >
              <option value="diapers">Diapers</option>
              <option value="wipes">Wipes</option>
              <option value="clothes">Clothes</option>
              <option value="cream">Cream</option>
              <option value="bedding">Bedding</option>
              <option value="other">Other</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={status}
              onChange={(event) => setStatus(event.target.value as SupplyEntry["status"])}
            >
              <option value="ok">OK</option>
              <option value="low">Low</option>
              <option value="restocked">Restocked</option>
            </select>
          </div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Supply note"
          />
          <button disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : "Save supply update"}
          </button>
        </form>
      )}
      renderEntry={(entry) => (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {entry.item} • {entry.status}
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
