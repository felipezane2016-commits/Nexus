import type { Ambiente, Modulo, Permissao } from "@/_core/identidade/permissoes";
import {
  Banknote,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  FileText,
  FolderOpen,
  Gauge,
  History,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  PiggyBank,
  Scale,
  Target,
  Timer,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Contador = "notificacoes" | "conferencia";

export type ItemMenu = {
  rota: string;
  rotulo: string;
  icone: LucideIcon;
  /** Sem módulo: aparece para qualquer pessoa logada (ex.: notificações). */
  modulo?: Modulo;
  exige?: Permissao;
  contador?: Contador;
};

export type Grupo = { rotulo: string; itens: ItemMenu[] };

/** Menu da casca principal, por ambiente. */
export const MENU_AMBIENTE: Record<Ambiente, Grupo[]> = {
  escritorio: [
    {
      rotulo: "Principal",
      itens: [
        { rota: "/", rotulo: "Visão geral", icone: LayoutDashboard, modulo: "visao" },
        { rota: "/notificacoes", rotulo: "Notificações", icone: Bell, contador: "notificacoes" },
        { rota: "/calendario", rotulo: "Calendário", icone: CalendarDays, modulo: "calendario" },
        { rota: "/tarefas", rotulo: "Tarefas", icone: KanbanSquare, modulo: "tarefas" },
        { rota: "/documentos", rotulo: "Documentos", icone: FileText, modulo: "documentos" },
      ],
    },
    {
      rotulo: "Workflows",
      itens: [
        { rota: "/legal", rotulo: "Legal Workflow", icone: Scale, modulo: "legal" },
        { rota: "/prestadores", rotulo: "Prestadores", icone: Truck, modulo: "prestadores", contador: "conferencia" },
        { rota: "/contas", rotulo: "Account Management", icone: Landmark, modulo: "contas" },
      ],
    },
    {
      rotulo: "Administração",
      itens: [{ rota: "/usuarios", rotulo: "Usuários e acessos", icone: UserCog, exige: "usuarios.gerenciar" }],
    },
  ],
  consultoria: [
    {
      rotulo: "Consultoria",
      itens: [
        { rota: "/consultoria", rotulo: "Clientes", icone: Users, modulo: "consultoria" },
        { rota: "/consultoria/painel", rotulo: "Painel", icone: Gauge, modulo: "consultoria" },
      ],
    },
  ],
  particular: [
    {
      rotulo: "Particular",
      itens: [
        { rota: "/particular", rotulo: "Objetivos", icone: Target, modulo: "particular" },
        { rota: "/particular/financeiro", rotulo: "Financeiro", icone: Wallet, modulo: "particular" },
      ],
    },
  ],
};

/**
 * Módulos com casca própria: ao entrar, a barra troca para o menu do módulo,
 * com volta para o escritório — como o GED e o Backoffice do modelo.
 */
export type MenuModulo = { modulo: Modulo; titulo: string; prefixo: string; grupos: Grupo[] };

export const MENUS_MODULO: MenuModulo[] = [
  {
    modulo: "legal",
    titulo: "Legal Workflow",
    prefixo: "/legal",
    grupos: [
      {
        rotulo: "Principal",
        itens: [
          { rota: "/legal", rotulo: "Painel", icone: Gauge },
          { rota: "/legal/pipeline", rotulo: "Pipeline", icone: KanbanSquare },
          { rota: "/legal/clientes", rotulo: "Clientes", icone: Users },
        ],
      },
      {
        rotulo: "Configuração",
        itens: [
          { rota: "/legal/templates", rotulo: "Templates de e-mail", icone: Mail },
          { rota: "/legal/slas", rotulo: "SLAs e automações", icone: Timer },
        ],
      },
      { rotulo: "Ferramentas", itens: [{ rota: "/legal/agente", rotulo: "Agente IA", icone: Bot }] },
    ],
  },
  {
    modulo: "prestadores",
    titulo: "Prestadores",
    prefixo: "/prestadores",
    grupos: [
      {
        rotulo: "Principal",
        itens: [
          { rota: "/prestadores", rotulo: "Painel", icone: Gauge },
          { rota: "/prestadores/conferencia", rotulo: "Conferência", icone: ClipboardCheck, contador: "conferencia" },
          { rota: "/prestadores/historico", rotulo: "Histórico de recibos", icone: History },
        ],
      },
      {
        rotulo: "Gestão",
        itens: [
          { rota: "/prestadores/cadastro", rotulo: "Cadastro e acesso", icone: BookOpen },
          { rota: "/prestadores/arquivos", rotulo: "Arquivos", icone: FolderOpen },
        ],
      },
    ],
  },
  {
    modulo: "contas",
    titulo: "Account Management",
    prefixo: "/contas",
    grupos: [
      { rotulo: "Principal", itens: [{ rota: "/contas", rotulo: "Tarefas", icone: ListChecks }] },
      {
        rotulo: "Banco Industrial",
        itens: [
          { rota: "/contas/banco", rotulo: "Painel de câmbio", icone: LineChart },
          { rota: "/contas/taxas", rotulo: "Taxas diárias", icone: Banknote },
          { rota: "/contas/ordens", rotulo: "Ordens recebidas", icone: ClipboardCheck },
          { rota: "/contas/tendencia", rotulo: "Tendência", icone: TrendingUp },
          { rota: "/contas/economia", rotulo: "Economia potencial", icone: PiggyBank },
          { rota: "/contas/calendario-economico", rotulo: "Calendário econômico", icone: CalendarRange },
        ],
      },
    ],
  },
];

function casa(caminho: string, prefixo: string) {
  return caminho === prefixo || caminho.startsWith(`${prefixo}/`);
}

export function menuDaRota(caminho: string): MenuModulo | null {
  return MENUS_MODULO.find((menu) => casa(caminho, menu.prefixo)) ?? null;
}

export function ambienteDaRota(caminho: string): Ambiente {
  if (casa(caminho, "/consultoria")) return "consultoria";
  if (casa(caminho, "/particular")) return "particular";
  return "escritorio";
}

/** Módulo dono da rota — o que decide se a pessoa pode abrir a página. */
export function moduloDaRota(caminho: string): Modulo | null {
  const mapa: [string, Modulo][] = [
    ["/calendario", "calendario"],
    ["/tarefas", "tarefas"],
    ["/documentos", "documentos"],
    ["/legal", "legal"],
    ["/prestadores", "prestadores"],
    ["/contas", "contas"],
    ["/consultoria", "consultoria"],
    ["/particular", "particular"],
  ];
  if (caminho === "/") return "visao";
  return mapa.find(([prefixo]) => casa(caminho, prefixo))?.[1] ?? null;
}

/** Item ativo: o de prefixo mais longo que casa com a rota. */
export function itemAtivo(itens: ItemMenu[], caminho: string) {
  return itens
    .filter((item) => (item.rota === "/" ? caminho === "/" : casa(caminho, item.rota)))
    .sort((a, b) => b.rota.length - a.rota.length)[0];
}
