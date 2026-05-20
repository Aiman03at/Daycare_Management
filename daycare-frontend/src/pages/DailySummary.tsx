import React, { useState, useEffect } from "react";
import { api } from "../api/client";

interface ChildReportData {
  child_id: number;
  child_name: string;
  child_age: number;
  check_in: string | null;
  check_out: string | null;
  absent_reason: string | null;
  attendance_summary: string;
  report_id: number | null;
  activities: string[];
  meals: string[];
  supplies: string[];
  behavior_notes: string;
  sleep_notes: string;
  incidents: string[];
  ai_summary: string;
  ai_highlights: string[];
  ai_recommendations: string[];
  ai_areas_of_growth: string[];
}

interface GroupedReports {
  [groupKey: string]: ChildReportData[];
}

export default function DailySummary() {
  const [groupedReports, setGroupedReports] = useState<GroupedReports>({});
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDailySummary();
  }, []);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ai/daily-summary-grouped");
      setGroupedReports(response.data.groupedReports || {});
      setDate(response.data.date);
    } catch (error) {
      console.error("Failed to fetch daily summary:", error);
      alert("Failed to fetch daily summary");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (childId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(childId)) {
      newExpanded.delete(childId);
    } else {
      newExpanded.add(childId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (absent_reason: string | null, check_out: string | null) => {
    if (absent_reason) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Absent</span>;
    }
    if (!check_out) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Present</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Checked Out</span>;
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">Loading...</div>;
  }

  const groupKeys = Object.keys(groupedReports).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Summary Report</h1>
          <p className="text-gray-600 mt-2">
            All children present on {new Date(date).toLocaleDateString()} with their daily reports
          </p>
          <button
            onClick={fetchDailySummary}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Groups and Tables */}
        <div className="space-y-8">
          {groupKeys.length === 0 ? (
            <p className="text-center text-gray-600">No attendance records for today.</p>
          ) : (
            groupKeys.map((groupKey) => (
              <div key={groupKey}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  {groupKey}
                </h2>

                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Age</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Check-in / Out</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">AI Summary</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedReports[groupKey].map((report) => (
                        <React.Fragment key={report.child_id}>
                          <tr className="border-b hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">{report.child_name}</td>
                            <td className="px-4 py-3 text-gray-600">{report.child_age} years</td>
                            <td className="px-4 py-3">
                              {getStatusBadge(report.absent_reason, report.check_out)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {report.absent_reason ? (
                                <span>Absent - {report.absent_reason}</span>
                              ) : (
                                <span>
                                  {report.check_in ? new Date(report.check_in).toLocaleTimeString() : "N/A"}
                                  {report.check_out ? ` / ${new Date(report.check_out).toLocaleTimeString()}` : " / Pending"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-700 truncate max-w-xs">
                              {report.ai_summary ? report.ai_summary.substring(0, 60) + "..." : "No report"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleRow(report.child_id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                              >
                                {expandedRows.has(report.child_id) ? "Hide" : "Show"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {expandedRows.has(report.child_id) && (
                            <tr className="bg-blue-50">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid grid-cols-2 gap-6">
                                  {/* Left Column */}
                                  <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Raw Data</h4>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Activities</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.activities.length > 0 ? (
                                          report.activities.map((a, i) => <li key={i}>{a}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Meals</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.meals.length > 0 ? (
                                          report.meals.map((m, i) => <li key={i}>{m}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Supplies</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.supplies.length > 0 ? (
                                          report.supplies.map((s, i) => <li key={i}>{s}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Behavior Notes</h5>
                                      <p className="text-sm text-gray-600">{report.behavior_notes || "None"}</p>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1">Sleep Notes</h5>
                                      <p className="text-sm text-gray-600">{report.sleep_notes || "None"}</p>
                                    </div>
                                  </div>

                                  {/* Right Column */}
                                  <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">AI Analysis</h4>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Summary</h5>
                                      <p className="text-sm text-gray-600">{report.ai_summary || "No summary"}</p>
                                    </div>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Highlights</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.ai_highlights.length > 0 ? (
                                          report.ai_highlights.map((h, i) => <li key={i}>{h}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>

                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-700 mb-1">Recommendations</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.ai_recommendations.length > 0 ? (
                                          report.ai_recommendations.map((r, i) => <li key={i}>{r}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1">Areas of Growth</h5>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {report.ai_areas_of_growth.length > 0 ? (
                                          report.ai_areas_of_growth.map((a, i) => <li key={i}>{a}</li>)
                                        ) : (
                                          <li>None</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
