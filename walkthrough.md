# Walkthrough - Resolução de Problemas e Melhorias Implementadas

Abaixo está o resumo detalhado das correções de inicialização e novas funcionalidades de persistência e comportamento do menu lateral implementadas e publicadas no Roteiro AV.

## Alterações Realizadas

### 1. Resolução do Travamento de Inicialização (Loading Infinito)
- **Fallback-Safe UUID (`safeUUID`):** Criamos a utilidade `safeUUID` em [utils.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/lib/utils.ts). Esta função substitui todas as chamadas diretas a `crypto.randomUUID()` em todo o projeto.
  - Em navegadores antigos ou em contextos HTTP não seguros (como servidores locais acessados por IP/domínios não HTTPS), `window.crypto.randomUUID` fica indisponível, gerando um erro fatal de JavaScript que interrompia a hidratação do React no navegador. A nova utilidade fornece um gerador de UUID v4 de fallback usando entropia aleatória baseada em `Math.random()`, garantindo que o programa abra em qualquer ambiente.
- **Substituição de UUIDs:** Substituímos as chamadas de UUID em [scriptService.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/lib/services/scriptService.ts), [createRoomSlice.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/store/slices/createRoomSlice.ts), [createEditorSlice.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/store/slices/createEditorSlice.ts) e [createMetadataSlice.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/store/slices/createMetadataSlice.ts).

### 2. Correção de Chaves Duplicadas (React Duplicate Keys)
- **Deduplicação de Roteiros:** Em [ScriptDashboard.tsx](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/components/ScriptDashboard.tsx) e [RecentScripts.tsx](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/components/RecentScripts.tsx), implementamos um filtro de unicidade baseado no ID do roteiro antes da renderização e ordenação. Isso evita o aviso fatal e eventuais problemas de renderização causados por duplicatas temporárias na listagem do Firestore.

### 3. Menu Lateral Minimizado por Padrão
- **Abertura Minimizado:** Alteramos o estado inicial da propriedade `isProjectSidebarOpen` de `true` para `false` no [useAppStore.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/store/useAppStore.ts). Agora, ao entrar em qualquer ferramenta (Precificação, Orçamento ou Roteiro), o explorador lateral inicia recolhido para maximizar a área de trabalho do usuário.

### 4. Memória e Persistência de Escolhas do Usuário
- **Persistência Global da App (`useAppStore`):** Atualizamos a função de partiarização (`partialize`) do Zustand persist no [useAppStore.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/store/useAppStore.ts) para armazenar no `localStorage` as seguintes configurações:
  - O estado da barra lateral (`isProjectSidebarOpen`).
  - O estado de maximização da janela principal (`isMaximized`).
  - As preferências manuais de maximização da dashboard (`manualMaximizeDashboard`) e do editor (`manualMaximizeEditor`), eliminando o uso de `sessionStorage`.
- **Persistência do Painel de Roteiros (`useScriptStore`):** Alteramos a inicialização e os métodos de mutação em [createMetadataSlice.ts](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/store/slices/createMetadataSlice.ts) para ler e escrever no `localStorage` do navegador:
  - O cliente selecionado no filtro de busca (`selectedClient`).
  - O campo de ordenação (`clientSortField`) e a ordem da listagem (`clientSortOrder`).
  - A aba ativa entre "Meus Roteiros" e "Compartilhados" (`activeTab`).

### 5. Resolução da Interrupção de Foco do TAB no Tiptap
- **Intercepção de Evento customizada:** Atualizamos o gerenciamento de teclas do Tiptap em [CollaborativeEditor.tsx](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/components/editor/CollaborativeEditor.tsx).
  - Anteriormente, o callback `handleKeyDown` de Tiptap retornava sempre `false`, o que permitia ao navegador e ao Prosemirror prosseguirem com sua navegação de foco nativa em paralelo à nossa ação customizada (como criação de novas linhas).
  - Agora, o manipulador verifica se a propagação de eventos foi customizadamente prevenida (`event.defaultPrevented`) e retorna `true` para sinalizar ao Prosemirror que o evento de teclado foi inteiramente tratado. Isso elimina de vez o delay, piscadas ou perda de foco ao pressionar TAB na coluna de VISUAL.
