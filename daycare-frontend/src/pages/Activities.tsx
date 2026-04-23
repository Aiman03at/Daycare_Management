import { useMemo, useState } from "react";
import Card from "../components/Card";
import {
  AGE_GROUPS,
  getAgeGroupDefinition,
  type AgeGroupKey,
} from "../data/ageGroups";

interface ActivityPost {
  id: number;
  title: string;
  note: string;
  group: AgeGroupKey;
  educator: string;
  time: string;
  photos: string[];
  tags: string[];
}

const initialPosts: ActivityPost[] = [
  {
    id: 1,
    title: "Nature collage morning",
    note:
      "The toddlers explored leaves, soft fabric, and paper circles while we practiced naming colors and textures together.",
    group: "toddlers",
    educator: "Ms. Sofia",
    time: "8:45 AM",
    photos: ["Leaf basket", "Painty hands", "Circle table"],
    tags: ["Sensory", "Fine motor", "Language"],
  },
  {
    id: 2,
    title: "Preschool garden journal",
    note:
      "Preschoolers checked the herb planters, drew what changed since Friday, and shared their observations with the class.",
    group: "preschoolers",
    educator: "Mr. Owen",
    time: "10:10 AM",
    photos: ["Garden check", "Drawing journals"],
    tags: ["Science", "Observation", "Outdoor play"],
  },
  {
    id: 3,
    title: "Kinder bridge builders",
    note:
      "Kinder learners worked in pairs to design paper bridges and tested which shape could hold the most blocks.",
    group: "kinder",
    educator: "Ms. Priya",
    time: "1:35 PM",
    photos: ["Bridge test", "Block count", "Team share"],
    tags: ["STEM", "Collaboration", "Problem solving"],
  },
];

export default function Activities() {
  const [posts, setPosts] = useState<ActivityPost[]>(initialPosts);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [group, setGroup] = useState<AgeGroupKey>("toddlers");
  const [educator, setEducator] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [activeFilter, setActiveFilter] = useState<AgeGroupKey | "all">("all");

  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") {
      return posts;
    }

    return posts.filter((post) => post.group === activeFilter);
  }, [activeFilter, posts]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !note.trim() || !educator.trim()) {
      return;
    }

    const photos = photoCaption
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const newPost: ActivityPost = {
      id: Date.now(),
      title: title.trim(),
      note: note.trim(),
      group,
      educator: educator.trim(),
      time: "Just now",
      photos,
      tags: [getAgeGroupDefinition(group).label, "Family update"],
    };

    setPosts((current) => [newPost, ...current]);
    setTitle("");
    setNote("");
    setGroup("toddlers");
    setEducator("");
    setPhotoCaption("");
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
              Start with simple text placeholders for photos now, then we can connect real uploads next.
            </p>
          </div>

          <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
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
                Photo captions
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                value={photoCaption}
                onChange={(event) => setPhotoCaption(event.target.value)}
                placeholder="Comma separated, example: Splash table, Happy smiles"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Post activity update
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
                      <p>{post.time}</p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{post.note}</p>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {post.photos.map((photo, index) => (
                      <div
                        key={`${post.id}-${photo}-${index}`}
                        className={`rounded-3xl bg-gradient-to-br p-5 text-white shadow-sm ${groupDetails.accent}`}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                          Photo {index + 1}
                        </p>
                        <p className="mt-8 text-lg font-semibold">{photo}</p>
                      </div>
                    ))}
                    {post.photos.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
                        No photo captions added yet.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={`${post.id}-${tag}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
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
