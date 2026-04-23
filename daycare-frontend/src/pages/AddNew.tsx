import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import { getStoredUser } from "../auth/session";

interface Announcement {
  id: number;
  title: string;
  detail: string;
  announcement_date: string;
}

export default function AddNew() {
  const user = getStoredUser();
  const canPostAnnouncements = user?.role === "admin" || user?.role === "educator";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    detail: "",
    announcementDate: new Date().toISOString().split("T")[0],
  });

  const fetchAnnouncements = async () => {
    const response = await api.get("/announcements");
    setAnnouncements(response.data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAnnouncementFieldChange = (
    field: "title" | "detail" | "announcementDate",
    value: string
  ) => {
    setAnnouncementForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAnnouncementSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPostingAnnouncement(true);

    try {
      await api.post("/announcements", {
        title: announcementForm.title,
        detail: announcementForm.detail,
        announcement_date: announcementForm.announcementDate,
      });

      setAnnouncementForm({
        title: "",
        detail: "",
        announcementDate: new Date().toISOString().split("T")[0],
      });

      await fetchAnnouncements();
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const formatAnnouncementDate = (value: string) =>
    new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  if (!canPostAnnouncements) {
    return (
      <Card>
        <h2 className="text-2xl font-semibold text-slate-900">Add New</h2>
        <p className="mt-3 text-sm text-slate-500">
          You do not have permission to create announcements.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Add New Announcement</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a new announcement without showing the form on the dashboard.
          </p>
        </div>

        <form onSubmit={handleAnnouncementSubmit} className="mt-6 space-y-4">
          <input
            value={announcementForm.title}
            onChange={(event) => handleAnnouncementFieldChange("title", event.target.value)}
            placeholder="Announcement title"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            required
          />
          <textarea
            value={announcementForm.detail}
            onChange={(event) => handleAnnouncementFieldChange("detail", event.target.value)}
            placeholder="Write the announcement details"
            className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            required
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="date"
              value={announcementForm.announcementDate}
              onChange={(event) =>
                handleAnnouncementFieldChange("announcementDate", event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              required
            />
            <button
              type="submit"
              disabled={isPostingAnnouncement}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isPostingAnnouncement ? "Posting..." : "Post announcement"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-slate-900">Recent Posts</h3>
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
    </div>
  );
}
