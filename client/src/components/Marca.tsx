import logo from "@/assets/pnst-logo.webp";

/** Logo do PNST (texto branco, barra laranja) — só sobre fundo escuro. */
export default function Marca({ legenda }: { legenda: string }) {
  return (
    <span className="brand-lockup">
      <img className="brand-logo" src={logo} alt="PNST" width={480} height={139} />
      <span className="brand-copy">{legenda}</span>
    </span>
  );
}
