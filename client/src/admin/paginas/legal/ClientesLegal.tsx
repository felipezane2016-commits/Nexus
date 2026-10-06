import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, gerarId } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import { salvarClienteLegal } from "@/modulos/legal/acoes";
import { useDadosLegal } from "@/modulos/legal/colecoes";
import type { ClienteLegal } from "@/modulos/legal/tipos";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

/** Máscara de CNPJ enquanto digita: 00.000.000/0000-00. */
function mascararCnpj(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function ClientesLegal() {
  const { clientes, processos } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const [, navegar] = useLocation();
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<ClienteLegal | "novo" | null>(null);
  const termo = busca.trim().toLowerCase();
  const visiveis = clientes.filter((cliente) => !termo || `${cliente.razaoBrasil} ${cliente.razaoExterior} ${cliente.pais}`.toLowerCase().includes(termo));
  const podeEditar = pode(usuario, "registros.editar");

  return (
    <>
      <Cabecalho
        rotulo="Legal Workflow"
        titulo="Clientes"
        descricao={`${clientes.length} cliente(s) com empresa no Brasil e controladora no exterior.`}
        acoes={
          podeEditar ? (
            <button type="button" className="button-primary" onClick={() => setEditando("novo")}>
              <Plus size={15} strokeWidth={2.2} /> Novo cliente
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar empresa ou país" aria-label="Buscar clientes" />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Processos</th>
                <th>Responsável</th>
                <th>País</th>
                <th>Último contato</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((cliente) => {
                const doCliente = processos.filter((processo) => processo.clienteId === cliente.id);
                const emCurso = doCliente.filter((processo) => processo.etapa !== "finalizado").length;
                const ultimo = doCliente.map((processo) => processo.ultimaAtividade).sort().pop();
                return (
                  <tr key={cliente.id}>
                    <td className="cell-main">
                      <strong>{cliente.razaoBrasil}</strong>
                      <span>{cliente.razaoExterior}</span>
                    </td>
                    <td>
                      <button type="button" className="text-button" onClick={() => navegar("/legal/pipeline")}>
                        {emCurso} em curso · {doCliente.length} no total
                      </button>
                    </td>
                    <td>{cliente.responsavel || "—"}</td>
                    <td>{cliente.pais || "—"}</td>
                    <td>{formatarData(ultimo)}</td>
                    <td>
                      <div className="cell-actions">
                        {podeEditar ? (
                          <button type="button" className="text-button" onClick={() => setEditando(cliente)}>
                            Editar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {editando ? <FormularioCliente cliente={editando === "novo" ? null : editando} aoFechar={() => setEditando(null)} /> : null}
    </>
  );
}

function FormularioCliente({ cliente, aoFechar }: { cliente: ClienteLegal | null; aoFechar: () => void }) {
  const [dados, setDados] = useState<ClienteLegal>(
    cliente ?? { id: gerarId("cl"), razaoBrasil: "", cnpjBrasil: "", razaoExterior: "", cnpjExterior: "", emails: "", pais: "", responsavel: "" },
  );
  const [erros, setErros] = useState<{ razaoBrasil?: string; emails?: string }>({});
  const mudar = (campo: keyof ClienteLegal, valor: string) => setDados((atual) => ({ ...atual, [campo]: valor }));

  function salvar() {
    const encontrados = {
      razaoBrasil: dados.razaoBrasil.trim() || dados.razaoExterior.trim() ? undefined : "Informe ao menos uma razão social.",
      emails: dados.emails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)
        .every((email) => /^\S+@\S+\.\S+$/.test(email))
        ? undefined
        : "Há um e-mail inválido na lista.",
    };
    if (encontrados.razaoBrasil || encontrados.emails) {
      setErros(encontrados);
      return;
    }
    salvarClienteLegal({ ...dados, razaoBrasil: dados.razaoBrasil.trim() || dados.razaoExterior.trim() });
    aoFechar();
  }

  return (
    <Painel rotulo="Legal Workflow" titulo={cliente ? "Editar cliente" : "Cadastro de cliente"} aoFechar={aoFechar} aoEnviar={salvar}>
      <span className="eyebrow">Empresa estrangeira</span>
      <div className="field-grid">
        <Campo id="cl-razao-ext" rotulo="Razão social">
          {(aria) => <input {...aria} className="field-input" value={dados.razaoExterior} onChange={(e) => mudar("razaoExterior", e.target.value)} />}
        </Campo>
        <Campo id="cl-pais" rotulo="País">
          {(aria) => <input {...aria} className="field-input" value={dados.pais} onChange={(e) => mudar("pais", e.target.value)} placeholder="EUA, Portugal…" />}
        </Campo>
      </div>
      <span className="eyebrow">Empresa brasileira</span>
      <div className="field-grid">
        <Campo id="cl-razao-br" rotulo="Razão social" erro={erros.razaoBrasil}>
          {(aria) => <input {...aria} className="field-input" value={dados.razaoBrasil} onChange={(e) => mudar("razaoBrasil", e.target.value)} />}
        </Campo>
        <Campo id="cl-cnpj-br" rotulo="CNPJ">
          {(aria) => <input {...aria} className="field-input" value={dados.cnpjBrasil} onChange={(e) => mudar("cnpjBrasil", mascararCnpj(e.target.value))} inputMode="numeric" placeholder="00.000.000/0000-00" />}
        </Campo>
      </div>
      <Campo id="cl-emails" rotulo="E-mails" erro={erros.emails} dica="Separe vários com vírgula">
        {(aria) => <input {...aria} className="field-input" value={dados.emails} onChange={(e) => mudar("emails", e.target.value)} />}
      </Campo>
      <Campo id="cl-responsavel" rotulo="Responsável no escritório">
        {(aria) => <input {...aria} className="field-input" value={dados.responsavel} onChange={(e) => mudar("responsavel", e.target.value)} />}
      </Campo>
    </Painel>
  );
}
