import { HOJE } from "@/_core/tempo";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import { parseAmount } from "@/lib/portal";
import { novaOrdemVazia, salvarOrdem } from "@/modulos/contas/acoesOrdens";
import { formatarMoeda } from "@/modulos/contas/formato";
import { lerEmailOrdem } from "@/modulos/contas/regras";
import type { Moeda, Ordem } from "@/modulos/contas/tipos";
import { ScanText } from "lucide-react";
import { useState } from "react";

type Erros = Partial<Record<"numeroOrdem" | "cliente" | "valor", string>>;

/** Nova ordem (a partir do e-mail colado) ou edição dos dados de uma ordem. */
export default function FormularioOrdem({ ordem, autor, aoFechar, aoSalvar }: { ordem: Ordem | null; autor: string; aoFechar: () => void; aoSalvar: (id: string) => void }) {
  const base = ordem ?? novaOrdemVazia();
  const [colado, setColado] = useState("");
  const [leitura, setLeitura] = useState<string | null>(null);
  const [dados, setDados] = useState({
    numeroOrdem: base.numeroOrdem,
    dataRecebimento: base.dataRecebimento || HOJE,
    cliente: base.cliente,
    beneficiario: base.beneficiario,
    moeda: base.moeda,
    valor: base.valor ? base.valor.toFixed(2).replace(".", ",") : "",
    bloqueiaEmails: base.bloqueiaEmails,
    observacoes: base.observacoes,
  });
  const [erros, setErros] = useState<Erros>({});

  function lerColado() {
    const lido = lerEmailOrdem(colado);
    setDados((atual) => ({
      ...atual,
      numeroOrdem: lido.numeroOrdem || atual.numeroOrdem,
      cliente: lido.cliente || atual.cliente,
      beneficiario: lido.beneficiario || atual.beneficiario,
      moeda: lido.moeda ?? atual.moeda,
      valor: lido.valor ? lido.valor.toFixed(2).replace(".", ",") : atual.valor,
    }));
    setLeitura(
      lido.faltando.length === 0
        ? `Lido: ordem nº ${lido.numeroOrdem}, ${lido.cliente}, ${formatarMoeda(lido.valor ?? 0, lido.moeda ?? "EUR")}. Confira e salve.`
        : `Não encontrei no texto: ${lido.faltando.join(", ")}. Preencha à mão.`,
    );
  }

  function salvar() {
    const valor = parseAmount(dados.valor);
    const encontrados: Erros = {};
    if (!dados.numeroOrdem.trim()) encontrados.numeroOrdem = "Informe o nº da ordem.";
    if (!dados.cliente.trim()) encontrados.cliente = "Informe o ordenante.";
    if (!(valor > 0)) encontrados.valor = "Informe o valor da ordem.";
    if (Object.values(encontrados).some(Boolean)) {
      setErros(encontrados);
      return;
    }
    salvarOrdem(
      {
        ...base,
        numeroOrdem: dados.numeroOrdem.trim(),
        dataRecebimento: dados.dataRecebimento,
        cliente: dados.cliente.trim(),
        beneficiario: dados.beneficiario.trim(),
        moeda: dados.moeda,
        valor,
        bloqueiaEmails: dados.bloqueiaEmails,
        observacoes: dados.observacoes.trim(),
      },
      autor,
    );
    aoSalvar(base.id);
  }

  return (
    <Painel
      rotulo="Ordens de pagamento"
      titulo={ordem ? `Ordem nº ${ordem.numeroOrdem}` : "Nova ordem"}
      descricao={ordem ? undefined : "Cole o e-mail \"Ordem de Pagamento\" do Banco Industrial: o sistema lê ordenante, valor e nº da ordem."}
      aoFechar={aoFechar}
      aoEnviar={salvar}
    >
      {!ordem ? (
        <div className="field-group">
          <label className="field-label" htmlFor="ord-email">
            E-mail do Banco Industrial
          </label>
          <textarea
            id="ord-email"
            className="field-input"
            rows={6}
            value={colado}
            onChange={(e) => setColado(e.target.value)}
            placeholder={"Recebemos a seguinte ordem de pagamento:\nBeneficiário: …\nOrdenante: …\nValor: EUR. 1.263,49\nNº da ordem: 90626"}
          />
          <div className="inline-row espaco-acima-curto">
            <button type="button" className="button-secondary" onClick={lerColado} disabled={!colado.trim()}>
              <ScanText size={15} strokeWidth={2} /> Ler e-mail
            </button>
          </div>
          {leitura ? (
            <p className="field-hint" role="status">
              {leitura}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="field-grid">
        <Campo id="ord-numero" rotulo="Nº da ordem" erro={erros.numeroOrdem}>
          {(aria) => <input {...aria} className="field-input" value={dados.numeroOrdem} onChange={(e) => setDados({ ...dados, numeroOrdem: e.target.value })} />}
        </Campo>
        <Campo id="ord-data" rotulo="Data de recebimento">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.dataRecebimento} onChange={(e) => setDados({ ...dados, dataRecebimento: e.target.value })} />}
        </Campo>
      </div>
      <Campo id="ord-cliente" rotulo="Ordenante (cliente)" erro={erros.cliente}>
        {(aria) => <input {...aria} className="field-input" value={dados.cliente} onChange={(e) => setDados({ ...dados, cliente: e.target.value })} />}
      </Campo>
      <Campo id="ord-benef" rotulo="Beneficiário">
        {(aria) => <input {...aria} className="field-input" value={dados.beneficiario} onChange={(e) => setDados({ ...dados, beneficiario: e.target.value })} />}
      </Campo>
      <div className="field-grid">
        <Campo id="ord-moeda" rotulo="Moeda">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.moeda} onChange={(e) => setDados({ ...dados, moeda: e.target.value as Moeda })}>
              <option>EUR</option>
              <option>USD</option>
            </select>
          )}
        </Campo>
        <Campo id="ord-valor" rotulo={`Valor em ${dados.moeda}`} erro={erros.valor}>
          {(aria) => <input {...aria} className="field-input" inputMode="decimal" value={dados.valor} onChange={(e) => setDados({ ...dados, valor: e.target.value })} placeholder="1.263,49" />}
        </Campo>
      </div>
      <label className="check-label">
        <input type="checkbox" checked={dados.bloqueiaEmails} onChange={(e) => setDados({ ...dados, bloqueiaEmails: e.target.checked })} />
        Bloquear e-mails de faturas vencidas deste cliente
      </label>
      <Campo id="ord-obs" rotulo="Observações">
        {(aria) => <textarea {...aria} className="field-input" value={dados.observacoes} onChange={(e) => setDados({ ...dados, observacoes: e.target.value })} />}
      </Campo>
    </Painel>
  );
}
