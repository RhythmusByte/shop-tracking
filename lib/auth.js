import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "store_tracker_session";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

// Session payload carries the user's id, username, and role so API routes
// can enforce admin-only actions without a DB round trip on every request.
export function signSession(user) {
  return jwt.sign(
    { sub: String(user._id), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Reads and verifies the session cookie from a Next.js API route request.
// Returns the decoded payload ({ sub, username, role }) or null.
export function getSession(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };
