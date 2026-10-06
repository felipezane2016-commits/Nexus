import { gravarItem } from "@/_core/armazenamento/colecao";
import { gerarId, HOJE } from "@/_core/tempo";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import type { Tom } from "@/admin/componentes/Selo";
import { parseAmount } from "@/lib/portal";
import { clientesConsultoria, trabalhos } from "@/modulos/consultoria/colecoes";
import {
  SERVICOS_CONSULTORIA,
  STATUS_PAGAMENTO,
  STATUS_TRABALHO,
  type ClienteConsultoria,
  type ServicoConsultoria,
  type StatusPagamento,
  type StatusTrabalho,
  type Trabalho,
} from "@/modulos/consultoria/tipos";
import { useState } from "react";

export const TOM_TRABALHO: Record<StatusTrabalho, Tom> = { Pendente: "neutral", "Em andamento": "blue", Concluído: "green", Cancelado: "red" };
export const TOM_PAGAMENTO: Record<StatusPagamento, Tom> = { Pendente: "amber", Parcial: "blue", Pago: "green" };

export function FormularioCliente({ cliente, aoFechar }: { cliente: ClienteConsultoria | null; aoFechar: () => void }) {
  const [dados, setDados] = useState({
    nome: cliente?.nome ?? "",
    tags: cliente?.tags.join(", ") ?? "",
    cadastro: cliente?.cadastro ?? HOJE,
    contato: cliente?.contato ?? "",
    observacoes: cliente?.observacoes ?? "",
  });
  const [erro, setErro] = useState<string | undefined>();
  return (
    <Painel
      rotulo="Consultoria"
      titulo={cliente ? "Editar cliente" : "Novo cliente"}
      aoFechar={aoFechar}
      aoEnviar={() => {
        if (!dados.nome.trim()) {
          setErro("Informe o nome do cliente.");
          return;
        }
        clientesConsultoria.atualizar((lista) =>
          gravarItem(lista, {
            id: cliente?.id ?? gerarId("cc"),
            reunioes: cliente?.reunioes ?? [],
            nome: dados.nome.trim(),
            tags: dados.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            cadastro: dados.cadastro,
            contato: dados.contato.trim(),
            observacoes: dados.observacoes.trim(),
          }),
        );
        aoFechar();
      }}
    >
      <Campo id="cc-nome" rotulo="Nome" erro={erro}>
        {(aria) => <input {...aria} className="field-input" value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />}
      </Campo>
      <Campo id="cc-tags" rotulo="Tags" dica="Separadas por vírgula — ex.: Indústria, PME, Ativo">
        {(aria) => <input {...aria} className="field-input" value={dados.tags} onChange={(e) => setDados({ ...dados, tags: e.target.value })} />}
      </Campo>
      <div className="field-grid">
        <Campo id="cc-cadastro" rotulo="Cliente desde">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.cadastro} onChange={(e) => setDados({ ...dados, cadastro: e.target.value })} />}
        </Campo>
        <Campo id="cc-contato" rotulo="Contato">
          {(aria) => <input {...aria} className="field-input" value={dados.contato} onChange={(e) => setDados({ ...dados, contato: e.target.value })} />}
        </Campo>
      </div>
      <Campo id="cc-obs" rotulo="Observações">
        {(aria) => <textarea {...aria} className="field-input" value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} />}
      </Campo>
    </Painel>
  );
}

type PropsTrabalho = { trabalho: Trabalho | null; clientes: ClienteConsultoria[]; clienteFixo?: string; podeExcluir: boolean; aoFechar: () => void };

