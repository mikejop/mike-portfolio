/**
 * migrate-to-yjs.mjs
 * 
 * Script de execução manual única para migrar os textos antigos de áudio e visual
 * da subcoleção `linhas` (plain text) para o novo formato CRDT do Yjs (Tiptap).
 * Ele lê todos os roteiros dentro de `salasRoteiro`, cria um Y.Doc centralizado
 * por roteiro, converte os textos em Y.XmlFragments (padrão Tiptap) e salva
 * o snapshot consolidado em `snapshot/current`.
 *
 * USO:
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/serviceAccountKey.json node scripts/migrate-to-yjs.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import * as Y from 'yjs';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\n❌  Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS não definida.');
    console.error('    Exemplo: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-to-yjs.mjs\n');
    process.exit(1);
}

let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    console.error('\n❌  firebase-admin não encontrado. Instale-o primeiro.\n');
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
} catch (e) {
    console.error('\n❌  Falha ao inicializar o Admin SDK:', e.message);
    process.exit(1);
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

function uint8ArrayToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converte um texto simples (plain text com \n) para a estrutura Y.XmlFragment
 * que o Tiptap + Collaboration espera (parágrafos).
 */
function populateTiptapFragment(fragment, plainText) {
    if (!plainText) {
        // Tiptap sempre precisa de pelo menos um parágrafo vazio
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

async function run() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  MIGRAÇÃO: Textos Plain -> Yjs CRDT (Tiptap)');
    console.log('═══════════════════════════════════════════════════════\n');

    const salasRef = db.collection('salasRoteiro');
    const salasSnap = await salasRef.get();
    
    if (salasSnap.empty) {
        console.log(' Nenhuma sala encontrada em `salasRoteiro`.');
        process.exit(0);
    }

    console.log(`🔍 Encontradas ${salasSnap.size} sala(s).\n`);

    for (const salaDoc of salasSnap.docs) {
        const roomId = salaDoc.id;
        console.log(`📂 Sala: ${roomId}`);

        const roteirosRef = salasRef.doc(roomId).collection('roteiros');
        const roteirosSnap = await roteirosRef.get();

        for (const roteiroDoc of roteirosSnap.docs) {
            const scriptId = roteiroDoc.id;
            console.log(`  📄 Roteiro: ${scriptId}`);

            const linhasRef = roteirosRef.doc(scriptId).collection('linhas');
            const linhasSnap = await linhasRef.get();

            if (linhasSnap.empty) {
                console.log('    ℹ️ Sem linhas. Pulando.');
                continue;
            }

            // Criar um Y.Doc centralizado para este roteiro
            const ydoc = new Y.Doc();
            let takesProcessados = 0;

            // Iterar sobre as linhas (cenas/takes)
            for (const linhaDoc of linhasSnap.docs) {
                const linhaData = linhaDoc.data();
                const takeId = linhaDoc.id;

                // Só takes possuem áudio e visual
                if (linhaData.type === 'take') {
                    const audioText = linhaData.audio?.texto || '';
                    const visualText = linhaData.visual?.texto || '';

                    // Mapear cada campo para um fragmento XML único
                    const audioFragment = ydoc.getXmlFragment(`audio-${takeId}`);
                    populateTiptapFragment(audioFragment, audioText);

                    const visualFragment = ydoc.getXmlFragment(`visual-${takeId}`);
                    populateTiptapFragment(visualFragment, visualText);

                    takesProcessados++;
                }
            }

            if (takesProcessados > 0) {
                // Serializar o estado do Y.Doc para salvar no Firestore
                const stateUpdate = Y.encodeStateAsUpdate(ydoc);
                const base64Data = uint8ArrayToBase64(stateUpdate);

                // O provider usa basePath = salasRoteiro/{roomId}/roteiros/{scriptId} (4 segmentos)
                // O snapshot fica em yjsSnapshots/current
                const snapshotRef = db.doc(`salasRoteiro/${roomId}/roteiros/${scriptId}/yjsSnapshots/current`);
                
                await snapshotRef.set({
                    data: base64Data,
                    updatedAt: FieldValue.serverTimestamp(),
                    _migratedAt: FieldValue.serverTimestamp(),
                    _takesMigrated: takesProcessados
                });

                console.log(`    ✅ Migrados ${takesProcessados} takes para snapshot Yjs.`);
            } else {
                console.log('    ℹ️ Nenhum take encontrado. Pulando.');
            }
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
}

run().catch(err => {
    console.error('\n❌ Erro durante a migração:', err);
    process.exit(1);
});
