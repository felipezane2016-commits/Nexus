import logo from "@/assets/pnst-logo-branca.webp";

/**
 * Logo do PNST na versão monocromática branca — a de uso sobre o laranja da
 * marca (na versão original a barra laranja some nesse fundo).
 */
export default function Marca({ legenda }: { legenda: string }) {
  return (
    <span className="brand-lockup">
      <img className="brand-logo" src={logo} alt="PNST" width={480} height={139} />
      <span className="brand-copy">{legenda}</span>
    </span>
  );
}
