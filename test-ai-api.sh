#!/bin/bash

# AI Features - Example cURL Commands
# Copy and paste these commands to test the AI APIs

# ============ SETUP ============
# Replace these values:
API_URL="http://localhost:4000"
TOKEN="your-jwt-token-here"
CHILD_ID="1"

# ============ HELPER FUNCTION ============
# Usage: api_call METHOD ENDPOINT DATA
# Example: api_call POST "/api/ai/daily-reports" '{"child_id":1,...}'

# ============ DAILY REPORTS ============

echo "=== CREATE DAILY REPORT ==="
curl -X POST "$API_URL/api/ai/daily-reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "activities": ["Drawing with markers", "Playing with blocks", "Story time"],
    "meals": ["Breakfast: Oatmeal with berries", "Snack: Apple slices", "Lunch: Chicken sandwich"],
    "behavior_notes": "Very cooperative today, played nicely with other children during free play",
    "sleep_notes": "Good 2-hour nap after lunch, woke up happy",
    "incidents": [],
    "educator_notes": "Great day! Very engaged and happy"
  }' | jq .

echo -e "\n=== GET DAILY REPORTS FOR CHILD ==="
curl -X GET "$API_URL/api/ai/daily-reports/1?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== GET SPECIFIC DAILY REPORT ==="
# Replace 1 with actual report ID
curl -X GET "$API_URL/api/ai/daily-reports/1/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== DELETE DAILY REPORT ==="
# Replace 1 with actual report ID
curl -X DELETE "$API_URL/api/ai/daily-reports/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# ============ ASSESSMENTS ============

echo -e "\n=== CREATE ASSESSMENT ==="
curl -X POST "$API_URL/api/ai/assessments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "age_group": "2-3 years",
    "development_area": "Language Development",
    "observations": "Child uses 50+ words, combines 2-word phrases, follows 2-step directions. Says their name when asked. Enjoys singing and can repeat simple songs.",
    "concerns": "Sometimes stutters on certain words but seems to be reducing. May need to monitor pronunciation."
  }' | jq .

echo -e "\n=== GET ASSESSMENTS FOR CHILD ==="
curl -X GET "$API_URL/api/ai/assessments/1?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== GET ASSESSMENTS FOR SPECIFIC DEVELOPMENT AREA ==="
curl -X GET "$API_URL/api/ai/assessments/1?development_area=Language%20Development&limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== GET ASSESSMENT PROGRESS (TRACK OVER 6 MONTHS) ==="
curl -X GET "$API_URL/api/ai/assessment-progress/1?development_area=Language%20Development&months=6" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== DELETE ASSESSMENT ==="
# Replace 1 with actual assessment ID
curl -X DELETE "$API_URL/api/ai/assessments/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# ============ ADMIN - USAGE LOGS ============

echo -e "\n=== GET AI USAGE LOGS (ADMIN ONLY) ==="
curl -X GET "$API_URL/api/ai/usage-logs?report_type=daily_report&limit=20&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== GET ALL USAGE LOGS (ADMIN ONLY) ==="
curl -X GET "$API_URL/api/ai/usage-logs?limit=50&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .

# ============ DATABASE QUERIES ============

echo -e "\n=== DATABASE: CHECK DAILY REPORTS ==="
cat << 'SQL'
SELECT 
  id, 
  child_id, 
  date, 
  ai_summary, 
  created_at 
FROM daily_reports 
ORDER BY created_at DESC 
LIMIT 10;
SQL

echo -e "\n=== DATABASE: CHECK ASSESSMENTS ==="
cat << 'SQL'
SELECT 
  id, 
  child_id, 
  development_area, 
  ai_development_level, 
  created_at 
FROM child_assessments 
ORDER BY created_at DESC 
LIMIT 10;
SQL

echo -e "\n=== DATABASE: CHECK ASSESSMENT PROGRESS ==="
cat << 'SQL'
SELECT 
  date, 
  development_area, 
  development_level 
FROM assessment_history 
WHERE child_id = 1 
ORDER BY date DESC 
LIMIT 10;
SQL

echo -e "\n=== DATABASE: CHECK AI REQUEST LOGS ==="
cat << 'SQL'
SELECT 
  id,
  report_type, 
  api_provider, 
  status, 
  error_message, 
  created_at 
