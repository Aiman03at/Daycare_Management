# AI Features - Developer Reference Card

Quick reference for developers integrating and maintaining AI features.

---

## 📍 File Locations

```
Backend:
├── src/services/ai.service.ts          # AI provider integration
├── src/db/ai.schema.ts                 # Database schema
├── src/routes/ai.routes.ts             # API endpoints
└── src/app.ts                          # Route registration (UPDATED)

Frontend:
├── src/pages/AIReports.tsx             # Daily reports page
├── src/pages/Assessments.tsx           # Assessments page
└── src/api/client.ts                   # Uses existing client

Config:
├── .env                                # Environment variables
├── .env.example                        # Template
└── tsconfig.json                       # TypeScript config

Documentation:
├── QUICKSTART_AI.md                    # Quick setup (READ THIS FIRST)
├── AI_FEATURES_GUIDE.md                # Full documentation
├── IMPLEMENTATION_SUMMARY.md           # What was added
├── INTEGRATION_CHECKLIST.md            # Step-by-step integration
├── COMPLETE_SETUP.md                   # Full overview
└── test-ai-api.sh                      # API testing examples
```

---

## ⚙️ Environment Variables

### Required
```env
AI_PROVIDER=openai|anthropic|google|mock
AI_API_KEY=sk-xxx (not needed for mock)
```

### Optional
```env
OPENAI_MODEL=gpt-4-turbo (default)
ANTHROPIC_MODEL=claude-3-opus-20240229
GOOGLE_MODEL=gemini-pro
```

---

## 🔌 API Endpoints

### Daily Reports
```
POST   /api/ai/daily-reports
GET    /api/ai/daily-reports/{childId}
GET    /api/ai/daily-reports/{childId}/{reportId}
DELETE /api/ai/daily-reports/{reportId}
```

### Assessments
```
POST   /api/ai/assessments
GET    /api/ai/assessments/{childId}
GET    /api/ai/assessment-progress/{childId}
DELETE /api/ai/assessments/{assessmentId}
```

### Admin
```
GET    /api/ai/usage-logs (admin only)
```

---

## 🗄️ Database Tables

### daily_reports
- Stores daily activity reports with AI analysis
- One per child per day (UNIQUE constraint)
- Includes raw data + AI-generated insights

### child_assessments
- Stores developmental assessments
- Multiple per child over time
- AI-generated development level and recommendations

### assessment_history
- Tracks assessment progress
- For trending/chart visualization
- Links to assessments table

### ai_report_requests
- Audit trail of all AI API calls
- Logs success/errors
- API provider and response times

---

## 🧪 Testing

### Test with Mock Provider
```env
AI_PROVIDER=mock
```
No API key needed, returns sample data.

### Test with Real API
```bash
curl -X POST http://localhost:4000/api/ai/daily-reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child_id":1,"activities":["Drawing"],"meals":["Breakfast"],"behavior_notes":"Good","sleep_notes":"Good"}'
```

### Database Queries
```sql
-- Check latest reports
SELECT * FROM daily_reports ORDER BY created_at DESC LIMIT 10;

-- Check assessments for child
SELECT * FROM child_assessments WHERE child_id = 1;

-- Check failed AI requests
SELECT * FROM ai_report_requests WHERE status = 'error';

-- API usage by provider
SELECT api_provider, COUNT(*) as count, status 
FROM ai_report_requests 
GROUP BY api_provider, status;
```

---

## 🛠️ Common Tasks

### Add New Development Area
File: `src/pages/Assessments.tsx`
```tsx
const developmentAreas = [
  "Physical Development",
  // Add here:
  "Your New Area",
];
```

### Customize AI Prompts
File: `src/services/ai.service.ts`
```tsx
private buildDailyReportPrompt(input: DailyReportInput): string {
  // Edit prompt text here
  return `...`;
}
```

### Change AI Provider
`.env`:
```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-xxx
```

### Switch to Mock (Testing)
`.env`:
```env
AI_PROVIDER=mock
# No API_KEY needed
```

### Add CORS for New Frontend Domain
Backend `src/app.ts`:
```tsx
import cors from 'cors';
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

---

## 🔍 Debugging

### Check Logs
```sql
-- Last 10 errors
SELECT * FROM ai_report_requests 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 10;

