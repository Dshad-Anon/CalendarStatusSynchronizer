import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/database";
import { authenticate } from "./middleware/auth";
import authRoutes from "./routes/auth";
import calendarRoutes from "./routes/calendar";
import oauthRoutes from "./routes/oauth";
import ruleRoutes from "./routes/rule";
import settingsRoutes from "./routes/settings";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/test/protected", authenticate, (req: any, res) => {
  res.json({ message: "Access granted to protected route", userId: req.userId });
});
// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
