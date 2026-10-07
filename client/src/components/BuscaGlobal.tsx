import { Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { usarFecharFora } from "./usarFecharFora";

export type ItemBusca = {
  id: string;
  grupo: string;
  titulo: string;
  detalhe?: string;
  icone?: ReactNode;
  abrir: () => void;
};

type Props = {
  /** Lido só quando a busca abre: a lista pode ser montada a partir das coleções. */
  itens: () => ItemBusca[];
  placeholder: string;
};

/** Busca do topo: um botão que abre um campo e os resultados agrupados. */
export default function BuscaGlobal({ itens, placeholder }: Props) {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberta(false), []);
  usarFecharFora(ref, aberta, fechar);

  const resultados = useMemo(() => {
    const alvo = termo.trim().toLowerCase();
    if (!aberta || alvo.length < 2) return [];
    return itens()
      .filter((item) => `${item.titulo} ${item.detalhe ?? ""}`.toLowerCase().includes(alvo))
      .slice(0, 12);
  }, [aberta, termo, itens]);

  const grupos = resultados.reduce<Record<string, ItemBusca[]>>((acc, item) => {
    (acc[item.grupo] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="topbar-menu" ref={ref}>
      <button
        type="button"
        className="search-trigger"
        aria-expanded={aberta}
        onClick={() => {
          setAberta((valor) => !valor);
          setTermo("");
        }}
      >
        <Search size={16} strokeWidth={1.9} />
        <span>Buscar</span>
      </button>
      {aberta ? (
        <div className="topbar-dropdown busca-menu" role="dialog" aria-label="Busca">
          <div className="busca-campo">
            <Search size={15} strokeWidth={1.9} aria-hidden="true" />
            <input autoFocus value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={placeholder} aria-label="Buscar" />
          </div>
          <div className="busca-resultados">
            {termo.trim().length < 2 ? (
              <p className="busca-vazio">Digite ao menos 2 caracteres para buscar.</p>
            ) : resultados.length === 0 ? (
              <p className="busca-vazio">Nenhum resultado para “{termo.trim()}”.</p>
            ) : (
              Object.entries(grupos).map(([grupo, lista]) => (
                <div key={grupo}>
                  <p className="busca-grupo">{grupo}</p>
                  {lista.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="busca-item"
                      onClick={() => {
                        setAberta(false);
                        item.abrir();
                      }}
                    >
                      {item.icone}
                      <span>
                        <strong>{item.titulo}</strong>
                        {item.detalhe ? <small>{item.detalhe}</small> : null}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
