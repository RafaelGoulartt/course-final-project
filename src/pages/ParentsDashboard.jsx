import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChartColumnBig,
  KeyRound,
  Copy,
  Check,
  HelpCircle,
  X,
  Smartphone,
  BarChart2,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { Chart } from "chart.js/auto";
import { useTheme } from "../context/useTheme";
import { authService } from "../services/authService";
import { dashboardService } from "../services/dashboardService";

export default function ParentsDashboard() {
  const { isDark } = useTheme();
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
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser?.id) {
      navigate("/auth");
      return;
    }
    setUser(currentUser);
    carregarDashboard(currentUser.id, null);
  }, [navigate]);

  async function carregarDashboard(userId, filhoId = null) {
    setLoading(true);
    setMessage("");
    try {
      const response = await dashboardService.carregarDashboard(userId, filhoId);
      setFilhos(response?.filhos || []);
      setFilhoSelecionadoId(response?.filhoSelecionadoId ? String(response.filhoSelecionadoId) : "");
      if (response?.filhos?.length) {
        const atual = response.filhos.find((item) => String(item.id) === String(response.filhoSelecionadoId));
        setNomeEdicaoFilho(atual?.nome || "");
      } else {
        setNomeEdicaoFilho("");
      }
      setToken(response?.token || "");
      setTempoPorApp(response?.tempoPorApp || []);
      setTempoPorDia(response?.tempoPorDia || []);
      setHasData(Boolean(response?.hasData));
      if (!response?.hasData) setMessage("Nenhum dado disponível ainda.");
    } catch (error) {
      setMessage(error.message || "Erro ao carregar dashboard.");
      setHasData(false);
      setTempoPorApp([]);
      setTempoPorDia([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilhoChange(event) {
    const selectedId = event.target.value;
    setFilhoSelecionadoId(selectedId);
    if (!user?.id) return;
    await carregarDashboard(user.id, selectedId);
  }

  async function handleSalvarNomeFilho() {
    if (!user?.id || !filhoSelecionadoId || !nomeEdicaoFilho.trim()) return;
    setSalvandoFilho(true);
    setMessage("");
    try {
      await dashboardService.atualizarFilho(filhoSelecionadoId, {
        user_id: user.id,
        nome: nomeEdicaoFilho.trim(),
      });
      await carregarDashboard(user.id, filhoSelecionadoId);
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
      await carregarDashboard(user.id, filhoSelecionadoId || null);
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

  useEffect(() => {
    const canRender = Boolean(token) && hasData && tempoPorApp.length > 0 && tempoPorDia.length > 0;

    if (appChartInstance.current) { appChartInstance.current.destroy(); appChartInstance.current = null; }
    if (dayChartInstance.current) { dayChartInstance.current.destroy(); dayChartInstance.current = null; }
    if (!canRender || !appChartRef.current || !dayChartRef.current) return;

    const labelColor = isDark ? "#cbd5e1" : "#334155";

    appChartInstance.current = new Chart(appChartRef.current, {
      type: "pie",
      data: {
        labels: tempoPorApp.map((item) => item.nome),
        datasets: [{
          label: "Tempo de uso (min)",
          data: tempoPorApp.map((item) => Number(item.total)),
          backgroundColor: [
            "rgba(6,182,212,0.8)", "rgba(16,185,129,0.8)", "rgba(245,158,11,0.8)",
            "rgba(239,68,68,0.8)", "rgba(99,102,241,0.8)", "rgba(236,72,153,0.8)",
          ],
          borderColor: isDark ? "#0f172a" : "#ffffff",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { color: labelColor } } },
      },
    });

    dayChartInstance.current = new Chart(dayChartRef.current, {
      type: "line",
      data: {
        labels: tempoPorDia.map((item) => new Date(item.data_uso).toLocaleDateString("pt-BR")),
        datasets: [{
          label: "Minutos por dia",
          data: tempoPorDia.map((item) => Number(item.total)),
          borderColor: "rgba(16,185,129,1)",
          backgroundColor: "rgba(16,185,129,0.22)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: labelColor } } },
        scales: {
          x: { ticks: { color: labelColor }, grid: { color: isDark ? "rgba(148,163,184,0.25)" : "rgba(100,116,139,0.2)" } },
          y: { ticks: { color: labelColor }, grid: { color: isDark ? "rgba(148,163,184,0.25)" : "rgba(100,116,139,0.2)" }, beginAtZero: true },
        },
      },
    });

    return () => {
      if (appChartInstance.current) appChartInstance.current.destroy();
      if (dayChartInstance.current) dayChartInstance.current.destroy();
    };
  }, [isDark, token, hasData, tempoPorApp, tempoPorDia]);

  const totalMinutos = useMemo(
    () => tempoPorDia.reduce((acc, cur) => acc + Number(cur.total || 0), 0),
    [tempoPorDia],
  );
  const qtdApps = tempoPorApp.length;
  const qtdDias = tempoPorDia.length;
  const canRenderCharts = !loading && token && hasData && tempoPorApp.length > 0 && tempoPorDia.length > 0;

  const t = isDark
    ? {
        main: "bg-slate-950 text-slate-100",
        shell: "border-slate-800 bg-slate-900/70",
        panel: "border-slate-800 bg-slate-900/80",
        panelSoft: "border-slate-700 bg-slate-950/75",
        textSoft: "text-slate-300",
        textMuted: "text-slate-400",
        btnPrimary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        btnGhost: "border-slate-700 bg-slate-950/80 text-slate-200 hover:bg-slate-900",
        input: "border-slate-700 bg-slate-950 text-slate-100",
        tag: "bg-cyan-400/20 text-cyan-200",
        stepBg: "bg-slate-800",
        modalBg: "bg-slate-900 border-slate-700",
      }
    : {
        main: "bg-slate-100 text-slate-900",
        shell: "border-slate-200 bg-white/80",
        panel: "border-slate-200 bg-white/95",
        panelSoft: "border-slate-300 bg-slate-50/95",
        textSoft: "text-slate-700",
        textMuted: "text-slate-500",
        btnPrimary: "bg-cyan-600 text-white hover:bg-cyan-500",
        btnGhost: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        input: "border-slate-300 bg-white text-slate-900",
        tag: "bg-cyan-100 text-cyan-700",
        stepBg: "bg-slate-100",
        modalBg: "bg-white border-slate-200",
      };

  const steps = [
    {
      icon: <KeyRound size={28} className="text-cyan-500" />,
      num: "1",
      title: "Gere o código",
      desc: 'Clique em "Gerar Código" logo abaixo. Você vai receber um código único.',
    },
    {
      icon: <Smartphone size={28} className="text-emerald-500" />,
      num: "2",
      title: "Configure o app do celular",
      desc: "Abra o aplicativo no celular da criança, cole o código e pronto — ele começa a enviar os dados.",
    },
    {
      icon: <BarChart2 size={28} className="text-violet-500" />,
      num: "3",
      title: "Acompanhe os gráficos",
      desc: "Assim que os dados chegarem, os gráficos aparecem aqui automaticamente.",
    },
  ];

  return (
    <main className={`relative min-h-screen overflow-hidden p-4 md:p-8 ${t.main}`}>
      <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-8 shadow-2xl ${t.modalBg}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Como usar o painel</h2>
              <button type="button" onClick={() => setShowInstructions(false)} className={`rounded-full p-2 transition ${t.btnGhost}`}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step.num} className={`flex gap-4 rounded-2xl p-4 ${t.stepBg}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/10">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-500">Passo {step.num}</p>
                    <p className="mt-0.5 font-bold">{step.title}</p>
                    <p className={`mt-1 text-sm ${t.textSoft}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={`mt-6 text-xs text-center ${t.textMuted}`}>Dúvidas? Fale com o suporte.</p>
            <button type="button" onClick={() => setShowInstructions(false)} className={`mt-4 w-full rounded-xl px-5 py-3 font-semibold transition ${t.btnPrimary}`}>
              Entendi, vou começar!
            </button>
          </div>
        </div>
      )}

      <div className={`mx-auto w-full max-w-5xl rounded-3xl border p-4 shadow-2xl backdrop-blur md:p-6 ${t.shell}`}>

        <header className={`rounded-2xl border p-5 md:p-7 ${t.panel}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${t.tag}`}>
                <ChartColumnBig size={14} />
                Painel dos pais
              </span>
              <h1 className="mt-3 text-2xl font-black md:text-3xl">
                Olá, {user?.name || "usuário"}!
              </h1>
              <p className={`mt-1 text-sm ${t.textSoft}`}>
                Aqui você acompanha o tempo de tela dos seus filhos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowInstructions(true)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${t.btnGhost}`}>
                <HelpCircle size={16} />
                Como usar?
              </button>
              <Link to="/" className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${t.btnGhost}`}>
                <ArrowLeft size={16} />
                Voltar
              </Link>
              <button type="button" onClick={() => { authService.logout(); navigate("/"); }} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${t.btnGhost}`}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className={`mt-4 rounded-2xl border p-5 ${t.panel}`}>
          <p className="font-bold">Qual filho você quer ver?</p>
          <p className={`mt-1 text-sm ${t.textMuted}`}>Selecione o filho para ver os dados de uso dele.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>Filho</label>
              <select value={filhoSelecionadoId} onChange={handleFilhoChange} disabled={loading || filhos.length === 0} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${t.input}`}>
                {filhos.length === 0 ? (
                  <option value="">Nenhum filho vinculado ainda</option>
                ) : (
                  filhos.map((filho) => (
                    <option key={filho.id} value={String(filho.id)}>{filho.nome}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>Editar nome</label>
              <div className="flex gap-2">
                <input type="text" value={nomeEdicaoFilho} onChange={(e) => setNomeEdicaoFilho(e.target.value)} disabled={!filhoSelecionadoId || salvandoFilho} placeholder="Nome do filho" className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${t.input}`} />
                <button type="button" onClick={handleSalvarNomeFilho} disabled={!filhoSelecionadoId || !nomeEdicaoFilho.trim() || salvandoFilho} className={`rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${t.btnPrimary}`}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-4 rounded-2xl border p-5 ${t.panel}`}>
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-cyan-500" />
            <p className="font-bold">Código de conexão</p>
          </div>
          <p className={`mt-1 text-sm ${t.textMuted}`}>
            Este código é como o celular da criança "fala" com este painel. Gere um e copie para o app.
          </p>
          <div className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-3 font-mono text-xs break-all ${t.panelSoft}`}>
            <span className="flex-1">{token || "Nenhum código gerado ainda. Clique em Gerar Código."}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={handleGerarToken} disabled={generatingToken || loading} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${t.btnPrimary}`}>
              <RefreshCw size={15} className={generatingToken ? "animate-spin" : ""} />
              {generatingToken ? "Gerando..." : "Gerar Código"}
            </button>
            <button type="button" onClick={handleCopyToken} disabled={!token} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${t.btnGhost}`}>
              {copiedToken ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              {copiedToken ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Tempo total", value: `${totalMinutos} min`, sub: "somado de todos os dias" },
            { label: "Aplicativos usados", value: qtdApps, sub: "apps com registro" },
            { label: "Dias registrados", value: qtdDias, sub: "dias com atividade" },
          ].map((card) => (
            <article key={card.label} className={`rounded-2xl border p-4 ${t.panelSoft}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>{card.label}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
              <p className={`mt-0.5 text-xs ${t.textMuted}`}>{card.sub}</p>
            </article>
          ))}
        </section>

        {canRenderCharts ? (
          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className={`rounded-2xl border p-5 ${t.panel}`}>
              <h3 className="font-bold">App mais usado</h3>
              <p className={`text-sm ${t.textMuted}`}>Minutos por aplicativo</p>
              <div className="mt-4 h-72"><canvas ref={appChartRef} /></div>
            </article>
            <article className={`rounded-2xl border p-5 ${t.panel}`}>
              <h3 className="font-bold">Uso por dia</h3>
              <p className={`text-sm ${t.textMuted}`}>O tempo aumentou ou diminuiu?</p>
              <div className="mt-4 h-72"><canvas ref={dayChartRef} /></div>
            </article>
          </section>
        ) : (
          <section className={`mt-4 rounded-2xl border p-8 text-center ${t.panel}`}>
            <Smartphone size={40} className={`mx-auto ${t.textMuted}`} />
            <h3 className="mt-3 text-lg font-bold">Nenhum dado ainda</h3>
            <p className={`mx-auto mt-2 max-w-sm text-sm ${t.textSoft}`}>
              Gere o código acima e configure o app no celular da criança. Os gráficos aparecem assim que os dados chegarem.
            </p>
            <button type="button" onClick={() => setShowInstructions(true)} className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-5 py-2 text-sm font-semibold transition ${t.btnGhost}`}>
              <HelpCircle size={15} />
              Ver instruções
            </button>
            {message && <p className={`mt-3 text-sm ${t.textMuted}`}>{message}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