export function FormularioTrabalho({ trabalho, clientes, clienteFixo, podeExcluir, aoFechar }: PropsTrabalho) {
  const [dados, setDados] = useState({
    clienteId: trabalho?.clienteId ?? clienteFixo ?? "",
    data: trabalho?.data ?? HOJE,
    servicos: trabalho?.servicos ?? ([] as ServicoConsultoria[]),
    descricao: trabalho?.descricao ?? "",
    status: trabalho?.status ?? ("Pendente" as StatusTrabalho),
    pagamento: trabalho?.pagamento ?? ("Pendente" as StatusPagamento),
    valor: trabalho ? trabalho.valor.toFixed(2).replace(".", ",") : "",
  });
  const [erros, setErros] = useState<{ clienteId?: string; servicos?: string; valor?: string }>({});
  const valor = parseAmount(dados.valor || "0");

  function salvar() {
    const encontrados = {
      clienteId: dados.clienteId ? undefined : "Escolha o cliente.",
      servicos: dados.servicos.length ? undefined : "Marque ao menos um serviço.",
      valor: Number.isNaN(valor) || valor < 0 ? "Valor inválido." : undefined,
    };
    if (Object.values(encontrados).some(Boolean)) {
      setErros(encontrados);
      return;
    }
    trabalhos.atualizar((lista) => gravarItem(lista, { id: trabalho?.id ?? gerarId("tb"), ...dados, descricao: dados.descricao.trim(), valor }));
    aoFechar();
  }

  return (
    <Painel
      rotulo="Consultoria"
      titulo={trabalho ? "Editar trabalho" : "Novo trabalho"}
      aoFechar={aoFechar}
      aoEnviar={salvar}
      rodapeExtra={
        trabalho && podeExcluir ? (
          <button
            type="button"
            className="text-button"
            style={{ color: "var(--status-red-fg)" }}
            onClick={() => {
              trabalhos.atualizar((lista) => lista.filter((item) => item.id !== trabalho.id));
              aoFechar();
            }}
          >
            Excluir
          </button>
        ) : null
      }
    >
      <div className="field-grid">
        <Campo id="tb-cliente" rotulo="Empresa" erro={erros.clienteId}>
          {(aria) => (
            <select {...aria} className="field-input" value={dados.clienteId} disabled={Boolean(clienteFixo)} onChange={(e) => setDados({ ...dados, clienteId: e.target.value })}>
              <option value="">Escolha a empresa</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="tb-data" rotulo="Data">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.data} onChange={(e) => setDados({ ...dados, data: e.target.value })} />}
        </Campo>
      </div>
      <fieldset className="field-group" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label" style={{ marginBottom: 6 }}>
          Serviços
        </legend>
        <div className="filter-chips">
          {SERVICOS_CONSULTORIA.map((servico) => {
            const ativo = dados.servicos.includes(servico);
            return (
              <button
                key={servico}
                type="button"
                className={ativo ? "filter-chip filter-chip-active" : "filter-chip"}
                aria-pressed={ativo}
                onClick={() => {
                  setDados({ ...dados, servicos: ativo ? dados.servicos.filter((item) => item !== servico) : [...dados.servicos, servico] });
                  setErros({ ...erros, servicos: undefined });
                }}
              >
                {servico}
              </button>
            );
          })}
        </div>
        {erros.servicos ? (
          <span className="field-error" role="alert">
            {erros.servicos}
          </span>
        ) : null}
      </fieldset>
      <Campo id="tb-descricao" rotulo="Descrição">
        {(aria) => <textarea {...aria} className="field-input" value={dados.descricao} onChange={(e) => setDados({ ...dados, descricao: e.target.value })} />}
      </Campo>
      <div className="field-grid">
        <Campo id="tb-status" rotulo="Status do serviço">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.status} onChange={(e) => setDados({ ...dados, status: e.target.value as StatusTrabalho })}>
              {STATUS_TRABALHO.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="tb-pagamento" rotulo="Pagamento">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.pagamento} onChange={(e) => setDados({ ...dados, pagamento: e.target.value as StatusPagamento })}>
              {STATUS_PAGAMENTO.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <Campo id="tb-valor" rotulo="Valor (R$)" erro={erros.valor}>
        {(aria) => <input {...aria} className="field-input" inputMode="decimal" value={dados.valor} onChange={(e) => setDados({ ...dados, valor: e.target.value })} placeholder="0,00" />}
      </Campo>
    </Painel>
  );
}
