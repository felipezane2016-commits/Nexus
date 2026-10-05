# Nexus — Portal do Prestador (protótipo)

Protótipo navegável do portal em que prestadores de serviço do escritório lançam
recibos, acompanham a conferência e enviam o fechamento mensal.

## Rodando

```bash
pnpm install
pnpm dev     # http://localhost:3000
```

Credenciais de demonstração: código **PNST-2481**, senha **nexus2026** (o botão
_Preencher credenciais demo_ na tela de login preenche os dois campos).

Outros comandos:

```bash
pnpm check   # typecheck
pnpm test    # regras de domínio (vitest)
pnpm build   # build de produção
```

## Telas

| Rota          | Tela              | O que faz                                                                                       |
| ------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `/login`      | Login             | Acesso por código de contrato + senha.                                                          |
| `/`           | Dashboard         | Métricas da competência, progresso do fechamento, devoluções e últimos lançamentos.             |
| `/recibos`    | Meus recibos      | Lista com busca e filtro por status, lançamento/edição em modal, envio e exclusão de rascunhos. |
| `/fechamento` | Fechamento mensal | Consolidação por competência, anexo do documento de faturamento e envio ao escritório.          |

## Regras do protótipo

Um recibo percorre quatro status: **Rascunho → Enviado → Aprovado**, ou
**Rejeitado** quando o escritório devolve.

- Recibos **aprovados** não podem mais ser editados.
- Editar um recibo **rejeitado** limpa a devolutiva e o devolve para rascunho.
- Recibos **rejeitados** aparecem no fechamento, mas não somam no total.
- O fechamento só pode ser enviado com o documento de faturamento anexado e ao
  menos um recibo não rejeitado; ao enviar, os rascunhos da competência vão junto.
- O progresso do fechamento tem quatro etapas — recibos lançados, revisão
  aprovada, documento anexado e envio —, cada uma valendo 25%.

Essas regras vivem em `client/src/lib/portal.ts` como funções puras e são
cobertas por `server/portal.test.ts` e `server/portal.rules.test.ts`.

## Estrutura

```
client/src/
  lib/portal.ts          regras de domínio (puras, testadas)
  lib/portalSeed.ts      dados de demonstração
  contexts/PortalContext estado do protótipo + persistência em localStorage
  components/            PortalShell (sidebar + topbar), ReceiptModal, StatusPill
  pages/                 Login, Dashboard, Receipts, Closing
  index.css              design system do protótipo (classes próprias, sem shadcn)
server/                  scaffold tRPC/Drizzle do template + testes
```

## Design e arquitetura

O portal segue o modelo "Design e Arquitetura" (Horizon + Ivory). Os valores
vivem em `client/src/index.css`, a folha única do app.

**Paleta.** Duas cores de marca, Horizon `#67a4bf` e Ivory `#f3f1e2`. O Horizon
puro é superfície e acento, nunca texto nem fundo de botão (branco sobre ele dá
2,75:1); ação primária e link usam `--horizon-700` `#2c596d`. Neutros quentes
(`--warm-*`) no lugar de cinza frio, para não brigar com o fundo creme.

| Status               | Classe            | Significado  |
| -------------------- | ----------------- | ------------ |
| Rascunho             | `.status-neutral` | sem estado   |
| Enviado              | `.status-blue`    | em andamento |
| Aprovado             | `.status-green`   | concluído    |
| Rejeitado            | `.status-red`     | bloqueado    |
| Fechamento em aberto | `.status-amber`   | atenção      |

**Tipografia.** DM Sans fala (títulos, botões, números), Source Sans 3 explica
(corpo e campos), IBM Plex Mono etiqueta (rótulos, códigos, selos).

**Modo escuro.** Botão na barra superior; o `ThemeContext` põe `.dark` na raiz e
guarda a escolha na chave `theme`. O CSS só redefine os tokens semânticos.

**Componentes.** As telas usam o vocabulário do modelo: `.app-shell`,
`.sidebar`, `.page-heading`, `.operations-surface`, `.kpi-card`, `.risk-card`,
`.attention-card`, `.next-step-list`, `.ged-line`, `.status-pill`,
`.button-primary`, `.field-group`, `.filter-chip`, `.inline-search` e, no login,
`.acesso`/`.acesso-cartao`.

**Dados.** Toda leitura e gravação passa por
`client/src/_core/armazenamento/deposito.ts`: interface `Motor`, hoje sobre o
localStorage com prefixo `nexus:v1:`, e motor de memória quando o navegador
recusa armazenamento. Ligar um backend é trocar o motor. O estado é lido uma vez
na montagem — o depósito devolve cópias, e alterar uma cópia não grava nada.

**Responsividade.** Barra de 258px; 218px até 1080px; vira gaveta até 760px. Nenhuma
tela rola para o lado em 390px, no claro e no escuro.

## Build estático para preview

Para publicar o protótipo em hosting estático sem fallback de SPA (link de
preview, GitHub Pages), gere o build com rotas em hash e caminhos relativos:

```bash
VITE_HASH_ROUTER=1 pnpm exec vite build --base=./
```

As rotas passam a viver no hash (`#/recibos`), então qualquer caminho de
publicação funciona. O `pnpm dev` e o `pnpm build` normais seguem com rotas em
path.

## Limites conhecidos

Este é um protótipo de front-end: **não há backend nem banco**. O login compara
as credenciais de demonstração no cliente e o estado é guardado em
`localStorage` (chave `nexus-portal-prototipo-v1`), então os dados são por
navegador e não saem da máquina. O scaffold de tRPC, Drizzle e OAuth que veio no
template continua no repositório, ainda não ligado às telas — é o ponto de
partida para a versão persistida.
