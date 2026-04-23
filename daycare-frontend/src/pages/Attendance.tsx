import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import AttendanceRoster, {
  type AbsentReason,
  type AttendanceRosterItem,
} from "../components/AttendanceRoster";
import {
  AGE_GROUPS,
  getAgeGroup,
  type AgeGroupKey,
} from "../data/ageGroups";

type AttendanceFilter = "all" | AgeGroupKey;

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRosterItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<AttendanceFilter>("all");
  const [reasonSelections, setReasonSelections] = useState<Record<number, AbsentReason>>({});
  const [loadingChildId, setLoadingChildId] = useState<number | null>(null);

  const fetchAttendance = async () => {
    const response = await api.get("/attendance/roster");
    setRecords(response.data);
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const filteredRecords = useMemo(() => {
    if (selectedGroup === "all") {
      return records;
    }

    return records.filter((child) => getAgeGroup(child.age) === selectedGroup);
  }, [records, selectedGroup]);

  const updateReasonSelection = (childId: number, reason: AbsentReason) => {
    setReasonSelections((current) => ({
      ...current,
      [childId]: reason,
    }));
  };

  const markCheckIn = async (childId: number) => {
    setLoadingChildId(childId);

    try {
      await api.post("/attendance/checkin", { child_id: childId });
      await fetchAttendance();
    } finally {
      setLoadingChildId(null);
    }
  };

  const markAbsent = async (childId: number) => {
    setLoadingChildId(childId);

    try {
      await api.post("/attendance/absent", {
        child_id: childId,
        absent_reason: reasonSelections[childId] ?? "sick",
      });
      await fetchAttendance();
    } finally {
      setLoadingChildId(null);
    }
  };

  const markCheckout = async (childId: number) => {
    setLoadingChildId(childId);

    try {
      await api.post("/attendance/checkout", { child_id: childId });
      await fetchAttendance();
    } finally {
      setLoadingChildId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-0">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-2xl font-semibold text-slate-900">Daily Attendance</h2>
          <p className="mt-1 text-sm text-slate-500">
            All children are listed first. Use the dropdown to focus on toddlers, preschoolers, or kinder.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Classroom</label>
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value as AttendanceFilter)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            >
              <option value="all">All children</option>
              {AGE_GROUPS.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-500">
            Showing {filteredRecords.length} of {records.length} children
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <AttendanceRoster
          records={filteredRecords}
          loadingChildId={loadingChildId}
          reasonSelections={reasonSelections}
          onReasonChange={updateReasonSelection}
          onCheckIn={markCheckIn}
          onAbsent={markAbsent}
          onCheckOut={markCheckout}
        />
      </Card>
    </div>
  );
}
