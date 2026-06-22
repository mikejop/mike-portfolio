import { initializeApp, refreshToken } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import os from "os";

const configPath = path.join(os.homedir(), ".config/configstore/firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const token = config.tokens.refresh_token;

// Write a temporary credential file
const tempCredPath = path.join(os.tmpdir() || ".", "temp-firebase-cred.json");
fs.writeFileSync(tempCredPath, JSON.stringify({
    client_id: config.user.azp,
    client_secret: "MWG4345S24sJgdBjo10As23d",
    refresh_token: token,
    type: "authorized_user"
}));

console.log("Found refresh token. Initializing admin...");
try {
    initializeApp({
        credential: refreshToken(tempCredPath),
        projectId: "michael-portfolio-b422a"
    });

    const db = getFirestore();
    const snap = await db.collection("rooms").get();
    console.log("Successfully connected. Rooms count:", snap.size);
} catch (e) {
    console.error("Connection failed:", e);
} finally {
    try { fs.unlinkSync(tempCredPath); } catch (e) {}
}
