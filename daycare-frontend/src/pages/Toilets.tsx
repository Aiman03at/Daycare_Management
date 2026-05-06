import { useMemo, useState, useEffect } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { type AgeGroupKey, type ChildRecord, getAgeGroup } from "../data/ageGroups";
import { api } from "../api/client";
import type { AttendanceRosterItem } from "../components/AttendanceRoster";

interface ToiletEntry {
  id: number;
  child_id: number;
  child_name: string;
  group_key: AgeGroupKey;
  type: "diaper" | "toilet";
  status: "changed" | "wet" | "dry" | "success" | "attempt";
  note: string;
  created_at: string;
}

export default function Toilets() {
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [type, setType] = useState<"diaper" | "toilet">("diaper");
  const [status, setStatus] = useState<"changed" | "wet" | "dry" | "success" | "attempt">("changed");
  const [note, setNote] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRosterItem[]>([]);
  const [dbToilets, setDbToilets] = useState<ToiletEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await api.get("/attendance/roster");
        setAttendanceRecords(response.data);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      }
    };
    fetchAttendance();
  }, []);

  // Fetch toilets from database
  const fetchToilets = async () => {
    try {
      const response = await api.get(`/toilets?group=${selectedGroup}`);
      setDbToilets(response.data);
    } catch (error) {
      console.error("Failed to fetch toilets:", error);
    }
  };

  useEffect(() => {
    fetchToilets();
  }, [selectedGroup]);

  const entries = useMemo(
    () =>
      dbToilets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [dbToilets]
  );

  const presentChildrenInGroup = useMemo(() => {
    return attendanceRecords.filter(
      (record) =>
        record.check_in && // Child is checked in
        getAgeGroup(record.age) === selectedGroup &&
        !record.absent_reason && // Not marked absent
        !record.check_out // Not checked out yet
    );
  }, [attendanceRecords, selectedGroup]);

  const toggleChildSelection = (childId: number) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const selectAllPresent = () => {
    if (selectedChildIds.length === presentChildrenInGroup.length) {
      setSelectedChildIds([]);
    } else {
      setSelectedChildIds(presentChildrenInGroup.map((child) => child.child_id));
    }
  };

  const handleSubmit = (children: ChildRecord[]) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedChildIds.length === 0) {
      alert("Please select at least one child");
      return;
    }

    setLoading(true);
    try {
      const childNames = selectedChildIds
        .map((id) => children.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[];

      const response = await api.post("/toilets/bulk", {
        childIds: selectedChildIds,
        childNames,
        groupKey: selectedGroup,
        type,
        status,
        note: note.trim(),
      });

      // Add newly created toilets to the display
      const newToilets: ToiletEntry[] = response.data.map((toilet: any) => ({
        id: toilet.id,
        child_id: toilet.child_id,
        child_name: toilet.child_name,
        group_key: toilet.group_key as AgeGroupKey,
        type: toilet.type as "diaper" | "toilet",
        status: toilet.status as "changed" | "wet" | "dry" | "success" | "attempt",
        note: toilet.note,
        created_at: toilet.created_at,
      }));

      setDbToilets((prev) => [...newToilets, ...prev]);

      setSelectedChildIds([]);
      setType("diaper");
      setStatus("changed");
      setNote("");
    } catch (error) {
      console.error("Error saving toilet entry:", error);
      alert("Failed to save toilet entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getChildEntries = (childId: number) => {
    return entries.filter((e) => e.child_id === childId);
  };

  return (
    <CarePageLayout
      pageTitle="Toilets / Diapers"
      pageDescription="Log diaper changes, toilet attempts, and successful bathroom routines by age group."
      accentLabel="Daily care"
      selectedGroup={selectedGroup}
      onSelectGroup={setSelectedGroup}
      entries={entries}
      showChildrenList={false}
      renderForm={(children) => (
        <form className="space-y-4" onSubmit={handleSubmit(children)}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Select children</label>
              <button
                type="button"
                onClick={selectAllPresent}
                className="text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                {selectedChildIds.length === presentChildrenInGroup.length && presentChildrenInGroup.length > 0
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>
            {presentChildrenInGroup.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-2xl px-4 py-3">
                No children checked in for this group yet.
              </p>
            ) : (
              <div className="space-y-2 bg-slate-50 rounded-2xl px-4 py-3 max-h-48 overflow-y-auto">
                {presentChildrenInGroup.map((childRecord) => (
                  <div key={childRecord.child_id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`child-${childRecord.child_id}`}
                      checked={selectedChildIds.includes(childRecord.child_id)}
                      onChange={() => toggleChildSelection(childRecord.child_id)}
                      className="rounded border-slate-300"
                    />
                    <label
                      htmlFor={`child-${childRecord.child_id}`}
                      className="text-sm font-medium text-slate-900 cursor-pointer"
                    >
                      {childRecord.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={type}
              onChange={(event) => setType(event.target.value as "diaper" | "toilet")}
            >
              <option value="diaper">Diaper</option>
              <option value="toilet">Toilet</option>
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={status}
              onChange={(event) => setStatus(event.target.value as "changed" | "wet" | "dry" | "success" | "attempt")}
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
          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save record"}
          </button>
        </form>
      )}
      renderEntry={() => null}
      renderMealsSummary={() => (
        <Card>
          <div className="w-full">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Toilet Entries</h3>
            {presentChildrenInGroup.length === 0 ? (
              <p className="text-sm text-slate-500">No children checked in</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Child Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presentChildrenInGroup.map((child) => {
                      const childToilets = getChildEntries(child.child_id);
                      return (
                        <tr key={child.child_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{child.name}</td>
                          <td className="px-4 py-3">
                            {childToilets.length === 0 ? (
                              <span className="text-sm text-slate-400">No entries</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {childToilets.map((toilet) => (
                                  <div
                                    key={toilet.id}
                                    className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1"
                                  >
                                    <span className="text-xs font-medium text-sky-700">
                                      {toilet.type === "diaper" ? "🧷" : "🚽"} {toilet.status}
                                    </span>
                                    <span className="text-xs text-sky-600">
                                      {new Date(toilet.created_at).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </span>
                                    {toilet.note && (
                                      <span className="text-xs text-sky-500 ml-1">• {toilet.note}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    />
  );
}
