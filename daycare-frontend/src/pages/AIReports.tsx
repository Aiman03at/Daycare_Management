import React, { useState, useEffect } from "react";
import { api } from "../api/client";

interface DailyReport {
  id: number;
  child_id: number;
  child_name: string;
  date: string;
  activities: string[];
  meals: string[];
  behavior_notes: string;
  sleep_notes: string;
  incidents: string[];
  ai_summary: string;
  ai_highlights: string[];
  ai_recommendations: string[];
  ai_areas_of_growth: string[];
  created_by_name: string;
}

export default function DailyReports() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [formData, setFormData] = useState({
    activities: [] as string[],
    meals: [] as string[],
    behavior_notes: "",
    sleep_notes: "",
    incidents: [] as string[],
    educator_notes: "",
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchReports(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const response = await api.get("/children");
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChildId(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  const fetchReports = async (childId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/daily-reports/${childId}`);
      const fetchedReports = response.data.reports || [];
      setReports(fetchedReports);
      setActiveReport((current) => current ?? fetchedReports[0] ?? null);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      alert("Please select a child");
      return;
    }

    try {
      const response = await api.post(`/ai/daily-reports`, {
        child_id: selectedChildId,
        ...formData,
      });

      setReports([response.data.report, ...reports]);
      setShowForm(false);
      setFormData({
        activities: [],
        meals: [],
        behavior_notes: "",
        sleep_notes: "",
        incidents: [],
        educator_notes: "",
      });

      alert("Report created successfully with AI analysis!");
    } catch (error) {
      console.error("Failed to create report:", error);
      alert("Failed to create report");
    }
  };

  const handleAddActivity = (activity: string) => {
    if (activity.trim()) {
      setFormData({
        ...formData,
        activities: [...formData.activities, activity],
      });
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600 mt-2">
            AI-powered daily activity reports for each child
          </p>
        </div>

        {/* Child Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <select
            value={selectedChildId || ""}
            onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a child...</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} (Age: {child.age})
              </option>
            ))}
          </select>
        </div>

        {/* Actions: Generate or Create */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <button
            onClick={async () => {
              if (!selectedChildId) return alert("Please select a child to generate report for");
              setLoading(true);
              try {
                const response = await api.post(`/ai/daily-reports/generate`, { child_id: selectedChildId });
                const newReport = response.data.report;
                setReports([newReport, ...reports]);
                setActiveReport(newReport);
                setSelectedTab("overview");
                setShowForm(false);
                alert("Daily report generated from today's data");
              } catch (error) {
                console.error("Failed to generate daily report:", error);
                alert("Failed to generate daily report");
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Generate Today's Report
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition"
          >
            {showForm ? "Hide Legacy Form" : "Optional Manual Entry"}
          </button>
        </div>

        {/* Optional legacy form */}
        {showForm && (
          <form onSubmit={handleCreateReport} className="bg-white rounded-lg shadow p-6 mb-8 border border-slate-200">
            <h2 className="text-xl font-semibold mb-2">Legacy Manual Report Entry</h2>
            <p className="text-sm text-slate-500 mb-4">Use this only if you need to override or backfill a report manually.</p>

            {/* Activities */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="activity-input"
                  placeholder="Add activity (e.g., Drawing, Playing)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(
                      "activity-input"
                    ) as HTMLInputElement;
                    handleAddActivity(input.value);
                    input.value = "";
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.activities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {activity}
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(idx)}
                      className="font-bold hover:text-blue-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Meals */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meals & Snacks
              </label>
              <textarea
                value={formData.meals.join("\n")}
                onChange={(e) => setFormData({
                  ...formData,
                  meals: e.target.value.split("\n").filter(m => m.trim()),
                })}
                placeholder="Enter meals/snacks (one per line)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            {/* Behavior Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Behavior Notes
              </label>
              <textarea
                value={formData.behavior_notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    behavior_notes: e.target.value,
                  })
                }
                placeholder="Describe behavior observations"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            {/* Sleep Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep/Rest Time
              </label>
              <textarea
                value={formData.sleep_notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sleep_notes: e.target.value,
                  })
                }
                placeholder="Describe sleep/rest observations"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Generate AI Report
            </button>
          </form>
        )}

        {/* Active Report Tabs or Reports List */}
        {activeReport ? (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2 mb-4">
              {[
                ["overview", "Overview"],
                ["activities", "Activities"],
                ["meals", "Meals"],
                ["incidents", "Incidents"],
                ["ai", "AI Summary"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTab(key as string)}
                  className={`px-3 py-1 rounded ${selectedTab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setActiveReport(null)}
                className="ml-auto px-3 py-1 rounded bg-red-100 text-red-700"
              >
                Close
              </button>
            </div>

            <div>
              {selectedTab === "overview" && (
                <div>
                  <h3 className="text-lg font-semibold">{activeReport.child_name} - {new Date(activeReport.date).toLocaleDateString()}</h3>
                  <p className="text-sm text-gray-600">By {activeReport.created_by_name}</p>
                </div>
              )}

              {selectedTab === "activities" && (
                <div>
                  <h4 className="font-semibold mb-2">Activities</h4>
                  <ul className="list-disc list-inside">
                    {activeReport.activities.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {selectedTab === "meals" && (
                <div>
                  <h4 className="font-semibold mb-2">Meals</h4>
                  <ul className="list-disc list-inside">
                    {activeReport.meals.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}

              {selectedTab === "incidents" && (
                <div>
                  <h4 className="font-semibold mb-2">Incidents</h4>
                  {activeReport.incidents.length === 0 ? <p>No incidents reported today.</p> : (
                    <ul className="list-disc list-inside">
                      {activeReport.incidents.map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {selectedTab === "ai" && (
                <div>
                  <h4 className="font-semibold mb-2">AI Summary</h4>
                  <p className="mb-3">{activeReport.ai_summary}</p>
                  <h5 className="font-semibold">Highlights</h5>
                  <ul className="list-disc list-inside mb-3">
                    {activeReport.ai_highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <p className="text-center text-gray-600">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-gray-600">
                No reports yet. Generate today's report to get started.
              </p>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setActiveReport(report);
                    setSelectedTab("overview");
                  }}
                  className={`w-full text-left bg-white rounded-lg shadow-lg overflow-hidden border transition ${activeReport?.id === report.id ? "border-blue-500 ring-2 ring-blue-100" : "border-transparent hover:border-slate-200"}`}
                >
                  <div className="bg-blue-50 p-4 border-l-4 border-blue-600">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.child_name} - {new Date(report.date).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-600">By {report.created_by_name}</p>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-700 line-clamp-3">{report.ai_summary}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
