import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ===================== helpers ===================== */
const LS_API = "api_base_url";
const LS_THEME = "theme_pref"; // "light" | "dark"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function api(baseUrl, path, opts) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ===================== tiny UI kit ===================== */
function Icon({ name, className = "h-4 w-4" }) {
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "check": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M20 6 9 17l-5-5" /></svg>;
    case "alert": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>;
    case "refresh": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" /></svg>;
    case "trash": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>;
    case "sun": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M6.06 6.06 4.64 4.64m12.02 0-1.42 1.42M6.06 17.94 4.64 19.36M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" /></svg>;
    case "moon": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case "search": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" /></svg>;
    case "plus": return <svg viewBox="0 0 24 24" className={className}><path {...common} d="M12 5v14M5 12h14" /></svg>;
    default: return null;
  }
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 active:scale-[.99]",
    outline: "border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200",
    subtle: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
const Input = (props) => (
  <input className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700" {...props} />
);
const Textarea = (props) => (
  <textarea className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700" {...props} />
);
function Badge({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-slate-200/70 dark:ring-slate-700",
    green: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800",
    red: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800",
    blue: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-800",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${map[tone]}`}>{children}</span>;
}
const Card = ({ children, className = "" }) => <div className={`rounded-2xl border border-white/30 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200/60 dark:border-slate-800/80">
    <div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
);
const CardBody = ({ children, className = "" }) => <div className={`p-5 ${className}`}>{children}</div>;

function Modal({ open, title, subtitle, children, onClose, onConfirm, confirmText = "Confirmar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h4 className="font-semibold">{title}</h4>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-5">{children}</div>
        <div className="p-5 pt-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}><Icon name="trash" /> {confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

/* ===== Toaster correto (HOOK + viewport) ===== */
function useToastStack() {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((tone, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  const View = () => {
    const colors = { ok: "bg-emerald-600", warn: "bg-amber-600", err: "bg-rose-600" };
    return (
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-xl ${colors[t.tone]} text-white shadow-lg px-4 py-3 text-sm`}>
            {t.text}
          </div>
        ))}
      </div>
    );
  };
  return { notify, View };
}

