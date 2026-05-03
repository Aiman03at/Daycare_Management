# 🏫 Little Haven - Daycare Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue?logo=react)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2+-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-green)](LICENSE)

> **A comprehensive, modern daycare management system built with React and Express.js that streamlines daily operations, child care tracking, and parent communications.**

---

## 🌟 Key Features

### 👨‍👩‍👧‍👦 **Child Management**
- Complete child profiles with photos and personal information
- Age group classification (Toddlers, Preschoolers, Kindergarten)
- Parent contact information and relationships
- Real-time child status tracking
- Searchable directory

### 📋 **Attendance Tracking**
- Daily check-in/check-out system
- Attendance roster with real-time updates
- Absence tracking with reasons
- Historical attendance reports
- Quick attendance summary dashboard

### 🍽️ **Meal & Nutrition Tracking**
- Daily meal logging for each child
- Meal photo uploads with progress tracking
- Meal status tracking (ate all, most, some, refused)
- Dietary notes and allergies
- Monthly nutrition reports
- Per-child and group meal summaries

### 📸 **Activity Documentation**
- Activity logging with descriptions
- Photo uploads and galleries
- Activity-child relationship tracking
- Educational activity documentation
- Developmental milestone recording
- Activity templates for frequent entries

### 🏥 **Health & Safety**
- Health records management
- Incident/accident documentation
- Sleep tracking and nap schedules
- Toilet training progress
- Allergy and dietary requirement tracking
- Health alerts and notifications

### 📢 **Communications**
- Staff announcements and bulletin board
- Parent notifications
- Activity sharing with parents
- Important updates and alerts

### 🔐 **Role-Based Access Control**
- **Admin**: Full system access, staff management
- **Educator/Staff**: Daily operations, child tracking
- **Parent**: View child activities and updates
- Secure JWT authentication
- Password hashing with bcryptjs

### 📊 **Dashboard & Analytics**
- Activity summary overview
- Attendance statistics
- Child count by age group
- Recent activities feed
- Quick action buttons

---

## 🛠️ Tech Stack

### **Frontend**
- **React 19** - Modern UI library with Hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **React Router v7** - Client-side routing
- **PostCSS** - CSS transformations

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js 5.2** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### **Development Tools**
- **ts-node-dev** - TypeScript development server
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixes

---

## 📁 Project Structure

```
Day_Care_Management_System/
│
├── daycare-backend/                    # Express.js Server
│   ├── src/
│   │   ├── app.ts                     # Express app setup
│   │   ├── server.ts                  # Server entry point
│   │   ├── db/                        # Database configuration
│   │   ├── config/                    # Environment config
│   │   ├── middleware/                # Auth, error handling
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── role.ts               # Role-based access
│   │   │   └── error.middleware.ts   # Error handling
│   │   ├── routes/                    # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── children.routes.ts
│   │   │   ├── attendance.route.ts
│   │   │   ├── activities.routes.ts
│   │   │   ├── meals.routes.ts
│   │   │   ├── announcements.routes.ts
│   │   │   └── ...
│   │   └── services/                  # Business logic
│   ├── scripts/
│   │   └── seed-activities.js         # Database seeding
│   ├── uploads/                       # File storage
│   │   ├── activities/
│   │   ├── children/
│   │   └── meals/
│   ├── package.json
│   └── tsconfig.json
│
├── daycare-frontend/                   # React Application
│   ├── src/
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Main component
│   │   ├── pages/                     # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Children.tsx
│   │   │   ├── Activities.tsx
│   │   │   ├── Meals.tsx
│   │   │   ├── Health.tsx
│   │   │   ├── Incidents.tsx
│   │   │   ├── Sleep.tsx
│   │   │   ├── Supplies.tsx
│   │   │   ├── Toilets.tsx
│   │   │   └── AddNew.tsx
│   │   ├── components/                # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── api/                       # API client
│   │   │   └── client.ts
│   │   ├── auth/                      # Auth utilities
│   │   │   └── session.ts
│   │   ├── data/                      # Constants & types
│   │   │   ├── ageGroups.ts
│   │   │   └── careRecords.ts
│   │   ├── routes/                    # Route protection
│   │   │   └── ProtectedRoutes.tsx
│   │   └── assets/
│   ├── public/                        # Static files
│   │   └── kids-assets/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                          # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20 or higher
- **npm** or **yarn**
- **PostgreSQL** 14 or higher
- **Git**

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Day_Care_Management_System
```

