import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL } from "@/lib/portal";
import { resumoTrabalhos, useDadosConsultoria } from "@/modulos/consultoria/colecoes";
import { Plus, Search, SearchX } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { FormularioCliente } from "./comum";

export default function ClientesConsultoria() {
  const { clientes, trabalhos } = useDadosConsultoria();
  const usuario = useUsuarioAtual();
  const [, navegar] = useLocation();
  const [busca, setBusca] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const tags = Array.from(new Set(clientes.flatMap((cliente) => cliente.tags))).sort();
  const termo = busca.trim().toLowerCase();
  const visiveis = clientes
    .filter((cliente) => !tag || cliente.tags.includes(tag))
    .filter((cliente) => !termo || cliente.nome.toLowerCase().includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <Cabecalho
        rotulo="Consultoria Empresarial"
        titulo="Clientes"
        descricao={`${clientes.length} cliente(s). Abra um cliente para ver reuniões, serviços e trabalhos.`}
        acoes={
          pode(usuario, "registros.editar") ? (
            <button type="button" className="button-primary" onClick={() => setCriando(true)}>
              <Plus size={15} strokeWidth={2.2} /> Novo cliente
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente" aria-label="Buscar clientes" />
          </label>
          <div className="filter-chips" role="group" aria-label="Filtrar por tag">
            <button type="button" className={!tag ? "filter-chip filter-chip-active" : "filter-chip"} aria-pressed={!tag} onClick={() => setTag(null)}>
              Todas
            </button>
            {tags.map((item) => (
              <button key={item} type="button" className={tag === item ? "filter-chip filter-chip-active" : "filter-chip"} aria-pressed={tag === item} onClick={() => setTag(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        {visiveis.length === 0 ? (
          <Vazio icone={SearchX} titulo="Nenhum cliente encontrado" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tags</th>
                  <th>Trabalhos</th>
                  <th>A receber</th>
                  <th>Desde</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((cliente) => {
                  const resumo = resumoTrabalhos(trabalhos.filter((trabalho) => trabalho.clienteId === cliente.id));
                  return (
                    <tr key={cliente.id}>
                      <td className="cell-main">
                        <strong>{cliente.nome}</strong>
                        <span>{cliente.contato || "—"}</span>
                      </td>
                      <td>
                        <div className="inline-row" style={{ gap: 4 }}>
                          {cliente.tags.map((item) => (
                            <span key={item} className="status-pill status-neutral">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{resumo.quantidade}</td>
                      <td className="money">{formatBRL(resumo.aReceber)}</td>
                      <td>{formatarData(cliente.cadastro)}</td>
                      <td>
                        <div className="cell-actions">
                          <button type="button" className="text-button" onClick={() => navegar(`/consultoria/cliente/${cliente.id}`)}>
                            Abrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {criando ? <FormularioCliente cliente={null} aoFechar={() => setCriando(false)} /> : null}
    </>
  );
}
