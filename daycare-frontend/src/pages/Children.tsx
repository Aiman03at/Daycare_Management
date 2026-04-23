import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import {
  AGE_GROUPS,
  getAgeGroup,
  normalizeChild,
  type ChildRecord,
} from "../data/ageGroups";

export default function Children() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [profilePicError, setProfilePicError] = useState("");
  const [editChild, setEditChild] = useState<ChildRecord | null>(null);

  const fetchChildren = () => {
    api
      .get("/children")
      .then((response) => {
        setChildren(response.data.map(normalizeChild));
      })
      .catch((error) => {
        console.error("Error fetching children:", error);
      });
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const groupedChildren = useMemo(() => {
    return AGE_GROUPS.map((group) => ({
      ...group,
      children: children.filter((child) => getAgeGroup(child.age) === group.key),
    }));
  }, [children]);

  const resetForm = () => {
    setName("");
    setAge("");
    setParentName("");
    setParentPhone("");
    setBirthDate("");
    setGender("");
    setProfilePic("");
    setProfilePicError("");
    setEditChild(null);
  };

  const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/jpg"].includes(file.type)) {
      setProfilePicError("Please upload a JPEG image only.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePic(reader.result);
        setProfilePicError("");
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !age.trim()) {
      return;
    }

    if (profilePicError) {
      return;
    }

    const payload = {
      name: name.trim(),
      age: Number(age),
      parent_name: parentName.trim(),
      parent_phone: parentPhone.trim(),
      birth_date: birthDate || null,
      gender: gender || null,
      profile_pic: profilePic.trim() || null,
    };

    if (editChild) {
      await api.put(`/children/${editChild.id}`, payload);
    } else {
      await api.post("/children", payload);
    }

    resetForm();
    fetchChildren();
  };

  const deleteChild = async (id: number) => {
    await api.delete(`/children/${id}`);
    fetchChildren();
  };

  const startEditing = (child: ChildRecord) => {
    setEditChild(child);
    setName(child.name);
    setAge(child.age.toString());
    setParentName(child.parentName || "");
    setParentPhone(child.parentPhone || "");
    setBirthDate(child.birthDate || "");
    setGender(child.gender || "");
    setProfilePic(child.profilePic || "");
    setProfilePicError("");
  };

  const assignedGroup = age
    ? AGE_GROUPS.find((group) => group.key === getAgeGroup(Number(age)))?.label
    : "Set age to preview";

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
        <Card className="p-0">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              {editChild ? "Update child profile" : "Add a child"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every child is automatically sorted into toddlers, preschoolers, or kinder by age.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Child's name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Age"
                  type="number"
                  min="1"
                />
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Assigned group
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">{assignedGroup}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Birth date
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  type="date"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Gender
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Profile picture
              </label>
              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800 focus:border-sky-400"
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleProfilePicUpload}
                />
                <p className="text-xs text-slate-500">
                  JPEG only. Upload a `.jpg` or `.jpeg` file.
                </p>
                {profilePicError && (
                  <p className="text-sm font-medium text-rose-600">{profilePicError}</p>
                )}
                {profilePic && (
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                    <img
                      src={profilePic}
                      alt="Profile preview"
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePic("");
                        setProfilePicError("");
                      }}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parent name
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="Parent or guardian"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parent phone
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={parentPhone}
                onChange={(event) => setParentPhone(event.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                {editChild ? "Save changes" : "Add child"}
              </button>
              {editChild && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          {groupedChildren.map((group) => (
            <Card key={group.key} className="overflow-hidden p-0">
              <div className={`h-2 bg-gradient-to-r ${group.accent}`} />
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{group.label}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.ageRange} - {group.description}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${group.badge}`}>
                    {group.children.length} children
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.children.length === 0 && (
                  <div className="px-6 py-5 text-sm text-slate-400">
                    No children in this group yet.
                  </div>
                )}

                {group.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                        {child.profilePic ? (
                          <img
                            src={child.profilePic}
                            alt={child.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          child.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{child.name}</h4>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span>Age {child.age}</span>
                          {child.birthDate && <span>Birthday: {child.birthDate}</span>}
                          {child.gender && <span>Gender: {child.gender}</span>}
                          {child.parentName && <span>Parent: {child.parentName}</span>}
                          {child.parentPhone && <span>{child.parentPhone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(child)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteChild(child.id)}
                        className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