/* ===================== App ===================== */
export default function App() {
  /* tema */
  function getInitialTheme() {
    const saved = localStorage.getItem(LS_THEME);
    if (saved === "light" || saved === "dark") return saved;
    // 1ª carga respeita a preferência do sistema
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  /* base URL */
  const [baseUrl, setBaseUrl] = useState(
    localStorage.getItem(LS_API) || API_BASE_URL || "http://localhost:3000"
  );
  useEffect(() => localStorage.setItem(LS_API, baseUrl), [baseUrl]);

  /* toasts (hook no topo) */
  const { notify, View: ToastView } = useToastStack();

  /* estados */
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userSort, setUserSort] = useState("id:asc");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [newUser, setNewUser] = useState({ id: "", nome: "", email: "" });
  const [newTask, setNewTask] = useState({ id: "", titulo: "", descricao: "", status: "aberta" });

  const [modalOpen, setModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [tab, setTab] = useState("usuarios");

  /* chamadas API */
  const checkHealth = async () => {
    try { setLoadingHealth(true); const h = await api(baseUrl, "/healthz"); setHealth(h); notify("ok", "API online"); }
    catch { setHealth(null); notify("err", "Falha ao consultar /healthz"); }
    finally { setLoadingHealth(false); }
  };
  const loadUsers = async () => {
    try { setLoadingUsers(true); await sleep(200); const data = await api(baseUrl, "/usuarios"); setUsers(data.usuarios || []); }
    catch { setUsers([]); notify("warn", "Erro ao listar usuários"); }
    finally { setLoadingUsers(false); }
  };
  const loadTasks = async (uid) => {
    if (!uid) return;
    try { setLoadingTasks(true); await sleep(200); const data = await api(baseUrl, `/tarefas/usuario/${uid}`); setTasks(data.tarefas || []); }
    catch { setTasks([]); notify("warn", "Erro ao listar tarefas"); }
    finally { setLoadingTasks(false); }
  };
  const createUser = async () => {
    if (!newUser.id || !newUser.email) return notify("warn", "Informe id e email");
    try { await api(baseUrl, "/usuarios", { method: "POST", body: JSON.stringify(newUser) }); setNewUser({ id: "", nome: "", email: "" }); await loadUsers(); notify("ok", "Usuário criado!"); }
    catch { notify("err", "Falha ao criar (id/email pode existir)"); }
  };
  const createTask = async () => {
    if (!selectedUser) return notify("warn", "Selecione um usuário");
    if (!newTask.id || !newTask.titulo) return notify("warn", "Preencha id e título");
    try {
      await api(baseUrl, "/tarefas", { method: "POST", body: JSON.stringify({ ...newTask, usuario_id: selectedUser }) });
      setNewTask({ id: "", titulo: "", descricao: "", status: "aberta" });
      await loadTasks(selectedUser);
      notify("ok", "Tarefa criada!");
    } catch { notify("err", "Erro ao criar tarefa"); }
  };
  const updateTaskStatus = async (taskId, status) => {
    try { await api(baseUrl, `/tarefas/${taskId}/status`, { method: "PUT", body: JSON.stringify({ status }) }); }
    catch { /* se falhar, ainda atualizamos localmente para a demo */ }
    setTasks((arr) => arr.map((t) => (t.id === taskId ? { ...t, status } : t)));
    notify("ok", "Status atualizado");
  };
  const requestDeleteTask = (task) => { setTaskToDelete(task); setModalOpen(true); };
  const confirmDeleteTask = async () => {
    try { await api(baseUrl, `/tarefas/${taskToDelete.id}`, { method: "DELETE" }); }
    catch { /* ignore para demo */ }
    setTasks((arr) => arr.filter((t) => t.id !== taskToDelete.id));
    setModalOpen(false); setTaskToDelete(null);
    notify("ok", "Tarefa removida");
  };

  /* initial */
  useEffect(() => { checkHealth(); loadUsers(); }, [baseUrl]);
  useEffect(() => { if (selectedUser) loadTasks(selectedUser); }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    let arr = users.filter(
      (u) =>
        u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.nome || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
    const [key, dir] = userSort.split(":"); // id|nome|email : asc|desc
    arr = arr.sort((a, b) => {
      const A = (a[key] || "").toString().toLowerCase();
      const B = (b[key] || "").toString().toLowerCase();
      if (A < B) return dir === "asc" ? -1 : 1;
      if (A > B) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [users, userSearch, userSort]);

  const completed = tasks.filter((t) => t.status === "concluida").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen transition-colors bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold shadow-md">SD</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-dark">Painel — Usuários & Tarefas</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Arquitetura 1 • API Node + Express • DB único</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Card className="sm:w-[420px]">
              <CardBody className="flex items-center gap-3">
                <input
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={API_BASE_URL || "https://load-balancer-sd-production.up.railway.app/"}
                />
                <Button variant="outline" onClick={checkHealth}>{loadingHealth ? "Testando..." : "Testar"}</Button>
                {health ? <Badge tone="green">online</Badge> : <Badge tone="red">offline</Badge>}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* top stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Usuários</div><div className="text-2xl font-bold">{users.length}</div></CardBody></Card>
          <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Tarefas (seleção)</div><div className="text-2xl font-bold">{tasks.length}</div></CardBody></Card>
          <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Progresso</div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xl font-bold">{progress}%</div>
            </div>
          </CardBody></Card>
        </div>

        {/* tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab("usuarios")} className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "usuarios" ? "bg-slate-900 text-white" : "bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"}`}>Usuários</button>
          <button onClick={() => setTab("tarefas")} className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "tarefas" ? "bg-slate-900 text-white" : "bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"}`}>Tarefas</button>
        </div>

        {/* content */}
        {tab === "usuarios" ? (
          <div className="grid grid-cols-1 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Usuários" subtitle="Cadastre, busque e ordene" right={<Badge tone="blue">{loadingUsers ? "carregando..." : `${users.length} itens`}</Badge>} />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400"><Icon name="search" /></span>
                    <Input placeholder="Buscar por id, nome ou email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                  </div>
                  <select className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={userSort} onChange={(e) => setUserSort(e.target.value)}>
                    <option value="id:asc">Ordenar: ID ↑</option>
                    <option value="id:desc">Ordenar: ID ↓</option>
                    <option value="nome:asc">Nome ↑</option>
                    <option value="nome:desc">Nome ↓</option>
                    <option value="email:asc">Email ↑</option>
                    <option value="email:desc">Email ↓</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1"><label className="block text-sm mb-1">ID</label><Input value={newUser.id} onChange={(e) => setNewUser({ ...newUser, id: e.target.value })} placeholder="u1" /></div>
                  <div className="flex-1"><label className="block text-sm mb-1">Nome</label><Input value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} placeholder="Ana" /></div>
                  <div className="flex-1"><label className="block text-sm mb-1">Email</label><Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="ana@ex.com" /></div>
                  <Button onClick={createUser}><Icon name="plus" /> Criar</Button>
                </div>

                <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                      <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Nome</th><th className="text-left p-3">Email</th><th className="text-left p-3">Ações</th></tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        [...Array(3)].map((_, i) => (
                          <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="p-3"><div className="h-4 w-20 skeleton" /></td>
                            <td className="p-3"><div className="h-4 w-40 skeleton" /></td>
                            <td className="p-3"><div className="h-4 w-52 skeleton" /></td>
                            <td className="p-3"><div className="h-8 w-24 skeleton rounded-xl" /></td>
                          </tr>
                        ))
                      ) : filteredUsers.length ? (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="p-3 font-medium">{u.id}</td>
                            <td className="p-3">{u.nome || "—"}</td>
                            <td className="p-3">{u.email}</td>
                            <td className="p-3">
                              <Button variant="outline" onClick={() => { setSelectedUser(u.id); setTab("tarefas"); }}>
                                Ver tarefas
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="p-10 text-center">Nenhum usuário encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Tarefas"
                subtitle="Crie, altere status e remova"
                right={<div className="flex items-center gap-2"><Badge tone="slate">{tasks.length} tarefas</Badge><Badge tone={progress === 100 ? "green" : "amber"}>{progress}%</Badge></div>}
              />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Usuário</label>
                    <select className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                      <option value="">— Selecione —</option>
                      {users.map((u) => (<option key={u.id} value={u.id}>{u.id} — {u.nome || u.email}</option>))}
                    </select>
                  </div>
                  <div className="flex items-end"><Button variant="outline" className="w-full" onClick={() => selectedUser && loadTasks(selectedUser)}>{loadingTasks ? "Atualizando..." : "Atualizar"}</Button></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1">ID</label><Input value={newTask.id} onChange={(e) => setNewTask({ ...newTask, id: e.target.value })} placeholder="t1" /></div>
                  <div>
                    <label className="block text-sm mb-1">Status</label>
                    <select className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
                      <option value="aberta">aberta</option>
                      <option value="em_andamento">em_andamento</option>
                      <option value="concluida">concluida</option>
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm mb-1">Título</label><Input value={newTask.titulo} onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })} placeholder="Estudar SD" /></div>
                  <div className="md:col-span-2"><label className="block text-sm mb-1">Descrição</label><Textarea rows={3} value={newTask.descricao} onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })} placeholder="Ler material da aula" /></div>
                  <div className="md:col-span-2"><Button onClick={createTask} disabled={!selectedUser}><Icon name="plus" /> Criar tarefa</Button></div>
                </div>

                <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                      <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Título</th><th className="text-left p-3">Status</th><th className="text-left p-3">Criado em</th><th className="text-left p-3">Ações</th></tr>
                    </thead>
                    <tbody>
                      {loadingTasks ? (
                        [...Array(3)].map((_, i) => (
                          <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="p-3"><div className="h-4 w-20 skeleton" /></td>
                            <td className="p-3"><div className="h-4 w-40 skeleton" /></td>
                            <td className="p-3"><div className="h-8 w-28 skeleton rounded-xl" /></td>
                            <td className="p-3"><div className="h-4 w-40 skeleton" /></td>
                            <td className="p-3"><div className="h-8 w-28 skeleton rounded-xl" /></td>
                          </tr>
                        ))
                      ) : tasks.length ? (
                        tasks.map((t) => (
                          <tr key={t.id} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="p-3 font-medium">{t.id}</td>
                            <td className="p-3">{t.titulo}</td>
                            <td className="p-3">
                              <select className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value)}>
                                <option value="aberta">aberta</option>
                                <option value="em_andamento">em_andamento</option>
                                <option value="concluida">concluida</option>
                              </select>
                            </td>
                            <td className="p-3">{t.criado_em ? new Date(t.criado_em).toLocaleString() : "—"}</td>
                            <td className="p-3"><Button variant="danger" onClick={() => { setTaskToDelete(t); setModalOpen(true); }}><Icon name="trash" /> Excluir</Button></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-10 text-center">Nenhuma tarefa para mostrar</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Resumo" />
              <CardBody>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">{completed} concluída(s) de {tasks.length}</div>
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-right text-sm text-slate-500 dark:text-slate-400 mt-1">{progress}%</p>
              </CardBody>
            </Card>
          </div>
        )}

        <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
          FRONTEND React + Tailwind • Conectado a {baseUrl || "—"}
        </footer>
      </div>

      {/* modal & toasts */}
      <Modal
        open={modalOpen}
        title="Remover tarefa?"
        subtitle={taskToDelete?.titulo}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDeleteTask}
        confirmText="Remover"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">Esta ação remove a tarefa (seu backend já tem DELETE).</p>
      </Modal>

      <ToastView />

      {/* skeleton styles */}
      <style>{`.skeleton{background-image:linear-gradient(90deg,transparent,rgba(100,116,139,.15),transparent);background-color:rgba(100,116,139,.2);animation:s 1.2s infinite;}.dark .skeleton{background-image:linear-gradient(90deg,transparent,rgba(148,163,184,.12),transparent);background-color:rgba(148,163,184,.15)}@keyframes s{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}`}</style>
    </div>
  );
}