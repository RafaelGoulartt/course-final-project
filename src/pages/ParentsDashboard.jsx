import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart2,
  ChartColumnBig,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  HelpCircle,
  KeyRound,
  LayoutGrid,
  LogOut,
  Moon,
  Pencil,
  RefreshCw,
  Smartphone,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { Chart } from "chart.js/auto";
import ControleCelular from "../components/ControleCelular";
import { useTheme } from "../context/useTheme";
import { authService } from "../services/authService";
import { dashboardService } from "../services/dashboardService";
import {
  PERIODOS,
  diaDaSemanaCurto,
  diaMes,
  diasDecorridos,
  formatarMinutos,
  hojeIso,
  moverPeriodo,
  periodoIncluiHoje,
  rotuloPeriodo,
} from "../utils/periodo";

const MAX_FATIAS = 5;
const CORES_APPS = ["#3b82f6", "#818cf8", "#38bdf8", "#2dd4bf", "#fbbf24", "#94a3b8"];

// Mantem os 5 apps mais usados e junta o resto em "Outros", para o grafico nao ficar poluido.
function agruparApps(tempoPorApp) {
  if (tempoPorApp.length <= MAX_FATIAS + 1) return tempoPorApp;
  const principais = tempoPorApp.slice(0, MAX_FATIAS);
  const outros = tempoPorApp.slice(MAX_FATIAS).reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  return [...principais, { nome: "Outros", total: outros }];
}

const PASSOS = [
  { icon: KeyRound, titulo: "Gere o código", desc: "Clique em \"Gerar código\" e copie o código que aparecer." },
  { icon: Smartphone, titulo: "Cole no celular", desc: "Abra o app no celular da criança, cole o código e toque em Entrar." },
  { icon: BarChart2, titulo: "Acompanhe aqui", desc: "Os gráficos aparecem nesta tela assim que os primeiros dados chegarem." },
];

function tema(isDark) {
  return isDark
    ? {
        page: "bg-slate-900 text-slate-100",
        topbar: "border-slate-800 bg-slate-900/90",
        card: "bg-slate-800/40 ring-1 ring-slate-700/60",
        soft: "bg-slate-800",
        textSoft: "text-slate-300",
        textMuted: "text-slate-400",
        divider: "divide-slate-700/60",
        input: "bg-slate-900 ring-1 ring-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500",
        iconBtn: "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        btnGhost: "ring-1 ring-slate-700 text-slate-200 hover:bg-slate-800",
        btnPrimary: "bg-blue-500 text-white hover:bg-blue-600",
        segment: "bg-slate-800",
        segmentActive: "bg-slate-600 text-white shadow-sm",
        segmentIdle: "text-slate-400 hover:text-slate-200",
        track: "bg-slate-700/70",
        modal: "bg-slate-900 ring-1 ring-slate-700",
        chip: "bg-slate-800 text-slate-300 hover:bg-slate-700",
      }
    : {
        page: "bg-slate-50 text-slate-900",
        topbar: "border-slate-200 bg-white/90",
        card: "bg-white ring-1 ring-slate-200 shadow-sm",
        soft: "bg-slate-100",
        textSoft: "text-slate-600",
        textMuted: "text-slate-500",
        divider: "divide-slate-100",
        input: "bg-white ring-1 ring-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500",
        iconBtn: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        btnGhost: "ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50",
        btnPrimary: "bg-blue-500 text-white hover:bg-blue-600",
        segment: "bg-slate-100",
        segmentActive: "bg-white text-slate-900 shadow-sm",
        segmentIdle: "text-slate-500 hover:text-slate-800",
        track: "bg-slate-100",
        modal: "bg-white ring-1 ring-slate-200",
        chip: "bg-slate-100 text-slate-600 hover:bg-slate-200",
      };
}

