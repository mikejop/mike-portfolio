import * as Y from 'yjs';
import fs from 'fs';
import { execSync } from 'child_process';

const PROJECT_ID = "michael-portfolio-b422a";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val: any): any {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
        const fields: any = {};
        for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function fromFirestoreValue(val: any): any {
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
        const obj: any = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            obj[k] = fromFirestoreValue(v);
        }
        return obj;
    }
    return null;
}

function documentToJS(doc: any): any {
    const obj: any = {};
    if (doc.fields) {
        for (const [k, v] of Object.entries(doc.fields)) {
            obj[k] = fromFirestoreValue(v);
        }
    }
    const nameParts = doc.name.split('/');
    obj.id = nameParts[nameParts.length - 1];
    return obj;
}

async function getAccessToken(): Promise<string | null> {
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
        console.error("Error reading token:", e);
    }
    // Fallback to gcloud
    try {
        return execSync('gcloud auth print-access-token').toString().trim();
    } catch (e) {
        return null;
    }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
}

function populateTiptapFragment(fragment: Y.XmlFragment, plainText: string) {
    if (!plainText) {
        const p = new Y.XmlElement('p');
        fragment.insert(0, [p]);
        return;
    }

    const paragraphs = plainText.split('\n');
    const elements = paragraphs.map(text => {
        const p = new Y.XmlElement('p');
        if (text.length > 0) {
            const yText = new Y.XmlText(text);
            p.insert(0, [yText]);
        }
        return p;
    });

    fragment.insert(0, elements);
}

// Configuração do Dry Run
const dryRun = process.env.DRY_RUN !== 'false' && !process.argv.includes('--run');

async function run() {
    console.log('================================================================');
    console.log(`MIGRAÇÃO DE ROTEIROS PARA O FORMATO YJS (REST API)`);
    console.log(`DryRun = ${dryRun}`);
    console.log(`Timestamp de Referência: ${new Date().toISOString()}`);
    console.log('================================================================\n');

    const token = await getAccessToken();
    if (!token) {
        console.error('❌ Falha ao obter access token para o Firebase/Gcloud.');
        process.exit(1);
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    // Obter todas as salas da coleção 'rooms'
    const roomsRes = await fetch(`${BASE_URL}/rooms`, { headers });
    if (!roomsRes.ok) {
        console.error('❌ Falha ao listar salas:', await roomsRes.text());
        process.exit(1);
    }
    const roomsData = await roomsRes.json();
    const rooms = (roomsData.documents || []).map(documentToJS);

    if (rooms.length === 0) {
        console.log('❌ Nenhuma sala encontrada.');
        return;
    }

    let totalRoteiros = 0;
    let totalTakes = 0;
    let totalWrites = 0;

    for (const room of rooms) {
        const roomId = room.id;
        
        // Listar roteiros por sala
        const roteirosRes = await fetch(`${BASE_URL}/salasRoteiro/${roomId}/roteiros`, { headers });
        if (!roteirosRes.ok) continue;
        const roteirosData = await roteirosRes.json();
        const roteiros = (roteirosData.documents || []).map(documentToJS);

        for (const roteiro of roteiros) {
            const scriptId = roteiro.id;
            const title = roteiro.titulo || 'Sem Título';

            // Listar linhas
            const linesRes = await fetch(`${BASE_URL}/salasRoteiro/${roomId}/roteiros/${scriptId}/linhas?pageSize=1000`, { headers });
            if (!linesRes.ok) continue;
            const linesData = await linesRes.json();
            const lines = (linesData.documents || []).map(documentToJS);

            const takeDocs = lines.filter((l: any) => l.type === 'take');
            if (takeDocs.length === 0) continue;

            totalRoteiros++;
            console.log(`📂 Sala: ${roomId} | Roteiro: ${scriptId} ("${title}") | Tomadas: ${takeDocs.length}`);

            let takeIndex = 0;
            for (const takeData of takeDocs) {
                const takeId = takeData.id;
                takeIndex++;
                totalTakes++;

                console.log(`  -> Migrando take ${takeIndex}/${takeDocs.length} (ID: ${takeId})...`);

                // 1. Processar campo de Audio
                const audioText = typeof takeData.audio === 'string'
                    ? takeData.audio
                    : (takeData.audio?.texto || '');
                
                const audioDoc = new Y.Doc();
                const audioFragment = audioDoc.getXmlFragment('default');
                populateTiptapFragment(audioFragment, audioText);
                const audioUpdate = Y.encodeStateAsUpdate(audioDoc);
                const audioBase64 = uint8ArrayToBase64(audioUpdate);

                // 2. Processar campo Visual
                const visualText = typeof takeData.visual === 'string'
                    ? takeData.visual
                    : (takeData.visual?.texto || '');
                
                const visualDoc = new Y.Doc();
                const visualFragment = visualDoc.getXmlFragment('default');
                populateTiptapFragment(visualFragment, visualText);
                const visualUpdate = Y.encodeStateAsUpdate(visualDoc);
                const visualBase64 = uint8ArrayToBase64(visualUpdate);

                const audioPath = `salasRoteiro/${roomId}/roteiros/${scriptId}/linhas_yjs/${takeId}/campos/audio/snapshot/current`;
                const visualPath = `salasRoteiro/${roomId}/roteiros/${scriptId}/linhas_yjs/${takeId}/campos/visual/snapshot/current`;

                if (dryRun) {
                    console.log(`    [DRY RUN] Simulação de escrita:`);
                    console.log(`      - Audio (Tam: ${audioBase64.length}) -> ${audioPath}`);
                    console.log(`      - Visual (Tam: ${visualBase64.length}) -> ${visualPath}`);
                } else {
                    const writeDoc = async (path: string, base64: string) => {
                        const fields = toFirestoreValue({
                            state: base64,
                            updatedAt: { timestampValue: new Date().toISOString() } // Custom conversion or let PATCH handle it
                        }).mapValue.fields;
                        
                        // We use query parameter currentDocument.exists=false to create, or just overwrite
                        const res = await fetch(`${BASE_URL}/${path}`, {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ fields })
                        });
                        if (!res.ok) {
                            console.error(`❌ Falha ao gravar snapshot em ${path}:`, await res.text());
                        } else {
                            totalWrites++;
                        }
                    };

                    await writeDoc(audioPath, audioBase64);
                    await writeDoc(visualPath, visualBase64);
                }
            }
        }
    }

    console.log('\n================================================================');
    console.log('MIGRAÇÃO CONCLUÍDA');
    console.log(`  Total de Roteiros Processados: ${totalRoteiros}`);
    console.log(`  Total de Takes Processados: ${totalTakes}`);
    if (!dryRun) {
        console.log(`  Total de Snapshots Gravados no Firestore: ${totalWrites}`);
    } else {
        console.log('  [DRY RUN] Nenhuma gravação real foi feita no banco.');
    }
    console.log('================================================================');
}

run().catch(err => {
    console.error('❌ Erro durante a execução da migração:', err);
});
