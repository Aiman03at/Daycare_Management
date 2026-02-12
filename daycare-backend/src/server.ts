
import express from "express";
import dotenv from "dotenv";
import "./db/index";
import childRoutes from "./routes/child.rotes";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/children", childRoutes);

app.get("/", (_, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});