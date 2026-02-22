
import express from "express";
import dotenv from "dotenv";
import "./db/index";
import cors from "cors";
import childRoutes from "./routes/children.routes";
import authRoutes from "./routes/auth.routes";
dotenv.config();



const app = express();

app.use(cors({
  origin: "http://localhost:5173", // 👈 your frontend URL
  credentials: true,
}));

app.use(express.json());
app.use("/api/children", childRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;