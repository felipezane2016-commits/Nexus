import { gravarItem } from "@/_core/armazenamento/colecao";
import { gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import Selo, { type Tom } from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { CATEGORIAS_OBJETIVO, objetivos, useDadosParticular, type CategoriaObjetivo, type Objetivo, type StatusObjetivo } from "@/modulos/particular/colecoes";
import { Plus, Star, Target } from "lucide-react";
import { useState } from "react";

const TOM: Record<StatusObjetivo, Tom> = { Pendente: "neutral", "Em andamento": "blue", Concluído: "green" };
const PROXIMO: Record<StatusObjetivo, StatusObjetivo> = { Pendente: "Em andamento", "Em andamento": "Concluído", Concluído: "Pendente" };

export default function Objetivos() {
  const { objetivos: lista } = useDadosParticular();
  const anos = Array.from(new Set([...lista.map((objetivo) => objetivo.ano), Number(HOJE.slice(0, 4))])).sort();
  const [ano, setAno] = useState(Number(HOJE.slice(0, 4)));
  const [editando, setEditando] = useState<Objetivo | "novo" | null>(null);
  const doAno = lista.filter((objetivo) => objetivo.ano === ano).sort((a, b) => Number(b.principal) - Number(a.principal));
  const concluidos = doAno.filter((objetivo) => objetivo.status === "Concluído").length;

  return (
    <>
      <Cabecalho
        rotulo="Particular"
        titulo="Objetivos"
        descricao={doAno.length ? `${concluidos} de ${doAno.length} concluídos em ${ano}.` : `Nenhum objetivo em ${ano}.`}
        acoes={
          <>
            <select className="field-input" style={{ width: "auto" }} value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano">
              {anos.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button type="button" className="button-primary" onClick={() => setEditando("novo")}>
              <Plus size={15} strokeWidth={2.2} /> Novo objetivo
            </button>
          </>
        }
      />
      {doAno.length === 0 ? (
        <section className="operations-surface">
          <Vazio icone={Target} titulo="Nenhum objetivo para este ano" />
        </section>
      ) : (
        <div className="grid-3">
          {doAno.map((objetivo) => (
            <section className="operations-surface" key={objetivo.id}>
              <div className="section-header" style={{ marginBottom: 10 }}>
                <span className="eyebrow">
                  {objetivo.principal ? <Star size={11} strokeWidth={2.2} aria-hidden="true" /> : null}
                  {objetivo.categoria}
                  {objetivo.principal ? " · principal" : ""}
                </span>
              </div>
              <h3 style={{ fontSize: 17, letterSpacing: "-0.03em", lineHeight: 1.25 }}>{objetivo.texto}</h3>
              <div className="inline-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="text-button"
                  aria-label={`Status: ${objetivo.status}. Mudar para ${PROXIMO[objetivo.status]}`}
                  onClick={() => objetivos.atualizar((atual) => gravarItem(atual, { ...objetivo, status: PROXIMO[objetivo.status] }))}
                >
                  <Selo tom={TOM[objetivo.status]}>{objetivo.status}</Selo>
                </button>
                <button type="button" className="text-button" onClick={() => setEditando(objetivo)}>
                  Editar
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
      {editando ? <FormularioObjetivo objetivo={editando === "novo" ? null : editando} ano={ano} aoFechar={() => setEditando(null)} /> : null}
    </>
  );
}

function FormularioObjetivo({ objetivo, ano, aoFechar }: { objetivo: Objetivo | null; ano: number; aoFechar: () => void }) {
  const [dados, setDados] = useState<Objetivo>(objetivo ?? { id: gerarId("ob"), texto: "", categoria: "Carreira", ano, principal: false, status: "Pendente" });
  const [erro, setErro] = useState<string | undefined>();
  return (
    <Painel
      rotulo="Particular"
      titulo={objetivo ? "Editar objetivo" : "Novo objetivo"}
      aoFechar={aoFechar}
      aoEnviar={() => {
        if (!dados.texto.trim()) {
          setErro("Descreva o objetivo.");
          return;
        }
        objetivos.atualizar((lista) => gravarItem(lista, { ...dados, texto: dados.texto.trim() }));
        aoFechar();
      }}
      rodapeExtra={
        objetivo ? (
          <button
            type="button"
            className="text-button"
            style={{ color: "var(--status-red-fg)" }}
            onClick={() => {
              objetivos.atualizar((lista) => lista.filter((item) => item.id !== objetivo.id));
              aoFechar();
            }}
          >
            Excluir
          </button>
        ) : null
      }
    >
      <Campo id="ob-texto" rotulo="Objetivo" erro={erro}>
        {(aria) => <input {...aria} className="field-input" value={dados.texto} onChange={(e) => setDados({ ...dados, texto: e.target.value })} />}
      </Campo>
      <div className="field-grid">
        <Campo id="ob-categoria" rotulo="Categoria">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.categoria} onChange={(e) => setDados({ ...dados, categoria: e.target.value as CategoriaObjetivo })}>
              {CATEGORIAS_OBJETIVO.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="ob-ano" rotulo="Ano">
          {(aria) => <input {...aria} className="field-input" type="number" min={2020} max={2100} value={dados.ano} onChange={(e) => setDados({ ...dados, ano: Number(e.target.value) || ano })} />}
        </Campo>
      </div>
      <Campo id="ob-status" rotulo="Status">
        {(aria) => (
          <select {...aria} className="field-input" value={dados.status} onChange={(e) => setDados({ ...dados, status: e.target.value as StatusObjetivo })}>
            <option>Pendente</option>
            <option>Em andamento</option>
            <option>Concluído</option>
          </select>
        )}
      </Campo>
      <label className="check-label">
        <input type="checkbox" checked={dados.principal} onChange={(e) => setDados({ ...dados, principal: e.target.checked })} />
        Objetivo principal do ano
      </label>
    </Painel>
  );
}
