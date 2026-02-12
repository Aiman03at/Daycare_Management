

import "./db/index"; // Ensure DB connection is established before starting the app
import express from "express";
import { errorHandler } from "./middleware/error.middleware"; 





const app = express();

app.use(express.json());
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

