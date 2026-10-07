import { useEffect, type RefObject } from "react";

/** Fecha um menu suspenso ao clicar fora dele ou apertar Esc. */
export function usarFecharFora(ref: RefObject<HTMLElement | null>, aberto: boolean, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return;
    const clique = (evento: MouseEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) fechar();
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    document.addEventListener("mousedown", clique);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", clique);
      document.removeEventListener("keydown", tecla);
    };
  }, [ref, aberto, fechar]);
}
