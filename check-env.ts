import { config } from "dotenv";
config({ path: ".env.local" });

const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
let privateKey = "";
if (privateKeyB64) {
  privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
}

console.log("projectId:", !!process.env.FIREBASE_ADMIN_PROJECT_ID);
console.log("clientEmail:", !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log("privateKey length:", privateKey.length);
console.log("Condition met:", !!(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey));
