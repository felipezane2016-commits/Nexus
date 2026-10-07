import Selo from "@/admin/componentes/Selo";
import { formatBRL } from "@/lib/portal";
import { escolher, useDadosConciliacao, useSelecao } from "@/modulos/conciliacao/colecoes";
import type { ContaBancaria, FechamentoConciliacao } from "@/modulos/conciliacao/tipos";

export function rotuloConta(conta: ContaBancaria) {
  return `${conta.banco} · ${conta.empresa}`;
}

export function detalheConta(conta: ContaBancaria) {
  return `Ag. ${conta.agencia} · C/C ${conta.numero} · Conta contábil ${conta.contaContabil}`;
}

/** Valor com sinal: saída em vermelho com "−", entrada com "+". */
export function Valor({ valor, sinal = true }: { valor: number; sinal?: boolean }) {
  const classe = valor < 0 ? "money money-debito" : "money";
  const texto = formatBRL(Math.abs(valor));
  return <span className={classe}>{sinal ? `${valor < 0 ? "−" : "+"} ${texto}` : valor < 0 ? `− ${texto}` : texto}</span>;
}

export function SeloFechamento({ fechamento }: { fechamento: FechamentoConciliacao | null }) {
  if (!fechamento) return <Selo tom="amber">Em aberto</Selo>;
  if (fechamento.status === "Em revisão") return <Selo tom="blue">Em revisão</Selo>;
  return <Selo tom="green">Fechada</Selo>;
}

/** Conta e mês em trabalho — o mesmo par em todas as páginas da conciliação. */
export function SeletorContaMes() {
  const { contas } = useDadosConciliacao();
  const { conta, mes } = useSelecao();
  return (
    <div className="inline-row">
      <select
        className="field-input field-input-compacto"
        value={conta?.id ?? ""}
        onChange={(e) => escolher({ contaId: e.target.value })}
        aria-label="Conta bancária"
      >
        {contas.map((item) => (
          <option key={item.id} value={item.id}>
            {rotuloConta(item)} — {item.numero}
          </option>
        ))}
      </select>
      <input
        className="field-input field-input-compacto"
        type="month"
        value={mes}
        onChange={(e) => e.target.value && escolher({ mes: e.target.value })}
        aria-label="Mês"
      />
    </div>
  );
}
