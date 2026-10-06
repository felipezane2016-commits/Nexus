import { gravarItem } from "@/_core/armazenamento/colecao";
import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import Selo, { type Tom } from "@/admin/componentes/Selo";
import Vazio from "@/admin/componentes/Vazio";
import { eventosEconomicos, useDadosContas } from "@/modulos/contas/colecoes";
import { REGIOES, type EventoEconomico, type Impacto, type Regiao } from "@/modulos/contas/tipos";
import { CalendarRange, Plus } from "lucide-react";
import { useState } from "react";

const TOM_IMPACTO: Record<Impacto, Tom> = { Alto: "red", Médio: "amber", Baixo: "neutral" };
type Filtro = Regiao | "Todos" | "Alto impacto";

export default function CalendarioEconomico() {
  const { eventos } = useDadosContas();
  const usuario = useUsuarioAtual();
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [criando, setCriando] = useState(false);
  const visiveis = eventos
    .filter((evento) => filtro === "Todos" || (filtro === "Alto impacto" ? evento.impacto === "Alto" : evento.regiao === filtro))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const datas = Array.from(new Set(visiveis.map((evento) => evento.data)));

  return (
    <>
      <Cabecalho
        rotulo="Banco Industrial"
        titulo="Calendário econômico"
        descricao="Divulgações que costumam mexer no câmbio. Fechar ordem grande na véspera de evento de alto impacto é risco."
        acoes={
          pode(usuario, "registros.editar") ? (
            <button type="button" className="button-primary" onClick={() => setCriando(true)}>
              <Plus size={15} strokeWidth={2.2} /> Novo evento
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="filter-chips espaco-abaixo" role="group" aria-label="Filtrar">
          {(["Todos", ...REGIOES, "Alto impacto"] as Filtro[]).map((opcao) => (
            <button key={opcao} type="button" className={filtro === opcao ? "filter-chip filter-chip-active" : "filter-chip"} aria-pressed={filtro === opcao} onClick={() => setFiltro(opcao)}>
              {opcao}
            </button>
          ))}
        </div>
        {datas.length === 0 ? (
          <Vazio icone={CalendarRange} titulo="Nenhum evento" />
        ) : (
          <div className="stack">
            {datas.map((data) => (
              <div key={data}>
                <p className="eyebrow rotulo-acima">
                  {formatarData(data)}
                  {data === HOJE ? " · hoje" : ""}
                </p>
                <ul className="item-list">
                  {visiveis
                    .filter((evento) => evento.data === data)
                    .map((evento) => (
                      <li className="item-row" key={evento.id}>
                        <span className="cell-code cell-code-hora">
                          {evento.hora}
                        </span>
                        <div className="item-row-copy">
                          <strong>{evento.titulo}</strong>
                          <span>{evento.regiao}</span>
                        </div>
                        <Selo tom={TOM_IMPACTO[evento.impacto]}>Impacto {evento.impacto.toLowerCase()}</Selo>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
      {criando ? <FormularioEvento aoFechar={() => setCriando(false)} /> : null}
    </>
  );
}

function FormularioEvento({ aoFechar }: { aoFechar: () => void }) {
  const [dados, setDados] = useState<EventoEconomico>({ id: gerarId("ev"), data: HOJE, hora: "09:00", titulo: "", regiao: "Brasil", impacto: "Médio" });
  const [erro, setErro] = useState<string | undefined>();
  return (
    <Painel
      rotulo="Calendário econômico"
      titulo="Novo evento"
      aoFechar={aoFechar}
      aoEnviar={() => {
        if (!dados.titulo.trim()) {
          setErro("Descreva o evento.");
          return;
        }
        eventosEconomicos.atualizar((lista) => gravarItem(lista, { ...dados, titulo: dados.titulo.trim() }));
        aoFechar();
      }}
    >
      <Campo id="ev-titulo" rotulo="Evento" erro={erro}>
        {(aria) => <input {...aria} className="field-input" value={dados.titulo} onChange={(e) => setDados({ ...dados, titulo: e.target.value })} placeholder="Ex.: Decisão do Copom" />}
      </Campo>
      <div className="field-grid">
        <Campo id="ev-data" rotulo="Data">
          {(aria) => <input {...aria} className="field-input" type="date" value={dados.data} onChange={(e) => setDados({ ...dados, data: e.target.value })} />}
        </Campo>
        <Campo id="ev-hora" rotulo="Hora">
          {(aria) => <input {...aria} className="field-input" type="time" value={dados.hora} onChange={(e) => setDados({ ...dados, hora: e.target.value })} />}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="ev-regiao" rotulo="Região">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.regiao} onChange={(e) => setDados({ ...dados, regiao: e.target.value as Regiao })}>
              {REGIOES.map((regiao) => (
                <option key={regiao}>{regiao}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo id="ev-impacto" rotulo="Impacto">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.impacto} onChange={(e) => setDados({ ...dados, impacto: e.target.value as Impacto })}>
              <option>Alto</option>
              <option>Médio</option>
              <option>Baixo</option>
            </select>
          )}
        </Campo>
      </div>
    </Painel>
  );
}
