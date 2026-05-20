import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";
import { aiService, DailyReportInput, AssessmentInput } from "../services/ai.service";
import { initializeAISchema } from "../db/ai.schema";

const router = Router();

// Initialize schema on first use
let schemaInitialized = false;

const ensureSchema = async () => {
  if (!schemaInitialized) {
    await initializeAISchema();
    schemaInitialized = true;
  }
};

/**
 * POST /api/ai/daily-reports/generate
 * Auto-generate a daily report by aggregating today's data for a child
 * Body or query: { child_id?: number }
 */
router.post("/daily-reports/generate", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const child_id = Number(req.body.child_id || req.query.child_id);
    const user_id = (req as any).user.id;

    if (!child_id || !Number.isInteger(child_id) || child_id <= 0) {
      return res.status(400).json({ error: "child_id is required (body or query)" });
    }

    // Get child details
    const childResult = await pool.query("SELECT * FROM children WHERE id = $1", [child_id]);

    if (childResult.rows.length === 0) {
      return res.status(404).json({ error: "Child not found" });
    }

    const child = childResult.rows[0];

    const attendanceRes = await pool.query(
      `SELECT check_in, check_out, absent_reason
       FROM attendance
       WHERE child_id = $1 AND date = CURRENT_DATE
       LIMIT 1`,
      [child_id]
    );

    const attendanceRecord = attendanceRes.rows[0];
    const attendanceSummary = attendanceRecord
      ? attendanceRecord.absent_reason
        ? `Absent - ${attendanceRecord.absent_reason}`
        : `Check-in: ${attendanceRecord.check_in ? new Date(attendanceRecord.check_in).toLocaleTimeString() : "N/A"}${attendanceRecord.check_out ? `, Check-out: ${new Date(attendanceRecord.check_out).toLocaleTimeString()}` : ", Check-out: pending"}`
      : "No attendance record for today";

    // Aggregate today's activities (where tagged_children contains this child)
    const activitiesRes = await pool.query(
      `SELECT title, note FROM activities a
       WHERE a.created_at::date = CURRENT_DATE
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(a.tagged_children) elem
         WHERE (elem->>'id')::int = $1
       )
       ORDER BY a.created_at ASC`,
      [child_id]
    );

    const activities = activitiesRes.rows.map((r: any) => `${r.title}${r.note ? ': ' + r.note : ''}`);

    // Meals for today
    const mealsRes = await pool.query(
      `SELECT meal_type, status, note FROM meals WHERE child_id = $1 AND created_at::date = CURRENT_DATE ORDER BY created_at ASC`,
      [child_id]
    );
    const meals = mealsRes.rows.map((r: any) => `${r.meal_type} - ${r.status}${r.note ? ': ' + r.note : ''}`);

    const suppliesRes = await pool.query(
      `SELECT item, status, note FROM supplies WHERE child_id = $1 AND created_at::date = CURRENT_DATE ORDER BY created_at ASC`,
      [child_id]
    );
    const supplies = suppliesRes.rows.map((r: any) => `${r.item} - ${r.status}${r.note ? ': ' + r.note : ''}`);

    // Health logs
    const healthRes = await pool.query(
      `SELECT category, status, note FROM health WHERE child_id = $1 AND created_at::date = CURRENT_DATE ORDER BY created_at ASC`,
      [child_id]
    );
    const behaviorNotes = healthRes.rows.map((r: any) => `${r.category} - ${r.status}${r.note ? ': ' + r.note : ''}`).join('; ');

    // Sleep logs
    const sleepRes = await pool.query(
      `SELECT duration, quality, note FROM sleep WHERE child_id = $1 AND created_at::date = CURRENT_DATE ORDER BY created_at ASC`,
      [child_id]
    );
    const sleepSummary = sleepRes.rows.map((r: any) => `${r.duration} (${r.quality})${r.note ? ': ' + r.note : ''}`).join('; ');

    // Incidents
    const incidentsRes = await pool.query(
      `SELECT category, severity, note FROM incidents WHERE child_id = $1 AND created_at::date = CURRENT_DATE ORDER BY created_at ASC`,
      [child_id]
    );
    const incidents = incidentsRes.rows.map((r: any) => `${r.category} - ${r.severity}${r.note ? ': ' + r.note : ''}`);

    // Build AI input
    const aiInput: DailyReportInput = {
      childId: child_id,
      childName: child.name,
      age: child.age,
      activities,
      meals,
      supplies,
      attendanceSummary,
      behavior: behaviorNotes || "",
      sleep: sleepSummary || "",
      incidents,
      notes: null,
    };

    // Generate AI report
    const aiReport = await aiService.generateDailyReport(aiInput);

    // Log AI request
    await pool.query(
      `INSERT INTO ai_report_requests (child_id, report_type, request_data, response_data, api_provider, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [child_id, "daily_report", JSON.stringify(aiInput), JSON.stringify(aiReport), process.env.AI_PROVIDER || "openai", user_id]
    );

    // Upsert into daily_reports
    const existingReport = await pool.query(
      `SELECT id FROM daily_reports WHERE child_id = $1 AND date = CURRENT_DATE`,
      [child_id]
    );

    let result;

    if (existingReport.rows.length > 0) {
      result = await pool.query(
        `UPDATE daily_reports 
         SET activities = $1, meals = $2, behavior_notes = $3, sleep_notes = $4, 
           incidents = $5, educator_notes = $6,
           attendance_summary = $7, supplies = $8,
           ai_summary = $9, ai_highlights = $10, ai_recommendations = $11, ai_areas_of_growth = $12,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $13 RETURNING *`,
        [
          activities,
          meals,
          behaviorNotes || null,
          sleepSummary || null,
          incidents || [],
          null,
          attendanceSummary,
          supplies,
          aiReport.summary,
          aiReport.highlights,
          aiReport.recommendations,
          aiReport.areas_of_growth,
          existingReport.rows[0].id,
        ]
      );
    } else {
      result = await pool.query(
        `INSERT INTO daily_reports 
         (child_id, activities, meals, behavior_notes, sleep_notes, incidents, educator_notes,
          attendance_summary, supplies,
          ai_summary, ai_highlights, ai_recommendations, ai_areas_of_growth, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          child_id,
          activities,
          meals,
          behaviorNotes || null,
          sleepSummary || null,
          incidents || [],
          null,
          attendanceSummary,
          supplies,
          aiReport.summary,
          aiReport.highlights,
          aiReport.recommendations,
          aiReport.areas_of_growth,
          user_id,
        ]
      );
    }

    res.status(200).json({ message: "Daily report generated from DB", report: result.rows[0], ai_analysis: aiReport });
  } catch (error) {
    console.error("Error auto-generating daily report:", error);

    if ((req as any).user?.id) {
      await pool
        .query(
          `INSERT INTO ai_report_requests (report_type, status, error_message, requested_by, api_provider)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            "daily_report",
            "error",
            (error as Error).message,
            (req as any).user.id,
            process.env.AI_PROVIDER || "openai",
          ]
        )
        .catch((err) => console.error("Failed to log error:", err));
    }

    res.status(500).json({ error: "Failed to auto-generate daily report" });
  }
});

/**
 * GET /api/ai/daily-reports/:childId
 * Get daily reports for a child (paginated)
 * Query params: limit=10, offset=0
 */
router.get("/daily-reports/:childId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { childId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM daily_reports WHERE child_id = $1`,
      [childId]
    );

    const reportsResult = await pool.query(
      `SELECT dr.*, 
              c.name as child_name, 
              u.name as created_by_name
       FROM daily_reports dr
       JOIN children c ON dr.child_id = c.id
       JOIN users u ON dr.created_by = u.id
       WHERE dr.child_id = $1
       ORDER BY dr.date DESC
       LIMIT $2 OFFSET $3`,
      [childId, limit, offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
      reports: reportsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching daily reports:", error);
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
});

/**
 * GET /api/ai/daily-reports/:childId/:reportId
 * Get specific daily report details
 */
router.get("/daily-reports/:childId/:reportId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { childId, reportId } = req.params;

    const result = await pool.query(
      `SELECT dr.*, 
              c.name as child_name, 
              u.name as created_by_name
       FROM daily_reports dr
       JOIN children c ON dr.child_id = c.id
       JOIN users u ON dr.created_by = u.id
       WHERE dr.id = $1 AND dr.child_id = $2`,
      [reportId, childId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching daily report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

/**
 * DELETE /api/ai/daily-reports/:reportId
 * Delete a daily report
 */
router.delete("/daily-reports/:reportId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { reportId } = req.params;

    const result = await pool.query(`DELETE FROM daily_reports WHERE id = $1 RETURNING id`, [
      reportId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting daily report:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// ============ ASSESSMENTS ============

/**
 * POST /api/ai/assessments
 * Create a new child assessment with AI analysis
 * Body: {
 *   child_id: number,
 *   age_group: string,
 *   development_area: string,
 *   observations: string,
 *   concerns?: string
 * }
 */
router.post("/assessments", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { child_id, age_group, development_area, observations, concerns } = req.body;
    const educator_id = (req as any).user.id;

    // Validate input
    if (!child_id || !development_area || !observations) {
      return res.status(400).json({
        error: "Missing required fields: child_id, development_area, observations",
      });
    }

    // Get child details
    const childResult = await pool.query("SELECT * FROM children WHERE id = $1", [child_id]);

    if (childResult.rows.length === 0) {
      return res.status(404).json({ error: "Child not found" });
    }

    const child = childResult.rows[0];

    // Prepare AI input
    const aiInput: AssessmentInput = {
      childId: child_id,
      childName: child.name,
      age: child.age,
      ageGroup: age_group || "General",
      developmentArea: development_area,
      observations,
      concerns,
    };

    // Generate AI assessment
    const aiAssessment = await aiService.generateAssessment(aiInput);

    // Log AI request
    await pool.query(
      `INSERT INTO ai_report_requests (child_id, report_type, request_data, response_data, api_provider, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        child_id,
        "assessment",
        JSON.stringify(aiInput),
        JSON.stringify(aiAssessment),
        process.env.AI_PROVIDER || "openai",
        educator_id,
      ]
    );

    // Create assessment record
    const result = await pool.query(
      `INSERT INTO child_assessments 
       (child_id, age_group, development_area, observations, concerns,
        ai_development_level, ai_strengths, ai_areas_for_improvement, ai_recommendations, ai_milestones_achieved, educator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        child_id,
        age_group,
        development_area,
        observations,
        concerns,
        aiAssessment.developmentLevel,
        aiAssessment.strengths,
        aiAssessment.areas_for_improvement,
        aiAssessment.recommendations,
        aiAssessment.milestones_achieved,
        educator_id,
      ]
    );

    // Add to assessment history for tracking progress
    await pool.query(
      `INSERT INTO assessment_history (child_id, assessment_id, development_area, development_level)
       VALUES ($1, $2, $3, $4)`,
      [child_id, result.rows[0].id, development_area, aiAssessment.developmentLevel]
    );

    res.status(201).json({
      message: "Assessment created successfully",
      assessment: result.rows[0],
      ai_analysis: aiAssessment,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);

    // Log failed request
    if ((req as any).user?.id) {
      await pool
        .query(
          `INSERT INTO ai_report_requests (report_type, status, error_message, requested_by, api_provider)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            "assessment",
            "error",
            (error as Error).message,
            (req as any).user.id,
            process.env.AI_PROVIDER || "openai",
          ]
        )
        .catch((err) => console.error("Failed to log error:", err));
    }

    res.status(500).json({ error: "Failed to create assessment" });
  }
});

/**
 * GET /api/ai/assessments/:childId
 * Get all assessments for a child
 * Query params: development_area, limit=10, offset=0
 */
router.get("/assessments/:childId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { childId } = req.params;
    const { development_area } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `SELECT ca.*, c.name as child_name, u.name as educator_name
                 FROM child_assessments ca
                 JOIN children c ON ca.child_id = c.id
                 JOIN users u ON ca.educator_id = u.id
                 WHERE ca.child_id = $1`;
    const params: any[] = [childId];

    if (development_area) {
      query += ` AND ca.development_area = $${params.length + 1}`;
      params.push(development_area);
    }

    query += ` ORDER BY ca.assessment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM child_assessments WHERE child_id = $1${
        development_area ? ` AND development_area = $2` : ""
      }`,
      development_area ? [childId, development_area] : [childId]
    );

    const result = await pool.query(query, params);

    res.json({
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
      assessments: result.rows,
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

/**
 * GET /api/ai/assessment-progress/:childId
 * Get assessment progress over time for a specific development area
 * Query params: development_area, months=6
 */
router.get(
  "/assessment-progress/:childId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      await ensureSchema();

      const { childId } = req.params;
      const { development_area } = req.query;
      const months = parseInt(req.query.months as string) || 6;

      if (!development_area) {
        return res.status(400).json({ error: "development_area query parameter is required" });
      }

      const result = await pool.query(
        `SELECT ah.date, ah.development_level, ah.notes, COUNT(*) as assessment_count
         FROM assessment_history ah
         WHERE ah.child_id = $1 
         AND ah.development_area = $2
         AND ah.date >= CURRENT_DATE - INTERVAL '${months} months'
         GROUP BY ah.date, ah.development_level, ah.notes
         ORDER BY ah.date ASC`,
        [childId, development_area]
      );

      res.json({
        child_id: childId,
        development_area,
        timeframe_months: months,
        progress: result.rows,
      });
    } catch (error) {
      console.error("Error fetching assessment progress:", error);
      res.status(500).json({ error: "Failed to fetch assessment progress" });
    }
  }
);

/**
 * DELETE /api/ai/assessments/:assessmentId
 * Delete an assessment
 */
router.delete("/assessments/:assessmentId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    const { assessmentId } = req.params;

    // Delete assessment (cascade will remove from history)
    const result = await pool.query(
      `DELETE FROM child_assessments WHERE id = $1 RETURNING id`,
      [assessmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    res.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    res.status(500).json({ error: "Failed to delete assessment" });
  }
});

/**
 * GET /api/ai/usage-logs
 * Get AI API usage logs (admin only)
 * Query params: limit=20, offset=0, report_type
 */
router.get("/usage-logs", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    // Check if user is admin
    if ((req as any).user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { report_type } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `SELECT * FROM ai_report_requests`;
    const params: any[] = [];

    if (report_type) {
      query += ` WHERE report_type = $1`;
      params.push(report_type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      total: result.rows.length,
      limit,
      offset,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Error fetching usage logs:", error);
    res.status(500).json({ error: "Failed to fetch usage logs" });
  }
});

/**
 * GET /api/ai/daily-summary-grouped
 * Get all children present today with their daily reports, grouped by group_key
 * Returns: { groupedReports: { [group_key]: [{ child, report }] } }
 */
router.get("/daily-summary-grouped", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureSchema();

    // Get all children who have attendance records for today (checked in or marked absent)
    const result = await pool.query(
      `SELECT c.id, c.name, c.age, c.group_key,
              a.check_in, a.check_out, a.absent_reason,
              dr.id as report_id, dr.activities, dr.meals, dr.supplies, dr.attendance_summary,
              dr.behavior_notes, dr.sleep_notes, dr.incidents,
              dr.ai_summary, dr.ai_highlights, dr.ai_recommendations, dr.ai_areas_of_growth
       FROM children c
       INNER JOIN attendance a ON c.id = a.child_id AND a.date = CURRENT_DATE
       LEFT JOIN daily_reports dr ON c.id = dr.child_id AND dr.date = CURRENT_DATE
       ORDER BY c.group_key ASC, c.name ASC`
    );

    // Group the results by group_key
    const groupedReports: any = {};
    result.rows.forEach((row: any) => {
      const groupKey = row.group_key || "Unassigned";
      if (!groupedReports[groupKey]) {
        groupedReports[groupKey] = [];
      }

      groupedReports[groupKey].push({
        child_id: row.id,
        child_name: row.name,
        child_age: row.age,
        check_in: row.check_in,
        check_out: row.check_out,
        absent_reason: row.absent_reason,
        attendance_summary: row.attendance_summary,
        report_id: row.report_id,
        activities: row.activities || [],
        meals: row.meals || [],
        supplies: row.supplies || [],
        behavior_notes: row.behavior_notes,
        sleep_notes: row.sleep_notes,
        incidents: row.incidents || [],
        ai_summary: row.ai_summary,
        ai_highlights: row.ai_highlights || [],
        ai_recommendations: row.ai_recommendations || [],
        ai_areas_of_growth: row.ai_areas_of_growth || [],
      });
    });

    res.json({
      date: new Date().toISOString().split("T")[0],
      groupedReports,
    });
  } catch (error) {
    console.error("Error fetching daily summary grouped:", error);
    res.status(500).json({ error: "Failed to fetch daily summary", details: (error as Error).message });
  }
});

export default router;
