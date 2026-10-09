import { gravarItem } from "@/_core/armazenamento/colecao";
import { formatarData, gerarId, HOJE, horaDeBrasilia } from "@/_core/tempo";
import Painel from "@/admin/componentes/Painel";
import { registrarEnvioSuperiores } from "@/modulos/contas/acoesOrdens";
import { taxas as colecaoTaxas, useDadosContas } from "@/modulos/contas/colecoes";
import { emailAosSuperiores } from "@/modulos/contas/emails";
import { formatarMoeda, formatarTaxa } from "@/modulos/contas/formato";
import { etapaDaOrdem, ultimasCotacoes, ultimaTaxa } from "@/modulos/contas/regras";
import type { Taxa } from "@/modulos/contas/tipos";
import { Save } from "lucide-react";
import { useState } from "react";
import AcoesEmail from "./AcoesEmail";

const CAMPOS = [
  ["bibUsd", "BIB · USD"],
  ["bibEur", "BIB · EUR"],
  ["itauUsd", "Itaú · USD"],
  ["itauEur", "Itaú · EUR"],
] as const;
type CampoTaxa = (typeof CAMPOS)[number][0];

const ELEGIVEIS = new Set(["Liberada pelo banco", "Aguardando decisão", "Aguardando câmbio", "Fechamento agendado"]);

/** Etapa 5: cotação do dia + ordens para fechamento + comentário de mercado, num e-mail só. */
export default function PainelSuperiores({ selecionadas, autor, aoFechar }: { selecionadas: string[]; autor: string; aoFechar: () => void }) {
  const { ordens, taxas, configEmails } = useDadosContas();
  const elegiveis = ordens.filter((ordem) => ELEGIVEIS.has(etapaDaOrdem(ordem)));
  const [marcadas, setMarcadas] = useState<string[]>(selecionadas.length ? selecionadas : elegiveis.filter((o) => etapaDaOrdem(o) === "Liberada pelo banco").map((o) => o.id));
  const ultima = ultimaTaxa(taxas);
  const deHoje = ultima?.data === HOJE;
  const [valores, setValores] = useState<Record<CampoTaxa, string>>({ bibUsd: "", bibEur: "", itauUsd: "", itauEur: "" });
  const [horario, setHorario] = useState(new Date().toTimeString().slice(0, 5));
  const [comentario, setComentario] = useState(deHoje ? (ultima?.observacao ?? "") : "");
  const [erroTaxa, setErroTaxa] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const escolhidas = ordens.filter((ordem) => marcadas.includes(ordem.id));
  const email = emailAosSuperiores(escolhidas, ultimasCotacoes(taxas, 4), comentario, configEmails, horaDeBrasilia());

  function salvarCotacao() {
    const numeros = Object.fromEntries(CAMPOS.map(([campo]) => [campo, Number.parseFloat(valores[campo].replace(",", "."))])) as Record<CampoTaxa, number>;
    if (CAMPOS.some(([campo]) => !(numeros[campo] >= 1 && numeros[campo] <= 20))) {
      setErroTaxa("Preencha as quatro taxas (entre 1 e 20, ex.: 5,5439).");
      return;
    }
    const taxa: Taxa = { id: gerarId("tx"), data: HOJE, horario, ...numeros, observacao: comentario.trim() };
    colecaoTaxas.atualizar((lista) => gravarItem(lista, taxa));
    setErroTaxa(null);
  }

  function marcarEnviado() {
    const novas = escolhidas.filter((ordem) => !ordem.enviadaSuperioresEm).map((ordem) => ordem.id);
    if (novas.length) registrarEnvioSuperiores(novas, autor);
    if (ultima && deHoje && comentario.trim() !== ultima.observacao)
      colecaoTaxas.atualizar((lista) => lista.map((taxa) => (taxa.id === ultima.id ? { ...taxa, observacao: comentario.trim() } : taxa)));
    setEnviado(true);
  }

  return (
    <Painel rotulo="Etapa 5" titulo="E-mail aos superiores" descricao="Cotação do dia, as ordens para fechamento e o comentário de mercado." aoFechar={aoFechar}>
      <div className="field-group">
        <span className="field-label">Ordens para fechamento</span>
        {elegiveis.length === 0 ? (
          <p className="field-hint">Nenhuma ordem liberada pelo banco no momento.</p>
        ) : (
          <ul className="lista-marcar">
            {elegiveis.map((ordem) => (
              <li key={ordem.id}>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={marcadas.includes(ordem.id)}
                    onChange={() => setMarcadas((atual) => (atual.includes(ordem.id) ? atual.filter((id) => id !== ordem.id) : [...atual, ordem.id]))}
                  />
                  <span>
                    <strong>{ordem.cliente}</strong> · {formatarMoeda(ordem.valor, ordem.moeda)} · nº {ordem.numeroOrdem}
                    <em> — {etapaDaOrdem(ordem)}</em>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field-group">
        <span className="field-label">Cotação do dia</span>
        {deHoje && ultima ? (
          <p className="field-hint">
            Cotação de hoje registrada às {ultima.horario}: BIB USD {formatarTaxa(ultima.bibUsd)} · EUR {formatarTaxa(ultima.bibEur)} — Itaú USD {formatarTaxa(ultima.itauUsd)} · EUR{" "}
            {formatarTaxa(ultima.itauEur)}.
          </p>
        ) : (
          <>
            <p className="field-hint">Ainda não há cotação de hoje ({formatarData(HOJE)}). Registre o que os bancos passaram na ligação:</p>
            <div className="grade-taxas">
              {CAMPOS.map(([campo, rotulo]) => (
                <label key={campo} className="field-group">
                  <span className="field-label">{rotulo}</span>
                  <input className="field-input" inputMode="decimal" value={valores[campo]} onChange={(e) => setValores({ ...valores, [campo]: e.target.value })} placeholder="0,0000" aria-label={rotulo} />
                </label>
              ))}
              <label className="field-group">
                <span className="field-label">Horário</span>
                <input className="field-input" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} aria-label="Horário da cotação" />
              </label>
            </div>
            {erroTaxa ? <p className="field-error">{erroTaxa}</p> : null}
            <button type="button" className="button-secondary espaco-acima-curto" onClick={salvarCotacao}>
              <Save size={15} strokeWidth={2} /> Registrar cotação de hoje
            </button>
          </>
        )}
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="sup-mercado">
          Comentário de mercado
        </label>
        <textarea
          id="sup-mercado"
          className="field-input"
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="o dólar iniciou a quarta-feira em alta, com o mercado ensaiando um ajuste…"
        />
        <span className="field-hint">Entra logo depois de "Segue cotação,".</span>
      </div>

      {escolhidas.length === 0 ? (
        <p className="field-hint">Marque ao menos uma ordem para montar o e-mail.</p>
      ) : enviado ? (
        <div className="acesso-alerta-sucesso" role="status">
          <span>Envio registrado. As ordens ficam aguardando a decisão dos superiores — eles podem decidir direto no sistema.</span>
        </div>
      ) : (
        <AcoesEmail email={email} aoMarcarEnviado={marcarEnviado} textoMarcar="Marcar como enviado" />
      )}
    </Painel>
  );
}
