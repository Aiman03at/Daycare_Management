import { useMemo, useState, useEffect, useRef } from "react";
import Card from "../components/Card";
import CarePageLayout from "../components/CarePageLayout";
import { createCareEntryId, formatEntryTime, useCareStore, type MealEntry } from "../data/careRecords";
import { type AgeGroupKey, type ChildRecord, getAgeGroup } from "../data/ageGroups";
import { api } from "../api/client";
import type { AttendanceRosterItem } from "../components/AttendanceRoster";

export default function Meals() {
  const { store, setStore } = useCareStore();
  const [selectedGroup, setSelectedGroup] = useState<AgeGroupKey>("toddlers");
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [mealType, setMealType] = useState<MealEntry["mealType"]>("lunch");
  const [status, setStatus] = useState<MealEntry["status"]>("all");
  const [note, setNote] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRosterItem[]>([]);
  const [dbMeals, setDbMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch meals from database
  const fetchMeals = async () => {
    try {
      const response = await api.get(`/meals?group=${selectedGroup}`);
      const formattedMeals: MealEntry[] = response.data.map((meal: any) => ({
        id: String(meal.id),
        childId: meal.child_id,
        childName: meal.child_name,
        group: meal.group_key as AgeGroupKey,
        mealType: meal.meal_type as MealEntry["mealType"],
        status: meal.status as MealEntry["status"],
        note: meal.note,
        images: meal.image_path ? [meal.image_path] : undefined,
        createdAt: meal.created_at,
      }));
      setDbMeals(formattedMeals);
    } catch (error) {
      console.error("Failed to fetch meals:", error);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedGroup]);
  const entries = useMemo(
    () =>
      dbMeals
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [dbMeals]
  );
  // Group meals by type and note
  const groupedMeals = useMemo(() => {
    const grouped: Record<string, Record<string, MealEntry[]>> = {};

    entries.forEach((entry) => {
      if (!grouped[entry.mealType]) {
        grouped[entry.mealType] = {};
      }
      if (!grouped[entry.mealType][entry.note]) {
        grouped[entry.mealType][entry.note] = [];
      }
      grouped[entry.mealType][entry.note].push(entry);
    });

    return grouped;
  }, [entries]);

  const mealTypeOrder: MealEntry["mealType"][] = ["breakfast", "lunch", "snack"];

  const presentChildrenInGroup = useMemo(() => {
    return attendanceRecords.filter(
      (record) =>
        record.check_in && // Child is checked in
        getAgeGroup(record.age) === selectedGroup &&
        !record.absent_reason && // Not marked absent
        !record.check_out // Not checked out yet
    );
  }, [attendanceRecords, selectedGroup]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess = Array.from(files);
    const maxToAdd = Math.min(filesToProcess.length, 4 - uploadedImages.length);
    const newImages: string[] = [];
    let processedCount = 0;

    filesToProcess.slice(0, maxToAdd).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
        }
        processedCount++;
        if (processedCount === maxToAdd) {
          setUploadedImages((prev) => [...prev, ...newImages]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      reader.onerror = () => {
        processedCount++;
        if (processedCount === maxToAdd) {
          setUploadedImages((prev) => [...prev, ...newImages]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

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

      const response = await api.post("/meals/bulk", {
        childIds: selectedChildIds,
        childNames,
        groupKey: selectedGroup,
        mealType,
        status,
        note: note.trim(),
        imagePath: uploadedImages.length > 0 ? uploadedImages[0] : null,
      });

      // Add newly created meals to the display
      const newMeals: MealEntry[] = response.data.map((meal: any) => ({
        id: String(meal.id),
        childId: meal.child_id,
        childName: meal.child_name,
        group: meal.group_key as AgeGroupKey,
        mealType: meal.meal_type as MealEntry["mealType"],
        status: meal.status as MealEntry["status"],
        note: meal.note,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        createdAt: meal.created_at,
      }));

      setDbMeals((prev) => [...newMeals, ...prev]);

      setSelectedChildIds([]);
      setMealType("lunch");
      setStatus("all");
      setNote("");
      setUploadedImages([]);
    } catch (error) {
      console.error("Error saving meal:", error);
      alert("Failed to save meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CarePageLayout
      pageTitle="Meals"
      pageDescription="Track what each age group ate throughout the day."
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload photos ({uploadedImages.length}/4)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadedImages.length >= 4}
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploadedImages.length >= 4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {uploadedImages.length >= 4 ? "Maximum 4 photos reached" : "Choose photos from device"}
            </button>
            {uploadedImages.length > 0 && (
              <div className="mt-3 grid gap-2 grid-cols-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Meal ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save meal"}
          </button>
        </form>
      )}
      renderEntry={(entry) => null}
      renderMealsSummary={() => (
        <div className="space-y-6">
          {mealTypeOrder.map((type) => {
            const mealsByType = groupedMeals[type];
            if (!mealsByType || Object.keys(mealsByType).length === 0) return null;

            return (
              <div key={type}>
                <h3 className="text-xl font-semibold text-slate-900 mb-4 capitalize">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </h3>
                <div className="space-y-3">
                  {Object.entries(mealsByType).map(([note, meals]) => (
                    <Card key={note}>
                      <p className="text-sm text-slate-600 mb-3">{note}</p>
                      <div className="flex flex-wrap gap-2 items-start">
                        {meals.map((meal) => (
                          <span
                            key={meal.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                          >
                            {meal.childName}
                            <span className="text-sky-500 font-semibold">• {meal.status}</span>
                          </span>
                        ))}
                      </div>
                      {meals[0]?.images && meals[0].images.length > 0 && (
                        <div className="mt-4 grid gap-2 grid-cols-2">
                          {meals[0].images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Meal ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">No meals recorded for this group yet.</p>
            </Card>
          )}
        </div>
      )}
    />
  );
}
