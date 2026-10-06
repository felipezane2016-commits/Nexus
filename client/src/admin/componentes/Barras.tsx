type Linha = { rotulo: string; valor: number; texto: string };

/** Barras horizontais com rótulo e valor em texto — a barra só carrega o tamanho. */
export default function Barras({ linhas, rotuloAcessivel }: { linhas: Linha[]; rotuloAcessivel: string }) {
  const maximo = Math.max(...linhas.map((linha) => linha.valor), 0);
  return (
    <ul className="bar-list" aria-label={rotuloAcessivel}>
      {linhas.map((linha) => (
        <li className="bar-row" key={linha.rotulo}>
          <span className="bar-row-label">{linha.rotulo}</span>
          <span className="bar-row-value">{linha.texto}</span>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill" style={{ display: "block", width: maximo ? `${(linha.valor / maximo) * 100}%` : 0 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
