import Cabecalho from "@/admin/componentes/Cabecalho";
import Vazio from "@/admin/componentes/Vazio";
import { Bot } from "lucide-react";

/** Já estava fora do ar no app antigo; continua em construção, dito com todas as letras. */
export default function Agente() {
  return (
    <>
      <Cabecalho rotulo="Legal Workflow" titulo="Agente IA" />
      <section className="operations-surface">
        <Vazio
          icone={Bot}
          titulo="Em construção"
          texto="O agente que lê documentos e sugere o próximo passo de cada processo depende do backend. Até lá, nada aqui executa."
        />
      </section>
    </>
  );
}
