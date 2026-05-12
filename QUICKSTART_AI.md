# AI Features Quick Start Guide

Get AI-powered daily reports and child assessments running in 5 minutes!

## Prerequisites
- ✅ Backend running (Node.js, Express, TypeScript)
- ✅ PostgreSQL database
- ✅ One of: OpenAI API key, Anthropic API key, or Google Gemini API key

## Quick Setup

### 1. Get an API Key (Choose One)

**OpenAI** (Recommended - most reliable):
- Go to https://platform.openai.com/api-keys
- Create new secret key
- Copy the key

**Anthropic** (Claude - great quality):
- Go to https://console.anthropic.com
- Create API key
- Copy the key

**Google Gemini** (Free tier available):
- Go to https://makersuite.google.com/app/apikey
- Create API key
- Copy the key

### 2. Configure Environment

In `daycare-backend/.env`:

```env
# Database (keep your existing config)
DATABASE_URL=postgresql://user:password@localhost:5432/daycare

# Add these lines:
AI_PROVIDER=openai
AI_API_KEY=sk-your-key-here
```

Replace `sk-your-key-here` with your actual API key.

### 3. Restart Backend

```bash
cd daycare-backend
npm run dev
```

Schema is automatically created on first use.

### 4. Add Frontend Routes

Edit `daycare-frontend/src/App.tsx` or your main router file:

```tsx
import AIReports from "./pages/AIReports";
import Assessments from "./pages/Assessments";

// In your Routes component:
<Route path="/ai-reports" element={<AIReports />} />
<Route path="/assessments" element={<Assessments />} />
```

Add to navigation:
```tsx
<Link to="/ai-reports">Daily Reports</Link>
<Link to="/assessments">Assessments</Link>
```

### 5. Test It!

1. Start backend: `npm run dev` (in daycare-backend)
2. Start frontend: `npm run dev` (in daycare-frontend)
3. Navigate to `/ai-reports`
4. Select a child
5. Fill in the form and click "Generate AI Report"

✅ Done!

---

## Using the Features

### Daily Reports

1. Go to Daily Reports page
2. Select a child
3. Click "Create New Report"
4. Fill in:
   - Activities (add multiple)
   - Meals/Snacks
   - Behavior notes
   - Sleep notes
5. Click "Generate AI Report"
6. AI generates summary, highlights, recommendations, growth areas

### Child Assessments

1. Go to Assessments page
2. Select a child
3. Click "New Assessment"
4. Select development area (e.g., Language Development)
5. Write observations
6. Click "Generate Assessment"
7. View:
   - Development level
   - Strengths
   - Areas for improvement
   - Recommendations
   - Milestones achieved

---

## Endpoints Reference

### Create Daily Report
```bash
curl -X POST http://localhost:4000/api/ai/daily-reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "activities": ["Drawing", "Playing"],
    "meals": ["Breakfast", "Snack"],
    "behavior_notes": "Good cooperation",
    "sleep_notes": "Good nap"
  }'
```

### Get Daily Reports
```bash
curl http://localhost:4000/api/ai/daily-reports/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Assessment
```bash
curl -X POST http://localhost:4000/api/ai/assessments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "development_area": "Language Development",
    "observations": "Speaks in 2-3 word sentences",
    "age_group": "2-3 years"
  }'
```

### Get Assessments
```bash
curl http://localhost:4000/api/ai/assessments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### "Invalid API key"
- Double-check your API key in `.env`
- Make sure there are no extra spaces
- Verify key hasn't been revoked

### "Module not found: ai.routes"
- Make sure `src/routes/ai.routes.ts` exists
- Restart backend server
- Check for TypeScript compile errors

### Reports showing mock data
- Backend defaulting to mock provider
- Verify `AI_API_KEY` is set in `.env`
- Check backend console for error messages
- Try with a real API key

### Database error
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check user has permissions

---

## Development Mode

To use mock AI (no API key needed):

```env
AI_PROVIDER=mock
# No need for AI_API_KEY
```

Returns realistic sample responses for testing UI/UX.

---

## Production Deployment

Before deploying:

1. ✅ Set real `AI_API_KEY` in production environment
2. ✅ Use strong `JWT_SECRET`
3. ✅ Set `NODE_ENV=production`
4. ✅ Configure `FRONTEND_URL` for CORS
5. ✅ Use managed PostgreSQL
6. ✅ Set up monitoring for API usage
7. ✅ Review cost implications (see AI_FEATURES_GUIDE.md)

---

## Next Steps

- 📖 Read [AI_FEATURES_GUIDE.md](./AI_FEATURES_GUIDE.md) for detailed documentation
- 🔧 Customize AI prompts in `src/services/ai.service.ts`
- 📊 Track AI usage in `ai_report_requests` table
- 🚀 Deploy to production
- 📝 Create reports for your children!

---

**Need help?** Check the error logs:
```sql
SELECT * FROM ai_report_requests WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;
```

This shows the last 5 failed AI requests with error messages.
