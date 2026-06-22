import { execSync } from "child_process";
import fs from "fs";

const PROJECT_ID = "michael-portfolio-b422a";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAccessToken() {
    // Try to read firebase-tools.json
    try {
        const configPath = '/Users/michaeloliveira/.config/configstore/firebase-tools.json';
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const refreshToken = config.tokens?.refresh_token;
            if (refreshToken) {
                console.log("Found Firebase CLI refresh token. Refreshing access token...");
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
                    if (data.access_token) {
                        console.log("Successfully obtained access token using Firebase CLI credentials!");
                        return data.access_token;
                    }
                } else {
                    console.error("Failed to refresh token via API:", await res.text());
                }
            }
        }
    } catch (e) {
        console.error("Error reading/refreshing via firebase-tools config:", e);
    }

    // Fallback to gcloud
    try {
        console.log("Falling back to gcloud auth print-access-token...");
        return execSync('gcloud auth print-access-token').toString().trim();
    } catch (e) {
        console.error("gcloud auth print-access-token failed too.", e);
        throw new Error("Could not authenticate. Please authenticate with firebase or gcloud.");
    }
}

const token = await getAccessToken();

const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
};

function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function fromFirestoreValue(val) {
    if (!val) return null;
    if ('nullValue' in val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('integerValue' in val) return Number(val.integerValue);
    if ('booleanValue' in val) return val.booleanValue;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        return (val.arrayValue.values || []).map(fromFirestoreValue);
    }
    if ('mapValue' in val) {
        const obj = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            obj[k] = fromFirestoreValue(v);
        }
        return obj;
    }
    return null;
}

function documentToJS(doc) {
    const obj = {};
    if (doc.fields) {
        for (const [k, v] of Object.entries(doc.fields)) {
            obj[k] = fromFirestoreValue(v);
        }
    }
    const nameParts = doc.name.split('/');
    obj.id = nameParts[nameParts.length - 1];
    return obj;
}

async function getDoc(path) {
    const res = await fetch(`${BASE_URL}/${path}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to get doc ${path}: ${res.statusText} - ${errText}`);
    }
    const data = await res.json();
    return documentToJS(data);
}

async function listDocs(path) {
    const res = await fetch(`${BASE_URL}/${path}`, { headers });
    if (res.status === 404) return [];
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to list docs ${path}: ${res.statusText} - ${errText}`);
    }
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map(documentToJS);
}

async function setDoc(path, data) {
    const fields = toFirestoreValue(data).mapValue.fields;
    const res = await fetch(`${BASE_URL}/${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to set doc ${path}: ${res.statusText} - ${errText}`);
    }
    return res.json();
}

async function migrate() {
    console.log("Starting migration of shared room scripts using Firestore REST API...");
    
    const rooms = await listDocs("rooms");
    console.log(`Found ${rooms.length} rooms.`);

    for (const room of rooms) {
        const roomId = room.id;
        console.log(`Checking room: ${roomId} (${room.name || 'Sem nome'})`);

        // Get scripts in this room
        const roomScripts = await listDocs(`rooms/${roomId}/roteiros`);
        console.log(`  Room ${roomId} has ${roomScripts.length} scripts.`);

        for (const metadata of roomScripts) {
            const scriptId = metadata.id;
            console.log(`    Migrating script ${scriptId}: "${metadata.titulo}"`);

            // 1. Copy metadata to new path
            const newPath = `salasRoteiro/${roomId}/roteiros/${scriptId}`;
            const existingMeta = await getDoc(newPath);
            if (existingMeta) {
                console.log(`      Script ${scriptId} already migrated. Skipping.`);
                continue;
            }

            // Remove id field before setting
            const metaToSet = { ...metadata };
            delete metaToSet.id;

            await setDoc(newPath, {
                ...metaToSet,
                updatedAt: new Date().toISOString()
            });

            // 2. Fetch and copy versioned content
            const availableVersions = metadata.availableVersions || [1];
            const currentVersion = metadata.currentVersion || 1;
            let latestContent = null;

            for (const version of availableVersions) {
                const oldContentPath = `rooms/${roomId}/roteiros/${scriptId}/content/v${version}`;
                let contentData = await getDoc(oldContentPath);
                
                // Fallback to content/full for v1
                if (!contentData && version === 1) {
                    const fallbackPath = `rooms/${roomId}/roteiros/${scriptId}/content/full`;
                    contentData = await getDoc(fallbackPath);
                }

                if (contentData) {
                    delete contentData.id;
                    const newContentPath = `salasRoteiro/${roomId}/roteiros/${scriptId}/content/v${version}`;
                    await setDoc(newContentPath, contentData);
                    
                    if (version === currentVersion) {
                        latestContent = contentData;
                    }
                }
            }

            // If we didn't find the currentVersion content, let's use the first available one as fallback
            if (!latestContent && availableVersions.length > 0) {
                const firstVersion = availableVersions[0];
                const newContentPath = `salasRoteiro/${roomId}/roteiros/${scriptId}/content/v${firstVersion}`;
                latestContent = await getDoc(newContentPath);
            }

            // 3. Flatten latestContent to flat lines collection
            if (latestContent && latestContent.cenas) {
                console.log(`      Flattening ${latestContent.cenas.length} scenes into lines...`);
                let currentOrdem = 1;
                for (const scene of latestContent.cenas) {
                    // Write scene line
                    const sceneLinePath = `salasRoteiro/${roomId}/roteiros/${scriptId}/linhas/${scene.id}`;
                    await setDoc(sceneLinePath, {
                        type: "scene",
                        ordem: currentOrdem++,
                        titulo: scene.titulo || "Cena Sem Título",
                        criadoEm: new Date().toISOString(),
                        atualizadoEm: new Date().toISOString()
                    });

                    // Write take lines
                    if (scene.takes) {
                        for (const take of scene.takes) {
                            const takeLinePath = `salasRoteiro/${roomId}/roteiros/${scriptId}/linhas/${take.id}`;
                            await setDoc(takeLinePath, {
                                type: "take",
                                ordem: currentOrdem++,
                                audio: {
                                    texto: take.audio || "",
                                    editedBy: take.editedBy || null,
                                    editedAt: take.editedBy ? new Date().toISOString() : null,
                                    lock: { userId: null, userName: null, lockedAt: null }
                                },
                                visual: {
                                    texto: take.visual || "",
                                    editedBy: take.editedBy || null,
                                    editedAt: take.editedBy ? new Date().toISOString() : null,
                                    lock: { userId: null, userName: null, lockedAt: null }
                                },
                                imagemRef: take.imagemRef || "",
                                imageScale: take.imageScale || 1,
                                imageX: take.imageX || 0,
                                imageY: take.imageY || 0,
                                flipX: take.flipX || false,
                                flipY: take.flipY || false,
                                audioAuthors: take.audioAuthors || [],
                                visualAuthors: take.visualAuthors || [],
                                criadoEm: new Date().toISOString(),
                                atualizadoEm: new Date().toISOString()
                            });
                        }
                    }
                }
            } else {
                console.log(`      Warning: No content found for script ${scriptId}`);
            }
        }
    }
    console.log("Migration complete!");
}

migrate().catch(err => {
    console.error("Migration failed:", err);
});
