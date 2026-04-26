import { useEffect, useMemo, useState } from "react";
import { api, BACKEND_BASE_URL } from "../api/client";
import Card from "../components/Card";
import {
  AGE_GROUPS,
  getAgeGroup,
  getAgeGroupDefinition,
  normalizeChild,
  type AgeGroupKey,
  type ChildRecord,
} from "../data/ageGroups";

interface ActivityPost {
  id: number;
  title: string;
  note: string;
  group: AgeGroupKey;
  educator: string;
  created_at: string;
  photos: string[];
  tagged_children: Array<{
    id: number;
    name: string;
  }>;
}

interface ActivityApiRecord {
  id: number;
  title: string;
  note: string;
  group: AgeGroupKey;
  educator: string;
  created_at: string;
  photos: string[];
  tagged_children: Array<{
    id: number;
    name: string;
  }>;
}

function toDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolvePhotoSrc(value: string) {
  if (value.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${value}`;
  }

  return value;
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function Activities() {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [group, setGroup] = useState<AgeGroupKey>("toddlers");
  const [educator, setEducator] = useState("");
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<AgeGroupKey | "all">("all");

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [activitiesResponse, childrenResponse] = await Promise.all([
          api.get<ActivityApiRecord[]>("/activities"),
          api.get("/children"),
        ]);

        setPosts(activitiesResponse.data);
        setChildren(childrenResponse.data.map(normalizeChild));
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.message ?? "Failed to load activities");
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, []);

  const childrenInSelectedGroup = useMemo(
    () => children.filter((child) => getAgeGroup(child.age) === group),
    [children, group]
  );

  useEffect(() => {
    const allowedIds = new Set(childrenInSelectedGroup.map((child) => child.id));
    setSelectedChildIds((current) => current.filter((id) => allowedIds.has(id)));
  }, [childrenInSelectedGroup]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") {
      return posts;
    }

    return posts.filter((post) => post.group === activeFilter);
  }, [activeFilter, posts]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submit = async () => {
      if (!title.trim() || !note.trim() || !educator.trim()) {
        setErrorMessage("Title, note, and educator are required.");
        return;
      }

      if (selectedChildIds.length === 0) {
        setErrorMessage("Please tag at least one child for this activity.");
        return;
      }

      setIsSubmitting(true);
      setErrorMessage("");

      try {
        const response = await api.post<ActivityPost>("/activities", {
          title: title.trim(),
          note: note.trim(),
          group,
          educator: educator.trim(),
          child_ids: selectedChildIds,
          photos: photoDataUrls,
        });

        setPosts((current) => [response.data, ...current]);
        setTitle("");
        setNote("");
        setGroup("toddlers");
        setEducator("");
        setSelectedChildIds([]);
        setPhotoDataUrls([]);
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.message ?? "Failed to create activity");
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  const toggleChildTag = (childId: number) => {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    );
  };

  const onFilesPicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (files.length === 0) {
      return;
    }

    try {
      const encodedFiles = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setPhotoDataUrls((current) => [...current, ...encodedFiles]);
    } catch {
      setErrorMessage("Failed to read one or more selected images.");
    } finally {
      event.target.value = "";
    }
  };

  const removeSelectedPhoto = (indexToRemove: number) => {
    setPhotoDataUrls((current) => current.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="grid gap-6 px-8 py-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-slate-100">
              Family communication
            </span>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Share classroom moments like Lillio-style activity posts.
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Educators can post photos, short learning notes, and group-specific updates so families quickly see what happened during the day.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {AGE_GROUPS.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-slate-300">{item.ageRange}</p>
                <p className="mt-2 text-xs text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Card className="p-0">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-xl font-semibold text-slate-900">New Activity Post</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create activity updates with tagged children and photos.
            </p>
          </div>

          <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Activity title
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Water play outside"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Age group
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                  value={group}
                  onChange={(event) => setGroup(event.target.value as AgeGroupKey)}
                >
                  {AGE_GROUPS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Posted by
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                  value={educator}
                  onChange={(event) => setEducator(event.target.value)}
                  placeholder="Educator name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Learning note
              </label>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Describe the activity, learning goal, or special moment."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Upload activity photos
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onFilesPicked}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
              />

              {photoDataUrls.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {photoDataUrls.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200">
                      <img src={photo} alt={`Selected upload ${index + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedPhoto(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tag kids in this activity
              </label>

              <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
                {childrenInSelectedGroup.length === 0 && (
                  <p className="text-sm text-slate-400">No children available in this age group.</p>
                )}

                {childrenInSelectedGroup.map((child) => (
                  <label
                    key={child.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{child.name}</span>
                    <input
                      type="checkbox"
                      checked={selectedChildIds.includes(child.id)}
                      onChange={() => toggleChildTag(child.id)}
                      className="h-4 w-4 accent-slate-900"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              {isSubmitting ? "Posting..." : "Post activity update"}
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 shadow-sm"
              }`}
            >
              All groups
            </button>
            {AGE_GROUPS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === item.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <Card>
              <p className="text-sm text-slate-500">Loading activities...</p>
            </Card>
          )}

          {!isLoading && filteredPosts.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">No activity posts yet.</p>
            </Card>
          )}

          {filteredPosts.map((post) => {
            const groupDetails = getAgeGroupDefinition(post.group);

            return (
              <Card key={post.id} className="overflow-hidden p-0">
                <div className={`h-2 bg-gradient-to-r ${groupDetails.accent}`} />
                <div className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${groupDetails.badge}`}
                      >
                        {groupDetails.label}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-slate-900">
                        {post.title}
                      </h3>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{post.educator}</p>
                      <p>{toDisplayDate(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{post.note}</p>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {post.photos.map((photo, index) => (
                      <div key={`${post.id}-${photo}-${index}`} className="overflow-hidden rounded-3xl shadow-sm">
                        <img
                          src={resolvePhotoSrc(photo)}
                          alt={`${post.title} photo ${index + 1}`}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ))}
                    {post.photos.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
                        No photos uploaded yet.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {post.tagged_children.map((child) => (
                      <span
                        key={`${post.id}-${child.id}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {child.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
