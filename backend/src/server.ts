import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { Server } from "socket.io";
import { config } from "./config/config";
import { connectDatabase } from "./config/database";
import { authenticate } from "./middleware/auth";
import User from "./models/User";
import authRoutes from "./routes/auth";
import calendarRoutes from "./routes/calendar";
import oauthRoutes from "./routes/oauth";
import ruleRoutes from "./routes/rules";
import settingsRoutes from "./routes/settings";
import { monitorAllUsersEmails } from "./services/emailMonitorService";
import logger from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.frontendUrl || "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on("authenticate", async (token: string) => {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        socket.emit("auth-error", { message: "User not found" });
        return;
      }

      const userSpecificRoom = `user_${user._id.toString()}`;
      socket.join(userSpecificRoom);
      socket.emit("authenticated", { room: userSpecificRoom });
      logger.info(`Socket ${socket.id} joined room ${userSpecificRoom}`);
    } catch (error: unknown) {
      logger.error(`Socket authentication failed for ${socket.id}:`, error);
      socket.emit("auth-error", { message: "Authentication failed" });
    }
  });

  socket.on("disconnect", () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

export { io };

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
  // Poll every 2 minutes to process unread emails for users with automation enabled.
  cron.schedule("*/2 * * * *", async () => {
    try {
      await monitorAllUsersEmails();
    } catch (error: unknown) {
      logger.error("Scheduled email monitor failed:", error);
    }
  });

  logger.info("Scheduled email monitor started (every 2 minutes)");

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