#### 2. Setup Backend

```bash
cd daycare-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your database credentials and JWT secret
```

**Environment Variables (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/daycare_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=4000
```

#### 3. Setup Database

```bash
# Create PostgreSQL database
createdb daycare_db

# Tables are created automatically on first server start
```

#### 4. Setup Frontend

```bash
cd ../daycare-frontend

# Install dependencies
npm install

# Create .env file (if needed)
cp .env.example .env
```

#### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd daycare-backend
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd daycare-frontend
npm run dev
# Application runs on http://localhost:5173
```

---

## 📚 API Endpoints

### **Authentication**
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login user
```

### **Children Management**
```
GET    /api/children             Get all children
GET    /api/children/:id         Get child by ID
POST   /api/children             Create new child
PUT    /api/children/:id         Update child
DELETE /api/children/:id         Delete child
```

### **Attendance**
```
GET    /api/attendance/roster    Get daily roster
POST   /api/attendance/checkin   Check-in child
POST   /api/attendance/checkout  Check-out child
GET    /api/attendance           Get attendance history
```

### **Activities**
```
GET    /api/activities           Get all activities
GET    /api/activities/:id       Get activity by ID
POST   /api/activities           Create activity
PUT    /api/activities/:id       Update activity
DELETE /api/activities/:id       Delete activity
```

### **Meals**
```
GET    /api/meals                Get all meals
POST   /api/meals                Log meal with photo
DELETE /api/meals/:id            Delete meal
```

### **Health & Care**
```
GET    /api/health               Get health records
POST   /api/health               Add health record
GET    /api/incidents            Get incidents
POST   /api/incidents            Report incident
GET    /api/sleep                Get sleep records
POST   /api/sleep                Log sleep time
GET    /api/toilets              Get toilet records
POST   /api/toilets              Log toilet activity
```

### **Communications**
```
GET    /api/announcements        Get announcements
POST   /api/announcements        Create announcement
DELETE /api/announcements/:id    Delete announcement
```

---

## 🔑 Features in Detail

### 📊 Dashboard
- Quick overview of all activities
- Today's attendance summary
- Recent activities feed
- Quick access to common tasks
- Child count by age group

### 👶 Child Profiles
- Complete personal information
- Parent/guardian details
- Contact information
- Age group assignment
- Photo upload
- Searchable directory

### ✅ Attendance System
- Real-time check-in/check-out
- Absence tracking with reasons
- Historical records
- Quick roster view
- Attendance reports

### 🎨 Activities
- Activity documentation
- Photo uploads
- Educational content tracking
- Multiple children per activity
- Activity templates
- Progress tracking

### 🥗 Nutrition Tracking
- Daily meal logging
- Photo documentation
- Dietary preferences
- Allergy tracking
- Meal status (ate all/most/some/refused)
- Notes for parents

### 🏥 Health & Safety
- Health record management
- Incident documentation
- Allergy alerts
- Sleep/nap tracking
- Toilet training progress
- Important reminders

### 📢 Announcements
- Staff bulletin board
- Important announcements
- Parent notifications
- Activity updates

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **Role-Based Access Control** - Admin, Educator, Parent roles
- ✅ **CORS Protection** - Configured origin restrictions
- ✅ **Input Validation** - Server-side validation
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Environment Variables** - Sensitive data protection

---

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 4000 is in use
lsof -i :4000

# Check database connection
psql -U user -d daycare_db -c "SELECT 1"
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Issues
```bash
# Reset database
dropdb daycare_db
createdb daycare_db
npm run dev  # Tables recreate automatically
```

---

## 📝 Development Workflow

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Use meaningful variable names
- Add comments for complex logic

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
```

### Build & Deploy

**Frontend Build:**
```bash
cd daycare-frontend
npm run build
# Output: dist/
```

**Backend Production:**
```bash
cd daycare-backend
NODE_ENV=production npm start
```

---

## 🙏 Acknowledgments

- Built with ❤️ for daycare centers
- Inspired by modern childcare practices
- Thanks to the open-source community

---

## 📞 Quick Links

- **Repository**: [GitHub Repository](https://github.com)
- **Issues**: [Report an Issue](https://github.com/issues)
- **Documentation**: [Full Docs](https://docs.littlehaven.com)
- **Website**: [littlehaven.com](https://littlehaven.com)

---

<div align="center">

**Made with ❤️ by the Little Haven Team**


</div>
