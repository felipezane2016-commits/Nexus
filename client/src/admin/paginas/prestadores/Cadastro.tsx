import { pode } from "@/_core/identidade/permissoes";
import { useUsuarioAtual } from "@/_core/identidade/sessao";
import { formatarData, gerarId, HOJE } from "@/_core/tempo";
import Cabecalho from "@/admin/componentes/Cabecalho";
import Campo from "@/admin/componentes/Campo";
import Painel from "@/admin/componentes/Painel";
import Selo from "@/admin/componentes/Selo";
import { salvarPrestador } from "@/modulos/prestadores/acoes";
import { codigoDisponivel } from "@/modulos/prestadores/regras";
import { CATEGORIAS_PRESTADOR, type CategoriaPrestador, type Prestador } from "@/modulos/prestadores/tipos";
import { useDadosPrestadores } from "@/modulos/prestadores/usarDados";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Cadastro() {
  const { prestadores } = useDadosPrestadores();
  const usuario = useUsuarioAtual();
  const podeEditar = pode(usuario, "registros.editar");
  const [editando, setEditando] = useState<Prestador | "novo" | null>(null);

  return (
    <>
      <Cabecalho
        rotulo="Prestadores de serviço"
        titulo="Cadastro e acesso"
        descricao="Quem presta serviço ao escritório e o acesso de cada um ao Portal do Prestador."
        acoes={
          podeEditar ? (
            <button type="button" className="button-primary" onClick={() => setEditando("novo")}>
              <Plus size={15} strokeWidth={2.2} /> Novo prestador
            </button>
          ) : null
        }
      />
      <section className="operations-surface">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Prestador</th>
                <th>Categoria</th>
                <th>Acesso ao portal</th>
                <th>Contato</th>
                <th>Desde</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {prestadores.map((prestador) => (
                <tr key={prestador.id}>
                  <td className="cell-main">
                    <strong>{prestador.nome}</strong>
                    <span>{prestador.documento}</span>
                  </td>
                  <td>{prestador.categoria}</td>
                  <td>
                    <div className="inline-row">
                      <span className="cell-code">{prestador.codigoAcesso}</span>
                      {prestador.portalAtivo ? <Selo tom="green">Ativo</Selo> : <Selo tom="neutral">Desativado</Selo>}
                    </div>
                  </td>
                  <td className="cell-main">
                    <strong className="texto-medio">{prestador.email}</strong>
                    <span>{prestador.telefone}</span>
                  </td>
                  <td>{formatarData(prestador.desde)}</td>
                  <td>
                    <div className="cell-actions">
                      {podeEditar ? (
                        <button type="button" className="text-button" onClick={() => setEditando(prestador)}>
                          Editar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editando ? (
        <FormularioPrestador
          prestador={editando === "novo" ? null : editando}
          todos={prestadores}
          aoFechar={() => setEditando(null)}
        />
      ) : null}
    </>
  );
}

type Erros = Partial<Record<"nome" | "email" | "codigoAcesso" | "senha", string>>;

function FormularioPrestador({ prestador, todos, aoFechar }: { prestador: Prestador | null; todos: Prestador[]; aoFechar: () => void }) {
  const [dados, setDados] = useState({
    nome: prestador?.nome ?? "",
    categoria: prestador?.categoria ?? ("Motoboy" as CategoriaPrestador),
    documento: prestador?.documento ?? "",
    email: prestador?.email ?? "",
    telefone: prestador?.telefone ?? "",
    codigoAcesso: prestador?.codigoAcesso ?? "",
    senha: "",
    portalAtivo: prestador?.portalAtivo ?? true,
  });
  const [erros, setErros] = useState<Erros>({});

  function mudar<K extends keyof typeof dados>(campo: K, valor: (typeof dados)[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    if (campo in erros) setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function salvar() {
    const encontrados: Erros = {};
    if (!dados.nome.trim()) encontrados.nome = "Informe o nome ou a razão social.";
    if (dados.email && !/^\S+@\S+\.\S+$/.test(dados.email)) encontrados.email = "E-mail inválido.";
    if (!dados.codigoAcesso.trim()) encontrados.codigoAcesso = "Defina o código de acesso ao portal.";
    else if (!codigoDisponivel(dados.codigoAcesso, todos, prestador?.id)) encontrados.codigoAcesso = "Este código já é de outro prestador.";
    // Na edição, senha em branco mantém a atual; no cadastro, é obrigatória.
    if ((!prestador || dados.senha) && dados.senha.length < 6) encontrados.senha = "Mínimo de 6 caracteres.";
    if (Object.values(encontrados).some(Boolean)) {
      setErros(encontrados);
      return;
    }
    salvarPrestador({
      id: prestador?.id ?? gerarId("prest"),
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      documento: dados.documento.trim(),
      email: dados.email.trim(),
      telefone: dados.telefone.trim(),
      codigoAcesso: dados.codigoAcesso.trim().toUpperCase(),
      senha: dados.senha || prestador?.senha || "",
      portalAtivo: dados.portalAtivo,
      contrato: prestador?.contrato ?? `Contrato de prestação ${dados.codigoAcesso.trim().toUpperCase()}`,
      desde: prestador?.desde ?? HOJE,
    });
    aoFechar();
  }

  return (
    <Painel
      rotulo={prestador ? "Editar prestador" : "Novo prestador"}
      titulo={prestador?.nome ?? "Cadastrar prestador"}
      descricao="O código e a senha são o acesso do prestador ao Portal do Prestador."
      aoFechar={aoFechar}
      aoEnviar={salvar}
    >
      <div className="field-grid">
        <Campo id="prest-nome" rotulo="Nome ou razão social" erro={erros.nome}>
          {(aria) => <input {...aria} className="field-input" value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} />}
        </Campo>
        <Campo id="prest-categoria" rotulo="Categoria">
          {(aria) => (
            <select {...aria} className="field-input" value={dados.categoria} onChange={(e) => mudar("categoria", e.target.value as CategoriaPrestador)}>
              {CATEGORIAS_PRESTADOR.map((categoria) => (
                <option key={categoria}>{categoria}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <div className="field-grid">
        <Campo id="prest-email" rotulo="E-mail" erro={erros.email}>
          {(aria) => <input {...aria} className="field-input" type="email" value={dados.email} onChange={(e) => mudar("email", e.target.value)} />}
        </Campo>
        <Campo id="prest-telefone" rotulo="Telefone">
          {(aria) => <input {...aria} className="field-input" value={dados.telefone} onChange={(e) => mudar("telefone", e.target.value)} placeholder="(11) 99999-9999" />}
        </Campo>
      </div>
      <Campo id="prest-documento" rotulo="CPF ou CNPJ">
        {(aria) => <input {...aria} className="field-input" value={dados.documento} onChange={(e) => mudar("documento", e.target.value)} />}
      </Campo>
      <div className="field-grid">
        <Campo id="prest-codigo" rotulo="Código de acesso" erro={erros.codigoAcesso} dica="Ex.: PNST-0000">
          {(aria) => (
            <input {...aria} className="field-input" value={dados.codigoAcesso} onChange={(e) => mudar("codigoAcesso", e.target.value)} autoCapitalize="characters" autoComplete="off" />
          )}
        </Campo>
        <Campo id="prest-senha" rotulo="Senha do portal" erro={erros.senha} dica={prestador ? "Em branco mantém a atual" : "Mínimo de 6 caracteres"}>
          {(aria) => (
            <input {...aria} className="field-input" type="password" value={dados.senha} onChange={(e) => mudar("senha", e.target.value)} autoComplete="new-password" />
          )}
        </Campo>
      </div>
      <div className="toggle-row">
        <div>
          <strong className="field-label" id="prest-ativo-rotulo">
            Acesso ao portal ativo
          </strong>
          <p className="field-hint">Desativar encerra a sessão aberta do prestador.</p>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={dados.portalAtivo}
          aria-labelledby="prest-ativo-rotulo"
          onClick={() => mudar("portalAtivo", !dados.portalAtivo)}
        />
      </div>
    </Painel>
  );
}
