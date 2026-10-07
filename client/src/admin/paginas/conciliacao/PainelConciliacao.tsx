import Cabecalho from "@/admin/componentes/Cabecalho";
import Kpi from "@/admin/componentes/Kpi";
import Vazio from "@/admin/componentes/Vazio";
import { diasDesde, formatarData } from "@/_core/tempo";
import {
  escolher,
  useDadosConciliacao,
  useSelecao,
} from "@/modulos/conciliacao/colecoes";
import {
  DIAS_PENDENCIA_ANTIGA,
  fechamentoDo,
  montarDemonstrativo,
} from "@/modulos/conciliacao/regras";
import {
  AlarmClock,
  CheckCircle2,
  Landmark,
  Scale,
  SearchCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { detalheConta, rotuloConta, SeloFechamento, Valor } from "./comum";

export default function PainelConciliacao() {
  const { contas, extrato, razao, casamentos, fechamentos } =
    useDadosConciliacao();
  const { mes } = useSelecao();
  const [, navegar] = useLocation();

  const linhas = contas
    .filter(conta => conta.ativa)
    .map(conta => ({
      conta,
      demonstrativo: montarDemonstrativo(
        conta,
        extrato,
        razao,
        casamentos,
        mes
      ),
      fechamento: fechamentoDo(fechamentos, conta.id, mes),
    }));
  const fechadas = linhas.filter(
    linha => linha.fechamento?.status === "Fechada"
  ).length;
  const emRevisao = linhas.filter(
    linha => linha.fechamento?.status === "Em revisão"
  ).length;
  const pendencias = linhas.reduce(
    (soma, linha) => soma + linha.demonstrativo.pendencias,
    0
  );
  const antigas = linhas
    .flatMap(({ conta, demonstrativo }) =>
      [
        ...demonstrativo.depositosEmTransito.map(item => ({
          conta,
          data: item.data,
          texto: item.descricao,
          valor: item.valor,
          tipo: "Depósito em trânsito",
        })),
        ...demonstrativo.pagamentosNaoCompensados.map(item => ({
          conta,
          data: item.data,
          texto: item.descricao,
          valor: item.valor,
          tipo: "Pagamento não compensado",
        })),
        ...demonstrativo.creditosNaoContabilizados.map(item => ({
          conta,
          data: item.data,
          texto: item.historico,
          valor: item.valor,
          tipo: "Crédito não contabilizado",
        })),
        ...demonstrativo.debitosNaoContabilizados.map(item => ({
          conta,
          data: item.data,
          texto: item.historico,
          valor: item.valor,
          tipo: "Débito não contabilizado",
        })),
      ].map(item => ({ ...item, dias: diasDesde(item.data) }))
    )
    .filter(item => item.dias > DIAS_PENDENCIA_ANTIGA)
    .sort((a, b) => b.dias - a.dias);

  function abrir(contaId: string, destino: string) {
    escolher({ contaId });
    navegar(destino);
  }

  return (
    <>
      <Cabecalho
        rotulo="Conciliação bancária"
        titulo="Painel da conciliação"
        descricao="Situação de cada conta no mês: saldo do banco, saldo do razão e o que ainda explica a diferença."
        acoes={
          <input
            className="field-input field-input-compacto"
            type="month"
            value={mes}
            onChange={e => e.target.value && escolher({ mes: e.target.value })}
            aria-label="Mês"
          />
        }
      />
      <div className="kpi-grid">
        <Kpi
          rotulo="Contas fechadas"
          valor={`${fechadas}/${linhas.length}`}
          detalhe="conciliadas e aprovadas"
          icone={CheckCircle2}
          tom="verde"
        />
        <Kpi
          rotulo="Em revisão"
          valor={String(emRevisao)}
          detalhe="aguardando a segunda assinatura"
          icone={SearchCheck}
          tom="laranja"
        />
        <Kpi
          rotulo="Itens pendentes"
          valor={String(pendencias)}
          detalhe="em todas as contas"
          icone={Scale}
          tom="ambar"
        />
        <Kpi
          rotulo={`Pendentes há +${DIAS_PENDENCIA_ANTIGA} dias`}
          valor={String(antigas.length)}
          detalhe="pedem investigação"
          icone={AlarmClock}
          tom={antigas.length ? "vermelho" : "neutro"}
        />
      </div>

      <section className="operations-surface">
        <div className="section-header">
          <div>
            <span className="eyebrow">Contas bancárias</span>
            <h3>Situação no mês</h3>
          </div>
        </div>
        {linhas.length === 0 ? (
          <Vazio
            icone={Landmark}
            titulo="Nenhuma conta ativa"
            texto="Cadastre as contas em Contas bancárias."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Saldo do extrato</th>
                  <th>Saldo do razão</th>
                  <th>Diferença de saldos</th>
                  <th>Pendências</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ conta, demonstrativo, fechamento }) => (
                  <tr key={conta.id}>
                    <td className="cell-main">
                      <strong>{rotuloConta(conta)}</strong>
                      <span>{detalheConta(conta)}</span>
                    </td>
                    <td>
                      <Valor valor={demonstrativo.saldoExtrato} sinal={false} />
                    </td>
                    <td>
                      <Valor valor={demonstrativo.saldoRazao} sinal={false} />
                    </td>
                    <td>
                      <Valor
                        valor={
                          demonstrativo.saldoExtrato - demonstrativo.saldoRazao
                        }
                      />
                    </td>
                    <td>{demonstrativo.pendencias}</td>
                    <td>
                      <SeloFechamento fechamento={fechamento} />
                    </td>
                    <td>
                      <div className="inline-row inline-row-fixo">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            abrir(conta.id, "/contas/conciliacao/conciliar")
                          }
                        >
                          Conciliar
                        </button>
                        <button
                          type="button"
                          className="text-button text-button-neutro"
                          onClick={() =>
                            abrir(conta.id, "/contas/conciliacao/demonstrativo")
                          }
                        >
                          Demonstrativo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="surface-footnote">
          A diferença de saldos é normal enquanto houver item em trânsito; o que
          importa é que cada centavo dela esteja explicado por uma pendência.
        </p>
      </section>

      {antigas.length ? (
        <section className="operations-surface espaco-acima">
          <div className="section-header">
            <div>
              <span className="eyebrow">Atenção</span>
              <h3>Pendências antigas</h3>
              <p>
                Itens abertos há mais de {DIAS_PENDENCIA_ANTIGA} dias: cheque
                que não compensa, depósito que não caiu, lançamento esquecido.
              </p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Conta</th>
                  <th>Lançamento</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Dias</th>
                </tr>
              </thead>
              <tbody>
                {antigas.map((item, indice) => (
                  <tr key={indice}>
                    <td>{formatarData(item.data)}</td>
                    <td>{rotuloConta(item.conta)}</td>
                    <td>{item.texto}</td>
                    <td>{item.tipo}</td>
                    <td>
                      <Valor valor={item.valor} />
                    </td>
                    <td>{item.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
