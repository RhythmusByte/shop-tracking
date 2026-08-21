// Usage: node scripts/hash-password.js "your-password-here"
// Prints a bcrypt hash to put in ADMIN_PASSWORD_HASH. Run this locally,
// never commit the plaintext password anywhere.
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
