import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { calculateClosingProgress, formatBRL, formatMonth } from "@/lib/portal";

type Tab = "dashboard" | "recibos" | "fechamento";
type ReceiptStatus = "Rascunho" | "Enviado" | "Aprovado" | "Rejeitado";

type Receipt = {
  id: string;
  service: string;
  client: string;
  category: string;
  caseProject: string;
  requester: string;
  description: string;
  date: string;
  amount: number;
  status: ReceiptStatus;
  attachment?: string;
};

type Closing = {
  month: string;
  status: "Pronto para envio" | "Enviado para conferência" | "Aprovado";
  sentAt?: string;
  document?: string;
};

const RECEIPTS_KEY = "nexus-prototype-receipts";
const CLOSING_KEY = "nexus-prototype-closing";

const seedReceipts: Receipt[] = [
  { id: "REC-2406", service: "Entregas e diligências", client: "PNST Advogados", category: "Motoboy", caseProject: "Diligência 2406", requester: "Ana Souza", description: "Entrega de documentos e diligência externa.", date: "2026-06-06", amount: 860, status: "Aprovado", attachment: "recibo-junho.pdf" },
  { id: "REC-2407", service: "Apoio operacional", client: "PNSTART", category: "Administrativo", caseProject: "Operação 2407", requester: "Carlos Lima", description: "Apoio operacional do período.", date: "2026-06-11", amount: 640, status: "Enviado", attachment: "nota-apoio.pdf" },
  { id: "REC-2408", service: "Diligência cartorial", client: "PNST Advogados", category: "Cartório", caseProject: "Caso 2408", requester: "Marina Alves", description: "Diligência e acompanhamento cartorial.", date: "2026-06-15", amount: 420, status: "Enviado", attachment: undefined },
  { id: "REC-2409", service: "Rota extraordinária", client: "PNSTART", category: "Motoboy", caseProject: "Rota 2409", requester: "João Costa", description: "Rota extraordinária solicitada pelo escritório.", date: "2026-06-18", amount: 315, status: "Rascunho", attachment: undefined },
];

