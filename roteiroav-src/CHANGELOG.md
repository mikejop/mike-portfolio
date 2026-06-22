# Changelog - Dojo Utilities

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [0.9.0-beta.1] - 2026-03-07 (Roteiro AV)
## [0.1.0-alpha.1] - 2026-03-07 (Dojo Utilities)

### 🚀 Correção Estratégica de Versões
- **Dojo Utilities:** Versão resetada para `0.1.0-alpha.1` para refletir o início do ecossistema (3/10 apps).
- **Roteiro AV:** Promovido para `0.9.0-beta.1` para refletir maturidade e proximidade com o lançamento estável.
- **Precificação/Orçamento:** Mantidos em `RC` (Release Candidate) como as ferramentas mais maduras.

### 🧪 Roteiro AV (Correções Recentes)
- **Áudio Multi-Camada:** Suporte independente para SFX e Trilha na mesma linha.
- **Bug Fixes:** Correção de esticamento de imagem e centralização de zoom.
- **D&D:** Reorganização por arrasto funcional para cenas e linhas.

---

## [0.1.0-beta.2] - 2026-03-07

### 🚀 Adicionado
- **Sistema de Versionamento:** Implementado sistema automático "Vibe Code" para controle de versões e builds.
- **Badge Beta:** Adicionado badge "BETA" no cabeçalho (TopBar) com tooltip informativo.
- **Script de Bump:** Criado script `scripts/bump-version.js` para automatizar incrementos de versão.

### 🎨 Interface
- **Tooltip de Versão:** Hover no badge "BETA" mostra a versão, build e data da última atualização.
- **Categorização da Dashboard:** Organização dos apps em "Criatividade", "Financeiro" e "Utilitários".
- **Novos Apps (Breve):** Adicionados placeholders para "Copy Writing", "Mapa de Luz", "Storyboard" e "Moodboard".

### 🔧 Interno
- Criado arquivo `src/version.ts` como fonte única de verdade para a versão do app.

---

## [0.1.0-beta.1] - 2026-03-07
- Lançamento inicial da versão Beta com suporte a Roteiro AV, Precificação e Editor de Orçamentos.
