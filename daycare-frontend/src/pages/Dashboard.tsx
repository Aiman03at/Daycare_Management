import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import AttendanceRoster, {
  type AbsentReason,
  type AttendanceRosterItem,
  getAttendanceStatus,
} from "../components/AttendanceRoster";
import Card from "../components/Card";
import AgeGroupSelector from "../components/AgeGroupSelector";
import {
  getAgeGroup,
  getAgeGroupDefinition,
  normalizeChild,
  type AgeGroupKey,
  type ChildRecord,
} from "../data/ageGroups";
import {
  createCareEntryId,
  formatEntryTime,
  useCareStore,
  type MealEntry,
  type SleepEntry,
  type ToiletEntry,
} from "../data/careRecords";

interface Announcement {
  id: number;
  title: string;
  detail: string;
  announcement_date: string;
}

function isBirthdayToday(birthDate?: string | null) {
  if (!birthDate) {
    return false;
  }

  const today = new Date();
  const date = new Date(birthDate);

  return (
    date.getUTCMonth() === today.getMonth() &&
    date.getUTCDate() === today.getDate()
  );
}

export default function Dashboard() {
  const { store, setStore } = useCareStore();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [records, setRecords] = useState<AttendanceRosterItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reasonSelections, setReasonSelections] = useState<Record<number, AbsentReason>>({});
  const [loadingChildId, setLoadingChildId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [mealStatus, setMealStatus] = useState<MealEntry["status"]>("all");
  const [toiletStatus, setToiletStatus] = useState<ToiletEntry["status"]>("changed");
  const [sleepQuality, setSleepQuality] = useState<SleepEntry["quality"]>("asleep");
  const [mealNote, setMealNote] = useState("");
  const [toiletNote, setToiletNote] = useState("");
  const [sleepDuration, setSleepDuration] = useState("");
  const [sleepNote, setSleepNote] = useState("");

  const fetchChildren = async () => {
    const response = await api.get("/children");
    setChildren(response.data.map(normalizeChild));
  };

  const fetchAttendance = async () => {
    const response = await api.get("/attendance/roster");
    setRecords(response.data);
  };

  const fetchAnnouncements = async () => {
    const response = await api.get("/announcements");
    setAnnouncements(response.data);
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchChildren(), fetchAttendance(), fetchAnnouncements()]);
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const birthdaysToday = useMemo(
    () => children.filter((child) => isBirthdayToday(child.birthDate)),
    [children]
  );

  const groupDetails = getAgeGroupDefinition(selectedGroup);
  const groupChildren = useMemo(
    () => children.filter((child) => getAgeGroup(child.age) === selectedGroup),
    [children, selectedGroup]
  );
  const groupRecords = useMemo(
    () => records.filter((record) => getAgeGroup(record.age) === selectedGroup),
    [records, selectedGroup]
  );
  const selectedChild = groupChildren.find((child) => child.id === Number(selectedChildId));
  const latestMeals = store.meals.filter((entry) => entry.group === selectedGroup).slice(0, 3);
  const latestToilets = store.toilets.filter((entry) => entry.group === selectedGroup).slice(0, 3);
  const latestSleep = store.sleep.filter((entry) => entry.group === selectedGroup).slice(0, 3);
  const groupAttendanceSummary = useMemo(
    () =>
      groupRecords.reduce<Record<string, number>>((acc, record) => {
        const status = getAttendanceStatus(record).text;
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {}),
    [groupRecords]
  );

  const todayLabel = new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

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

  const markCheckOut = async (childId: number) => {
    setLoadingChildId(childId);

    try {
      await api.post("/attendance/checkout", { child_id: childId });
      await fetchAttendance();
    } finally {
      setLoadingChildId(null);
    }
  };

  const formatAnnouncementDate = (value: string) =>
    new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  const resetDashboardCareForms = () => {
    setSelectedChildId("");
    setMealStatus("all");
    setToiletStatus("changed");
    setSleepQuality("asleep");
    setMealNote("");
    setToiletNote("");
    setSleepDuration("");
    setSleepNote("");
  };

  useEffect(() => {
    resetDashboardCareForms();
  }, [selectedGroup]);

  const saveMeal = () => {
    if (!selectedChild) {
      return;
    }

    const newEntry: MealEntry = {
      id: createCareEntryId("meal"),
      childId: selectedChild.id,
      childName: selectedChild.name,
      group: selectedGroup,
      mealType: "lunch",
      status: mealStatus,
      note: mealNote.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      meals: [newEntry, ...current.meals],
    }));

    setMealStatus("all");
    setMealNote("");
  };

  const saveToilet = () => {
    if (!selectedChild) {
      return;
    }

    const newEntry: ToiletEntry = {
      id: createCareEntryId("toilet"),
      childId: selectedChild.id,
      childName: selectedChild.name,
      group: selectedGroup,
      type: selectedGroup === "toddlers" ? "diaper" : "toilet",
      status: toiletStatus,
      note: toiletNote.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      toilets: [newEntry, ...current.toilets],
    }));

    setToiletStatus("changed");
    setToiletNote("");
  };

  const saveSleep = () => {
    if (!selectedChild || !sleepDuration.trim()) {
      return;
    }

    const newEntry: SleepEntry = {
      id: createCareEntryId("sleep"),
      childId: selectedChild.id,
      childName: selectedChild.name,
      group: selectedGroup,
      duration: sleepDuration.trim(),
      quality: sleepQuality,
      note: sleepNote.trim(),
      createdAt: new Date().toISOString(),
    };

    setStore((current) => ({
      ...current,
      sleep: [newEntry, ...current.sleep],
    }));

    setSleepDuration("");
    setSleepQuality("asleep");
    setSleepNote("");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${groupDetails.accent}`} />
        <div className="space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Classroom workflow
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                First select an age group, then manage that group only
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Pick one classroom on the dashboard first. Meals, diapers/toilets, sleep, and the child list below will update for that selected group.
              </p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${groupDetails.badge}`}>
              {groupChildren.length} children in {groupDetails.label.trim()}
            </span>
          </div>

          <AgeGroupSelector selectedGroup={selectedGroup} onSelect={setSelectedGroup} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-8 py-8 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-300">
                  Little Haven
                </p>
                <h2 className="mt-3 text-4xl font-bold">Students</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Where every Child feels at home
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Today</p>
                <p className="mt-2 text-lg font-semibold">{todayLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-4">
            <div className="rounded-3xl bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-500">{groupDetails.label.trim()} students</p>
              <p className="mt-3 text-4xl font-bold text-slate-900">{groupChildren.length}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-5 text-center">
              <p className="text-sm text-slate-500">Meals logged</p>
              <p className="mt-3 text-4xl font-bold text-sky-700">{latestMeals.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 text-center">
              <p className="text-sm text-slate-500">Toilets logged</p>
              <p className="mt-3 text-4xl font-bold text-emerald-700">{latestToilets.length}</p>
            </div>
            <div className="rounded-3xl bg-rose-50 p-5 text-center">
              <p className="text-sm text-slate-500">Sleep logged</p>
              <p className="mt-3 text-4xl font-bold text-rose-700">{latestSleep.length}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">Announcements</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {announcements.length} posted
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {announcements.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No announcements posted yet.
                </div>
              )}
              {announcements.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatAnnouncementDate(item.announcement_date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Birthdays Today</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {birthdaysToday.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {birthdaysToday.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No birthdays recorded for today yet.
                </div>
              )}
              {birthdaysToday.map((child) => (
                <div key={child.id} className="rounded-2xl bg-amber-50 p-4">
                  <p className="font-semibold text-slate-900">{child.name}</p>
                  <p className="mt-1 text-sm text-slate-600">Turning point celebration day</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Quick care actions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Select one child from {groupDetails.label.trim()} first, then save meals, diapers/toilets, or sleep.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${groupDetails.badge}`}>
              Step 1
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Selected child
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(event.target.value)}
              >
                <option value="">Choose child from {groupDetails.label.trim()}</option>
                {groupChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <h4 className="text-lg font-semibold text-slate-900">Meals</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  value={mealStatus}
                  onChange={(event) => setMealStatus(event.target.value as MealEntry["status"])}
                >
                  <option value="all">Ate all</option>
                  <option value="most">Ate most</option>
                  <option value="some">Ate some</option>
                  <option value="refused">Refused</option>
                </select>
                <button
                  type="button"
                  onClick={saveMeal}
                  disabled={!selectedChild}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save meal
                </button>
              </div>
              <textarea
                className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={mealNote}
                onChange={(event) => setMealNote(event.target.value)}
                placeholder="Meal note for the selected child"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <h4 className="text-lg font-semibold text-slate-900">
                {selectedGroup === "toddlers" ? "Diapers" : "Toilets"}
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  value={toiletStatus}
                  onChange={(event) => setToiletStatus(event.target.value as ToiletEntry["status"])}
                >
                  <option value="changed">Changed</option>
                  <option value="wet">Wet</option>
                  <option value="dry">Dry</option>
                  <option value="success">Success</option>
                  <option value="attempt">Attempt</option>
                </select>
                <button
                  type="button"
                  onClick={saveToilet}
                  disabled={!selectedChild}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save {selectedGroup === "toddlers" ? "diaper" : "toilet"}
                </button>
              </div>
              <textarea
                className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={toiletNote}
                onChange={(event) => setToiletNote(event.target.value)}
                placeholder="Diaper or toilet note"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <h4 className="text-lg font-semibold text-slate-900">Sleep</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  value={sleepDuration}
                  onChange={(event) => setSleepDuration(event.target.value)}
                  placeholder="Example: 1h 10m"
                />
                <select
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  value={sleepQuality}
                  onChange={(event) => setSleepQuality(event.target.value as SleepEntry["quality"])}
                >
                  <option value="asleep">Asleep well</option>
                  <option value="resting">Resting only</option>
                  <option value="woke-early">Woke early</option>
                </select>
              </div>
              <textarea
                className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={sleepNote}
                onChange={(event) => setSleepNote(event.target.value)}
                placeholder="Sleep note"
              />
              <button
                type="button"
                onClick={saveSleep}
                disabled={!selectedChild || !sleepDuration.trim()}
                className="mt-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save sleep
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">Selected group overview</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${groupDetails.badge}`}>
                Step 2
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-sm text-slate-500">Latest meals</p>
                <p className="mt-2 text-3xl font-bold text-sky-700">{latestMeals.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-slate-500">Latest toilets</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">{latestToilets.length}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4">
                <p className="text-sm text-slate-500">Latest sleep</p>
                <p className="mt-2 text-3xl font-bold text-violet-700">{latestSleep.length}</p>
              </div>
            </div>
          </Card>

          {[...latestMeals, ...latestToilets, ...latestSleep]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6)
            .map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{entry.childName}</h4>
                    <p className="mt-1 text-sm text-slate-500">{formatEntryTime(entry.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {"mealType" in entry
                      ? "Meal"
                      : "type" in entry
                        ? "Toilet"
                        : "Sleep"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {"mealType" in entry && `${entry.mealType} - ${entry.status}`}
                  {"type" in entry && `${entry.type} - ${entry.status}`}
                  {"duration" in entry && `${entry.duration} - ${entry.quality}`}
                </p>
                {entry.note && <p className="mt-2 text-sm text-slate-500">{entry.note}</p>}
              </Card>
            ))}
          {latestMeals.length === 0 && latestToilets.length === 0 && latestSleep.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">
                No meals, diapers/toilets, or sleep logs yet for {groupDetails.label.trim()}.
              </p>
            </Card>
          )}
        </div>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                {groupDetails.label.trim()} child list
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Attendance actions below are limited to the selected age group.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {Object.entries(groupAttendanceSummary).length > 0
                ? Object.entries(groupAttendanceSummary)
                    .map(([label, count]) => `${label}: ${count}`)
                    .join(" | ")
                : "No attendance marked yet"}
            </div>
          </div>
        </div>

        <AttendanceRoster
          records={groupRecords}
          loadingChildId={loadingChildId}
          reasonSelections={reasonSelections}
          onReasonChange={updateReasonSelection}
          onCheckIn={markCheckIn}
          onAbsent={markAbsent}
          onCheckOut={markCheckOut}
        />
      </Card>
    </div>
  );
}
