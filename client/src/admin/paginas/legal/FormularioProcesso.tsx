import { HOJE } from "@/_core/tempo";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import { novoIdProcesso, salvarProcesso } from "@/modulos/legal/acoes";
import { processos } from "@/modulos/legal/colecoes";
import { TIPOS_PROCURACAO, type ClienteLegal, type ComQuem, type Processo, type TipoProcuracao } from "@/modulos/legal/tipos";
import { useState } from "react";

type Props = { processo: Processo | null; clientes: ClienteLegal[]; autor: string; aoFechar: () => void };

export default function FormularioProcesso({ processo, clientes, autor, aoFechar }: Props) {
  const [dados, setDados] = useState({
    clienteId: processo?.clienteId ?? "",
    tipo: processo?.tipo ?? ("Societária" as TipoProcuracao),
    responsavel: processo?.responsavel ?? autor,
    vencimento: processo?.vencimento ?? "",
    comQuem: processo?.comQuem ?? ("escritorio" as ComQuem),
    traducao: processo?.traducao ?? false,
    observacoes: processo?.observacoes ?? "",
  });
  const [erro, setErro] = useState<string | undefined>();
  const cliente = clientes.find((item) => item.id === dados.clienteId);

  function salvar() {
    if (!dados.clienteId) {
      setErro("Escolha o cliente. Se ainda não existe, cadastre em Clientes.");
      return;
    }
    const base = { ...dados, vencimento: dados.vencimento || null, observacoes: dados.observacoes.trim() };
    if (processo) {
      salvarProcesso({ ...processo, ...base });
    } else {
      salvarProcesso({
        id: novoIdProcesso(processos.ler()),
        ...base,
        etapa: "proposta",
        etapaDesde: HOJE,
        criadoEm: HOJE,
        ultimaAtividade: HOJE,
        comunicacoes: [{ id: `cm-${Date.now()}`, data: HOJE, tipo: "nota", descricao: "Processo criado · proposta a enviar", autor }],
      });
    }
    aoFechar();
  }

  return (
    <Painel
      rotulo="Legal Workflow"
      titulo={processo ? `Editar ${processo.id}` : "Novo processo de procuração"}
      descricao={processo ? undefined : "O processo entra em Proposta enviada e o relógio do SLA começa hoje."}
      aoFechar={aoFechar}
      aoEnviar={salvar}
      textoEnviar={processo ? "Salvar" : "Criar processo"}
    >
      <Campo id="pr-cliente" rotulo="Cliente" erro={erro}>
        {(aria) => (
          <select {...aria} className="field-input" value={dados.clienteId} onChange={(e) => (setDados({ ...dados, clienteId: e.target.value }), setErro(undefined))}>
            <option value="">Escolha um cliente do cadastro</option>
            {clientes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.razaoBrasil}
              </option>
            ))}
          </select>
        )}
      </Campo>
      {cliente ? (
        <dl className="data-list" style={{ padding: 14, borderRadius: 6, background: "var(--subtle)" }}>
          <div>
            <dt>Empresa estrangeira</dt>
            <dd>{cliente.razaoExterior || "—"}</dd>
          </div>
          <div>
            <dt>País</dt>
            <dd>{cliente.pais || "—"}</dd>
          </div>
          <div>
            <dt>CNPJ Brasil</dt>
            <dd>{cliente.cnpjBrasil || "—"}</dd>
          </div>
          <div>
            <dt>E-mails</dt>
            <dd>{cliente.emails || "—"}</dd>
          </div>
        </dl>
      ) : null}
      <div className="field-grid">
        <Campo id="pr-tipo" rotulo="Tipo de procuração">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.tipo} onChange={(e) => setDados({ ...dados, tipo: e.target.value as TipoProcuracao })}>
              {TIPOS_PROCURACAO.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="pr-vencimento" rotulo="Vencimento da procuração atual">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.vencimento} onChange={(e) => setDados({ ...dados, vencimento: e.target.value })} />}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="pr-responsavel" rotulo="Responsável no escritório">
          {(aria) => <input {...aria} className="field-input" value={dados.responsavel} onChange={(e) => setDados({ ...dados, responsavel: e.target.value })} />}
        </Campo>
        <Campo id="pr-comquem" rotulo="Com quem está">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.comQuem} onChange={(e) => setDados({ ...dados, comQuem: e.target.value as ComQuem })}>
              <option value="escritorio">Com o escritório</option>
              <option value="cliente">Com o cliente</option>
            </select>
          )}
        </Campo>
      </div>
      <label className="check-label">
        <input type="checkbox" checked={dados.traducao} onChange={(e) => setDados({ ...dados, traducao: e.target.checked })} />
        Requer tradução juramentada
      </label>
      <Campo id="pr-obs" rotulo="Observações">
        {(aria) => <textarea {...aria} className="field-input" value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
