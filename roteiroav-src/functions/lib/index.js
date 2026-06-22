"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletarProjeto = exports.salvarProjeto = exports.gerarUrlAssinada = exports.validarUpload = exports.seedEquipments = exports.assessRecaptcha = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("firebase-functions/v2/storage");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const https = __importStar(require("https"));
const equipments_1 = require("./equipments");
admin.initializeApp();
const recaptchaApiKey = (0, params_1.defineSecret)('RECAPTCHA_API_KEY');
const PROJECT_ID = 'budgetapp-ab10a';
const SITE_KEY = '6Lcpy68sAAAAADS_K4IP6WX7fNfRjy5SGF2QOL4N';
const MIN_SCORE = 0.5;
function postAssessment(apiKey, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'recaptchaenterprise.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/assessments?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error(`Resposta inválida da API: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
exports.assessRecaptcha = (0, https_1.onCall)({ secrets: [recaptchaApiKey], region: 'us-east1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login necessário.');
    }
    const { token, expectedAction } = request.data;
    if (!token || typeof token !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'token é obrigatório.');
    }
    if (!expectedAction || typeof expectedAction !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'expectedAction é obrigatório.');
    }
    const requestBody = JSON.stringify({
        event: {
            token,
            expectedAction,
            siteKey: SITE_KEY,
        },
    });
    firebase_functions_1.logger.info(`[assessRecaptcha] Avaliando token para ação: ${expectedAction}`);
    let assessment;
    try {
        assessment = await postAssessment(recaptchaApiKey.value(), requestBody);
    }
    catch (err) {
        firebase_functions_1.logger.error('[assessRecaptcha] Erro ao contatar API do Google:', err);
        throw new https_1.HttpsError('internal', 'Erro ao verificar reCAPTCHA.');
    }
    const { tokenProperties, riskAnalysis } = assessment;
    if (!tokenProperties.valid) {
        firebase_functions_1.logger.warn(`[assessRecaptcha] Token inválido: ${tokenProperties.invalidReason}`);
        throw new https_1.HttpsError('permission-denied', `Token inválido: ${tokenProperties.invalidReason}`);
    }
    if (tokenProperties.action !== expectedAction) {
        firebase_functions_1.logger.warn(`[assessRecaptcha] Action não corresponde: esperado=${expectedAction} recebido=${tokenProperties.action}`);
        throw new https_1.HttpsError('permission-denied', 'Action do reCAPTCHA não corresponde.');
    }
    const score = riskAnalysis.score;
    firebase_functions_1.logger.info(`[assessRecaptcha] Score: ${score} | Action: ${tokenProperties.action}`);
    if (score < MIN_SCORE) {
        firebase_functions_1.logger.warn(`[assessRecaptcha] Score baixo (${score}) — possível bot.`);
        throw new https_1.HttpsError('permission-denied', `Score de segurança insuficiente: ${score}`);
    }
    return {
        success: true,
        score,
        action: tokenProperties.action,
        reasons: riskAnalysis.reasons,
    };
});
exports.seedEquipments = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    try {
        const db = admin.firestore();
        const colRef = db.collection('predefined_equipments');
        console.log(`[Firebase Function] Iniciando sementeira de ${equipments_1.equipments.length} itens...`);
        for (const eq of equipments_1.equipments) {
            await colRef.doc(eq.id).set({
                ...eq,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.json({ success: true, count: equipments_1.equipments.length });
    }
    catch (error) {
        console.error('[Firebase Function] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
const TIPOS_PERMITIDOS = [
    'application/json',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
];
exports.validarUpload = (0, storage_1.onObjectFinalized)({ bucket: 'budgetapp-ab10a.firebasestorage.app', region: 'us-east1' }, async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    if (!contentType || !TIPOS_PERMITIDOS.includes(contentType)) {
        firebase_functions_1.logger.warn(`[validarUpload] Tipo inválido bloqueado: ${contentType} — ${filePath}`);
        await admin.storage().bucket().file(filePath).delete();
        return;
    }
    const partes = filePath.split('/');
    if (partes[0] !== 'users' || !partes[1]) {
        firebase_functions_1.logger.warn(`[validarUpload] Arquivo fora da estrutura esperada: ${filePath}`);
        await admin.storage().bucket().file(filePath).delete();
        return;
    }
    firebase_functions_1.logger.info(`[validarUpload] Upload válido: ${filePath} (${contentType})`);
});
exports.gerarUrlAssinada = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login necessário.');
    }
    const { filePath } = request.data;
    if (!filePath || typeof filePath !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'filePath é obrigatório.');
    }
    const partes = filePath.split('/');
    if (partes[0] !== 'users' || partes[1] !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'Acesso negado.');
    }
    const bucket = admin.storage().bucket();
    const arquivo = bucket.file(filePath);
    const [url] = await arquivo.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
    });
    return { url };
});
const FERRAMENTAS_VALIDAS = [
    'roteiro_av',
    'mapa_de_luz',
    'storyboard',
    'moodboard',
    'copy_writing',
    'precificacao',
    'orcamento',
    'planejador_conteudo',
    'extrair_paleta',
    'criar_paleta',
];
exports.salvarProjeto = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login necessário.');
    }
    const { projectId, ferramenta, conteudo } = request.data;
    const uid = request.auth.uid;
    if (!projectId || !ferramenta || conteudo === undefined) {
        throw new https_1.HttpsError('invalid-argument', 'projectId, ferramenta e conteudo são obrigatórios.');
    }
    if (!FERRAMENTAS_VALIDAS.includes(ferramenta)) {
        throw new https_1.HttpsError('invalid-argument', `Ferramenta inválida: ${ferramenta}`);
    }
    const tamanho = Buffer.byteLength(JSON.stringify(conteudo));
    if (tamanho > 10 * 1024 * 1024) {
        throw new https_1.HttpsError('invalid-argument', 'Arquivo muito grande (máx 10 MB).');
    }
    const filePath = `users/${uid}/projects/${projectId}/${ferramenta}/data.json`;
    const bucket = admin.storage().bucket();
    const arquivo = bucket.file(filePath);
    await arquivo.save(JSON.stringify(conteudo), {
        contentType: 'application/json',
        metadata: {
            uid,
            projectId,
            ferramenta,
            savedAt: new Date().toISOString(),
        },
    });
    await admin.firestore().collection('audit_logs').add({
        uid,
        projectId,
        ferramenta,
        acao: 'autosave',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    firebase_functions_1.logger.info(`[salvarProjeto] Autosave: ${filePath} (${tamanho} bytes)`);
    return { sucesso: true };
});
exports.deletarProjeto = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login necessário.');
    }
    const { projectId } = request.data;
    const uid = request.auth.uid;
    if (!projectId || typeof projectId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'projectId é obrigatório.');
    }
    const bucket = admin.storage().bucket();
    const prefixo = `users/${uid}/projects/${projectId}/`;
    const [arquivos] = await bucket.getFiles({ prefix: prefixo });
    await Promise.all(arquivos.map((arquivo) => arquivo.delete()));
    await admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('projects')
        .doc(projectId)
        .delete();
    firebase_functions_1.logger.info(`[deletarProjeto] Projeto ${projectId} removido — ${arquivos.length} arquivo(s) deletado(s).`);
    return { sucesso: true, arquivosDeletados: arquivos.length };
});
//# sourceMappingURL=index.js.map