const seedClosing: Closing = { month: "2026-06", status: "Pronto para envio" };

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "recibos", label: "Meus recibos", icon: ReceiptText },
  { id: "fechamento", label: "Fechamento mensal", icon: CalendarDays },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value}T12:00:00`))
    .replace(" de ", " ");
}

function statusClass(status: ReceiptStatus | Closing["status"]) {
  if (status === "Aprovado") return "status status-approved";
  if (status === "Enviado" || status === "Enviado para conferência") return "status status-sent";
  if (status === "Rejeitado") return "status status-rejected";
  return "status status-draft";
}

function StatusPill({ status }: { status: ReceiptStatus | Closing["status"] }) {
  return <span className={statusClass(status)}><span className="status-dot" />{status}</span>;
}

function Brand() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><span>N</span></div>
      <div><strong>Nexus</strong><small>Portal do Prestador</small></div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [email, setEmail] = useState("prestador@exemplo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email || password.length < 4) {
      setError("Informe um usuário e uma senha válidos.");
      return;
    }
    onLogin("Leonardo Almeida");
  }

  return (
    <main className="login-page">
      <div className="login-artwork">
        <div className="art-grid" />
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="login-art-copy">
          <div className="eyebrow light"><Sparkles size={14} /> Operação mais simples</div>
          <h1>Seu trabalho,<br /><em>em um só lugar.</em></h1>
          <p>Envie recibos, acompanhe aprovações e faça o fechamento mensal sem trocar dezenas de mensagens.</p>
          <div className="trust-line"><ShieldCheck size={17} /> Ambiente seguro para prestadores cadastrados</div>
        </div>
      </div>
      <section className="login-panel">
        <div className="login-panel-inner">
          <Brand />
          <div className="login-heading">
            <div className="eyebrow">Acesso do prestador</div>
            <h2>Bem-vindo de volta</h2>
            <p>Entre para acompanhar seus recibos e fechamentos.</p>
          </div>
          <form onSubmit={submit} className="login-form">
            <label>Usuário ou e-mail<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></label>
            <label>Senha<div className="password-wrap"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" /><span>•••</span></div></label>
            {error && <div className="form-error">{error}</div>}
            <div className="login-options"><label className="check-label"><input type="checkbox" defaultChecked /> <span>Manter conectado</span></label><button type="button" className="text-button" onClick={() => toast.info("Em um produto final, o link de recuperação seria enviado por e-mail.")}>Esqueci minha senha</button></div>
            <button className="primary-button login-submit" type="submit">Entrar no portal <ArrowUpRight size={17} /></button>
          </form>
          <div className="demo-note"><span className="demo-dot" /><div><strong>Modo demonstração</strong><br /><span>Use os dados já preenchidos para explorar o protótipo.</span></div></div>
          <p className="login-legal">Acesso exclusivo para prestadores de serviços cadastrados.</p>
        </div>
      </section>
    </main>
  );
}

function AppShell({ userName, tab, setTab, onLogout, children }: { userName: string; tab: Tab; setTab: (tab: Tab) => void; onLogout: () => void; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = userName.split(" ").map((part) => part[0]).join("").slice(0, 2);

  function navigate(next: Tab) {
    setTab(next);
    setMobileOpen(false);
  }

  return (
    <div className="portal-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="profile-mini"><div className="avatar avatar-small">{initials}</div><div><strong>{userName}</strong><span>Prestador de serviços</span></div><button className="icon-button"><MoreHorizontal size={17} /></button></div>
        <div className="sidebar-label">Menu principal</div>
        <nav className="sidebar-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-button ${tab === id ? "active" : ""}`} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{id === "fechamento" && <span className="nav-badge">!</span>}</button>)}</nav>
        <div className="sidebar-help"><div className="help-icon"><Bell size={17} /></div><strong>Precisa de ajuda?</strong><p>Fale com o financeiro sobre seus documentos.</p><button onClick={() => toast.success("Mensagem preparada para o time financeiro.")}>Abrir suporte <ChevronRight size={14} /></button></div>
        <div className="sidebar-bottom"><button className="nav-button logout-button" onClick={onLogout}><LogOut size={18} /><span>Sair do portal</span></button></div>
      </aside>
      {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}
      <main className="portal-main">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="topbar-context"><span>Portal do Prestador</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === tab)?.label}</strong></div><div className="topbar-actions"><button className="icon-button notification-button" onClick={() => toast.info("Você não tem novas notificações.")}><Bell size={19} /><i /></button><div className="topbar-user"><div className="avatar">{initials}</div><div><strong>{userName}</strong><span>Prestador</span></div></div></div></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ receipts, closing, setTab, userName }: { receipts: Receipt[]; closing: Closing; setTab: (tab: Tab) => void; userName: string }) {
  const total = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const approved = receipts.filter((receipt) => receipt.status === "Aprovado").reduce((sum, receipt) => sum + receipt.amount, 0);
  const pending = receipts.filter((receipt) => receipt.status === "Enviado").reduce((sum, receipt) => sum + receipt.amount, 0);
  const progress = calculateClosingProgress(receipts.map((receipt) => receipt.status), Boolean(closing.document), closing.status !== "Pronto para envio");

  return <>
    <PageHeader eyebrow="Quarta-feira, 18 de junho de 2026" title={`Olá, ${userName.split(" ")[0]} 👋`} description="Aqui está um resumo da sua operação neste mês." action={<button className="primary-button" onClick={() => setTab("recibos")}><Plus size={17} /> Novo recibo</button>} />
    <div className="notice-banner"><div className="notice-icon"><CalendarDays size={18} /></div><div><strong>Seu fechamento de junho está quase pronto</strong><span>Confira os recibos e envie a nota fiscal até 30/06.</span></div><button onClick={() => setTab("fechamento")}>Revisar fechamento <ArrowUpRight size={16} /></button></div>
    <section className="metric-grid"><MetricCard label="Total no mês" value={formatBRL(total)} detail="4 recibos cadastrados" icon={<CircleDollarSign size={19} />} tone="blue" /><MetricCard label="Aprovado" value={formatBRL(approved)} detail="1 recibo aprovado" icon={<CheckCircle2 size={19} />} tone="green" /><MetricCard label="Em conferência" value={formatBRL(pending)} detail="2 recibos enviados" icon={<Clock3 size={19} />} tone="orange" /><MetricCard label="Documentos" value={`${receipts.filter((r) => r.attachment).length}/${receipts.length}`} detail="com anexo" icon={<Paperclip size={19} />} tone="violet" /></section>
    <section className="dashboard-grid"><div className="card progress-card"><div className="card-heading"><div><h3>Progresso do fechamento</h3><p>Competência {formatMonth(closing.month)}</p></div><span className="progress-percent">{progress}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="progress-steps"><Step label="Recibos cadastrados" done={receipts.length > 0} /><Step label="Conferência interna" done={receipts.some((r) => r.status === "Aprovado")} /><Step label="Documento fiscal" done={Boolean(closing.document)} /><Step label="Enviado" done={closing.status !== "Pronto para envio"} /></div><button className="secondary-button full-width" onClick={() => setTab("fechamento")}>Ver detalhes do fechamento <ChevronRight size={16} /></button></div><div className="card quick-card"><div className="card-heading"><div><h3>Ações rápidas</h3><p>Resolva o que importa primeiro.</p></div><Sparkles size={18} className="muted-icon" /></div><QuickAction icon={<ReceiptText size={17} />} title="Cadastrar um recibo" description="Adicione um novo serviço prestado" onClick={() => setTab("recibos")} /><QuickAction icon={<FileCheck2 size={17} />} title="Revisar documentos" description="Confira os anexos deste mês" onClick={() => setTab("fechamento")} /><QuickAction icon={<Download size={17} />} title="Baixar comprovantes" description="Exporte seu histórico de recibos" onClick={() => toast.success("Seu relatório está sendo preparado.")} /></div></section>
    <section className="card recent-card"><div className="card-heading"><div><h3>Recibos recentes</h3><p>Últimos lançamentos do seu portal</p></div><button className="text-button with-icon" onClick={() => setTab("recibos")}>Ver todos <ArrowUpRight size={15} /></button></div><ReceiptTable receipts={receipts.slice(0, 4)} compact /></section>
  </>;
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function Step({ label, done }: { label: string; done: boolean }) {
  return <div className={`progress-step ${done ? "done" : ""}`}><span>{done ? <Check size={11} /> : <span />}</span><small>{label}</small></div>;
}

function QuickAction({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-action-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={16} /></button>;
}

function ReceiptTable({ receipts, compact = false }: { receipts: Receipt[]; compact?: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Recibo</th><th>Serviço / cliente</th><th>Data</th><th>Valor</th><th>Status</th><th /></tr></thead><tbody>{receipts.map((receipt) => <tr key={receipt.id}><td><strong className="receipt-id">{receipt.id}</strong></td><td><div className="service-cell"><strong>{receipt.service}</strong><span>{receipt.client}</span></div></td><td>{formatDate(receipt.date)}</td><td><strong>{formatBRL(receipt.amount)}</strong></td><td><StatusPill status={receipt.status} /></td><td><button className="table-more" onClick={() => toast.info(`${receipt.id}: ${receipt.attachment ? `anexo ${receipt.attachment}` : "sem anexo"}.`)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{!receipts.length && <div className="empty-state"><ReceiptText size={26} /><strong>Nenhum recibo encontrado</strong><span>Cadastre seu primeiro recibo para começar.</span></div>}{compact && receipts.length > 0 && <div className="table-footnote"><span><span className="green-dot" /> Dados sincronizados agora</span><span>{receipts.length} registros exibidos</span></div>}</div>;
}

function ReceiptsPage({ receipts, onAdd }: { receipts: Receipt[]; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const filtered = receipts.filter((receipt) => `${receipt.id} ${receipt.service} ${receipt.client}`.toLowerCase().includes(search.toLowerCase()) && (filter === "Todos" || receipt.status === filter));
  const total = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return <><PageHeader eyebrow="Central de documentos" title="Meus recibos" description="Cadastre e acompanhe os recibos dos serviços que você realizou." action={<button className="primary-button" onClick={onAdd}><Plus size={17} /> Novo recibo</button>} /><div className="summary-strip"><div><span>Valor acumulado</span><strong>{formatBRL(total)}</strong></div><div><span>Recibos no período</span><strong>{receipts.length}</strong></div><div><span>Em conferência</span><strong>{receipts.filter((r) => r.status === "Enviado").length}</strong></div><div><span>Com anexo</span><strong>{receipts.filter((r) => r.attachment).length}</strong></div></div><section className="card list-card"><div className="list-toolbar"><div className="search-input"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por recibo, serviço ou cliente" /></div><div className="filter-group">{["Todos", "Rascunho", "Enviado", "Aprovado"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div><ReceiptTable receipts={filtered} /></section></>;
}

function ClosingPage({ receipts, closing, onSend }: { receipts: Receipt[]; closing: Closing; onSend: (document: string) => void }) {
  const [file, setFile] = useState(closing.document || "");
  const active = receipts.filter((receipt) => receipt.status !== "Rejeitado");
  const total = active.reduce((sum, receipt) => sum + receipt.amount, 0);
  const sent = closing.status !== "Pronto para envio";

  return <><PageHeader eyebrow="Consolidação financeira" title="Fechamento mensal" description="Reúna seus recibos e envie a documentação fiscal para conferência." action={<div className="month-select"><CalendarDays size={16} /><select defaultValue={closing.month}><option value="2026-06">Junho de 2026</option><option value="2026-05">Maio de 2026</option></select></div>} /><div className={`closing-status ${sent ? "closing-sent" : ""}`}><div className="closing-status-icon">{sent ? <CheckCircle2 size={21} /> : <ClipboardCheck size={21} />}</div><div><strong>{sent ? "Fechamento enviado para conferência" : "Fechamento pronto para revisão"}</strong><span>{sent ? `Enviado em ${closing.sentAt || "18/06/2026"}. A equipe financeira analisará seus documentos.` : "Revise os recibos, adicione a nota fiscal e envie tudo de uma vez."}</span></div><StatusPill status={sent ? closing.status : "Pronto para envio"} /></div><div className="closing-grid"><div className="card closing-main"><div className="card-heading"><div><h3>Resumo de junho</h3><p>{active.length} recibos fazem parte deste fechamento</p></div><span className="closing-total">{formatBRL(total)}</span></div><div className="closing-receipts">{active.map((receipt) => <div className="closing-receipt" key={receipt.id}><div className="closing-receipt-icon"><FileText size={17} /></div><div><strong>{receipt.service}</strong><span>{receipt.id} · {formatDate(receipt.date)}</span></div><div className="closing-receipt-value">{formatBRL(receipt.amount)}<StatusPill status={receipt.status} /></div></div>)}</div><div className="closing-total-line"><span>Total do fechamento</span><strong>{formatBRL(total)}</strong></div></div><div className="card upload-card"><div className="card-heading"><div><h3>Documento fiscal</h3><p>NF, fatura ou boleto referente ao total.</p></div><Paperclip size={18} className="muted-icon" /></div><label className={`upload-box ${file ? "has-file" : ""}`}><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files?.[0]?.name || "")} />{file ? <><CheckCircle2 size={25} /><strong>{file}</strong><span>Arquivo selecionado · clique para substituir</span></> : <><Upload size={24} /><strong>Arraste o arquivo aqui</strong><span>ou clique para procurar · PDF, JPG ou PNG</span></>}</label><div className="upload-tip"><ShieldCheck size={15} /> Seus documentos são tratados com segurança.</div><button className="primary-button full-width" disabled={sent || !file} onClick={() => onSend(file)}>{sent ? "Fechamento já enviado" : "Enviar fechamento"}<ArrowUpRight size={17} /></button>{!sent && !file && <small className="button-hint">Adicione um documento para habilitar o envio.</small>}</div></div></>;
}

function ReceiptModal({ draft, onClose, onSave }: { draft: Receipt; onClose: () => void; onSave: (receipt: Receipt) => void }) {
  const [date, setDate] = useState(draft.date);
  const [category, setCategory] = useState(draft.category || "Motoboy");
  const [client, setClient] = useState(draft.client || "PNST Advogados");
  const [caseProject, setCaseProject] = useState(draft.caseProject);
  const [requester, setRequester] = useState(draft.requester);
  const [amount, setAmount] = useState(draft.amount ? String(draft.amount) : "");
  const [description, setDescription] = useState(draft.description);
  const [file, setFile] = useState(draft.attachment || "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!date || !category || !client || !description || !amount || Number(amount) <= 0) {
      setError("Preencha os campos obrigatórios: data, categoria, cliente, descrição e valor.");
      return;
    }
    onSave({ id: draft.id || `REC-${String(Date.now()).slice(-4)}`, service: description.slice(0, 42), client, category, caseProject, requester, description, date, amount: Number(amount), status: "Rascunho", attachment: file || undefined });
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card"><div className="modal-header"><div><div className="eyebrow">Informações do serviço</div><h2>Novo Recibo</h2><p>Registre os detalhes do serviço prestado.</p></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit} className="modal-form"><div className="form-grid"><label>Data do Serviço *<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Categoria *<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Motoboy</option><option>Cartório</option><option>Administrativo</option><option>Consultoria</option><option>Outro</option></select></label><label>Cliente *<input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" /></label><label>Caso / Projeto<input value={caseProject} onChange={(e) => setCaseProject(e.target.value)} placeholder="Número ou nome" /></label><label>Solicitante<input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Quem solicitou" /></label><label>Valor (R$) *<input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></label></div><label>Descrição detalhada *<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o serviço executado..." rows={4} /></label><label className="file-field"><span><Paperclip size={13} /> Documentos (NF, Boleto, Comprovante...)</span><span className="file-select"><Paperclip size={16} />{file || "Escolher arquivo"}<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0]?.name || "")} /></span></label>{error && <div className="form-error">{error}</div>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button"><Check size={17} /> Salvar</button></div></form></section></div>;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(() => window.localStorage.getItem("nexus-prototype-session") === "active");
  const [userName, setUserName] = useState("Leonardo Almeida");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [receipts, setReceipts] = useState<Receipt[]>(() => readStorage(RECEIPTS_KEY, seedReceipts));
  const [closing, setClosing] = useState<Closing>(() => readStorage(CLOSING_KEY, seedClosing));
  const [receiptDraft, setReceiptDraft] = useState<Receipt | null>(null);

  useEffect(() => { window.localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts)); }, [receipts]);
  useEffect(() => { window.localStorage.setItem(CLOSING_KEY, JSON.stringify(closing)); }, [closing]);

  const page = useMemo(() => {
    if (tab === "recibos") return <ReceiptsPage receipts={receipts} onAdd={() => setReceiptDraft({ id: "", service: "", client: "", category: "Motoboy", caseProject: "", requester: "", description: "", date: "2026-06-18", amount: 0, status: "Rascunho" })} />;
    if (tab === "fechamento") return <ClosingPage receipts={receipts} closing={closing} onSend={(document) => { setClosing({ ...closing, status: "Enviado para conferência", sentAt: "18/06/2026", document }); setReceipts((current) => current.map((receipt) => receipt.status === "Rascunho" ? { ...receipt, status: "Enviado" } : receipt)); toast.success("Fechamento enviado para conferência."); }} />;
    return <Dashboard receipts={receipts} closing={closing} setTab={setTab} userName={userName} />;
  }, [closing, receipts, tab, userName]);

  function login(name: string) { setUserName(name); setLoggedIn(true); window.localStorage.setItem("nexus-prototype-session", "active"); toast.success("Login realizado. Bem-vindo ao portal!"); }
  function logout() { setLoggedIn(false); window.localStorage.removeItem("nexus-prototype-session"); setTab("dashboard"); }
  function saveReceipt(receipt: Receipt) { setReceipts((current) => [receipt, ...current.filter((item) => item.id !== receipt.id)]); setReceiptDraft(null); toast.success("Recibo salvo com sucesso."); }

  if (!loggedIn) return <LoginScreen onLogin={login} />;
  return <><AppShell userName={userName} tab={tab} setTab={setTab} onLogout={logout}>{page}</AppShell>{receiptDraft && <ReceiptModal draft={receiptDraft} onClose={() => setReceiptDraft(null)} onSave={saveReceipt} />}</>;
}
