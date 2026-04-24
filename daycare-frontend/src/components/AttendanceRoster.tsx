import { AGE_GROUPS, getAgeGroup } from "../data/ageGroups";

export type AbsentReason = "sick" | "vacation" | "home day" | "appointment" | "other";

export interface AttendanceRosterItem {
  id: number | null;
  child_id: number;
  name: string;
  age: number;
  check_in: string | null;
  check_out: string | null;
  absent_reason: AbsentReason | null;
}

export const ABSENT_REASON_OPTIONS: AbsentReason[] = [
  "sick",
  "vacation",
  "home day",
  "appointment",
  "other",
];

export function getAttendanceStatus(record: AttendanceRosterItem) {
  if (record.check_out) {
    return {
      text: "Checked out",
      tone: "bg-emerald-100 text-emerald-700",
    };
  }

  if (record.check_in) {
    return {
      text: "Checked in",
      tone: "bg-sky-100 text-sky-700",
    };
  }

  if (record.absent_reason) {
    return {
      text: `Absent - ${record.absent_reason}`,
      tone: "bg-rose-100 text-rose-700",
    };
  }

  return {
    text: "Not marked yet",
    tone: "bg-slate-100 text-slate-600",
  };
}

function formatTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendanceRoster({
  records,
  loadingChildId,
  reasonSelections,
  onReasonChange,
  onCheckIn,
  onAbsent,
  onCheckOut,
}: {
  records: AttendanceRosterItem[];
  loadingChildId: number | null;
  reasonSelections: Record<number, AbsentReason>;
  onReasonChange: (childId: number, reason: AbsentReason) => void;
  onCheckIn: (childId: number) => void;
  onAbsent: (childId: number) => void;
  onCheckOut: (childId: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>
            <th className="px-6 py-4 font-semibold">Child</th>
            <th className="px-6 py-4 font-semibold">Group</th>
            <th className="px-6 py-4 font-semibold">Check in</th>
            <th className="px-6 py-4 font-semibold">Check out</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {records.map((record) => {
            const group = AGE_GROUPS.find((item) => item.key === getAgeGroup(record.age));
            const status = getAttendanceStatus(record);
            const isLoading = loadingChildId === record.child_id;

            return (
              <tr key={record.child_id} className="align-top">
                <td className="px-6 py-5">
                  <div>
                    <p className="font-semibold text-slate-900">{record.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Age {record.age}</p>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${group?.badge}`}>
                    {group?.label ?? "Group"}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-slate-600">{formatTime(record.check_in)}</td>

                <td className="px-6 py-5 text-sm text-slate-600">{formatTime(record.check_out)}</td>

                <td className="px-6 py-5">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>
                    {status.text}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <div className="flex min-w-[430px] items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCheckIn(record.child_id)}
                      disabled={isLoading || (!!record.check_in && !record.check_out)}
                      className="whitespace-nowrap rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {record.check_in && !record.check_out ? "Checked in" : "Check in"}
                    </button>

                    <select
                      value=""
                      onChange={(event) => {
                        const reason = event.target.value as AbsentReason;

                        if (!reason) {
                          return;
                        }

                        onReasonChange(record.child_id, reason);
                        onAbsent(record.child_id);
                        event.target.value = "";
                      }}
                      disabled={isLoading}
                      className="min-w-[144px] rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white outline-none transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="" className="text-slate-700">
                        Mark absent
                      </option>
                      {ABSENT_REASON_OPTIONS.map((reason) => (
                        <option key={reason} value={reason} className="text-slate-700">
                          {reason === "home day" ? "Home day" : reason[0].toUpperCase() + reason.slice(1)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onCheckOut(record.child_id)}
                      disabled={isLoading || !record.check_in || !!record.check_out}
                      className="whitespace-nowrap rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      Check out
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {records.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                No children found for this classroom filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
