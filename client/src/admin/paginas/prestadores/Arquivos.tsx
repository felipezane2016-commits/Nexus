import { formatarData } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Vazio from "@/admin/componentes/Vazio";
import { formatMonth, listCompetencias } from "@/lib/portal";
import { CATEGORIAS_PRESTADOR, type CategoriaPrestador } from "@/modulos/prestadores/tipos";
import { useDadosPrestadores } from "@/modulos/prestadores/usarDados";
import { FileCheck2, FileText, FolderOpen } from "lucide-react";
import { useState } from "react";

type Arquivo = { nome: string; tipo: "Comprovante" | "Faturamento"; prestador: string; referencia: string; data: string };

export default function Arquivos() {
  const { prestadores, recibos, fechamentos } = useDadosPrestadores();
  const competencias = listCompetencias(recibos);
  const [competencia, setCompetencia] = useState(competencias[0] ?? "");
  const [categoria, setCategoria] = useState<CategoriaPrestador | "Todas">("Todas");

  const prestadorDe = new Map(prestadores.map((prestador) => [prestador.id, prestador]));
  const porCategoria = new Map<CategoriaPrestador, Arquivo[]>();
  function guardar(categoriaDoArquivo: CategoriaPrestador, arquivo: Arquivo) {
    porCategoria.set(categoriaDoArquivo, [...(porCategoria.get(categoriaDoArquivo) ?? []), arquivo]);
  }
  for (const recibo of recibos) {
    const prestador = prestadorDe.get(recibo.prestadorId);
    if (!prestador || recibo.competencia !== competencia || !recibo.attachmentName || recibo.status === "Rascunho") continue;
    guardar(prestador.categoria, {
      nome: recibo.attachmentName,
      tipo: "Comprovante",
      prestador: prestador.nome,
      referencia: `${recibo.id} · ${recibo.client}`,
      data: recibo.serviceDate,
    });
  }
  for (const fechamento of fechamentos) {
    const prestador = prestadorDe.get(fechamento.prestadorId);
    if (!prestador || fechamento.competencia !== competencia || !fechamento.documentName || !fechamento.submitted) continue;
    guardar(prestador.categoria, {
      nome: fechamento.documentName,
      tipo: "Faturamento",
      prestador: prestador.nome,
      referencia: `Fechamento de ${formatMonth(competencia)}`,
      data: (fechamento.submittedAt ?? `${competencia}-01`).slice(0, 10),
    });
  }
  const categorias = CATEGORIAS_PRESTADOR.filter((item) => categoria === "Todas" || item === categoria);
  const total = categorias.reduce((soma, item) => soma + (porCategoria.get(item)?.length ?? 0), 0);

  return (
    <>
      <Cabecalho
        rotulo="Prestadores de serviço"
        titulo="Arquivos"
        descricao="Comprovantes e documentos de faturamento enviados pelos prestadores, por categoria."
        acoes={
          <div className="field-group">
            <label className="field-label" htmlFor="arq-competencia">
              Competência
            </label>
            <select id="arq-competencia" className="field-input" value={competencia} onChange={(evento) => setCompetencia(evento.target.value)}>
              {competencias.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {formatMonth(opcao)}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className="acesso-alerta-info espaco-abaixo">
        <FileText size={15} strokeWidth={2} />
        <span>
          <strong>Em construção.</strong> O protótipo guarda o nome dos arquivos, não o conteúdo — abrir e baixar entram com o armazenamento do backend.
        </span>
      </div>
      <section className="operations-surface">
        <div className="filter-chips espaco-abaixo" role="group" aria-label="Filtrar por categoria">
          {(["Todas", ...CATEGORIAS_PRESTADOR] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={categoria === opcao ? "filter-chip filter-chip-active" : "filter-chip"}
              aria-pressed={categoria === opcao}
              onClick={() => setCategoria(opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>
        {total === 0 ? (
          <Vazio icone={FolderOpen} titulo="Nenhum arquivo nesta competência" />
        ) : (
          <div className="stack">
            {categorias.map((item) => {
              const arquivos = porCategoria.get(item) ?? [];
              if (!arquivos.length) return null;
              return (
                <div key={item}>
                  <p className="eyebrow rotulo-acima">
                    {item} · {arquivos.length}
                  </p>
                  <div className="ged-list">
                    {arquivos.map((arquivo, indice) => (
                      <div className="ged-line" key={`${arquivo.nome}-${indice}`}>
                        <span className="doc-icon" aria-hidden="true">
                          {arquivo.tipo === "Faturamento" ? <FileCheck2 size={16} strokeWidth={1.9} /> : <FileText size={16} strokeWidth={1.9} />}
                        </span>
                        <div className="ged-line-copy">
                          <strong>{arquivo.nome}</strong>
                          <span>
                            {arquivo.prestador} · {arquivo.referencia}
                          </span>
                        </div>
                        <div className="ged-line-meta">
                          <span className="field-hint">{formatarData(arquivo.data)}</span>
                          <span className={arquivo.tipo === "Faturamento" ? "status-pill status-blue" : "status-pill status-neutral"}>{arquivo.tipo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
