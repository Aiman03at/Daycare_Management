# Integration Checklist - Step by Step

This document shows the exact steps to integrate AI features into your existing project.

---

## Step 1: Backend Setup ✅ (DONE)

### Files Created:
- ✅ `daycare-backend/src/services/ai.service.ts`
- ✅ `daycare-backend/src/db/ai.schema.ts`
- ✅ `daycare-backend/src/routes/ai.routes.ts`

### Files Updated:
- ✅ `daycare-backend/src/app.ts` (AI routes imported and registered)

---

## Step 2: Environment Configuration

### Action: Update `.env`

**File**: `daycare-backend/.env`

Add these lines:

```env
# ============ AI Configuration ============
# Choose one: openai, anthropic, google, mock
AI_PROVIDER=openai

# Get your API key from:
# OpenAI: https://platform.openai.com/api-keys
# Anthropic: https://console.anthropic.com
# Google: https://makersuite.google.com/app/apikey
AI_API_KEY=sk-your-api-key-here
```

**Complete `.env` Example**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/daycare
PORT=4000
JWT_SECRET=your-secret-key
NODE_ENV=development
BACKEND_URL=http://localhost:4000
AI_PROVIDER=openai
AI_API_KEY=sk-your-key-here
FRONTEND_URL=http://localhost:5173
```

---

## Step 3: Frontend Pages ✅ (DONE)

### Files Created:
- ✅ `daycare-frontend/src/pages/AIReports.tsx`
- ✅ `daycare-frontend/src/pages/Assessments.tsx`

---

## Step 4: Frontend Routing

### Action: Add Routes to Your App

**Option A: If using React Router v6**

File: `daycare-frontend/src/App.tsx` (or `routes.tsx`)

```tsx
import AIReports from "./pages/AIReports";
import Assessments from "./pages/Assessments";

// Add these routes:
<Route path="/ai-reports" element={<AIReports />} />
<Route path="/assessments" element={<Assessments />} />
```

**Option B: If using different routing pattern**

Ensure the routes are accessible:
- `/ai-reports` → `AIReports` component
- `/assessments` → `Assessments` component

---

## Step 5: Navigation/Menu Updates

### Action: Add Menu Links

**If you have a Navigation/Sidebar component:**

```tsx
// In your navigation component
<Link to="/ai-reports">
  <span>Daily Reports</span>
</Link>

<Link to="/assessments">
  <span>Child Assessments</span>
</Link>
```

**Or if you have a menu array:**

```tsx
const menuItems = [
  { label: "Daily Reports", path: "/ai-reports" },
  { label: "Assessments", path: "/assessments" },
  // ... other items
];
```

---

## Step 6: Backend Restart

### Action: Restart Backend Server

```bash
cd daycare-backend
npm run dev
```

**Expected Output:**
```
✅ PostgreSQL Connected
Server running on port 4000
```

On first API call, the schema auto-initializes:
```
✅ AI Schema initialized successfully
```

---

## Step 7: Frontend Startup

### Action: Restart Frontend Server

```bash
cd daycare-frontend
npm run dev
```

**Expected Output:**
```
VITE v... ready in ... ms
Local: http://localhost:5173/
```

---

## Step 8: Testing

### Quick Test Checklist

```bash
# 1. Open browser to http://localhost:5173

# 2. Navigate to Daily Reports
# Expected: Page loads with child selector

# 3. Select a child
# Expected: Empty reports list

# 4. Click "Create New Report"
# Expected: Form appears

# 5. Fill form with sample data
# Expected: Form accepts input

# 6. Click "Generate AI Report"
# Expected: 
#   - Loading indicator appears (2-5 seconds)
#   - AI summary displayed
#   - Highlights listed
#   - Recommendations shown
#   - No errors in console

# 7. Navigate to Assessments
# Expected: Page loads similar to reports

# 8. Create an assessment
# Expected: AI-generated assessment appears
```

---

## Step 9: Database Verification

### Verify Tables Created

**Using PostgreSQL CLI:**

```bash
psql -d daycare
```

**Check tables exist:**
```sql
\dt daily_reports
\dt child_assessments
\dt assessment_history
\dt ai_report_requests
```

**Expected Output:**
```
                    List of relations
 Schema |         Name         | Type  |  Owner
--------+----------------------+-------+---------
 public | daily_reports        | table | user
 public | child_assessments    | table | user
 public | assessment_history   | table | user
 public | ai_report_requests   | table | user
```

**Check sample data:**
```sql
SELECT * FROM daily_reports LIMIT 5;
SELECT * FROM child_assessments LIMIT 5;
```

---

## Step 10: Test API with cURL

### Test Daily Report Endpoint

```bash
# Get JWT token first
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq .token

