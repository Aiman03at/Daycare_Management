import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (String(req.user?.role || "").toLowerCase() !== "admin")
    return res.status(403).json({ message: "Admins only" });

  next();
};
