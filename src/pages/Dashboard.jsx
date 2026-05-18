import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock3,
  Crown,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import KPI from "../components/KPI";
import { useTheme } from "../context/useTheme";

const regionalData = [
  { name: "Sudeste", horas: 2.9 },
  { name: "Sul", horas: 2.7 },
  { name: "Centro-Oeste", horas: 2.5 },
  { name: "Nordeste", horas: 2.3 },
  { name: "Norte", horas: 2.1 },
];

const highlightCards = [
  {
    title: "Pico de uso",
    value: "20h - 23h",
    note: "Maior concentracao de tela no periodo noturno.",
  },
  {
    title: "Publico mais exposto",
    value: "Classe alta",
    note: "Media de 3.15 horas/dia em smartphone.",
  },
  {
    title: "Variacao regional",
    value: "0.8h",
    note: "Distancia entre o maior e menor indice.",
  },
];

const recentAlerts = [
  "Sudeste manteve lideranca de uso por 3 meses consecutivos.",
  "Classe media cresceu 4% no tempo medio diario.",
  "Norte teve reducao de 2% no ultimo periodo medido.",
];

export default function Dashboard() {
  const { isDark } = useTheme();
  const [activeItem, setActiveItem] = useState("visao-geral");
  const [showHelp, setShowHelp] = useState(false);
  const overviewRef = useRef(null);
  const classesRef = useRef(null);
  const regionsRef = useRef(null);
  const analysesRef = useRef(null);

  const backButtonClass = isDark
    ? "border-slate-700 bg-slate-900/90 text-slate-200 shadow-black/30 hover:bg-slate-800 hover:text-white"
    : "border-slate-300 bg-white/90 text-slate-700 shadow-slate-300/60 hover:bg-slate-100 hover:text-slate-900";
  const heroClass = isDark
    ? "border-slate-800 from-slate-900 via-slate-900 to-sky-950/50 shadow-black/20"
    : "border-slate-200 from-white via-sky-50 to-cyan-100 shadow-slate-300/50";
  const badgeClass = isDark
    ? "bg-sky-500/15 text-sky-200"
    : "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  const headingClass = isDark ? "text-white" : "text-slate-900";
  const textClass = isDark ? "text-slate-300" : "text-slate-700";
  const smallCardClass = isDark
    ? "border-slate-700 bg-slate-900/60 text-slate-300"
    : "border-slate-200 bg-white/80 text-slate-600";
  const smallCardAccentClass = isDark ? "text-white" : "text-slate-900";
  const panelClass = isDark
    ? "border-slate-800 bg-slate-900/70 shadow-black/20"
    : "border-slate-200 bg-white/90 shadow-slate-300/40";
  const panelHeadingClass = isDark ? "text-white" : "text-slate-900";
  const panelSubtextClass = isDark ? "text-slate-400" : "text-slate-600";
  const chipClass = isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700";
  const rankingLabelClass = isDark ? "text-slate-200" : "text-slate-700";
  const rankingValueClass = isDark ? "text-white" : "text-slate-900";
  const barTrackClass = isDark ? "bg-slate-800" : "bg-slate-200";
  const insightCardClass = isDark
    ? "border-slate-800 bg-slate-950/70"
    : "border-slate-200 bg-slate-50";
  const insightTitleClass = isDark ? "text-slate-500" : "text-slate-500";
  const insightValueClass = isDark ? "text-white" : "text-slate-900";
  const alertCardClass = isDark
    ? "border-slate-800 bg-slate-950/70 text-slate-300"
    : "border-slate-200 bg-slate-50 text-slate-700";
  const helpBoxClass = isDark
    ? "border-slate-700 bg-slate-900/95 text-slate-200"
    : "border-slate-200 bg-white/95 text-slate-700";

  const sectionMap = useMemo(
    () => ({
      "visao-geral": overviewRef,
      regioes: regionsRef,
      "classes-sociais": classesRef,
      analises: analysesRef,
    }),
    [],
  );

  function handleSidebarClick(sectionId) {
    setActiveItem(sectionId);
    const targetRef = sectionMap[sectionId];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleExport() {
    const maxHours = Math.max(...regionalData.map((item) => item.horas));
    const generatedAt = new Date().toLocaleString("pt-BR");

    const barRows = regionalData
      .map((item) => {
        const width = Math.round((item.horas / maxHours) * 100);
        return `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#334155;margin-bottom:4px;">
              <span>${item.name}</span>
              <strong>${item.horas}h</strong>
            </div>
            <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
              <div style="height:100%;width:${width}%;background:linear-gradient(90deg,#0ea5e9,#22d3ee);"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const tableRows = regionalData
      .map(
        (item, index) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;"><strong>${item.horas}h</strong></td>
          </tr>
        `,
      )
      .join("");

    const reportWindow = window.open("", "_blank", "width=1100,height=850");
    if (!reportWindow) return;

    reportWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>ScreenTime BI - Relatorio</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #0f172a; background: #f8fafc; }
            .header { margin-bottom: 20px; }
            .badge { display: inline-block; font-size: 11px; font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 5px 10px; border-radius: 999px; }
            h1 { margin: 12px 0 6px; font-size: 24px; }
            .sub { color: #475569; font-size: 13px; margin: 0; }
            .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 18px; }
            .card { border: 1px solid #e2e8f0; background: white; border-radius: 16px; padding: 16px; }
            .card h2 { margin: 0 0 10px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; color: #475569; font-size: 12px; letter-spacing: .02em; border-bottom: 1px solid #cbd5e1; padding: 8px; }
            .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
            .kpi { border: 1px solid #e2e8f0; background: white; border-radius: 14px; padding: 12px; }
            .kpi .label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
            .kpi .value { font-size: 20px; font-weight: 700; color: #0f172a; }
            .foot { margin-top: 18px; font-size: 11px; color: #64748b; }
            @media print { body { background: white; padding: 16px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">Relatorio em PDF</span>
            <h1>ScreenTime BI - Panorama de Tempo de Tela</h1>
            <p class="sub">Gerado em ${generatedAt} | Base consolidada: Marco 2026</p>
          </div>

          <div class="grid">
            <section class="card">
              <h2>Grafico por regiao (horas/dia)</h2>
              ${barRows}
            </section>
            <section class="card">
              <h2>Ranking regional</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Regiao</th>
                    <th style="text-align:right;">Horas</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
            </section>
          </div>

          <section class="kpis">
            <div class="kpi">
              <div class="label">Media nacional</div>
              <div class="value">2.5h</div>
            </div>
            <div class="kpi">
              <div class="label">Classe com maior uso</div>
              <div class="value">Alta (3.15h)</div>
            </div>
            <div class="kpi">
              <div class="label">Faixa de pico</div>
              <div class="value">20h - 23h</div>
            </div>
          </section>

          <p class="foot">Dica: no dialogo de impressao, selecione "Salvar como PDF".</p>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  }

  function handleHelp() {
    setShowHelp((current) => !current);
    if (analysesRef.current) {
      analysesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <DashboardLayout
      sidebarProps={{
        activeItem,
        onItemClick: handleSidebarClick,
        onExport: handleExport,
        onHelp: handleHelp,
      }}
    >
      <Link
        to="/"
        className={`fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur transition md:right-6 md:top-6 ${backButtonClass}`}
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <section ref={overviewRef} className={`rounded-3xl border bg-gradient-to-r p-6 shadow-2xl md:p-8 ${heroClass}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
            >
              <Sparkles size={14} />
              Panorama atualizado
            </p>
            <h1 className={`mt-4 text-3xl font-bold md:text-4xl ${headingClass}`}>
              Dashboard Analitico de Tempo de Tela
            </h1>
            <p className={`mt-3 max-w-2xl text-sm md:text-base ${textClass}`}>
              Acompanhe consumo diario por regiao e perfil social com foco em comportamento digital
              e variacoes de tendencia.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${smallCardClass}`}>
            Ultima consolidacao: <span className={`font-semibold ${smallCardAccentClass}`}>Marco 2026</span>
          </div>
        </div>
      </section>

      <section ref={classesRef} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          title="Media nacional"
          value="2.5h"
          subtitle="Tempo medio diario por usuario"
          trend="+12% vs 2025"
          trendUp
          icon={Clock3}
          tone="blue"
        />
        <KPI
          title="Regiao com maior uso"
          value="Sudeste"
          subtitle="2.9 horas por dia"
          trend="+0.2h no trimestre"
          trendUp
          icon={Crown}
          tone="amber"
        />
        <KPI
          title="Classe com maior uso"
          value="Alta"
          subtitle="3.15 horas por dia"
          trend="+5.4% anual"
          trendUp
          icon={Users}
          tone="emerald"
        />
        <KPI
          title="Sinal de atencao"
          value="Noite"
          subtitle="Faixa de maior exposicao digital"
          trend="-3% no controle de pausa"
          trendUp={false}
          icon={Activity}
          tone="rose"
        />
      </section>

      <section ref={regionsRef} className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className={`xl:col-span-2 rounded-3xl border p-5 shadow-xl md:p-6 ${panelClass}`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Tempo medio por regiao</h2>
              <p className={`text-sm ${panelSubtextClass}`}>
                Comparativo direto entre as principais regioes do pais.
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${chipClass}`}>
              <BarChart3 size={14} />
              Em horas/dia
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 6, right: 6, left: -8, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#cbd5e1"} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? "#94a3b8" : "#475569", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  unit="h"
                  tick={{ fill: isDark ? "#94a3b8" : "#475569", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#cbd5e1",
                    color: isDark ? "#e2e8f0" : "#0f172a",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="horas" fill={isDark ? "#38bdf8" : "#0ea5e9"} radius={[10, 10, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`rounded-3xl border p-5 shadow-xl md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Ranking regional</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Ordenado por media de horas diarias.</p>

          <ul className="mt-6 space-y-4">
            {regionalData.map((item, index) => (
              <li key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={rankingLabelClass}>
                    {index + 1}. {item.name}
                  </span>
                  <span className={`font-semibold ${rankingValueClass}`}>{item.horas}h</span>
                </div>
                <div className={`h-2 rounded-full ${barTrackClass}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                    style={{ width: `${(item.horas / 3.2) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section ref={analysesRef} className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className={`rounded-3xl border p-5 shadow-xl md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Insights rapidos</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Destaques para leitura executiva.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {highlightCards.map((card) => (
              <div key={card.title} className={`rounded-2xl border p-4 ${insightCardClass}`}>
                <p className={`text-xs uppercase tracking-wider ${insightTitleClass}`}>{card.title}</p>
                <p className={`mt-2 text-xl font-semibold ${insightValueClass}`}>{card.value}</p>
                <p className={`mt-1 text-xs ${panelSubtextClass}`}>{card.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={`rounded-3xl border p-5 shadow-xl md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Eventos recentes</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Mudancas observadas na ultima consolidacao.</p>
          <ul className="mt-5 space-y-3">
            {recentAlerts.map((alert) => (
              <li key={alert} className={`rounded-xl border px-4 py-3 text-sm ${alertCardClass}`}>
                {alert}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {showHelp && (
        <aside
          className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border p-4 shadow-xl ${helpBoxClass}`}
        >
          <p className="text-sm font-semibold">Como usar o dashboard</p>
          <p className="mt-2 text-xs leading-relaxed">
            Use os botoes do menu lateral para ir direto nas secoes. Em "Exportar", o sistema abre
            um relatorio com grafico para salvar em PDF.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="mt-3 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          >
            Fechar
          </button>
        </aside>
      )}
    </DashboardLayout>
  );
}
