# AI-Powered Daily Reports & Child Assessments

## Overview

This document describes the AI-powered daily reports and child assessments features integrated into the Day Care Management System. These features leverage external AI APIs to provide intelligent analysis of child development and daily activities.

---

## Features

### 1. **Daily Reports**
Generate comprehensive daily activity reports with AI analysis:
- Activities performed during the day
- Meals and snacks consumed
- Behavior observations
- Sleep and rest time notes
- Incidents or concerns
- AI-generated summaries, highlights, recommendations, and areas of growth

### 2. **Child Assessments**
Create formative assessments across developmental domains:
- Physical Development
- Cognitive Development
- Language Development
- Social-Emotional Development
- Creative Development
- Independence & Self-Care
- Fine Motor Skills
- Gross Motor Skills

Each assessment generates:
- Development level (On track, Advanced, Needs support)
- Identified strengths
- Areas for improvement
- Specific recommendations
- Milestones achieved

### 3. **Progress Tracking**
- Track assessment progress over time (6+ months)
- View historical development level changes
- Identify trends and patterns

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd daycare-backend
npm install
```

The AI service requires no additional packages beyond what's already in `package.json`.

### Step 2: Configure Environment Variables

Create a `.env` file in the `daycare-backend` directory. Copy from `.env.example`:

```bash
cp .env.example .env
```

Update with your AI provider details:

#### **Option A: Using OpenAI (Recommended)**

1. Get an API key from [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Update `.env`:
```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key-here
```

#### **Option B: Using Anthropic (Claude)**

1. Get an API key from [Anthropic Console](https://console.anthropic.com)
2. Update `.env`:
```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your-anthropic-api-key-here
```

#### **Option C: Using Google Gemini**

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `.env`:
```env
AI_PROVIDER=google
AI_API_KEY=your-google-gemini-api-key-here
```

#### **Option D: Mock Provider (Testing/Development)**

If you want to test without API keys:
```env
AI_PROVIDER=mock
```

This uses pre-built responses for development/testing.

### Step 3: Initialize Database Schema

The AI schema is automatically initialized on the first API call to any AI endpoint. No manual migration is needed.

To manually verify the schema:
```bash
npm run dev
# Make a request to /api/ai/daily-reports or /api/ai/assessments
```

---

## API Endpoints

### Daily Reports

#### Create Report
```http
POST /api/ai/daily-reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "child_id": 1,
  "activities": ["Drawing", "Playing outside", "Story time"],
  "meals": ["Breakfast: Oatmeal", "Snack: Fruit", "Lunch: Sandwich"],
  "behavior_notes": "Very cooperative today, interacted well with peers",
  "sleep_notes": "Good 2-hour nap after lunch",
  "incidents": [],
  "educator_notes": "Great day overall!"
}
```

**Response:**
```json
{
  "message": "Daily report generated successfully",
  "report": {
    "id": 1,
    "child_id": 1,
    "date": "2024-05-09",
    "activities": ["Drawing", "Playing outside", "Story time"],
    "ai_summary": "...",
    "ai_highlights": ["..."],
    "ai_recommendations": ["..."],
    "ai_areas_of_growth": ["..."]
  },
  "ai_analysis": {
    "summary": "...",
    "highlights": ["..."],
    "recommendations": ["..."],
    "areas_of_growth": ["..."]
  }
}
```

#### Get Reports for Child
```http
GET /api/ai/daily-reports/{childId}?limit=10&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total": 25,
  "limit": 10,
  "offset": 0,
  "reports": [...]
}
```

#### Get Specific Report
```http
GET /api/ai/daily-reports/{childId}/{reportId}
Authorization: Bearer {token}
```

#### Delete Report
```http
DELETE /api/ai/daily-reports/{reportId}
Authorization: Bearer {token}
```

### Assessments

#### Create Assessment
```http
POST /api/ai/assessments
Authorization: Bearer {token}
Content-Type: application/json

{
  "child_id": 1,
  "age_group": "2-3 years",
  "development_area": "Language Development",
  "observations": "Child uses 50+ words, combines 2-word phrases, follows 2-step directions",
  "concerns": "Sometimes struggles with pronunciation of certain sounds"
}
```

**Response:**
```json
{
  "message": "Assessment created successfully",
  "assessment": {
    "id": 1,
    "child_id": 1,
    "development_area": "Language Development",
    "assessment_date": "2024-05-09",
    "ai_development_level": "On track",
    "ai_strengths": ["..."],
    "ai_areas_for_improvement": ["..."],
    "ai_recommendations": ["..."],
    "ai_milestones_achieved": ["..."]
  },
  "ai_analysis": {...}
}
```

#### Get Assessments for Child
```http
GET /api/ai/assessments/{childId}?development_area=Language%20Development&limit=10&offset=0
Authorization: Bearer {token}
```

#### Get Assessment Progress
```http
GET /api/ai/assessment-progress/{childId}?development_area=Language%20Development&months=6
Authorization: Bearer {token}
```

**Response:**
```json
{
  "child_id": 1,
  "development_area": "Language Development",
  "timeframe_months": 6,
  "progress": [
    {
      "date": "2024-03-09",
      "development_level": "Needs support"
    },
    {
      "date": "2024-04-09",
      "development_level": "On track"
    },
    {
      "date": "2024-05-09",
      "development_level": "On track"
    }
  ]
}
```

#### Delete Assessment
```http
DELETE /api/ai/assessments/{assessmentId}
Authorization: Bearer {token}
```

#### Get AI Usage Logs (Admin Only)
```http
GET /api/ai/usage-logs?report_type=daily_report&limit=20&offset=0
Authorization: Bearer {admin_token}
```

---

## Frontend Integration

### Daily Reports Page

Located in: `src/pages/AIReports.tsx`

Features:
- Select a child
- Create new daily reports with form
- AI automatically analyzes the data
- Display reports with AI-generated insights
- View highlights, recommendations, and growth areas

### Assessments Page

Located in: `src/pages/Assessments.tsx`

Features:
- Select a child
- Create new assessments for different development areas
- View AI development level
- Track progress over time
- View strengths, improvements, and milestones

### Add to Navigation

Update your `Navigation` or `Sidebar` component to include links:

```tsx
<Link to="/ai-reports">Daily Reports</Link>
<Link to="/assessments">Child Assessments</Link>
```

Update your router configuration in `routes.tsx`:

```tsx
import AIReports from "../pages/AIReports";
import Assessments from "../pages/Assessments";

