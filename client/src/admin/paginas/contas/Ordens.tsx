import { gravarItem } from "@/_core/armazenamento/colecao";
import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Kpi from "@/admin/componentes/Kpi";
import Painel from "@/admin/componentes/Painel";
import Selo from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL, parseAmount } from "@/lib/portal";
import { ordens, useDadosContas } from "@/modulos/contas/colecoes";
import { formatarMoeda, formatarTaxa } from "@/modulos/contas/formato";
import { ordensDoMes, valorEmReais } from "@/modulos/contas/regras";
import { TIPOS_ORDEM, type Moeda, type Ordem, type TipoOrdem } from "@/modulos/contas/tipos";
import { ClipboardCheck, Clock3, Euro, Plus, Search, SearchX } from "lucide-react";
import { useState } from "react";

export default function Ordens() {
  const { ordens: lista } = useDadosContas();
  const usuario = useUsuarioAtual();
  const [mes, setMes] = useState(HOJE.slice(0, 7));
  const [moeda, setMoeda] = useState<Moeda | "todas">("todas");
  const [situacao, setSituacao] = useState<"todas" | "pendentes" | "fechadas">("todas");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Ordem | "nova" | null>(null);

  const doMes = ordensDoMes(lista, mes);
  const termo = busca.trim().toLowerCase();
  const visiveis = doMes
    .filter((ordem) => moeda === "todas" || ordem.moeda === moeda)
    .filter((ordem) => situacao === "todas" || (situacao === "pendentes" ? !ordem.fechamento : Boolean(ordem.fechamento)))
    .filter((ordem) => !termo || `${ordem.cliente} ${ordem.faturas.join(" ")}`.toLowerCase().includes(termo))
    .sort((a, b) => b.dataRecebimento.localeCompare(a.dataRecebimento));
  const pendentes = lista.filter((ordem) => !ordem.fechamento);
  const volume = (alvo: Moeda) => doMes.filter((ordem) => ordem.moeda === alvo).reduce((soma, ordem) => soma + ordem.valor, 0);

  return (
    <>
      <Cabecalho
        rotulo="Banco Industrial"
        titulo="Ordens recebidas"
        descricao="Pagamentos do exterior que chegam em moeda estrangeira e esperam o fechamento do câmbio."
        acoes={
          pode(usuario, "registros.editar") ? (
            <button type="button" className="button-primary" onClick={() => setEditando("nova")}>
              <Plus size={15} strokeWidth={2.2} /> Nova ordem
            </button>
          ) : null
        }
      />
      <div className="kpi-grid">
        <Kpi rotulo="Pendentes" valor={String(pendentes.length)} detalhe="aguardando fechamento" icone={Clock3} aoClicar={() => setSituacao("pendentes")} />
        <Kpi rotulo="Fechadas no mês" valor={String(doMes.filter((ordem) => ordem.fechamento).length)} icone={ClipboardCheck} />
        <Kpi rotulo="Volume USD no mês" valor={formatarMoeda(volume("USD"), "USD")} />
        <Kpi rotulo="Volume EUR no mês" valor={formatarMoeda(volume("EUR"), "EUR")} icone={Euro} />
      </div>
      <section className="operations-surface">
        <div className="surface-toolbar">
          <label className="inline-search">
            <Search size={15} strokeWidth={1.9} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente ou fatura" aria-label="Buscar ordens" />
          </label>
          <div className="inline-row">
            <input className="field-input field-input-compacto" type="month" value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mês" />
            <select className="field-input field-input-compacto" value={moeda} onChange={(e) => setMoeda(e.target.value as Moeda | "todas")} aria-label="Moeda">
              <option value="todas">Todas as moedas</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
            <select className="field-input field-input-compacto" value={situacao} onChange={(e) => setSituacao(e.target.value as typeof situacao)} aria-label="Situação">
              <option value="todas">Todas</option>
              <option value="pendentes">Pendentes</option>
              <option value="fechadas">Fechadas</option>
            </select>
          </div>
        </div>
        {visiveis.length === 0 ? (
          <Vazio icone={SearchX} titulo="Nenhuma ordem encontrada" texto="Mude o mês ou os filtros." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Recebimento</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Cotação</th>
                  <th>Em reais</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((ordem) => (
                  <tr key={ordem.id}>
                    <td>{formatarData(ordem.dataRecebimento)}</td>
                    <td className="cell-main">
                      <strong>{ordem.cliente}</strong>
                      <span>Faturas {ordem.faturas.join(", ") || "—"}</span>
                    </td>
                    <td className="money">{formatarMoeda(ordem.valor, ordem.moeda)}</td>
                    <td>{ordem.tipo}</td>
                    <td>{ordem.fechamento ? formatarTaxa(ordem.fechamento.cotacao) : "—"}</td>
                    <td className="money">{ordem.fechamento ? formatBRL(valorEmReais(ordem) ?? 0) : "—"}</td>
                    <td>{ordem.fechamento ? <Selo tom="green">Fechada em {formatarData(ordem.fechamento.data)}</Selo> : <Selo tom="amber">Pendente</Selo>}</td>
                    <td>
                      {pode(usuario, "registros.editar") ? (
                        <button type="button" className="text-button" onClick={() => setEditando(ordem)}>
                          {ordem.fechamento ? "Editar" : "Fechar"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editando ? <FormularioOrdem ordem={editando === "nova" ? null : editando} autor={usuario?.nome ?? ""} aoFechar={() => setEditando(null)} /> : null}
    </>
  );
}

type Erros = Partial<Record<"cliente" | "valor" | "cotacao", string>>;

function FormularioOrdem({ ordem, autor, aoFechar }: { ordem: Ordem | null; autor: string; aoFechar: () => void }) {
  const [dados, setDados] = useState({
    dataRecebimento: ordem?.dataRecebimento ?? HOJE,
    cliente: ordem?.cliente ?? "",
    moeda: ordem?.moeda ?? ("EUR" as Moeda),
    valor: ordem ? String(ordem.valor).replace(".", ",") : "",
    tipo: ordem?.tipo ?? ("Honorários" as TipoOrdem),
    faturas: ordem?.faturas.join(", ") ?? "",
    observacoes: ordem?.observacoes ?? "",
    fechada: Boolean(ordem?.fechamento),
    cotacao: ordem?.fechamento ? String(ordem.fechamento.cotacao).replace(".", ",") : "",
    dataFechamento: ordem?.fechamento?.data ?? HOJE,
    responsavel: ordem?.fechamento?.responsavel ?? autor,
  });
  const [erros, setErros] = useState<Erros>({});
  const valor = parseAmount(dados.valor);
  const cotacao = Number.parseFloat(dados.cotacao.replace(",", "."));

  function salvar() {
    const encontrados: Erros = {};
    if (!dados.cliente.trim()) encontrados.cliente = "Informe o cliente.";
    if (!(valor > 0)) encontrados.valor = "Informe o valor na moeda estrangeira.";
    if (dados.fechada && !(cotacao >= 1 && cotacao <= 20)) encontrados.cotacao = "Cotação entre 1 e 20 (ex.: 6,2500).";
    if (Object.values(encontrados).some(Boolean)) {
      setErros(encontrados);
      return;
    }
    ordens.atualizar((lista) =>
      gravarItem(lista, {
        id: ordem?.id ?? gerarId("ord"),
        dataRecebimento: dados.dataRecebimento,
        cliente: dados.cliente.trim(),
        moeda: dados.moeda,
        valor,
        tipo: dados.tipo,
        faturas: dados.faturas
          .split(",")
          .map((fatura) => fatura.trim())
          .filter(Boolean),
        observacoes: dados.observacoes.trim(),
        fechamento: dados.fechada ? { cotacao, data: dados.dataFechamento, responsavel: dados.responsavel.trim() } : null,
      }),
    );
    aoFechar();
  }

  return (
    <Painel rotulo="Ordens recebidas" titulo={ordem ? `Ordem de ${ordem.cliente}` : "Nova ordem"} aoFechar={aoFechar} aoEnviar={salvar}>
      <div className="field-grid">
        <Campo id="ord-data" rotulo="Data de recebimento">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.dataRecebimento} onChange={(e) => setDados({ ...dados, dataRecebimento: e.target.value })} />}
        </Campo>
        <Campo id="ord-moeda" rotulo="Moeda">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.moeda} onChange={(e) => setDados({ ...dados, moeda: e.target.value as Moeda })}>
              <option>EUR</option>
              <option>USD</option>
            </select>
          )}
        </Campo>
      </div>
      <Campo id="ord-cliente" rotulo="Cliente" erro={erros.cliente}>
        {(aria) => <input {...aria} className="field-input" value={dados.cliente} onChange={(e) => setDados({ ...dados, cliente: e.target.value })} />}
      </Campo>
      <div className="field-grid">
        <Campo id="ord-valor" rotulo={`Valor em ${dados.moeda}`} erro={erros.valor}>
          {(aria) => <input {...aria} className="field-input" inputMode="decimal" value={dados.valor} onChange={(e) => setDados({ ...dados, valor: e.target.value })} placeholder="1.234,56" />}
        </Campo>
        <Campo id="ord-tipo" rotulo="Tipo">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.tipo} onChange={(e) => setDados({ ...dados, tipo: e.target.value as TipoOrdem })}>
              {TIPOS_ORDEM.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <Campo id="ord-faturas" rotulo="Faturas" dica="Números separados por vírgula">
        {(aria) => <input {...aria} className="field-input" value={dados.faturas} onChange={(e) => setDados({ ...dados, faturas: e.target.value })} />}
      </Campo>
      <label className="check-label">
        <input type="checkbox" checked={dados.fechada} onChange={(e) => setDados({ ...dados, fechada: e.target.checked })} />
        Câmbio fechado
      </label>
      {dados.fechada ? (
        <div className="field-grid">
          <Campo id="ord-cotacao" rotulo="Cotação usada" erro={erros.cotacao} dica={cotacao > 0 && valor > 0 ? `= ${formatBRL(valor * cotacao)}` : undefined}>
            {(aria) => <input {...aria} className="field-input" inputMode="decimal" value={dados.cotacao} onChange={(e) => setDados({ ...dados, cotacao: e.target.value })} placeholder="6,2500" />}
          </Campo>
          <Campo id="ord-data-fech" rotulo="Data do fechamento">
            {(aria) => <input {...aria} className="field-input" type="date" value={dados.dataFechamento} onChange={(e) => setDados({ ...dados, dataFechamento: e.target.value })} />}
          </Campo>
        </div>
      ) : null}
      <Campo id="ord-obs" rotulo="Observações">
        {(aria) => <textarea {...aria} className="field-input" value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
