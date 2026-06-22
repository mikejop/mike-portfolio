import fs from 'fs';

const PROJECT_ID = "michael-portfolio-b422a";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAccessToken() {
    try {
        const configPath = '/Users/michaeloliveira/.config/configstore/firebase-tools.json';
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const refreshToken = config.tokens?.refresh_token;
            if (refreshToken) {
                const res = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
                        client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
                        refresh_token: refreshToken,
                        grant_type: 'refresh_token'
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.access_token;
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function run() {
    const token = await getAccessToken();
    if (!token) {
        console.error("No token obtained");
        return;
    }
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`${BASE_URL}/salasRoteiro/5d1e601b-b65c-4b2e-b7f9-503b8c71c573/roteiros`, { headers });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Scripts inside salasRoteiro count:", data.documents?.length || 0);
    if (data.documents) {
        for (const doc of data.documents) {
            console.log("\n--- Script Document ---");
            console.log("Name:", doc.name);
            console.log("Title:", doc.fields?.titulo?.stringValue);
            console.log("OwnerId:", doc.fields?.ownerId?.stringValue);
        }
    }
}

run();
