
import express from "express";
import dotenv from "dotenv";
import "./db/index";
import cors from "cors";
import path from "path";
import childRoutes, { ensureChildrenSchema } from "./routes/children.routes";
import authRoutes, { ensureUsersSchema } from "./routes/auth.routes";
import attendanceRoutes, { ensureAttendanceSchema } from "./routes/attendance.route";
import announcementRoutes from "./routes/announcements.routes";
import activitiesRoutes from "./routes/activities.routes";
import mealsRoutes from "./routes/meals.routes";
import toiletsRoutes, { ensureToiletsSchema } from "./routes/toilets.routes";
import incidentsRoutes, { ensureIncidentsSchema } from "./routes/incidents.routes";
import healthRoutes, { ensureHealthSchema } from "./routes/health.routes";
import sleepRoutes, { ensureSleepSchema } from "./routes/sleep.routes";
import suppliesRoutes, { ensureSuppliesSchema } from "./routes/supplies.routes";
import messagesRoutes, { ensureMessagesSchema } from "./routes/messages.routes";
import aiRoutes from "./routes/ai.routes";
import { initializeAISchema } from "./db/ai.schema";
dotenv.config();



const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://daycare-management-lake.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/children", childRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/toilets", toiletsRoutes);
app.use("/api/incidents", incidentsRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/supplies", suppliesRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/ai", aiRoutes);
app.get("/", (_, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await ensureUsersSchema();
    await ensureChildrenSchema();
    await ensureAttendanceSchema();
    await ensureToiletsSchema();
    await ensureIncidentsSchema();
    await ensureHealthSchema();
    await ensureSleepSchema();
    await ensureSuppliesSchema();
    await ensureMessagesSchema();
    await initializeAISchema();
  } catch (err) {
    console.error("Error ensuring schema:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

export default app;
