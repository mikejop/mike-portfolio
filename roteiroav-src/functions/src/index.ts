import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import * as https from 'https';
import { equipments } from './equipments';

admin.initializeApp();

// ─────────────────────────────────────────────────────────
// Secret — chave de API do Google Cloud (reCAPTCHA Enterprise)
// Definida via: firebase functions:secrets:set RECAPTCHA_API_KEY
// ─────────────────────────────────────────────────────────
const recaptchaApiKey = defineSecret('RECAPTCHA_API_KEY');

// ─────────────────────────────────────────────────────────
// 0. Avaliar reCAPTCHA Enterprise — Callable (v2 API)
//    Recebe o token gerado pelo frontend e a action esperada,
//    envia ao endpoint do Google e valida score + action.
//    Estrutura do request.json:
//    { event: { token, expectedAction, siteKey } }
//    Endpoint:
//    POST https://recaptchaenterprise.googleapis.com/v1/
//         projects/budgetapp-ab10a/assessments?key=API_KEY
// ─────────────────────────────────────────────────────────
const PROJECT_ID = 'budgetapp-ab10a';
const SITE_KEY   = '6Lcpy68sAAAAADS_K4IP6WX7fNfRjy5SGF2QOL4N';
const MIN_SCORE  = 0.5;

interface AssessRecaptchaData {
  token: string;
  expectedAction: string;
}

interface RecaptchaAssessmentResponse {
  name: string;
  event: { token: string; siteKey: string; expectedAction: string };
  riskAnalysis: { score: number; reasons: string[] };
  tokenProperties: {
    valid: boolean;
    hostname: string;
    action: string;
    createTime: string;
    invalidReason?: string;
  };
}

