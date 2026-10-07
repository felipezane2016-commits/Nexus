# Nexus — Sistema administrativo + Portal do Prestador (protótipo)

Protótipo navegável do Nexus em duas zonas que compartilham os mesmos dados:

- **Admin (escritório)**: visão geral, calendário, tarefas, documentos,
  notificações, usuários e os módulos Prestadores e Account Management. É a
  reconstrução do app legado
  (`operational-intelligence-platform/index.html`) no modelo "Design e
  Arquitetura".
- **Portal do Prestador**: o prestador lança recibos e envia o fechamento
  mensal. O escritório confere e paga no admin.

O que o prestador envia aparece na conferência do admin. O que o escritório
decide volta para o portal na hora.

## Rodando

```bash
pnpm install
pnpm dev     # http://localhost:3000
```

```bash
pnpm check   # typecheck
pnpm test    # regras de domínio (vitest)
pnpm build   # build de produção
```

## Contas de demonstração

**Admin** (`/login`). Todos usam a senha **nexus2026**.

| E-mail                | Papel         | Módulos                            |
| --------------------- | ------------- | ---------------------------------- |
| `fernanda@nexus.demo` | Administrador | todos                              |
| `ricardo@nexus.demo`  | Gestor        | escritório, Prestadores e Contas   |
| `helena@nexus.demo`   | Operador      | calendário, tarefas e Prestadores  |
| `caio@nexus.demo`     | Visualizador  | visão geral, Prestadores e Contas  |
| `bianca@nexus.demo`   | —             | conta inativa (o login é recusado) |

**Portal** (`/portal/login`):

| Código      | Senha        | Prestador                                    |
| ----------- | ------------ | -------------------------------------------- |
| `PNST-2481` | `nexus2026`  | Marina Corrêa Diligências                    |
| `PNST-3107` | `rotaleve26` | Rota Leve Entregas                           |
| `PNST-1180` | `apoio2026`  | Apoio Forense Paulista                       |
| `PNST-2204` | `oficio2026` | Ofício Central de Notas                      |
| `PNST-0942` | `postal2026` | Agência Postal Vila Nova (acesso desativado) |

Senhas e acesso ao portal são editados em **Prestadores → Cadastro e acesso**.

## Zonas e rotas

| Zona   | Rotas                                                                   |
| ------ | ----------------------------------------------------------------------- |
| Portal | `/portal/login`, `/portal`, `/portal/recibos`, `/portal/fechamento`     |
| Admin  | `/login` e tudo o mais (exige sessão; cada rota confere papel e módulo) |

Rotas do admin:

- **Escritório**:
  - `/` visão geral
  - `/notificacoes`
  - `/calendario`
  - `/tarefas`
  - `/documentos`
  - `/usuarios` (só com permissão `usuarios.gerenciar`)
- **Prestadores**:
  - `/prestadores` painel
  - `/prestadores/conferencia`: lotes por prestador × competência. Aprovar ou
    devolver cada recibo, depois finalizar e marcar como pago.
  - `/prestadores/historico`
  - `/prestadores/cadastro`
  - `/prestadores/arquivos`
- **Account Management**:
  - `/contas` tarefas
  - `/contas/banco` painel de câmbio
  - `/contas/taxas` (com exportação CSV)
  - `/contas/ordens`
  - `/contas/tendencia`
  - `/contas/economia`
  - `/contas/calendario-economico`

Ao entrar num módulo (Prestadores, Contas), a barra lateral troca para o menu
dele e ganha o link "Voltar ao escritório".

## Arquitetura

```
client/src/
  _core/
    armazenamento/deposito.ts  interface Motor (localStorage com prefixo nexus:v1:, ou memória)
    armazenamento/colecao.ts   criarColecao / useColecao: coleção reativa e persistida
    armazenamento/semente.ts   VERSAO_DA_SEMENTE, restaurarDemonstracao(), comecarDoZero()
    identidade/                papéis, permissões, módulos, sessão do admin
    tempo.ts                   "hoje" da demonstração e utilitários de data
  modulos/<módulo>/            tipos, dados de demonstração, coleções, regras puras, ações
  admin/                       casca, menus, rotas, componentes e páginas do admin
  pages/, components/          Portal do Prestador
  contexts/PortalContext.tsx   portal sobre as coleções compartilhadas de Prestadores
  index.css                    folha única do design system
```

