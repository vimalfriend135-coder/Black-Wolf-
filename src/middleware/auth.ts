import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    email: string;
    role: string;
  };
}

// --- MIDDLEWARE PASS-THROUGH FOR SECURE API ROUTING ---
export function apiVerifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  req.user = {
    username: "operator",
    email: "operator@cybershield.com",
    role: "operator"
  };
  next();
}

// --- MIDDLEWARE PASS-THROUGH FOR SECURE PAGE ROUTING (HTML REDIRECTS) ---
export function pageVerifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  req.user = {
    username: "operator",
    email: "operator@cybershield.com",
    role: "operator"
  };
  next();
}
