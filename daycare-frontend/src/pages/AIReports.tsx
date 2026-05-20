import React, { useState, useEffect } from "react";
import { api } from "../api/client";

interface DailyReport {
  id: number;
  child_id: number;
  child_name: string;
  date: string;
  activities: string[];
  attendance_summary: string;
  meals: string[];
  supplies: string[];
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
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600 mt-2">
            Daily reports are built from daycare records. AI only writes the summary, highlights, and recommendations.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Source data includes attendance, activities, meals, supplies, sleep, behavior notes, and incidents.
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
        </div>

        {/* Active Report Tabs or Reports List */}
        {activeReport ? (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2 mb-4">
              {[
                ["overview", "Overview"],
                ["attendance", "Attendance"],
                ["activities", "Activities"],
                ["meals", "Meals"],
                ["supplies", "Supplies"],
                ["incidents", "Incidents"],
                ["ai", "AI-Written Summary"],
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

              {selectedTab === "attendance" && (
                <div>
                  <h4 className="font-semibold mb-2">Attendance</h4>
                  <p className="text-gray-700">{activeReport.attendance_summary || "No attendance data for today."}</p>
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

              {selectedTab === "supplies" && (
                <div>
                  <h4 className="font-semibold mb-2">Supplies</h4>
                  {activeReport.supplies.length === 0 ? (
                    <p>No supply records were posted today.</p>
                  ) : (
                    <ul className="list-disc list-inside">
                      {activeReport.supplies.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
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
                  <h4 className="font-semibold mb-2">AI-Written Summary</h4>
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