function Modal({ titulo, onFechar, t, children }) {
  useEffect(() => {
    const fechar = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${t.modal}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className={`rounded-lg p-1.5 transition ${t.iconBtn}`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Codigo de conexao + botoes. Usado no modal "Conectar celular" e na tela de boas-vindas.
function CodigoConexao({ token, gerando, copiado, onGerar, onCopiar, t }) {
  return (
    <div>
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${t.soft}`}>
        <KeyRound size={18} className="shrink-0 text-blue-500" />
        <code className={`flex-1 break-all text-xs ${token ? "" : t.textMuted}`}>
          {token || "Nenhum código gerado ainda"}
        </code>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onGerar}
          disabled={gerando}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${t.btnPrimary}`}
        >
          <RefreshCw size={15} className={gerando ? "animate-spin" : ""} />
          {gerando ? "Gerando..." : token ? "Gerar novo" : "Gerar código"}
        </button>
        <button
          type="button"
          onClick={onCopiar}
          disabled={!token}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${t.btnGhost}`}
        >
          {copiado ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function Passos({ t }) {
  return (
    <ol className="space-y-4">
      {PASSOS.map((passo, i) => (
        <li key={passo.titulo} className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <passo.icon size={20} />
          </span>
          <div>
            <p className="font-semibold">
              <span className={t.textMuted}>{i + 1}.</span> {passo.titulo}
            </p>
            <p className={`mt-0.5 text-sm ${t.textSoft}`}>{passo.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ParentsDashboard() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const appChartRef = useRef(null);
  const dayChartRef = useRef(null);
  const appChartInstance = useRef(null);
  const dayChartInstance = useRef(null);

  const [user, setUser] = useState(null);
  const [filhos, setFilhos] = useState([]);
  const [filhoSelecionadoId, setFilhoSelecionadoId] = useState("");
  const [nomeEdicaoFilho, setNomeEdicaoFilho] = useState("");
  const [salvandoFilho, setSalvandoFilho] = useState(false);
  const [token, setToken] = useState("");
  const [tempoPorApp, setTempoPorApp] = useState([]);
  const [tempoPorDia, setTempoPorDia] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [periodo, setPeriodo] = useState("semana");
  const [dataRef, setDataRef] = useState(hojeIso);
  const [periodoInfo, setPeriodoInfo] = useState(null);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [modal, setModal] = useState(null); // "ajuda" | "conectar" | "nome" | null

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser?.id) {
      navigate("/auth");
      return;
    }
    setUser(currentUser);
    carregarDashboard(currentUser.id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // parcial = so trocou o periodo: atualiza os graficos sem esconder a pagina inteira.
  async function carregarDashboard(userId, filhoId = null, opcoes = {}) {
    const { periodoSel = periodo, data = dataRef, parcial = false } = opcoes;
    if (parcial) setLoadingPeriodo(true);
    else setLoading(true);
    setMessage("");
    try {
      const response = await dashboardService.carregarDashboard(userId, filhoId, periodoSel, data);
      setPeriodoInfo(response?.periodo || null);
      setFilhos(response?.filhos || []);
      setFilhoSelecionadoId(response?.filhoSelecionadoId ? String(response.filhoSelecionadoId) : "");
      const atual = response?.filhos?.find((item) => String(item.id) === String(response.filhoSelecionadoId));
      setNomeEdicaoFilho(atual?.nome || "");
      setToken(response?.token || "");
      setTempoPorApp(response?.tempoPorApp || []);
      setTempoPorDia(response?.tempoPorDia || []);
      setHasData(Boolean(response?.hasData));
    } catch (error) {
      setMessage(error.message || "Erro ao carregar dashboard.");
      setHasData(false);
      setTempoPorApp([]);
      setTempoPorDia([]);
    } finally {
      setLoading(false);
      setLoadingPeriodo(false);
    }
  }

  function trocarPeriodo(novoPeriodo, novaData) {
    setPeriodo(novoPeriodo);
    setDataRef(novaData);
    if (!user?.id) return;
    carregarDashboard(user.id, filhoSelecionadoId || null, { periodoSel: novoPeriodo, data: novaData, parcial: true });
  }

  async function handleFilhoChange(event) {
    const selectedId = event.target.value;
    setFilhoSelecionadoId(selectedId);
    if (!user?.id) return;
    await carregarDashboard(user.id, selectedId, { parcial: true });
  }

  async function handleSalvarNomeFilho(event) {
    event.preventDefault();
    if (!user?.id || !filhoSelecionadoId || !nomeEdicaoFilho.trim()) return;
    setSalvandoFilho(true);
    setMessage("");
    try {
      await dashboardService.atualizarFilho(filhoSelecionadoId, {
        user_id: user.id,
        nome: nomeEdicaoFilho.trim(),
      });
      await carregarDashboard(user.id, filhoSelecionadoId, { parcial: true });
      setModal(null);
    } catch (error) {
      setMessage(error.message || "Erro ao atualizar nome.");
    } finally {
      setSalvandoFilho(false);
    }
  }

  async function handleGerarToken() {
    if (!user?.id) return;
    setGeneratingToken(true);
    setMessage("");
    try {
      const response = await dashboardService.gerarToken(user.id);
      setToken(response?.token || "");
      await carregarDashboard(user.id, filhoSelecionadoId || null, { parcial: true });
    } catch (error) {
      setMessage(error.message || "Erro ao gerar código.");
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleCopyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1400);
    } catch {
      setCopiedToken(false);
    }
  }

  const canRenderCharts = !loading && Boolean(token) && hasData;
  const tipoPeriodo = periodoInfo?.tipo || periodo;
  const fatias = useMemo(() => agruparApps(tempoPorApp), [tempoPorApp]);

  useEffect(() => {
    if (appChartInstance.current) { appChartInstance.current.destroy(); appChartInstance.current = null; }
    if (dayChartInstance.current) { dayChartInstance.current.destroy(); dayChartInstance.current = null; }
    if (!canRenderCharts) return;

    const labelColor = isDark ? "#94a3b8" : "#64748b";
    const gridColor = isDark ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.12)";
    const tooltip = {
      backgroundColor: isDark ? "#1e293b" : "#0f172a",
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      callbacks: { label: (ctx) => formatarMinutos(ctx.parsed.y ?? ctx.parsed) },
    };

    if (appChartRef.current && fatias.length > 0) {
      appChartInstance.current = new Chart(appChartRef.current, {
        type: "doughnut",
        data: {
          labels: fatias.map((item) => item.nome),
          datasets: [{
            data: fatias.map((item) => Number(item.total)),
            backgroundColor: CORES_APPS,
            borderColor: isDark ? "#1e293b" : "#ffffff",
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip, callbacks: { label: (ctx) => `${ctx.label}: ${formatarMinutos(ctx.parsed)}` } },
          },
        },
      });
    }

    // No "dia" o grafico mostra os 7 dias ate a data escolhida; a barra do dia escolhido fica destacada.
    const destaque = tipoPeriodo === "dia" ? periodoInfo?.inicio : null;
    const rotuloDia = (iso) =>
      tipoPeriodo === "mes" ? String(Number(iso.slice(8))) : `${diaDaSemanaCurto(iso)} ${diaMes(iso)}`;

    // Passo redondo no eixo (15min, 30min, 1h, 2h...) com no maximo 5 linhas.
    const maiorDia = Math.max(0, ...tempoPorDia.map((item) => Number(item.total)));
    const passo = [15, 30, 60, 120, 180, 240, 360, 480].find((p) => maiorDia / p <= 5) || 600;

    if (dayChartRef.current && tempoPorDia.length > 0) {
      dayChartInstance.current = new Chart(dayChartRef.current, {
        type: "bar",
        data: {
          labels: tempoPorDia.map((item) => rotuloDia(item.data_uso)),
          datasets: [{
            data: tempoPorDia.map((item) => Number(item.total)),
            backgroundColor: tempoPorDia.map((item) =>
              !destaque || item.data_uso === destaque ? "#3b82f6" : isDark ? "rgba(96,165,250,0.3)" : "rgba(59,130,246,0.25)",
            ),
            hoverBackgroundColor: "#2563eb",
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 40,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip },
          scales: {
            x: { ticks: { color: labelColor, font: { size: 11 } }, grid: { display: false }, border: { display: false } },
            y: {
              ticks: { color: labelColor, font: { size: 11 }, stepSize: passo, callback: (valor) => formatarMinutos(valor) },
              grid: { color: gridColor },
              border: { display: false },
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      if (appChartInstance.current) { appChartInstance.current.destroy(); appChartInstance.current = null; }
      if (dayChartInstance.current) { dayChartInstance.current.destroy(); dayChartInstance.current = null; }
    };
  }, [isDark, canRenderCharts, fatias, tempoPorDia, tipoPeriodo, periodoInfo]);

  // No "dia" o total usa so o dia escolhido; a media usa os 7 dias do grafico.
  const totalMinutos = useMemo(
    () => tempoPorApp.reduce((acc, cur) => acc + Number(cur.total || 0), 0),
    [tempoPorApp],
  );
  const appMaisUsado = tempoPorApp[0];
  const mediaDiaria = tipoPeriodo === "dia"
    ? Math.round(tempoPorDia.reduce((acc, cur) => acc + Number(cur.total || 0), 0) / Math.max(1, tempoPorDia.length))
    : Math.round(totalMinutos / diasDecorridos(periodoInfo));
  const nomePeriodo = periodoIncluiHoje(periodoInfo)
    ? { dia: "hoje", semana: "nesta semana", mes: "neste mês" }[tipoPeriodo]
    : "no período";
  const nomeFilho = filhos.find((f) => String(f.id) === String(filhoSelecionadoId))?.nome;

  const t = tema(isDark);

  const kpis = [
    { icon: Clock, label: "Tempo de tela", value: formatarMinutos(totalMinutos), sub: nomePeriodo, destaque: true },
    {
      icon: LayoutGrid,
      label: "App mais usado",
      value: appMaisUsado?.nome || "—",
      sub: appMaisUsado ? formatarMinutos(appMaisUsado.total) : "sem uso no período",
    },
    {
      icon: TrendingUp,
      label: "Média por dia",
      value: formatarMinutos(mediaDiaria),
      sub: tipoPeriodo === "dia" ? "nos últimos 7 dias" : nomePeriodo,
    },
  ];

  return (
    <main className={`min-h-screen ${t.page}`}>
      {/* Barra do topo */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur ${t.topbar}`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
              <ChartColumnBig size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">Painel dos pais</span>
              <span className={`block text-xs ${t.textMuted}`}>Olá, {user?.name || "usuário"}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setModal("conectar")} className={`hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:inline-flex ${t.btnGhost}`}>
              <Smartphone size={16} />
              Conectar celular
            </button>
            <button type="button" onClick={() => setModal("conectar")} aria-label="Conectar celular" title="Conectar celular" className={`rounded-lg p-2 transition sm:hidden ${t.iconBtn}`}>
              <Smartphone size={18} />
            </button>
            <button type="button" onClick={() => setModal("ajuda")} aria-label="Como usar" title="Como usar" className={`rounded-lg p-2 transition ${t.iconBtn}`}>
              <HelpCircle size={18} />
            </button>
            <button type="button" onClick={toggleTheme} aria-label={isDark ? "Tema claro" : "Tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"} className={`rounded-lg p-2 transition ${t.iconBtn}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/" aria-label="Voltar ao início" title="Voltar ao início" className={`rounded-lg p-2 transition ${t.iconBtn}`}>
              <ArrowLeft size={18} />
            </Link>
            <button type="button" onClick={() => { authService.logout(); navigate("/"); }} aria-label="Sair" title="Sair" className={`rounded-lg p-2 transition ${t.iconBtn}`}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        {message && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Carregando">
            <div className={`h-10 w-64 animate-pulse rounded-lg ${t.soft}`} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => <div key={i} className={`h-28 animate-pulse rounded-2xl ${t.soft}`} />)}
            </div>
            <div className={`h-80 animate-pulse rounded-2xl ${t.soft}`} />
          </div>
        ) : !canRenderCharts ? (
          /* Boas-vindas: ainda nao chegou nenhum dado */
          <section className={`mx-auto max-w-3xl rounded-2xl p-6 md:p-10 ${t.card}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Smartphone size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">Vamos conectar o celular</h1>
            <p className={`mt-2 ${t.textSoft}`}>
              Em três passos o tempo de tela do seu filho começa a aparecer aqui.
            </p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <Passos t={t} />
              <div>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${t.textMuted}`}>Código de conexão</p>
                <CodigoConexao
                  token={token}
                  gerando={generatingToken}
                  copiado={copiedToken}
                  onGerar={handleGerarToken}
                  onCopiar={handleCopyToken}
                  t={t}
                />
                <p className={`mt-3 text-xs ${t.textMuted}`}>O código vale por 7 dias.</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Titulo + filho + periodo */}
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-sm font-medium ${t.textMuted}`}>Tempo de tela de</p>
                <div className="mt-1 flex items-center gap-2">
                  {filhos.length > 1 ? (
                    <select
                      value={filhoSelecionadoId}
                      onChange={handleFilhoChange}
                      aria-label="Escolher filho"
                      className={`rounded-lg px-3 py-1.5 text-2xl font-black tracking-tight outline-none ${t.input}`}
                    >
                      {filhos.map((filho) => (
                        <option key={filho.id} value={String(filho.id)}>{filho.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="text-3xl font-black tracking-tight">{nomeFilho}</h1>
                  )}
                  <button type="button" onClick={() => setModal("nome")} aria-label="Editar nome" title="Editar nome" className={`rounded-lg p-2 transition ${t.iconBtn}`}>
                    <Pencil size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className={`flex rounded-xl p-1 ${t.segment}`} role="tablist" aria-label="Período">
                  {PERIODOS.map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      role="tab"
                      aria-selected={periodo === opcao.id}
                      onClick={() => trocarPeriodo(opcao.id, hojeIso())}
                      className={`flex-1 rounded-lg px-5 py-1.5 text-sm font-semibold transition ${
                        periodo === opcao.id ? t.segmentActive : t.segmentIdle
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => trocarPeriodo(periodo, moverPeriodo(periodo, dataRef, -1))}
                    disabled={loadingPeriodo}
                    aria-label="Período anterior"
                    className={`rounded-lg p-2 transition disabled:opacity-40 ${t.iconBtn}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className={`min-w-36 text-center text-sm font-semibold ${loadingPeriodo ? "opacity-50" : ""}`}>
                    {rotuloPeriodo(periodoInfo)}
                  </span>
                  <button
                    type="button"
                    onClick={() => trocarPeriodo(periodo, moverPeriodo(periodo, dataRef, 1))}
                    disabled={loadingPeriodo || periodoIncluiHoje(periodoInfo)}
                    aria-label="Próximo período"
                    className={`rounded-lg p-2 transition disabled:opacity-30 ${t.iconBtn}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* Numeros principais */}
            <section className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-3 ${loadingPeriodo ? "opacity-50" : ""}`}>
              {kpis.map((kpi) => (
                <article
                  key={kpi.label}
                  className={`rounded-2xl p-5 ${kpi.destaque ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : t.card}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.destaque ? "bg-white/20" : "bg-blue-500/10 text-blue-500"}`}>
                      <kpi.icon size={16} />
                    </span>
                    <p className={`text-sm font-medium ${kpi.destaque ? "text-blue-50" : t.textSoft}`}>{kpi.label}</p>
                  </div>
                  <p className="mt-4 truncate text-3xl font-black tracking-tight">{kpi.value}</p>
                  <p className={`mt-1 text-sm ${kpi.destaque ? "text-blue-100" : t.textMuted}`}>{kpi.sub}</p>
                </article>
              ))}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className={`space-y-6 transition-opacity lg:col-span-2 ${loadingPeriodo ? "opacity-50" : ""}`}>
                {/* Uso por dia */}
                <article className={`rounded-2xl p-5 md:p-6 ${t.card}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-bold">Uso por dia</h2>
                    <p className={`text-xs ${t.textMuted}`}>
                      {tipoPeriodo === "dia" ? "Últimos 7 dias" : "Passe o mouse para ver o tempo"}
                    </p>
                  </div>
                  <div className="mt-4 h-64"><canvas ref={dayChartRef} /></div>
                </article>

                {/* Apps mais usados */}
                <article className={`rounded-2xl p-5 md:p-6 ${t.card}`}>
                  <h2 className="font-bold">Apps mais usados</h2>
                  {fatias.length === 0 ? (
                    <p className={`py-16 text-center text-sm ${t.textMuted}`}>Nenhum uso registrado {nomePeriodo}.</p>
                  ) : (
                    <div className="mt-4 grid items-center gap-6 sm:grid-cols-5">
                      <div className="relative mx-auto h-48 w-48 sm:col-span-2">
                        <canvas ref={appChartRef} />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black">{formatarMinutos(totalMinutos)}</span>
                          <span className={`text-xs ${t.textMuted}`}>no total</span>
                        </div>
                      </div>
                      <ul className="space-y-3 sm:col-span-3">
                        {fatias.map((app, i) => {
                          const pct = totalMinutos > 0 ? Math.round((Number(app.total) / totalMinutos) * 100) : 0;
                          // A barra e relativa ao maior app, para a diferenca entre eles ficar visivel.
                          const maiorFatia = Math.max(...fatias.map((f) => Number(f.total)));
                          const largura = maiorFatia > 0 ? (Number(app.total) / maiorFatia) * 100 : 0;
                          return (
                            <li key={app.nome}>
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CORES_APPS[i] }} />
                                  <span className="truncate font-medium">{app.nome}</span>
                                </span>
                                <span className="shrink-0 font-semibold">
                                  {formatarMinutos(app.total)} <span className={`font-normal ${t.textMuted}`}>· {pct}%</span>
                                </span>
                              </div>
                              <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${t.track}`}>
                                <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: CORES_APPS[i] }} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </article>
              </div>

              {/* Controle do celular */}
              <aside>
                {user?.id && filhoSelecionadoId && (
                  <ControleCelular key={filhoSelecionadoId} userId={user.id} filhoId={filhoSelecionadoId} t={t} />
                )}
              </aside>
            </div>
          </>
        )}
      </div>

      {modal === "ajuda" && (
        <Modal titulo="Como usar o painel" onFechar={() => setModal(null)} t={t}>
          <Passos t={t} />
          <p className={`mt-6 text-sm ${t.textSoft}`}>
            Depois de conectado, use a área <strong>Controle do celular</strong> para mandar mensagens ou suspender um app.
          </p>
          <button type="button" onClick={() => setModal(null)} className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${t.btnPrimary}`}>
            Entendi
          </button>
        </Modal>
      )}

      {modal === "conectar" && (
        <Modal titulo="Conectar celular" onFechar={() => setModal(null)} t={t}>
          <p className={`mb-4 text-sm ${t.textSoft}`}>
            Cole este código no app do celular da criança. Gerar um código novo não desconecta quem já está conectado.
          </p>
          <CodigoConexao
            token={token}
            gerando={generatingToken}
            copiado={copiedToken}
            onGerar={handleGerarToken}
            onCopiar={handleCopyToken}
            t={t}
          />
          <p className={`mt-3 text-xs ${t.textMuted}`}>O código vale por 7 dias.</p>
        </Modal>
      )}

      {modal === "nome" && (
        <Modal titulo="Editar nome" onFechar={() => setModal(null)} t={t}>
          <form onSubmit={handleSalvarNomeFilho}>
            <label htmlFor="nome-filho" className={`mb-1.5 block text-sm font-medium ${t.textSoft}`}>Nome do filho</label>
            <input
              id="nome-filho"
              type="text"
              value={nomeEdicaoFilho}
              onChange={(e) => setNomeEdicaoFilho(e.target.value)}
              autoFocus
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none ${t.input}`}
            />
            <button
              type="submit"
              disabled={!nomeEdicaoFilho.trim() || salvandoFilho}
              className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${t.btnPrimary}`}
            >
              {salvandoFilho ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}