FROM ai_report_requests 
ORDER BY created_at DESC 
LIMIT 10;
SQL

# ============ VARIATIONS ============

echo -e "\n=== CREATE ASSESSMENT - COGNITIVE DEVELOPMENT ==="
curl -X POST "$API_URL/api/ai/assessments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "age_group": "2-3 years",
    "development_area": "Cognitive Development",
    "observations": "Child can sort objects by color, count to 5, recognizes familiar people in photos. Shows problem-solving skills with simple puzzles.",
    "concerns": "None observed at this time"
  }' | jq .

echo -e "\n=== CREATE ASSESSMENT - SOCIAL-EMOTIONAL DEVELOPMENT ==="
curl -X POST "$API_URL/api/ai/assessments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "age_group": "2-3 years",
    "development_area": "Social-Emotional Development",
    "observations": "Child shows empathy when peers cry, plays alongside other children, beginning parallel play. Follows simple rules and routines. Shows excitement about activities.",
    "concerns": "Sometimes resistant to transitions between activities"
  }' | jq .

echo -e "\n=== CREATE DAILY REPORT - WITH INCIDENTS ==="
curl -X POST "$API_URL/api/ai/daily-reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "activities": ["Painting", "Sand play", "Music time"],
    "meals": ["Breakfast: Toast and jam", "Snack: Crackers and cheese", "Lunch: Pasta"],
    "behavior_notes": "Generally good behavior, some minor conflicts during toy sharing",
    "sleep_notes": "Napped for 1.5 hours",
    "incidents": ["Minor bump during outside play - no injury"],
    "educator_notes": "Normal day with one small incident"
  }' | jq .

# ============ ADVANCED QUERIES ============

echo -e "\n=== ADVANCED: DATABASE - CHILD PROGRESS SUMMARY ==="
cat << 'SQL'
SELECT 
  ca.development_area,
  ca.ai_development_level as latest_level,
  COUNT(*) as total_assessments,
  MAX(ca.assessment_date) as last_assessment
FROM child_assessments ca
WHERE ca.child_id = 1
GROUP BY ca.development_area
ORDER BY ca.development_area;
SQL

echo -e "\n=== ADVANCED: DATABASE - MONTHLY REPORT COUNT ==="
cat << 'SQL'
SELECT 
  DATE_TRUNC('month', date)::date as month,
  COUNT(*) as reports_created
FROM daily_reports
WHERE child_id = 1
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;
SQL

echo -e "\n=== ADVANCED: DATABASE - API USAGE BY PROVIDER ==="
cat << 'SQL'
SELECT 
  api_provider,
  report_type,
  COUNT(*) as requests,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
FROM ai_report_requests
GROUP BY api_provider, report_type
ORDER BY requests DESC;
SQL

# ============ NOTES ============
cat << 'NOTES'

IMPORTANT NOTES:

1. Replace "your-jwt-token-here" with an actual JWT token from login
   - Get token from /auth/login endpoint
   - Include in "Authorization: Bearer {token}" header

2. Make sure backend is running:
   cd daycare-backend
   npm run dev

3. Set environment variable in .env:
   AI_PROVIDER=openai
   AI_API_KEY=sk-your-key-here

4. Use 'jq' for pretty JSON output (install with: brew install jq)
   - Without jq, curl output will be on one line

5. For database queries:
   - Connect to PostgreSQL: psql -d daycare
   - Paste the SQL query at the prompt
   - Exit with \q

6. Test with mock provider first (no API key needed):
   AI_PROVIDER=mock

7. Common HTTP Status Codes:
   - 200/201: Success
   - 400: Bad request (check required fields)
   - 401: Unauthorized (check token)
   - 404: Not found (check IDs)
   - 500: Server error (check backend logs)

EXAMPLE TOKEN WORKFLOW:

1. Login to get token:
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'

2. Copy the returned token

3. Use in Authorization header for subsequent requests

EXAMPLE FULL WORKFLOW:

1. Create a daily report
2. Get the report
3. Create an assessment
4. Get the assessment
5. Track progress over 6 months
6. View admin usage logs

START HERE:
1. Set TOKEN variable at top of this file
2. Run: ./test-ai-api.sh (or bash test-ai-api.sh)
3. Or copy individual curl commands and paste in terminal

NOTES
