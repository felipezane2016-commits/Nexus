import { pode, veModulo } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { Loader2, ShieldOff } from "lucide-react";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import CascaAdmin, { rotaInicial } from "./CascaAdmin";
import Vazio from "./componentes/Vazio";
import { moduloDaRota } from "./menu";
import VisaoGeral from "./paginas/VisaoGeral";

/**
 * Rotas do admin. A visão geral é estática — é o primeiro quadro depois do
 * login; o resto entra sob demanda, e o Suspense fica dentro da casca para a
 * barra não piscar.
 */

type Pagina = { padrao: string; titulo: string; Componente: ComponentType | LazyExoticComponent<ComponentType> };

const PAGINAS: Pagina[] = [
  { padrao: "/", titulo: "Visão geral", Componente: VisaoGeral },
  { padrao: "/notificacoes", titulo: "Notificações", Componente: lazy(() => import("./paginas/Notificacoes")) },
  { padrao: "/calendario", titulo: "Calendário", Componente: lazy(() => import("./paginas/Calendario")) },
  { padrao: "/tarefas", titulo: "Tarefas", Componente: lazy(() => import("./paginas/Tarefas")) },
  { padrao: "/documentos", titulo: "Documentos", Componente: lazy(() => import("./paginas/Documentos")) },
  { padrao: "/usuarios", titulo: "Usuários e acessos", Componente: lazy(() => import("./paginas/Usuarios")) },

  { padrao: "/legal", titulo: "Painel", Componente: lazy(() => import("./paginas/legal/PainelLegal")) },
  { padrao: "/legal/pipeline", titulo: "Pipeline", Componente: lazy(() => import("./paginas/legal/Pipeline")) },
  { padrao: "/legal/clientes", titulo: "Clientes", Componente: lazy(() => import("./paginas/legal/ClientesLegal")) },
  { padrao: "/legal/templates", titulo: "Templates de e-mail", Componente: lazy(() => import("./paginas/legal/Templates")) },
  { padrao: "/legal/slas", titulo: "SLAs e automações", Componente: lazy(() => import("./paginas/legal/Slas")) },
  { padrao: "/legal/agente", titulo: "Agente IA", Componente: lazy(() => import("./paginas/legal/Agente")) },

  { padrao: "/prestadores", titulo: "Painel", Componente: lazy(() => import("./paginas/prestadores/PainelPrestadores")) },
  { padrao: "/prestadores/conferencia", titulo: "Conferência", Componente: lazy(() => import("./paginas/prestadores/Conferencia")) },
  { padrao: "/prestadores/historico", titulo: "Histórico de recibos", Componente: lazy(() => import("./paginas/prestadores/Historico")) },
  { padrao: "/prestadores/cadastro", titulo: "Cadastro e acesso", Componente: lazy(() => import("./paginas/prestadores/Cadastro")) },
  { padrao: "/prestadores/arquivos", titulo: "Arquivos", Componente: lazy(() => import("./paginas/prestadores/Arquivos")) },

  { padrao: "/contas", titulo: "Tarefas", Componente: lazy(() => import("./paginas/contas/TarefasContas")) },
  { padrao: "/contas/banco", titulo: "Painel de câmbio", Componente: lazy(() => import("./paginas/contas/PainelCambio")) },
  { padrao: "/contas/taxas", titulo: "Taxas diárias", Componente: lazy(() => import("./paginas/contas/Taxas")) },
  { padrao: "/contas/ordens", titulo: "Ordens recebidas", Componente: lazy(() => import("./paginas/contas/Ordens")) },
  { padrao: "/contas/tendencia", titulo: "Tendência", Componente: lazy(() => import("./paginas/contas/Tendencia")) },
  { padrao: "/contas/economia", titulo: "Economia potencial", Componente: lazy(() => import("./paginas/contas/Economia")) },
  {
    padrao: "/contas/calendario-economico",
    titulo: "Calendário econômico",
    Componente: lazy(() => import("./paginas/contas/CalendarioEconomico")),
  },

  { padrao: "/consultoria", titulo: "Clientes", Componente: lazy(() => import("./paginas/consultoria/ClientesConsultoria")) },
  { padrao: "/consultoria/painel", titulo: "Painel", Componente: lazy(() => import("./paginas/consultoria/PainelConsultoria")) },
  {
    padrao: "/consultoria/cliente/:id",
    titulo: "Cliente",
    Componente: lazy(() => import("./paginas/consultoria/DetalheCliente")),
  },

  { padrao: "/particular", titulo: "Objetivos", Componente: lazy(() => import("./paginas/particular/Objetivos")) },
  { padrao: "/particular/financeiro", titulo: "Financeiro", Componente: lazy(() => import("./paginas/particular/FinanceiroPessoal")) },
];

function Carregando() {
  return (
    <div className="empty-state" role="status">
      <Loader2 size={22} strokeWidth={1.8} className="animate-spin" />
      <span>Carregando…</span>
    </div>
  );
}

export default function RotasAdmin() {
  const usuario = useUsuarioAtual();
  const [caminho] = useLocation();

  if (!usuario) return <Redirect to="/login" />;

  const pagina =
    PAGINAS.find((item) => item.padrao === caminho) ??
    PAGINAS.find((item) => item.padrao.includes(":") && caminho.startsWith(item.padrao.split(":")[0]));
  const modulo = moduloDaRota(caminho);

  // A visão geral é o destino padrão; quem não a vê cai na primeira área que vê.
  if (caminho === "/" && !veModulo(usuario, "visao")) return <Redirect to={rotaInicial(usuario, "escritorio")} />;

  const semAcesso =
    (modulo !== null && !veModulo(usuario, modulo)) ||
    (caminho.startsWith("/usuarios") && !pode(usuario, "usuarios.gerenciar"));

  return (
    <CascaAdmin usuario={usuario} titulo={pagina?.titulo ?? "Página não encontrada"}>
      {semAcesso ? (
        <section className="operations-surface">
          <Vazio
            icone={ShieldOff}
            titulo="Sem acesso a esta área"
            texto="Seu usuário não tem este módulo liberado. Peça a um administrador em Usuários e acessos."
          />
        </section>
      ) : (
        <Suspense fallback={<Carregando />}>
          <Switch>
            {PAGINAS.map(({ padrao, Componente }) => (
              <Route key={padrao} path={padrao}>
                <Componente />
              </Route>
            ))}
            <Route>
              <section className="operations-surface">
                <Vazio icone={ShieldOff} titulo="Página não encontrada" texto="O endereço não existe no escritório." />
              </section>
            </Route>
          </Switch>
        </Suspense>
      )}
    </CascaAdmin>
  );
}