// In your routes array:
{ path: "/ai-reports", element: <AIReports /> },
{ path: "/assessments", element: <Assessments /> },
```

---

## How It Works

### Architecture

```
Frontend (React)
    ↓
Backend API Routes (/api/ai/...)
    ↓
AI Service Layer (aiService)
    ↓
External AI Provider (OpenAI / Anthropic / Google)
    ↓
AI Response
    ↓
Database Storage
    ↓
Frontend Display
```

### Data Flow

1. **Educator Input**: Educator enters daily activities, observations, or assessment data via frontend
2. **Backend Processing**: Backend receives request, validates data, and formats for AI
3. **AI Generation**: External AI API generates analysis based on input
4. **Database Storage**: Results stored in PostgreSQL with audit trail
5. **Frontend Display**: Formatted results displayed to educator/parent

### Fallback Mechanism

If the external AI API fails:
- System logs the error
- Returns mock AI response (for testing)
- Educator can retry the request
- Detailed error logged in `ai_report_requests` table

---

## Database Schema

### daily_reports

```sql
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id),
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
```

### child_assessments

```sql
CREATE TABLE child_assessments (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id),
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
```

### assessment_history

```sql
CREATE TABLE assessment_history (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id),
  assessment_id INTEGER REFERENCES child_assessments(id),
  development_area VARCHAR(100) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  development_level VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ai_report_requests

```sql
CREATE TABLE ai_report_requests (
  id SERIAL PRIMARY KEY,
  child_id INTEGER REFERENCES children(id),
  report_type VARCHAR(50) NOT NULL,
  request_data JSONB,
  response_data JSONB,
  api_provider VARCHAR(50),
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  requested_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Cost Estimation

### API Usage & Pricing

**OpenAI (GPT-4-turbo)**:
- ~$0.01 per daily report
- ~$0.01 per assessment
- Estimated monthly (1000 reports/assessments): $20

**Anthropic (Claude-3)**:
- ~$0.01 per daily report
- ~$0.01 per assessment
- Estimated monthly (1000 reports/assessments): $15-20

**Google Gemini (Free tier or paid)**:
- Free tier: 60 requests/minute, 1500 requests/day
- Estimated monthly: $0-30 depending on usage

### Database

PostgreSQL storage is minimal:
- ~1KB per report
- ~2KB per assessment
- Estimated storage for 10,000 reports/assessments: 30MB

---

## Best Practices

### 1. Input Quality
- Provide detailed, specific observations
- Include concrete examples from the day
- Use consistent terminology
- Avoid vague descriptions

### 2. Privacy & Security
- Never include personal health information beyond general wellbeing
- AI API calls are logged for audit purposes
- Keep API keys secure (never commit to version control)
- Use HTTPS for all API communication

### 3. Frequency
- Create one daily report per child per day
- Conduct formal assessments monthly or quarterly
- Track progress over time for meaningful insights

### 4. Interpretation
- Use AI insights as supplementary, not definitive
- Combine with professional expertise
- Share with parents/guardians appropriately
- Document follow-ups and action items

---

## Troubleshooting

### API Key Issues

**Error**: "Invalid API key"
- Verify API key is correct
- Check it's in the right format for the provider
- Ensure it hasn't been revoked/regenerated

**Error**: "Rate limit exceeded"
- Wait a few seconds before retrying
- Consider batching requests
- Upgrade API plan if needed

### Database Issues

**Error**: "Schema initialization failed"
- Ensure PostgreSQL is running
- Check database user has permissions
- Verify DATABASE_URL is correct

**Error**: "UNIQUE constraint violation for child_id, date"
- Report already exists for this child today
- Use PUT to update instead of POST
- Or use different date if needed

### Frontend Issues

**Reports/Assessments not displaying**
- Check API token is valid
- Verify browser console for errors
- Ensure child exists in database
- Check CORS configuration

---

## Future Enhancements

1. **Export Reports**: PDF/Word document generation
2. **Email Notifications**: Send reports to parents automatically
3. **Trends Dashboard**: Visual analytics of child development
4. **Batch Operations**: Create multiple reports/assessments at once
5. **AI Customization**: Fine-tune prompts for specific populations
6. **Multi-language Support**: Generate reports in different languages
7. **Photo Integration**: Include activity photos in reports
8. **Milestone Tracking**: Automated milestone achievement detection

---

## Support & Resources

### Documentation Links
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Google Gemini Docs](https://ai.google.dev)

### Getting Help
- Check error logs in database: `SELECT * FROM ai_report_requests WHERE status = 'error'`
- Review backend logs for detailed error messages
- Test with mock provider first before using real APIs

---

**Version**: 1.0  
**Last Updated**: May 2024
