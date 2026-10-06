import { gravarItem } from "@/_core/armazenamento/colecao";
import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import { templates, useDadosLegal } from "@/modulos/legal/colecoes";
import { nomeEtapa, preencherTemplate } from "@/modulos/legal/regras";
import type { Template } from "@/modulos/legal/tipos";
import { Info, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Mostra as variáveis que ficaram sem valor, para quem revisa saber o que falta. */
function realcarVariaveis(texto: string): ReactNode[] {
  return texto.split(/(\{\{\w+\}\})/g).map((parte, indice) =>
    /^\{\{\w+\}\}$/.test(parte) ? (
      <span className="var-token" key={indice}>
        {parte}
      </span>
    ) : (
      parte
    ),
  );
}

export default function Templates() {
  const { templates: lista, processos, clientes } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const [selecionadoId, setSelecionadoId] = useState(lista[0]?.id ?? "");
  const [processoId, setProcessoId] = useState(processos[0]?.id ?? "");
  const [editando, setEditando] = useState(false);
  const selecionado = lista.find((item) => item.id === selecionadoId) ?? lista[0];
  const processo = processos.find((item) => item.id === processoId);
  const cliente = clientes.find((item) => item.id === processo?.clienteId);

  const valores: Record<string, string> = {
    nome_cliente: cliente?.razaoExterior ?? "",
    empresa: cliente?.razaoBrasil ?? "",
    nome_advogado: processo?.responsavel ?? "",
    nova_etapa: processo ? nomeEtapa(processo.etapa) : "",
    escritorio: "Nexus Escritório",
    prazo_dias: "30",
  };

  return (
    <>
      <Cabecalho rotulo="Legal Workflow" titulo="Templates de e-mail" descricao={`${lista.length} templates configurados, preenchidos com os dados de um processo real.`} />
      <div className="acesso-alerta-info" style={{ marginBottom: 18 }}>
        <Info size={15} strokeWidth={2} />
        <span>
          <strong>Em construção.</strong> O envio de e-mail entra com o backend; aqui você revisa e edita o texto.
        </span>
      </div>
      <div className="grid-main grid-aside">
        <section className="operations-surface">
          <ul className="item-list">
            {lista.map((item) => (
              <li className="item-row" key={item.id}>
                <span className="doc-icon" aria-hidden="true">
                  <Mail size={16} strokeWidth={1.9} />
                </span>
                <div className="item-row-copy">
                  <button
                    type="button"
                    className="text-button"
                    style={{ color: item.id === selecionado?.id ? "var(--action)" : "var(--foreground)" }}
                    aria-pressed={item.id === selecionado?.id}
                    onClick={() => setSelecionadoId(item.id)}
                  >
                    <strong>{item.nome}</strong>
                  </button>
                  <span>{item.gatilho}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {selecionado ? (
          <section className="operations-surface">
            <div className="section-header">
              <div>
                <span className="eyebrow">{selecionado.gatilho}</span>
                <h3>{selecionado.nome}</h3>
              </div>
              {pode(usuario, "registros.editar") ? (
                <button type="button" className="button-secondary" onClick={() => setEditando(true)}>
                  Editar
                </button>
              ) : null}
            </div>
            <div className="field-group" style={{ marginBottom: 14 }}>
              <label className="field-label" htmlFor="tp-processo">
                Pré-visualizar com o processo
              </label>
              <select id="tp-processo" className="field-input" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
                {processos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {clientes.find((c) => c.id === item.clienteId)?.razaoBrasil}
                  </option>
                ))}
              </select>
            </div>
            <p className="field-hint" style={{ marginBottom: 8 }}>
              Para: {cliente?.emails || "—"}
            </p>
            <div className="email-preview">{realcarVariaveis(preencherTemplate(selecionado.corpo, valores))}</div>
          </section>
        ) : null}
      </div>
      {editando && selecionado ? <EditarTemplate template={selecionado} aoFechar={() => setEditando(false)} /> : null}
    </>
  );
}

function EditarTemplate({ template, aoFechar }: { template: Template; aoFechar: () => void }) {
  const [dados, setDados] = useState(template);
  return (
    <Painel
      rotulo="Template"
      titulo={template.nome}
      descricao="Use {{nome_cliente}}, {{empresa}}, {{nome_advogado}}, {{nova_etapa}}, {{escritorio}} e {{prazo_dias}}."
      aoFechar={aoFechar}
      aoEnviar={() => {
        templates.atualizar((lista) => gravarItem(lista, dados));
        aoFechar();
      }}
    >
      <Campo id="tp-nome" rotulo="Nome">
        {(aria) => <input {...aria} className="field-input" value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />}
      </Campo>
      <Campo id="tp-corpo" rotulo="Texto">
        {(aria) => <textarea {...aria} className="field-input" style={{ minHeight: 260 }} value={dados.corpo} onChange={(e) => setDados({ ...dados, corpo: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