- **Remoção de Atraso e Layout Shift (Textarea Dummy Temporário):** 
  - Em salas colaborativas, a inicialização do editor Tiptap/Yjs exige conexões assíncronas com o Firestore, gerando um atraso de carregamento de aproximadamente 300ms.
  - Para resolver isso, implementamos uma renderização condicional em [CollaborativeEditor.tsx](file:///Users/michaeloliveira/Documents/michael-portfolio-site/roteiroav-src/src/features/tools/script-editor/components/editor/CollaborativeEditor.tsx): enquanto o editor real está carregando (`editor === null`), renderizamos um elemento `<textarea>` dummy de fallback com o visual idêntico ao do editor final.
  - Se o usuário pressionar TAB na coluna VISUAL da última linha, a linha é criada e a coluna AUDIO seguinte (que é um novo `CollaborativeEditor`) é focada instantaneamente por meio desse elemento dummy. O usuário pode começar a digitar imediatamente e, quando o editor colaborativo real se conecta, a transição de texto e foco ocorre sem nenhuma piscada, atraso ou perda de foco.

### 6. Sistema de Elementos e Comandos Slash (/)
- **Menu de Comandos Palette (Slash Menu):** Adicionamos suporte ao caractere `/` em ambos os campos de **ÁUDIO** e **VISUAL**. Digitar `/` no início de uma linha abre uma paleta flutuante e translúcida (efeito glassmorphism) próxima ao cursor, contendo os elementos válidos para aquela coluna. Pressionar `ArrowUp`/`ArrowDown` navega pelas opções, `Enter` seleciona e `Escape` fecha o menu.
- **Estruturação Semântica em ÁUDIO:**
  - `/char`: Insere `[CHAR:]` (Personagem) e coloca o cursor para digitação. O nome digitado é automaticamente convertido para caixa alta (uppercase). Pressionar `Enter` cria uma nova linha abaixo já preenchida com o qualificador de diálogo padrão `[DIAL]`.
  - Subelementos de Diálogo (`/dial`, `/vo`, `/off`, `/loc`, `/entrevista`): Aparecem no menu apenas quando o cursor está dentro de uma linha de diálogo de personagem, substituindo o rótulo da fala atual.
  - `/trilha` e `/sfx`: Inserem blocos de Trilha Sonora e Efeitos Sonoros (`[TRILHA]` e `[SFX]`) respectivamente. Seus subelementos correspondentes (como `/original`, `/banco`, `/ambiente`, `/foley`) aparecem quando o cursor está dentro dessas linhas, atualizando o rótulo do bloco (ex: `TRILHA (Original):` ou `SFX (Som Ambiente):`).
- **Autocompletar Semântico em VISUAL:**
  - O menu abre diretamente no nível de subelementos ao acionar comandos de categoria (`/plano`, `/angulo`, `/posicao`, `/movcam`, `/lente`, `/luz`, `/insercao`, `/transicao`).
  - Escolher um subelemento (ex: `PE` ou `Contra-plongée`) insere apenas o subelemento na célula em formato de tag inline (`[PLANO:PE]`), permitindo encadear múltiplos elementos na mesma célula (ex: um plano, ângulo e movimento juntos).
  - Subelementos de `/transicao` (ex: `Fade out`) são renderizados de forma especial, flutuando no canto inferior direito da célula.
- **Três Camadas de Estilização Visual (Mac Cores):**
  - Aplicamos a identidade de cor (Azul para personagens, Violeta para trilhas, Verde para efeitos sonoros, Âmbar/Laranja/Teal/Coral para itens visuais) em três níveis:
    1. **Borda lateral esquerda:** Uma linha de destaque vertical de 3px no lado esquerdo do bloco.
    2. **Rótulo/Label:** O texto do rótulo (ex: `TRILHA:`, `DIAL:`) na respectiva cor.
    3. **Fundo sutil (Tint):** Um fundo suave com opacidade adaptável (0.06 no tema escuro, 0.08 no tema claro).
- **Hiding Não-Destrutivo (WYSIWYG Ativo):** O texto original contendo a marcação técnica (ex: `[TRILHA:Original]`) é preservado no banco de dados e fica visível apenas na linha focada para edição (permitindo edição e remoção direta das tags). Ao desfocar (blur) a linha, as tags se convertem visualmente nos rótulos limpos e coloridos.

---

## Verificação e Implantação
- **Backup Commit:** Commit de backup criado e publicado na branch remota `main` do GitHub antes do início da tarefa.
- **Build de Produção:** Next.js compilado estaticamente com sucesso (`next build`).
- **Firebase Deploy:** Executado `firebase deploy --only hosting` com sucesso.
  - URL de Produção Atualizada: [michael-portfolio-b422a.web.app/roteiroav/](https://michael-portfolio-b422a.web.app/roteiroav/)
