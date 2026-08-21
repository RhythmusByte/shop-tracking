import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "store_tracker_session";

if (!JWT_SECRET) {
  // Fail loudly at import time rather than silently issuing insecure tokens.
  throw new Error("JWT_SECRET is not set in environment variables");
}

export function signSession() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
