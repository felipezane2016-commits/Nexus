import { criarColecao, useColecao } from "@/_core/armazenamento/colecao";
import type { Modulo, Usuario } from "./permissoes";

const MODULOS_TODOS: Modulo[] = [
  "visao",
  "calendario",
  "tarefas",
  "documentos",
  "prestadores",
  "contas",
];

/** Pessoas fictícias: o link do protótipo é compartilhável. */
export const USUARIOS_DEMO: Usuario[] = [
  {
    id: "usr-fernanda",
    nome: "Fernanda Moraes",
    email: "fernanda@nexus.demo",
    senha: "nexus2026",
    departamento: "Administrativo",
    papel: "admin",
    modulos: MODULOS_TODOS,
    ativo: true,
    ultimoAcesso: "2026-06-30T08:12:00.000Z",
  },
  {
    id: "usr-ricardo",
    nome: "Ricardo Alves",
    email: "ricardo@nexus.demo",
    senha: "nexus2026",
    departamento: "Operações",
    papel: "gestor",
    modulos: ["visao", "calendario", "tarefas", "documentos", "prestadores", "contas"],
    ativo: true,
    ultimoAcesso: "2026-06-29T17:40:00.000Z",
  },
  {
    id: "usr-marcos",
    nome: "Marcos Teixeira",
    email: "marcos@nexus.demo",
    senha: "nexus2026",
    departamento: "Chefe da Administração",
    papel: "gestor",
    modulos: ["visao", "calendario", "tarefas", "documentos", "contas"],
    ativo: true,
    ultimoAcesso: "2026-06-30T08:40:00.000Z",
  },
  {
    id: "usr-helena",
    nome: "Helena Prado",
    email: "helena@nexus.demo",
    senha: "nexus2026",
    departamento: "Operações",
    papel: "operador",
    modulos: ["calendario", "tarefas", "prestadores"],
    ativo: true,
    ultimoAcesso: "2026-06-30T09:05:00.000Z",
  },
  {
    id: "usr-caio",
    nome: "Caio Lemos",
    email: "caio@nexus.demo",
    senha: "nexus2026",
    departamento: "Financeiro",
    papel: "viewer",
    modulos: ["visao", "prestadores", "contas"],
    ativo: true,
    ultimoAcesso: "2026-06-26T11:20:00.000Z",
  },
  {
    id: "usr-bianca",
    nome: "Bianca Torres",
    email: "bianca@nexus.demo",
    senha: "nexus2026",
    departamento: "RH",
    papel: "operador",
    modulos: ["visao", "calendario", "tarefas"],
    ativo: false,
    ultimoAcesso: "2026-03-14T10:00:00.000Z",
  },
];

export const usuarios = criarColecao<Usuario[]>("usuarios", () => USUARIOS_DEMO);

type Sessao = { usuarioId: string | null };
export const sessaoAdmin = criarColecao<Sessao>("sessao-admin", () => ({ usuarioId: null }));

/** Usuário logado — desativado no meio da sessão perde o acesso na hora. */
export function useUsuarioAtual(): Usuario | null {
  const sessao = useColecao(sessaoAdmin);
  const lista = useColecao(usuarios);
  return lista.find((usuario) => usuario.id === sessao.usuarioId && usuario.ativo) ?? null;
}

export function entrar(email: string, senha: string): { ok: true } | { ok: false; mensagem: string } {
  const alvo = email.trim().toLowerCase();
  const usuario = usuarios.ler().find((item) => item.email.toLowerCase() === alvo);
  if (!usuario || usuario.senha !== senha) return { ok: false, mensagem: "E-mail ou senha incorretos." };
  if (!usuario.ativo) return { ok: false, mensagem: "Este usuário está inativo. Fale com um administrador." };
  const agora = new Date().toISOString();
  usuarios.atualizar((lista) => lista.map((item) => (item.id === usuario.id ? { ...item, ultimoAcesso: agora } : item)));
  sessaoAdmin.atualizar(() => ({ usuarioId: usuario.id }));
  return { ok: true };
}

export function sair() {
  sessaoAdmin.atualizar(() => ({ usuarioId: null }));
}

