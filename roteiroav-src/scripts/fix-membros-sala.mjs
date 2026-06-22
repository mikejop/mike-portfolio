/**
 * fix-membros-sala.mjs
 * 
 * Script de execução manual única para adicionar um usuário ao array memberIds
 * e ao mapa members de uma sala colaborativa no Firestore.
 *
 * USO:
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/serviceAccountKey.json node scripts/fix-membros-sala.mjs
 *
 * NÃO importar este arquivo no app. NÃO commitar a service account key.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ─── Validação de variável de ambiente ──────────────────────────────────────
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\n❌  Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS não definida.');
    console.error('    Defina-a apontando para o arquivo JSON da service account:');
    console.error('    GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/serviceAccountKey.json node scripts/fix-membros-sala.mjs\n');
    process.exit(1);
}

// ─── Importação do Admin SDK ────────────────────────────────────────────────
let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    console.error('\n❌  firebase-admin não encontrado. Instale com:');
    console.error('    npm install firebase-admin\n');
    process.exit(1);
}

// ─── Configuração ───────────────────────────────────────────────────────────
const TARGET_EMAIL = 'contato@michaeloliveira.online';
const ROOM_ID = '5d1e601b-b65c-4b2e-b7f9-503b8c71c573';
const PERMISSION = 'editor';

// ─── Inicialização ──────────────────────────────────────────────────────────
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
} catch (e) {
    console.error('\n❌  Falha ao inicializar o Admin SDK.');
    console.error('    Verifique se o arquivo apontado por GOOGLE_APPLICATION_CREDENTIALS é válido.');
    console.error(`    Erro: ${e.message}\n`);
    process.exit(1);
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function run() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  fix-membros-sala.mjs — Adicionar membro à sala');
    console.log('═══════════════════════════════════════════════════════\n');

    // ── 1. Buscar UID do usuário por e-mail ─────────────────────────────
    console.log(`🔍  Buscando usuário: ${TARGET_EMAIL}`);
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.error(`\n❌  Usuário ${TARGET_EMAIL} NÃO existe no Firebase Auth.`);
            console.error('    Abortando. Não será criado um usuário novo.\n');
        } else {
            console.error(`\n❌  Erro ao buscar usuário: ${e.message}\n`);
        }
        process.exit(1);
    }

    const uid = userRecord.uid;
    const displayName = userRecord.displayName || TARGET_EMAIL.split('@')[0];
    console.log(`✅  Encontrado — UID: ${uid}  |  Display Name: ${displayName}\n`);

    // ── 2. Atualizar rooms/{roomId} (OBRIGATÓRIO — usado pelas rules) ───
    console.log('───────────────────────────────────────────────────────');
    console.log(`📂  rooms/${ROOM_ID}`);
    console.log('───────────────────────────────────────────────────────');

    const roomRef = db.collection('rooms').doc(ROOM_ID);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
        console.error(`\n❌  Documento rooms/${ROOM_ID} NÃO existe no Firestore.`);
        console.error('    Verifique se o ROOM_ID está correto.\n');
        process.exit(1);
    }

    const roomData = roomSnap.data();
    const memberIdsBefore = roomData.memberIds || [];
    const membersBefore = Object.keys(roomData.members || {});

    console.log(`    memberIds ANTES:  [${memberIdsBefore.join(', ')}]`);
    console.log(`    members   ANTES:  [${membersBefore.join(', ')}]\n`);

    if (memberIdsBefore.includes(uid)) {
        console.log(`    ⚠️  UID ${uid} já está em memberIds — pulando arrayUnion.`);
    } else {
        console.log(`    ➕  Adicionando ${uid} a memberIds...`);
    }

    // Sempre garantir que o mapa members tenha a entrada com permission
    const memberEntry = {
        uid: uid,
        email: TARGET_EMAIL,
        displayName: displayName,
        permission: PERMISSION,
        joinedAt: new Date().toISOString()
    };

    await roomRef.update({
        memberIds: FieldValue.arrayUnion(uid),
        [`members.${uid}`]: memberEntry
    });

    // Reler para confirmar
    const roomAfter = (await roomRef.get()).data();
    const memberIdsAfter = roomAfter.memberIds || [];
    const membersAfter = Object.keys(roomAfter.members || {});

    console.log(`\n    memberIds DEPOIS: [${memberIdsAfter.join(', ')}]`);
    console.log(`    members   DEPOIS: [${membersAfter.join(', ')}]`);
    console.log('    ✅  rooms/ atualizado com sucesso.\n');

    // ── 3. Atualizar salasRoteiro/{roomId} (por consistência, se existir) ─
    console.log('───────────────────────────────────────────────────────');
    console.log(`📂  salasRoteiro/${ROOM_ID}`);
    console.log('───────────────────────────────────────────────────────');

    const salaRef = db.collection('salasRoteiro').doc(ROOM_ID);
    const salaSnap = await salaRef.get();

    if (!salaSnap.exists) {
        console.log('    ℹ️  Documento salasRoteiro/ não existe — ok, regra usa rooms/.');
        console.log('    Nenhuma ação necessária aqui.\n');
    } else {
        const salaData = salaSnap.data();

        if (!salaData.memberIds) {
            console.log('    ℹ️  Campo memberIds não encontrado em salasRoteiro — ok, regra usa rooms/.');
        } else {
            const salaMembersBefore = salaData.memberIds || [];
            console.log(`    memberIds ANTES:  [${salaMembersBefore.join(', ')}]`);

            if (salaMembersBefore.includes(uid)) {
                console.log(`    ⚠️  UID ${uid} já está presente — pulando.`);
            } else {
                await salaRef.update({
                    memberIds: FieldValue.arrayUnion(uid)
                });
                console.log(`    ➕  Adicionado ${uid} a memberIds.`);
            }

            const salaAfter = (await salaRef.get()).data();
            console.log(`    memberIds DEPOIS: [${(salaAfter.memberIds || []).join(', ')}]`);
        }
        console.log('    ✅  salasRoteiro/ processado.\n');
    }

    // ── 4. Resumo final ─────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════');
    console.log('  RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Usuário:    ${TARGET_EMAIL}`);
    console.log(`  UID:        ${uid}`);
    console.log(`  Permissão:  ${PERMISSION}`);
    console.log(`  Sala:       ${ROOM_ID}`);
    console.log(`  memberIds:  [${memberIdsAfter.join(', ')}]`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅  Concluído com sucesso.\n');

    process.exit(0);
}

run().catch((err) => {
    console.error(`\n❌  Erro inesperado: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
