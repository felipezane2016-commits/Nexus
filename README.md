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
