

import "./db/index";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";
import aiRoutes from "./routes/ai.routes";

const app = express();

// CORS — must be before all routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://daycare-management-lake.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// rest of your code...

// AI Routes
app.use("/api/ai", aiRoutes);

app.use(errorHandler);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Daycare Backend is running!"
  });
});




//Error Handling Middleware
app.use((_req, _res, next) => {
  const error = new Error("Not Found");
  (error as any).statusCode = 404;
  next(error);  

});

export default app;

