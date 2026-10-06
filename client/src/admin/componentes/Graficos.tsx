import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

/**
 * Gráficos do admin. Cores só de --serie-1/--serie-2 (--chart-1 e --chart-2 da
 * família laranja, como no modelo); a 2ª série também é tracejada, para a
 * identidade não depender só da cor. Texto sempre em token de texto, nunca na
 * cor da série; grade recessiva; uma escala só (nada de eixo duplo).
 */

const EIXO = { fill: "var(--tertiary-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

type Formatador = (valor: number) => string;

function Dica({ active, payload, label, formatar }: TooltipProps<number, string> & { formatar: Formatador }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={String(item.dataKey)} className="inline-row">
          <span className="chart-swatch" style={{ background: item.color }} aria-hidden="true" />
          {item.name}: {formatar(Number(item.value))}
        </div>
      ))}
    </div>
  );
}

type Ponto = Record<string, string | number>;

type BarrasProps = {
  dados: Ponto[];
  chaveX: string;
  chaveY: string;
  nome: string;
  formatar: Formatador;
  formatarEixo?: Formatador;
  rotulo: string;
};

/** Uma série, magnitude por categoria. Sem legenda: o título nomeia a série. */
export function GraficoBarras({ dados, chaveX, chaveY, nome, formatar, formatarEixo, rotulo }: BarrasProps) {
  return (
    <figure className="chart-figure">
      <div className="chart-box" role="img" aria-label={rotulo}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--grade)" />
            <XAxis dataKey={chaveX} tick={EIXO} tickLine={false} axisLine={{ stroke: "var(--grade)" }} />
            <YAxis tick={EIXO} tickLine={false} axisLine={false} width={64} tickFormatter={formatarEixo ?? formatar} />
            <Tooltip cursor={{ fill: "var(--highlight)" }} content={<Dica formatar={formatar} />} />
            <Bar dataKey={chaveY} name={nome} fill="var(--serie-1)" radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TabelaDoGrafico dados={dados} colunas={[{ chave: chaveX, nome: "" }, { chave: chaveY, nome, formatar }]} />
    </figure>
  );
}

type Serie = { chave: string; nome: string };

type LinhasProps = {
  dados: Ponto[];
  chaveX: string;
  series: Serie[];
  formatar: Formatador;
  rotulo: string;
  dominio?: [number | "auto", number | "auto"];
};

/** Até duas séries no tempo: legenda sempre, rótulo direto no último ponto. */
export function GraficoLinhas({ dados, chaveX, series, formatar, rotulo, dominio }: LinhasProps) {
  const cores = ["var(--serie-1)", "var(--serie-2)"];
  const tracos = [undefined, "6 4"];
  const ultimo = dados.length - 1;
  return (
    <figure className="chart-figure">
      {series.length > 1 ? (
        <div className="chart-legend">
          {series.map((serie, indice) => (
            <span key={serie.chave}>
              <svg className="chart-swatch" viewBox="0 0 16 4" aria-hidden="true">
                <line x1="0" y1="2" x2="16" y2="2" stroke={cores[indice]} strokeWidth={2} strokeDasharray={tracos[indice] ? "4 3" : undefined} />
              </svg>
              {serie.nome}
            </span>
          ))}
        </div>
      ) : null}
      <div className="chart-box" role="img" aria-label={rotulo}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 8, right: 56, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grade)" />
            <XAxis dataKey={chaveX} tick={EIXO} tickLine={false} axisLine={{ stroke: "var(--grade)" }} minTickGap={24} />
            <YAxis tick={EIXO} tickLine={false} axisLine={false} width={64} tickFormatter={formatar} domain={dominio ?? ["auto", "auto"]} />
            <Tooltip cursor={{ stroke: "var(--tertiary-foreground)", strokeDasharray: "3 3" }} content={<Dica formatar={formatar} />} />
            {series.map((serie, indice) => (
              <Line
                key={serie.chave}
                type="monotone"
                dataKey={serie.chave}
                name={serie.nome}
                stroke={cores[indice]}
                strokeWidth={2}
                strokeDasharray={tracos[indice]}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
                label={(props: { x?: number; y?: number; index?: number }) =>
                  props.index === ultimo && series.length > 1 ? (
                    <text
                      key={`${serie.chave}-rotulo`}
                      x={(props.x ?? 0) + 6}
                      y={(props.y ?? 0) + 4}
                      fill="var(--muted-foreground)"
                      fontSize={11}
                      fontFamily="var(--font-display)"
                      fontWeight={700}
                    >
                      {serie.nome}
                    </text>
                  ) : (
                    <g key={`${serie.chave}-${props.index}`} />
                  )
                }
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TabelaDoGrafico
        dados={dados}
        colunas={[{ chave: chaveX, nome: "" }, ...series.map((serie) => ({ ...serie, formatar }))]}
      />
    </figure>
  );
}

type Coluna = { chave: string; nome: string; formatar?: Formatador };

/** A mesma informação em tabela, para quem não lê o gráfico. */
function TabelaDoGrafico({ dados, colunas }: { dados: Ponto[]; colunas: Coluna[] }) {
  return (
    <details className="chart-tabela">
      <summary className="text-button">
        Ver como tabela
      </summary>
      <div className="table-scroll espaco-acima-curto">
        <table>
          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th key={coluna.chave}>{coluna.nome || "Período"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((ponto, indice) => (
              <tr key={indice}>
                {colunas.map((coluna) => (
                  <td key={coluna.chave}>
                    {coluna.formatar && typeof ponto[coluna.chave] === "number"
                      ? coluna.formatar(ponto[coluna.chave] as number)
                      : String(ponto[coluna.chave] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
