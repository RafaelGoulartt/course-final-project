import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChartColumnBig, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Chart } from "chart.js/auto";
import { useTheme } from "../context/useTheme";
import { authService } from "../services/authService";
import { dashboardService } from "../services/dashboardService";

export default function Dashboard() {
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

      if (!response?.hasData) {
        setMessage("Nenhum dado disponivel");
      }
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
      setMessage(error.message || "Erro ao atualizar nome do filho.");
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
      setMessage(error.message || "Erro ao gerar token.");
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
    const canRenderCharts = Boolean(token) && hasData && tempoPorApp.length > 0 && tempoPorDia.length > 0;

    if (appChartInstance.current) {
      appChartInstance.current.destroy();
      appChartInstance.current = null;
    }

    if (dayChartInstance.current) {
      dayChartInstance.current.destroy();
      dayChartInstance.current = null;
    }

    if (!canRenderCharts || !appChartRef.current || !dayChartRef.current) {
      return;
    }

    const labelColor = isDark ? "#cbd5e1" : "#334155";
    appChartInstance.current = new Chart(appChartRef.current, {
      type: "pie",
      data: {
        labels: tempoPorApp.map((item) => item.nome),
        datasets: [
          {
            label: "Tempo de uso (min)",
            data: tempoPorApp.map((item) => Number(item.total)),
            backgroundColor: [
              "rgba(6, 182, 212, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(99, 102, 241, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
            borderColor: isDark ? "#0f172a" : "#ffffff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: labelColor },
          },
        },
      },
    });

    dayChartInstance.current = new Chart(dayChartRef.current, {
      type: "line",
      data: {
        labels: tempoPorDia.map((item) => new Date(item.data_uso).toLocaleDateString("pt-BR")),
        datasets: [
          {
            label: "Tempo total por dia (min)",
            data: tempoPorDia.map((item) => Number(item.total)),
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.22)",
            borderWidth: 1,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: labelColor },
          },
        },
        scales: {
          x: {
            ticks: { color: labelColor },
            grid: { color: isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(100, 116, 139, 0.2)" },
          },
          y: {
            ticks: { color: labelColor },
            grid: { color: isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(100, 116, 139, 0.2)" },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (appChartInstance.current) {
        appChartInstance.current.destroy();
      }
      if (dayChartInstance.current) {
        dayChartInstance.current.destroy();
      }
    };
  }, [isDark, token, hasData, tempoPorApp, tempoPorDia]);

  const totalMinutos = useMemo(
    () => tempoPorDia.reduce((acc, current) => acc + Number(current.total || 0), 0),
    [tempoPorDia],
  );
  const qtdApps = tempoPorApp.length;
  const qtdDias = tempoPorDia.length;
  const canRenderCharts = !loading && token && hasData && tempoPorApp.length > 0 && tempoPorDia.length > 0;

  const theme = isDark
    ? {
        main: "bg-slate-950 text-slate-100",
        shell: "border-slate-800 bg-slate-900/70",
        panel: "border-slate-800 bg-slate-900/80",
        panelSoft: "border-slate-700 bg-slate-950/75",
        textSoft: "text-slate-300",
        textMuted: "text-slate-400",
        buttonPrimary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        buttonGhost: "border-slate-700 bg-slate-950/80 text-slate-200 hover:bg-slate-900",
        heroGradient: "from-cyan-500/15 via-slate-900 to-emerald-500/10",
        tag: "bg-cyan-400/20 text-cyan-200",
      }
    : {
        main: "bg-slate-100 text-slate-900",
        shell: "border-slate-200 bg-white/80",
        panel: "border-slate-200 bg-white/95",
        panelSoft: "border-slate-300 bg-slate-50/95",
        textSoft: "text-slate-700",
        textMuted: "text-slate-500",
        buttonPrimary: "bg-cyan-600 text-white hover:bg-cyan-500",
        buttonGhost: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        heroGradient: "from-cyan-100 via-white to-emerald-100",
        tag: "bg-cyan-100 text-cyan-700",
      };

  return (
    <main className={`relative min-h-screen overflow-hidden p-4 md:p-8 ${theme.main}`}>
      <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className={`mx-auto w-full max-w-6xl rounded-3xl border p-4 shadow-2xl backdrop-blur md:p-6 ${theme.shell}`}>
        <header className={`rounded-2xl border bg-gradient-to-r p-5 md:p-8 ${theme.panel} ${theme.heroGradient}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${theme.tag}`}>
                <ChartColumnBig size={14} />
                Painel da familia
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">Tempo de tela das criancas</h1>
              <p className={`mt-2 max-w-2xl text-sm md:text-base ${theme.textSoft}`}>
                Aqui voce gera o token, recebe os dados do celular e acompanha tudo em graficos simples.
              </p>
            </div>
            <Link
              to="/"
              className={`inline-flex h-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${theme.buttonGhost}`}
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </header>

        <section className={`mt-5 rounded-2xl border p-4 ${theme.panel}`}>
          <p className="text-sm font-semibold">Como usar em 3 passos</p>
          <p className={`mt-2 text-sm ${theme.textSoft}`}>
            1) Clique em <strong>Gerar Token</strong>. 2) Envie os dados do app mobile para a API.
            3) Veja os graficos abaixo.
          </p>
        </section>

        <section className={`mt-5 rounded-2xl border p-4 ${theme.panel}`}>
          <p className="text-sm font-semibold">Filho selecionado</p>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className={`mb-2 block text-xs uppercase tracking-wide ${theme.textMuted}`}>Selecionar filho</label>
              <select
                value={filhoSelecionadoId}
                onChange={handleFilhoChange}
                disabled={loading || filhos.length === 0}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {filhos.length === 0 ? (
                  <option value="">Nenhum filho vinculado</option>
                ) : (
                  filhos.map((filho) => (
                    <option key={filho.id} value={String(filho.id)}>
                      {filho.nome}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className={`mb-2 block text-xs uppercase tracking-wide ${theme.textMuted}`}>Editar nome</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nomeEdicaoFilho}
                  onChange={(event) => setNomeEdicaoFilho(event.target.value)}
                  disabled={!filhoSelecionadoId || salvandoFilho}
                  placeholder="Nome do filho"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSalvarNomeFilho}
                  disabled={!filhoSelecionadoId || !nomeEdicaoFilho.trim() || salvandoFilho}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${theme.buttonPrimary}`}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>

          <p className={`mt-2 text-xs ${theme.textMuted}`}>
            Os graficos abaixo mostram apenas os dados do filho selecionado.
          </p>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className={`rounded-2xl border p-4 ${theme.panelSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Tempo total</p>
            <p className="mt-1 text-2xl font-bold">{totalMinutos} minutos</p>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>Soma de todo o periodo</p>
          </article>
          <article className={`rounded-2xl border p-4 ${theme.panelSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Aplicativos</p>
            <p className="mt-1 text-2xl font-bold">{qtdApps}</p>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>Quantidade com uso registrado</p>
          </article>
          <article className={`rounded-2xl border p-4 ${theme.panelSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Dias registrados</p>
            <p className="mt-1 text-2xl font-bold">{qtdDias}</p>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>Dias que receberam dados</p>
          </article>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.4fr]">
          <article className={`rounded-2xl border p-5 ${theme.panel}`}>
            <div className="flex items-center justify-between">
              <p className={`inline-flex items-center gap-2 text-xs uppercase tracking-wide ${theme.textMuted}`}>
                <KeyRound size={14} />
                Codigo de conexao
              </p>
              <span className={`inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                <ShieldCheck size={13} />
                Expira em 7 dias
              </span>
            </div>

            <p className={`mt-3 text-sm ${theme.textSoft}`}>
              Conta: <strong>{user?.name || user?.email || "Usuario"}</strong>
            </p>

            <div className={`mt-3 rounded-xl border p-3 font-mono text-xs break-all ${theme.panelSoft}`}>
              {token || "Nenhum token gerado ainda."}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGerarToken}
                disabled={generatingToken || loading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${theme.buttonPrimary}`}
              >
                {generatingToken ? "Gerando..." : "Gerar Token"}
              </button>
              <button
                type="button"
                onClick={handleCopyToken}
                disabled={!token}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${theme.buttonGhost}`}
              >
                {copiedToken ? "Copiado!" : "Copiar token"}
              </button>
            </div>
            <p className={`mt-3 text-xs ${theme.textMuted}`}>
              Este codigo e usado pelo app mobile para enviar os dados de uso.
            </p>
          </article>

          <article className={`rounded-2xl border p-5 ${theme.panel}`}>
            <div className="flex items-center gap-2">
              <Smartphone size={18} />
              <h2 className="text-lg font-bold">Status dos dados</h2>
            </div>
            <p className={`mt-2 text-sm ${theme.textSoft}`}>
              Os graficos aparecem quando tiver token e dados enviados pelo celular.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={`rounded-xl border p-3 ${theme.panelSoft}`}>
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Token pronto</p>
                <p className="mt-1 font-semibold">{token ? "Sim" : "Nao"}</p>
              </div>
              <div className={`rounded-xl border p-3 ${theme.panelSoft}`}>
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>Dados recebidos</p>
                <p className="mt-1 font-semibold">{hasData ? "Sim" : "Nao"}</p>
              </div>
            </div>
            {message ? (
              <p className={`mt-4 rounded-xl border p-3 text-sm ${theme.panelSoft}`}>{message}</p>
            ) : null}
          </article>
        </section>

        {canRenderCharts ? (
          <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <article className={`rounded-2xl border p-5 ${theme.panel}`}>
              <h3 className="text-lg font-bold">Qual app foi mais usado</h3>
              <p className={`mt-1 text-sm ${theme.textSoft}`}>Comparacao de minutos por aplicativo.</p>
              <div className="mt-4 h-80">
                <canvas ref={appChartRef} />
              </div>
            </article>
            <article className={`rounded-2xl border p-5 ${theme.panel}`}>
              <h3 className="text-lg font-bold">Uso por dia</h3>
              <p className={`mt-1 text-sm ${theme.textSoft}`}>Mostra se o tempo aumentou ou diminuiu com os dias.</p>
              <div className="mt-4 h-80">
                <canvas ref={dayChartRef} />
              </div>
            </article>
          </section>
        ) : (
          <section className={`mt-5 rounded-2xl border p-8 text-center ${theme.panel}`}>
            <h3 className="text-xl font-bold">Ainda nao temos dados para mostrar</h3>
            <p className={`mx-auto mt-2 max-w-lg text-sm ${theme.textSoft}`}>
              Gere o token e envie os dados para `/api/dashboard/tempo-uso`. Assim que chegar informacao, os graficos aparecem automaticamente.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