/** Faz a requisição HTTPS para a API do reCAPTCHA Enterprise. */
function postAssessment(apiKey: string, body: string): Promise<RecaptchaAssessmentResponse> {
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
          resolve(JSON.parse(data) as RecaptchaAssessmentResponse);
        } catch {
          reject(new Error(`Resposta inválida da API: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export const assessRecaptcha = onCall(
  { secrets: [recaptchaApiKey], region: 'us-east1' },
  async (request) => {
    // Autenticação obrigatória
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login necessário.');
    }

    const { token, expectedAction } = request.data as AssessRecaptchaData;

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'token é obrigatório.');
    }
    if (!expectedAction || typeof expectedAction !== 'string') {
      throw new HttpsError('invalid-argument', 'expectedAction é obrigatório.');
    }

    // Monta o body conforme request.json
    const requestBody = JSON.stringify({
      event: {
        token,
        expectedAction,
        siteKey: SITE_KEY,
      },
    });

    logger.info(`[assessRecaptcha] Avaliando token para ação: ${expectedAction}`);

    let assessment: RecaptchaAssessmentResponse;
    try {
      assessment = await postAssessment(recaptchaApiKey.value(), requestBody);
    } catch (err: any) {
      logger.error('[assessRecaptcha] Erro ao contatar API do Google:', err);
      throw new HttpsError('internal', 'Erro ao verificar reCAPTCHA.');
    }

    const { tokenProperties, riskAnalysis } = assessment;

    // Valida se o token é legítimo
    if (!tokenProperties.valid) {
      logger.warn(`[assessRecaptcha] Token inválido: ${tokenProperties.invalidReason}`);
      throw new HttpsError('permission-denied', `Token inválido: ${tokenProperties.invalidReason}`);
    }

    // Valida se a action bate com o esperado
    if (tokenProperties.action !== expectedAction) {
      logger.warn(`[assessRecaptcha] Action não corresponde: esperado=${expectedAction} recebido=${tokenProperties.action}`);
      throw new HttpsError('permission-denied', 'Action do reCAPTCHA não corresponde.');
    }

    const score = riskAnalysis.score;
    logger.info(`[assessRecaptcha] Score: ${score} | Action: ${tokenProperties.action}`);

    // Rejeita se score abaixo do mínimo (provável bot)
    if (score < MIN_SCORE) {
      logger.warn(`[assessRecaptcha] Score baixo (${score}) — possível bot.`);
      throw new HttpsError('permission-denied', `Score de segurança insuficiente: ${score}`);
    }

    return {
      success: true,
      score,
      action: tokenProperties.action,
      reasons: riskAnalysis.reasons,
    };
  }
);



// ─────────────────────────────────────────────────────────
// Função existente — Seed de Equipamentos (v1 API)
// ─────────────────────────────────────────────────────────
export const seedEquipments = functions.https.onRequest(async (req, res) => {
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

    console.log(`[Firebase Function] Iniciando sementeira de ${equipments.length} itens...`);

    for (const eq of equipments) {
      await colRef.doc(eq.id).set({
        ...eq,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ success: true, count: equipments.length });
  } catch (error: any) {
    console.error('[Firebase Function] Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────
// 1. Validar Upload — Storage Trigger (v2 API)
//    Roda automaticamente quando qualquer arquivo termina
//    de ser salvo no Storage. Bloqueia tipos inválidos e
//    arquivos fora da estrutura users/{uid}/...
// ─────────────────────────────────────────────────────────
const TIPOS_PERMITIDOS = [
  'application/json',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const validarUpload = onObjectFinalized(
  { bucket: 'budgetapp-ab10a.firebasestorage.app', region: 'us-east1' },
  async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // Bloqueia tipos MIME não permitidos
  if (!contentType || !TIPOS_PERMITIDOS.includes(contentType)) {
    logger.warn(`[validarUpload] Tipo inválido bloqueado: ${contentType} — ${filePath}`);
    await admin.storage().bucket().file(filePath).delete();
    return;
  }

  // Garante estrutura esperada: users/{userId}/...
  const partes = filePath.split('/');
  if (partes[0] !== 'users' || !partes[1]) {
    logger.warn(`[validarUpload] Arquivo fora da estrutura esperada: ${filePath}`);
    await admin.storage().bucket().file(filePath).delete();
    return;
  }

  logger.info(`[validarUpload] Upload válido: ${filePath} (${contentType})`);
});

// ─────────────────────────────────────────────────────────
// 2. Gerar URL Assinada — Callable (v2 API)
//    Retorna uma URL temporária (15 min) para um arquivo
//    do Storage. Só o dono (uid) pode gerar.
// ─────────────────────────────────────────────────────────
export const gerarUrlAssinada = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }

  const { filePath } = request.data as { filePath: string };

  if (!filePath || typeof filePath !== 'string') {
    throw new HttpsError('invalid-argument', 'filePath é obrigatório.');
  }

  // Garante que o usuário só pode gerar URL para seus próprios arquivos
  const partes = filePath.split('/');
  if (partes[0] !== 'users' || partes[1] !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  const bucket = admin.storage().bucket();
  const arquivo = bucket.file(filePath);

  // URL válida por 15 minutos
  const [url] = await arquivo.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });

  return { url };
});

// ─────────────────────────────────────────────────────────
// 3. Salvar Projeto (Autosave) — Callable (v2 API)
//    Recebe o conteúdo de uma ferramenta, valida e grava
//    no Storage. Registra ação no audit_logs (Firestore).
// ─────────────────────────────────────────────────────────
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

interface SalvarProjetoData {
  projectId: string;
  ferramenta: string;
  conteudo: unknown;
}

export const salvarProjeto = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }

  const { projectId, ferramenta, conteudo } = request.data as SalvarProjetoData;
  const uid = request.auth.uid;

  if (!projectId || !ferramenta || conteudo === undefined) {
    throw new HttpsError('invalid-argument', 'projectId, ferramenta e conteudo são obrigatórios.');
  }

  if (!FERRAMENTAS_VALIDAS.includes(ferramenta)) {
    throw new HttpsError('invalid-argument', `Ferramenta inválida: ${ferramenta}`);
  }

  // Valida tamanho do conteúdo (máx 10 MB)
  const tamanho = Buffer.byteLength(JSON.stringify(conteudo));
  if (tamanho > 10 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'Arquivo muito grande (máx 10 MB).');
  }

  const filePath = `users/${uid}/projects/${projectId}/${ferramenta}/data.json`;

  // Salva no Storage
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

  // Registra no log de auditoria (Firestore)
  await admin.firestore().collection('audit_logs').add({
    uid,
    projectId,
    ferramenta,
    acao: 'autosave',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`[salvarProjeto] Autosave: ${filePath} (${tamanho} bytes)`);
  return { sucesso: true };
});

// ─────────────────────────────────────────────────────────
// 4. Deletar Projeto — Callable (v2 API)
//    Remove todos os arquivos do projeto no Storage e o
//    documento correspondente no Firestore.
// ─────────────────────────────────────────────────────────
export const deletarProjeto = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }

  const { projectId } = request.data as { projectId: string };
  const uid = request.auth.uid;

  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId é obrigatório.');
  }

  const bucket = admin.storage().bucket();
  const prefixo = `users/${uid}/projects/${projectId}/`;

  // Lista e deleta todos os arquivos do projeto
  const [arquivos] = await bucket.getFiles({ prefix: prefixo });
  await Promise.all(arquivos.map((arquivo) => arquivo.delete()));

  // Remove também do Firestore
  await admin.firestore()
    .collection('users')
    .doc(uid)
    .collection('projects')
    .doc(projectId)
    .delete();

  logger.info(`[deletarProjeto] Projeto ${projectId} removido — ${arquivos.length} arquivo(s) deletado(s).`);
  return { sucesso: true, arquivosDeletados: arquivos.length };
});