- **Coleções.** Cada conjunto de dados é uma coleção, como `recibos`,
  `fechamentos`, `taxas` ou `usuarios`:
  - É lida do depósito uma vez.
  - Fica num envelope `{versao, dados}`. Mudar a versão da semente reidrata a
    demonstração.
  - As gravações são agrupadas por microtarefa.
  - As telas assinam com `useColecao` (`useSyncExternalStore`).

  Portal e admin usam as mesmas coleções, e é isso que os integra. Ligar um
  backend é trocar o `Motor`.

- **Regras puras.** Agenda, vencimentos, lotes de conferência, spreads e
  rankings ficam em `modulos/*/regras.ts`, sem React. Os testes ficam em
  `server/admin.regras.test.ts`, `server/colecao.test.ts` e
  `server/portal*.test.ts`.
- **Acesso efetivo = papel ∩ módulos.** O papel (admin, gestor, operador,
  visualizador) dá as permissões (`registros.editar`, `registros.excluir`,
  `usuarios.gerenciar`). Os módulos do usuário dizem o que ele vê. Visualizador
  não edita nada.
- **Data da demonstração.** "Hoje" é fixo em **30/06/2026** (`_core/tempo.ts`),
  para que prazos, vencimentos e alertas da semente façam sentido em qualquer
  data real.
- **Semente.** Em Usuários e acessos o administrador tem "Restaurar
  demonstração" (volta tudo à semente) e "Começar do zero" (esvazia os dados de
  trabalho; usuários e sessões ficam). Os dois pedem um segundo clique.
  Trocar `VERSAO_DA_SEMENTE` renova a demonstração na próxima leitura, e o
  sistema avisa uma vez no topo da página.

## Design

Estrutura e design do **MBG Connected Operations** (o sistema de referência),
com as cores da marca PNST:

- **Casca.** Barra lateral de 256px em grafite `#303030` com a logo, itens de
  menu arredondados e um cartão no pé com a pessoa logada. O título da página,
  a descrição e as ações ficam no topo fixo (com desfoque), não no miolo — as
  páginas declaram o título com `<Cabecalho>`/`<CabecalhoPagina>` e ele vai
  para o topo por portal. Abaixo de 1024px a barra vira gaveta.
- **Tokens semânticos** como no MBG: `primary`, `secondary`, `muted`,
  `accent`, `success`, `warning`, `info`, `destructive` e `sidebar-*`. O
  `primary` é o laranja 600 `#C9460D` (4,81:1 com branco, para botão, link e
  filtro ativo); o laranja da marca `#F16122` é o `sidebar-primary` (item
  ativo, contador, avatar, gráfico).
- **Componentes.** Painéis com raio de 16px, sombra suave e animação de
  entrada; KPIs com o número grande primeiro; selos em pílula com borda e
  fundo translúcidos; filtros em pílula (o ativo preenchido); tabelas de
  borda a borda com cabeçalho em fundo neutro.
- **Tipografia.** Manrope no texto, Sora nos títulos — como no MBG, sem
  monoespaçada; números com algarismos tabulares.
- **Gráficos.** `--chart-1` (laranja 700) e `--chart-2` (a marca), par
  validado no claro e no escuro; a 2ª série também é tracejada e cada gráfico
  tem "Ver como tabela".
- **Convenções.** Uma folha de estilo só; `style={{}}` apenas para valor
  calculado em tempo de execução. O modo escuro redefine só os tokens.
  Nenhuma tela rola para o lado em 390px.

## Build estático para preview

```bash
VITE_HASH_ROUTER=1 pnpm exec vite build --base=./
```

Com esse build, as rotas vivem no hash (`#/login`, `#/portal/login`), então
qualquer hosting estático funciona.

## Fora do escopo / limites conhecidos

- **Não há backend.** Os dados ficam no `localStorage` do navegador, com o
  prefixo `nexus:v1:`. O login compara as credenciais de demonstração no
  cliente. O scaffold tRPC/Drizzle do template continua no repositório, ainda
  não ligado às telas.
- **Módulos que não fazem parte do sistema:** Legal Workflow, Consultoria e
  Particular foram retirados. O Financeiro do escritório também não existe — o
  próprio app legado o marca como removido.
- **Em construção:** o armazenamento do conteúdo dos arquivos (Documentos e
  Arquivos de prestadores guardam só os metadados).
- **Os dados de demonstração são fictícios:** clientes, prestadores, taxas e
  pessoas.
