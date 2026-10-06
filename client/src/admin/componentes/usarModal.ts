import { useEffect, useRef } from "react";

/**
 * Comportamento comum a painel e gaveta: Esc fecha e o foco entra no primeiro
 * campo. aoFechar fica em ref porque muda a cada render do pai — no array de
 * dependências, devolveria o foco ao primeiro campo no meio da digitação.
 */
export function usarModal(aoFechar: () => void) {
  const raiz = useRef<HTMLDivElement>(null);
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = raiz.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), select, textarea, button:not([data-fechar])",
    );
    primeiro?.focus();
    const tecla = (evento: KeyboardEvent) => evento.key === "Escape" && fechar.current();
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      anterior?.focus?.();
    };
  }, []);

  return raiz;
}
