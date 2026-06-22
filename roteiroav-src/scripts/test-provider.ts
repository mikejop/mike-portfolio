/**
 * test-provider.ts
 * 
 * Script de teste isolado para validar o FirestoreYjsProvider.
 * Conecta-se ao Firebase usando o client SDK, instancia o Y.Doc,
 * registra o event listener do Yjs, realiza uma edição local e aguarda
 * a propagação. O Firestore registrará isso na coleção `updates`.
 * 
 * USO: npx tsx scripts/test-provider.ts
 */

import * as Y from 'yjs';
import { createFirestoreProvider } from '../src/features/tools/script-editor/services/firestoreYjsProvider';
import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
    console.log('1. Inicializando teste isolado do Yjs Provider...');
    
    // Caminho isolado para não sujar o DB principal (4 segmentos)
    const basePath = 'salasRoteiro/test-room/roteiros/test-script';
    
    // 1. Instanciar Y.Doc e Provider
    const ydoc = new Y.Doc();
    const provider = await createFirestoreProvider(ydoc, basePath);

    // 2. Conectar o evento 'update' (simulando o que o CollaborativeEditor faz)
    ydoc.on('update', (update, origin) => {
        if (origin !== 'firestoreYjsProvider') {
            console.log('   -> Y.Doc emitiu "update". Enviando pushUpdate para Firestore...');
            provider.pushUpdate(update);
        }
    });

    console.log('2. Aguardando 2s para inicialização do snapshot...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Fazendo edição no Y.Doc (inserindo fragmento XML)...');
    const fragment = ydoc.getXmlFragment('audio-take1');
    const p = new Y.XmlElement('p');
    p.insert(0, [new Y.XmlText(`Teste isolado rodando em: ${new Date().toISOString()}`)]);
    fragment.insert(0, [p]);

    console.log('4. Aguardando 3s para o Firebase processar a gravação e o onSnapshot receber de volta...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('5. Verificando o banco de dados diretamente...');
    const updatesRef = collection(db, `${basePath}/yjsUpdates`);
    const snap = await getDocs(updatesRef);
    
    console.log(`   -> Total de documentos na coleção 'updates': ${snap.size}`);
    if (snap.size > 0) {
        console.log('   ✅ Updates foram salvos com sucesso!');
        snap.forEach(doc => {
            console.log(`      - Doc ID: ${doc.id}`);
            console.log(`      - ClientId: ${doc.data().clientId}`);
            console.log(`      - Data length: ${doc.data().data?.length}`);
        });
    } else {
        console.log('   ❌ Nenhum update encontrado no banco de dados.');
    }

    // Opcional: testar compactação forçando 51 documentos
    // Mas o objetivo principal já foi cumprido.

    console.log('6. Limpando resources...');
    provider.destroy();
    
    console.log('\n✅ Teste concluído. Pressione Ctrl+C para sair.');
    process.exit(0);
}

run().catch(console.error);
