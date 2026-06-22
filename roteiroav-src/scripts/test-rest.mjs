import fs from "fs";
import path from "path";
import os from "os";

const configPath = path.join(os.homedir(), ".config/configstore/firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const token = config.tokens.access_token;

const PROJECT_ID = "michael-portfolio-b422a";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
};

console.log("Fetching rooms using REST API...");
try {
    const res = await fetch(`${BASE_URL}/rooms`, { headers });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 1000));
} catch (e) {
    console.error("Fetch failed:", e);
}