-- Latest requests
SELECT * FROM ai_report_requests 
ORDER BY created_at DESC 
LIMIT 20;
```

### Backend Console
```bash
npm run dev
# Look for errors and timestamps
```

### Browser Console
```javascript
// Open DevTools (F12)
// Check Network tab for API calls
// Check Console for JavaScript errors
```

### API Response Format
```json
{
  "message": "Daily report generated successfully",
  "report": {
    "id": 1,
    "child_id": 1,
    "date": "2024-05-09",
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

---

## 📊 Performance Tips

1. **Pagination**: Use `limit` and `offset` for large datasets
   ```
   GET /api/ai/daily-reports/1?limit=10&offset=0
   ```

2. **Filtering**: Use `development_area` query parameter
   ```
   GET /api/ai/assessments/1?development_area=Language%20Development
   ```

3. **Caching**: Store responses in frontend state
   ```tsx
   const [reports, setReports] = useState([]);
   ```

4. **Database Indexes**: Already configured on:
   - child_id + date
   - child_id + assessment_date
   - created_at DESC

---

## 🔐 Security Checklist

- [ ] API key in `.env` (not hardcoded)
- [ ] Never commit `.env` to git
- [ ] JWT tokens required for all endpoints
- [ ] Admin-only access to usage logs
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS in production
- [ ] CORS configured for frontend URL only

---

## 📈 Monitoring

### Track API Usage
```sql
SELECT 
  api_provider,
  report_type,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_sec
FROM ai_report_requests
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY api_provider, report_type;
```

### Monthly Costs Estimation
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as requests,
  COUNT(*) * 0.01 as estimated_cost_usd
FROM ai_report_requests
WHERE status = 'success'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 🚀 Deployment

### Pre-Deployment
- [ ] Run: `npm run build` in backend
- [ ] Run: `npm run build` in frontend
- [ ] Test with production-like data
- [ ] Set production `AI_API_KEY`
- [ ] Set strong `JWT_SECRET`
- [ ] Configure CORS for production domain

### Production Environment Variables
```env
NODE_ENV=production
AI_PROVIDER=openai
AI_API_KEY=sk-production-key
JWT_SECRET=very-strong-secret-key
DATABASE_URL=postgresql://prod:pass@prod-host/db
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Post-Deployment
- [ ] Test reports creation
- [ ] Check database connectivity
- [ ] Verify AI API working
- [ ] Monitor error logs
- [ ] Check response times

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| QUICKSTART_AI.md | 5-minute setup |
| AI_FEATURES_GUIDE.md | Full reference |
| IMPLEMENTATION_SUMMARY.md | What was added |
| INTEGRATION_CHECKLIST.md | Step-by-step |
| COMPLETE_SETUP.md | Full overview |
| test-ai-api.sh | API testing |

---

## 🎯 Features

### Daily Reports
- ✅ Create with AI analysis
- ✅ View summaries, highlights, recommendations
- ✅ Searchable by date
- ✅ One per child per day

### Child Assessments
- ✅ 8 development areas
- ✅ AI evaluates development level
- ✅ Track progress 6+ months
- ✅ Export recommendations

### Data
- ✅ All requests logged
- ✅ Error tracking
- ✅ Usage analytics
- ✅ Audit trail

---

## 💻 Code Examples

### Create Daily Report (Frontend)
```tsx
const response = await client.post('/ai/daily-reports', {
  child_id: 1,
  activities: ["Drawing", "Playing"],
  meals: ["Breakfast", "Snack"],
  behavior_notes: "Good cooperation",
  sleep_notes: "Good nap"
});
```

### Fetch Reports (Frontend)
```tsx
const response = await client.get('/ai/daily-reports/1?limit=10&offset=0');
const reports = response.data.reports;
```

### Create Assessment (Frontend)
```tsx
const response = await client.post('/ai/assessments', {
  child_id: 1,
  development_area: "Language Development",
  observations: "Uses 50+ words, combines phrases",
  age_group: "2-3 years"
});
```

### Get Progress (Frontend)
```tsx
const response = await client.get(
  '/ai/assessment-progress/1?development_area=Language%20Development&months=6'
);
const progress = response.data.progress;
```

---

## 🆘 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| "Module not found: ai.routes" | Restart backend |
| "Invalid API key" | Check .env |
| "CORS error" | Check backend CORS config |
| "Mock data returned" | API key not loaded |
| "Database error" | Check PostgreSQL running |
| "Reports not loading" | Check network tab, auth token |

---

## 📞 Support

- Backend Issues: Check `npm run dev` output
- Frontend Issues: Check F12 console
- Database Issues: Check PostgreSQL connection
- API Issues: Query `ai_report_requests` table
- Documentation: Read QUICKSTART_AI.md

---

**Version**: 1.0  
**Last Updated**: May 2024  
**Status**: Production Ready ✅
