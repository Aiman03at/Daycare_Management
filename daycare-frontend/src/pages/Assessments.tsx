import React, { useState, useEffect } from "react";
import { api } from "../api/client";

interface Assessment {
  id: number;
  child_id: number;
  child_name: string;
  development_area: string;
  assessment_date: string;
  observations: string;
  concerns: string;
  ai_development_level: string;
  ai_strengths: string[];
  ai_areas_for_improvement: string[];
  ai_recommendations: string[];
  ai_milestones_achieved: string[];
  educator_name: string;
}

interface ProgressData {
  date: string;
  development_level: string;
}

const developmentAreas = [
  "Physical Development",
  "Cognitive Development",
  "Language Development",
  "Social-Emotional Development",
  "Creative Development",
  "Independence & Self-Care",
  "Fine Motor Skills",
  "Gross Motor Skills",
];

export default function ChildAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressData[]>([]);

  const [formData, setFormData] = useState({
    development_area: "",
    observations: "",
    concerns: "",
    age_group: "",
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchAssessments(selectedChildId);
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

  const fetchAssessments = async (childId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/assessments/${childId}`);
      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (area: string) => {
    if (!selectedChildId) return;

    try {
      const response = await api.get(
        `/ai/assessment-progress/${selectedChildId}?development_area=${encodeURIComponent(area)}&months=6`
      );
      setProgressData(response.data.progress || []);
      setSelectedArea(area);
      setShowProgress(true);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId || !formData.development_area) {
      alert("Please select a child and development area");
      return;
    }

    try {
      const response = await api.post(`/ai/assessments`, {
        child_id: selectedChildId,
        ...formData,
      });

      setAssessments([response.data.assessment, ...assessments]);
      setShowForm(false);
      setFormData({
        development_area: "",
        observations: "",
        concerns: "",
        age_group: "",
      });

      alert("Assessment created successfully with AI analysis!");
    } catch (error) {
      console.error("Failed to create assessment:", error);
      alert("Failed to create assessment");
    }
  };

  const getChildName = (childId: number) => {
    const child = children.find((c) => c.id === childId);
    return child?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Child Assessments</h1>
          <p className="text-gray-600 mt-2">
            AI-powered developmental assessments to track child progress
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

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "New Assessment"}
          </button>
          {selectedChildId && (
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {showProgress ? "Hide Progress" : "View Progress"}
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleCreateAssessment}
            className="bg-white rounded-lg shadow p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">New Assessment</h2>

            {/* Development Area */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Development Area *
              </label>
              <select
                value={formData.development_area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    development_area: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select area...</option>
                {developmentAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Group */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group
              </label>
              <input
                type="text"
                value={formData.age_group}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age_group: e.target.value,
                  })
                }
                placeholder="e.g., 2-3 years, Toddler, Preschool"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Observations */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observations *
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observations: e.target.value,
                  })
                }
                placeholder="Describe your observations about the child's development in this area"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={4}
                required
              />
            </div>

            {/* Concerns */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concerns (Optional)
              </label>
              <textarea
                value={formData.concerns}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    concerns: e.target.value,
                  })
                }
                placeholder="Any concerns or areas to watch"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Generate Assessment
            </button>
          </form>
        )}

        {/* Progress Chart */}
        {showProgress && progressData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Progress: {selectedArea}
            </h2>
            <div className="space-y-2">
              {progressData.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      entry.development_level === "Advanced"
                        ? "bg-green-100 text-green-800"
                        : entry.development_level === "On track"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {entry.development_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessments List */}
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-gray-600">Loading assessments...</p>
          ) : assessments.length === 0 ? (
            <p className="text-center text-gray-600">
              No assessments yet. Create one to get started!
            </p>
          ) : (
            assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="bg-purple-50 p-4 border-l-4 border-purple-600">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assessment.development_area}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-600">
                      {new Date(
                        assessment.assessment_date
                      ).toLocaleDateString()}{" "}
                      by {assessment.educator_name}
                    </p>
                    <button
                      onClick={() => fetchProgress(assessment.development_area)}
                      className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      View Progress
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Development Level */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Development Level
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        assessment.ai_development_level === "Advanced"
                          ? "text-green-600"
                          : assessment.ai_development_level === "On track"
                          ? "text-blue-600"
                          : "text-orange-600"
                      }`}
                    >
                      {assessment.ai_development_level}
                    </p>
                  </div>

                  {/* Strengths */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {assessment.ai_strengths.map((strength, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <span className="text-green-600 font-bold">+</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {assessment.ai_areas_for_improvement.map((area, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <span className="text-orange-600 font-bold">→</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Milestones Achieved */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Milestones Achieved
                    </h4>
                    <ul className="space-y-2">
                      {assessment.ai_milestones_achieved.map((milestone, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <span className="text-purple-600 font-bold">✓</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {assessment.ai_recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-gray-700"
                        >
                          <span className="text-yellow-600 font-bold">!</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
