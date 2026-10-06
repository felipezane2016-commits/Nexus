import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import Cabecalho from "@/admin/componentes/Cabecalho";
import { sla, useDadosLegal } from "@/modulos/legal/colecoes";
import { ETAPAS } from "@/modulos/legal/tipos";

export default function Slas() {
  const { sla: config } = useDadosLegal();
  const usuario = useUsuarioAtual();
  const podeEditar = pode(usuario, "registros.editar");

  return (
    <>
      <Cabecalho
        rotulo="Legal Workflow"
        titulo="SLAs e automações"
        descricao="Prazo de cada etapa em dias úteis. Mudar aqui recalcula na hora o prazo de todos os processos."
      />
      <div className="grid-2">
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Prazos</span>
              <h3>SLA por etapa</h3>
            </div>
          </div>
          <ul className="item-list">
            {ETAPAS.filter((etapa) => etapa.chave !== "finalizado").map((etapa) => (
              <li className="item-row" key={etapa.chave} style={{ alignItems: "center" }}>
                <div className="item-row-copy">
                  <label htmlFor={`sla-${etapa.chave}`}>
                    <strong>{etapa.nome}</strong>
                  </label>
                </div>
                <input
                  id={`sla-${etapa.chave}`}
                  className="field-input"
                  style={{ width: 84 }}
                  type="number"
                  min={0}
                  max={120}
                  value={config.dias[etapa.chave]}
                  disabled={!podeEditar}
                  onChange={(e) => {
                    const dias = Math.max(0, Math.min(120, Number(e.target.value) || 0));
                    sla.atualizar((atual) => ({ ...atual, dias: { ...atual.dias, [etapa.chave]: dias } }));
                  }}
                  aria-describedby="sla-unidade"
                />
              </li>
            ))}
          </ul>
          <p id="sla-unidade" className="field-hint" style={{ marginTop: 10 }}>
            Dias úteis. Zero deixa a etapa sem prazo.
          </p>
        </section>
        <section className="operations-surface">
          <div className="section-header">
            <div>
              <span className="eyebrow">Automações</span>
              <h3>Regras</h3>
              <p>Disparos automáticos entram com o envio de e-mail do backend.</p>
            </div>
          </div>
          {config.regras.map((regra) => (
            <div className="toggle-row" key={regra.id}>
              <div>
                <strong className="field-label" id={`regra-${regra.id}`}>
                  {regra.titulo}
                </strong>
                <p className="field-hint">{regra.descricao}</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={regra.ativa}
                aria-labelledby={`regra-${regra.id}`}
                disabled={!podeEditar}
                onClick={() => sla.atualizar((atual) => ({ ...atual, regras: atual.regras.map((item) => (item.id === regra.id ? { ...item, ativa: !item.ativa } : item)) }))}
              />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
