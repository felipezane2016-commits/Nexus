import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { HOJE } from "@/_core/tempo";
import Barras from "@/admin/componentes/Barras";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Kpi from "@/admin/componentes/Kpi";
import Vazio from "@/admin/componentes/Vazio";
import { useDadosLegal } from "@/modulos/legal/colecoes";
import { alertas, ativos } from "@/modulos/legal/regras";
import { ETAPAS } from "@/modulos/legal/tipos";
import { AlertTriangle, CheckCircle2, Hourglass, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import DetalheProcesso from "./DetalheProcesso";
import FormularioProcesso from "./FormularioProcesso";

export default function PainelLegal() {
  const { processos, clientes } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const [, navegar] = useLocation();
  const [aberto, setAberto] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  if (!usuario) return null;

  const emCurso = ativos(processos);
  const comCliente = emCurso.filter((processo) => processo.comQuem === "cliente");
  const comEscritorio = emCurso.filter((processo) => processo.comQuem === "escritorio");
  const concluidos = processos.filter((processo) => processo.etapa === "finalizado");
  const lista = alertas(processos, clientes, HOJE);

  return (
    <>
      <Cabecalho
        rotulo="Legal Workflow"
        titulo="Painel"
        descricao="Procurações em andamento, com quem está cada uma e o que pede atenção."
        acoes={
          pode(usuario, "registros.editar") ? (
            <button type="button" className="button-primary" onClick={() => setCriando(true)}>
              <Plus size={15} strokeWidth={2.2} /> Novo processo
            </button>
          ) : null
        }
      />
      <div className="kpi-grid">
        <Kpi rotulo="Com o cliente" valor={String(comCliente.length)} detalhe="aguardando retorno" icone={Users} aoClicar={() => navegar("/legal/pipeline?com=cliente")} />
        <Kpi rotulo="Com o escritório" valor={String(comEscritorio.length)} detalhe="próxima ação é nossa" icone={Hourglass} aoClicar={() => navegar("/legal/pipeline?com=escritorio")} />
        <Kpi rotulo="Concluídos" valor={String(concluidos.length)} detalhe="procurações registradas" icone={CheckCircle2} />
        <Kpi rotulo="Alertas" valor={String(lista.length)} detalhe={lista.length ? "pedem atenção" : "nada pendente"} icone={AlertTriangle} />
      </div>
      <div className="grid-main">
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Atenção</span>
              <h3>Alertas ativos</h3>
              <p>Parados há 7 dias ou mais, procurações vencendo em até 60 dias e e-mails que voltaram.</p>
            </div>
          </div>
          {lista.length === 0 ? (
            <Vazio icone={ShieldCheck} titulo="Nenhum alerta no momento" />
          ) : (
            <ul className="item-list">
              {lista.map((alerta, indice) => (
                <li className="item-row" key={indice}>
                  <span className="risk-icon" style={alerta.gravidade === "alta" ? { color: "var(--status-red-fg)", background: "var(--status-red-bg)" } : undefined}>
                    <AlertTriangle size={14} strokeWidth={2} />
                    <span className="sr-only">{alerta.gravidade === "alta" ? "Alta prioridade" : "Média prioridade"}</span>
                  </span>
                  <div className="item-row-copy">
                    <strong>{alerta.titulo}</strong>
                    <span>{alerta.descricao}</span>
                  </div>
                  <button type="button" className="text-button" onClick={() => setAberto(alerta.processo.id)}>
                    Ver
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h3>Processos por etapa</h3>
            </div>
          </div>
          <Barras
            rotuloAcessivel="Processos por etapa"
            linhas={ETAPAS.map((etapa) => {
              const total = processos.filter((processo) => processo.etapa === etapa.chave).length;
              return { rotulo: etapa.nome, valor: total, texto: String(total) };
            })}
          />
        </section>
      </div>
      {aberto ? <DetalheProcesso id={aberto} aoFechar={() => setAberto(null)} /> : null}
      {criando ? <FormularioProcesso processo={null} clientes={clientes} autor={usuario.nome} aoFechar={() => setCriando(false)} /> : null}
    </>
  );
}
