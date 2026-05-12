import pool from "../db";

/**
 * Database schema setup for AI Reports and Assessments
 * Run this on server startup to ensure tables exist
 */

export const initializeAISchema = async () => {
  try {
    // Daily Reports Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        activities TEXT[] DEFAULT '{}',
        meals TEXT[] DEFAULT '{}',
        behavior_notes TEXT,
        sleep_notes TEXT,
        incidents TEXT[],
        educator_notes TEXT,
        ai_summary TEXT,
        ai_highlights TEXT[],
        ai_recommendations TEXT[],
        ai_areas_of_growth TEXT[],
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(child_id, date)
      );
    `);

    // Child Assessments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS child_assessments (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        age_group VARCHAR(50),
        assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        development_area VARCHAR(100) NOT NULL,
        observations TEXT NOT NULL,
        concerns TEXT,
        ai_development_level VARCHAR(50),
        ai_strengths TEXT[],
        ai_areas_for_improvement TEXT[],
        ai_recommendations TEXT[],
        ai_milestones_achieved TEXT[],
        educator_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Assessment History (for tracking progress over time)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_history (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        assessment_id INTEGER REFERENCES child_assessments(id) ON DELETE CASCADE,
        development_area VARCHAR(100) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        development_level VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // AI Report Requests Log (for audit trail and API usage tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_report_requests (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        report_type VARCHAR(50) NOT NULL,
        request_data JSONB,
        response_data JSONB,
        api_provider VARCHAR(50),
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        requested_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_daily_reports_child_date 
       ON daily_reports(child_id, date DESC)`
    );

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_assessments_child_date 
       ON child_assessments(child_id, assessment_date DESC)`
    );

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_assessment_history_child 
       ON assessment_history(child_id, development_area, date DESC)`
    );

    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_ai_requests_created 
       ON ai_report_requests(created_at DESC)`
    );

    console.log("✅ AI Schema initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing AI Schema:", error);
    throw error;
  }
};
