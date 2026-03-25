import { Router } from "express";
import { googleLogin, login, register } from "../controllers/authController";
import { getGoogleLoginAuthUrl } from "../services/googleService";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google/login", (req, res) => {
  const authUrl = getGoogleLoginAuthUrl();
  res.json({ authUrl });
});


router.post("/google/callback",googleLogin);

export default router;