# Copy the token, then test:
TOKEN="your-token-here"

curl -X POST http://localhost:4000/api/ai/daily-reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_id": 1,
    "activities": ["Drawing"],
    "meals": ["Breakfast"],
    "behavior_notes": "Good",
    "sleep_notes": "Good nap"
  }' | jq .
```

**Expected Response:**
```json
{
  "message": "Daily report generated successfully",
  "report": { ... },
  "ai_analysis": { ... }
}
```

---

## Step 11: Monitor Logs

### Check AI Request Log

**In PostgreSQL:**
```sql
SELECT * FROM ai_report_requests 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected columns:**
- id, child_id, report_type, status, api_provider, created_at

---

## Final Verification Checklist

### Backend
- [ ] `npm run dev` starts without errors
- [ ] API responds to `/health` endpoint
- [ ] Database connection successful
- [ ] No TypeScript compilation errors
- [ ] AI routes registered at `/api/ai/*`

### Frontend
- [ ] `npm run dev` starts without errors
- [ ] Routes `/ai-reports` and `/assessments` accessible
- [ ] Navigation links visible
- [ ] Forms render correctly
- [ ] No console errors

### Integration
- [ ] Can create a daily report via UI
- [ ] AI API responds within 5 seconds
- [ ] Report appears in list
- [ ] Can create an assessment
- [ ] Assessment progress can be viewed
- [ ] Database records created
- [ ] No errors in backend logs

### API
- [ ] POST `/api/ai/daily-reports` works
- [ ] GET `/api/ai/daily-reports/{childId}` works
- [ ] POST `/api/ai/assessments` works
- [ ] GET `/api/ai/assessments/{childId}` works
- [ ] GET `/api/ai/assessment-progress/{childId}` works
- [ ] All endpoints require authentication

---

## Troubleshooting During Integration

### Issue: Module not found error
**Solution**: Restart backend TypeScript compiler
```bash
npm run dev
```

### Issue: API key not recognized
**Solution**: 
1. Stop backend
2. Update .env
3. Restart backend
4. Check console for "✅ AI Schema initialized"

### Issue: Frontend can't connect to backend
**Solution**: 
1. Verify BACKEND_URL in api client
2. Check CORS configuration
3. Ensure both running on correct ports

### Issue: Reports showing mock data
**Solution**: 
1. Verify `AI_API_KEY` is set in .env
2. Verify `AI_PROVIDER` is set correctly
3. Restart backend
4. Check error logs: `SELECT * FROM ai_report_requests WHERE status = 'error'`

### Issue: Database tables not created
**Solution**: 
1. First API call auto-creates tables
2. Or manually run schema:
```bash
cd daycare-backend
node -e "require('./dist/db/ai.schema').initializeAISchema().then(() => process.exit(0))"
```

---

## Post-Integration Configuration

### Customize AI Prompts

**File**: `daycare-backend/src/services/ai.service.ts`

Look for `buildDailyReportPrompt()` and `buildAssessmentPrompt()` methods. Edit the prompt text to customize AI behavior.

### Add More Development Areas

**File**: `daycare-frontend/src/pages/Assessments.tsx`

Look for `developmentAreas` array and add new areas:
```tsx
const developmentAreas = [
  "Physical Development",
  "Cognitive Development",
  "Language Development",
  // Add more here
  "Your Custom Area",
];
```

### Customize Email Notifications (Optional)

Coming in future update. Currently only database storage.

---

## Support Resources

📖 **Full Documentation**: `AI_FEATURES_GUIDE.md`
⚡ **Quick Start**: `QUICKSTART_AI.md`
🔧 **API Examples**: `test-ai-api.sh`
📋 **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`

---

## Deployment Steps

### 1. Prepare Production Environment

```bash
# Build backend
cd daycare-backend
npm run build

# Build frontend  
cd daycare-frontend
npm run build
```

### 2. Set Production Environment Variables

```env
NODE_ENV=production
AI_PROVIDER=openai
AI_API_KEY=sk-production-key-here
JWT_SECRET=strong-production-secret
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/daycare_prod
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 3. Deploy Backend
- Upload dist/ folder to server
- Start with: `NODE_ENV=production npm start`

### 4. Deploy Frontend
- Upload dist/ folder to web server or CDN
- Update API endpoints to production URL

### 5. Verify Production
- Test reports creation
- Check AI responses
- Monitor API usage
- Review error logs

---

## You're All Set! 🎉

All integration steps are complete. Your Day Care Management System now has:

✅ AI-powered daily reports  
✅ Child assessments with development tracking  
✅ Multi-provider AI support  
✅ Production-ready infrastructure  
✅ Comprehensive documentation  

**Start creating reports now!**

---

**Questions or issues?** Check the documentation files or review the inline code comments.
