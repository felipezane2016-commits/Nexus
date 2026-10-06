import { gravarItem } from "@/_core/armazenamento/colecao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Kpi from "@/admin/componentes/Kpi";
import Painel from "@/admin/componentes/Painel";
import Selo, { type Tom } from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { formatBRL, formatMonth, parseAmount } from "@/lib/portal";
import { CATEGORIAS_DESPESA, despesas, useDadosParticular, type CategoriaDespesa, type Despesa, type StatusDespesa } from "@/modulos/particular/colecoes";
import { Plus, Receipt, Repeat, Shuffle, Wallet } from "lucide-react";
import { useState } from "react";

const TOM: Record<StatusDespesa, Tom> = { Pendente: "amber", "Em andamento": "blue", Pago: "green" };

export default function FinanceiroPessoal() {
  const { despesas: lista } = useDadosParticular();
  const meses = Array.from(new Set([...lista.map((despesa) => despesa.data.slice(0, 7)), HOJE.slice(0, 7)])).sort().reverse();
  const [mes, setMes] = useState(HOJE.slice(0, 7));
  const [editando, setEditando] = useState<Despesa | "nova" | null>(null);
  const doMes = lista.filter((despesa) => despesa.data.startsWith(mes)).sort((a, b) => a.data.localeCompare(b.data));
  const soma = (filtro: (despesa: Despesa) => boolean) => doMes.filter(filtro).reduce((total, despesa) => total + despesa.valor, 0);

  return (
    <>
      <Cabecalho
        rotulo="Particular"
        titulo="Financeiro"
        descricao="Despesas pessoais do mês, fixas e variáveis."
        acoes={
          <>
            <select className="field-input" style={{ width: "auto" }} value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mês">
              {meses.map((item) => (
                <option key={item} value={item}>
                  {formatMonth(item)}
                </option>
              ))}
            </select>
            <button type="button" className="button-primary" onClick={() => setEditando("nova")}>
              <Plus size={15} strokeWidth={2.2} /> Nova despesa
            </button>
          </>
        }
      />
      <div className="kpi-grid">
        <Kpi rotulo="Total do mês" valor={formatBRL(soma(() => true))} detalhe={`${doMes.length} despesa(s)`} icone={Wallet} />
        <Kpi rotulo="Fixas" valor={formatBRL(soma((despesa) => despesa.fixa))} icone={Repeat} />
        <Kpi rotulo="Variáveis" valor={formatBRL(soma((despesa) => !despesa.fixa))} icone={Shuffle} />
        <Kpi rotulo="Em aberto" valor={formatBRL(soma((despesa) => despesa.status !== "Pago"))} icone={Receipt} />
      </div>
      <section className="operations-surface">
        {doMes.length === 0 ? (
          <Vazio icone={Receipt} titulo="Nenhuma despesa no mês" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Despesa</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Parcelas</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {doMes.map((despesa) => (
                  <tr key={despesa.id}>
                    <td className="cell-main">
                      <button type="button" className="text-button" style={{ color: "var(--foreground)" }} onClick={() => setEditando(despesa)}>
                        <strong>{despesa.titulo}</strong>
                      </button>
                      <span>{despesa.categoria}</span>
                    </td>
                    <td>{formatarData(despesa.data)}</td>
                    <td>{despesa.fixa ? "Fixa" : "Variável"}</td>
                    <td>{despesa.parcelas || "—"}</td>
                    <td>
                      <Selo tom={TOM[despesa.status]}>{despesa.status}</Selo>
                    </td>
                    <td className="money">{formatBRL(despesa.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editando ? <FormularioDespesa despesa={editando === "nova" ? null : editando} mes={mes} aoFechar={() => setEditando(null)} /> : null}
    </>
  );
}

function FormularioDespesa({ despesa, mes, aoFechar }: { despesa: Despesa | null; mes: string; aoFechar: () => void }) {
  const [dados, setDados] = useState({
    titulo: despesa?.titulo ?? "",
    data: despesa?.data ?? (HOJE.startsWith(mes) ? HOJE : `${mes}-01`),
    valor: despesa ? despesa.valor.toFixed(2).replace(".", ",") : "",
    fixa: despesa?.fixa ?? false,
    categoria: despesa?.categoria ?? ("Diversos" as CategoriaDespesa),
    parcelas: despesa?.parcelas ?? "",
    status: despesa?.status ?? ("Pendente" as StatusDespesa),
    observacoes: despesa?.observacoes ?? "",
  });
  const [erros, setErros] = useState<{ titulo?: string; valor?: string }>({});
  const valor = parseAmount(dados.valor);

  return (
    <Painel
      rotulo="Particular"
      titulo={despesa ? "Editar despesa" : "Nova despesa"}
      aoFechar={aoFechar}
      aoEnviar={() => {
        const encontrados = { titulo: dados.titulo.trim() ? undefined : "Informe a despesa.", valor: valor > 0 ? undefined : "Informe um valor maior que zero." };
        if (encontrados.titulo || encontrados.valor) {
          setErros(encontrados);
          return;
        }
        despesas.atualizar((lista) => gravarItem(lista, { id: despesa?.id ?? gerarId("dp"), ...dados, titulo: dados.titulo.trim(), valor }));
        aoFechar();
      }}
      rodapeExtra={
        despesa ? (
          <button
            type="button"
            className="text-button"
            style={{ color: "var(--status-red-fg)" }}
            onClick={() => {
              despesas.atualizar((lista) => lista.filter((item) => item.id !== despesa.id));
              aoFechar();
            }}
          >
            Excluir
          </button>
        ) : null
      }
    >
      <Campo id="dp-titulo" rotulo="Despesa" erro={erros.titulo}>
        {(aria) => <input {...aria} className="field-input" value={dados.titulo} onChange={(e) => setDados({ ...dados, titulo: e.target.value })} placeholder="Ex.: Aluguel" />}
      </Campo>
      <div className="field-grid">
        <Campo id="dp-data" rotulo="Data">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.data} onChange={(e) => setDados({ ...dados, data: e.target.value })} />}
        </Campo>
        <Campo id="dp-valor" rotulo="Valor (R$)" erro={erros.valor}>
          {(aria) => <input {...aria} className="field-input" inputMode="decimal" value={dados.valor} onChange={(e) => setDados({ ...dados, valor: e.target.value })} placeholder="0,00" />}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="dp-tipo" rotulo="Tipo">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.fixa ? "Fixa" : "Variável"} onChange={(e) => setDados({ ...dados, fixa: e.target.value === "Fixa" })}>
              <option>Fixa</option>
              <option>Variável</option>
            </select>
          )}
        </Campo>
        <Campo id="dp-categoria" rotulo="Categoria">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.categoria} onChange={(e) => setDados({ ...dados, categoria: e.target.value as CategoriaDespesa })}>
              {CATEGORIAS_DESPESA.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="dp-parcelas" rotulo="Parcelas" dica="Ex.: 3/12">
          {(aria) => <input {...aria} className="field-input" value={dados.parcelas} onChange={(e) => setDados({ ...dados, parcelas: e.target.value })} />}
        </Campo>
        <Campo id="dp-status" rotulo="Status">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.status} onChange={(e) => setDados({ ...dados, status: e.target.value as StatusDespesa })}>
              <option>Pendente</option>
              <option>Em andamento</option>
              <option>Pago</option>
            </select>
          )}
        </Campo>
      </div>
      <Campo id="dp-obs" rotulo="Observações">
        {(aria) => <textarea {...aria} className="field-input" value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
