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
    note: "Maior concentração de tela no período noturno.",
  },
  {
    title: "Público mais exposto",
    value: "Classe alta",
    note: "Média de 3.15 horas/dia em smartphone.",
  },
  {
    title: "Variação regional",
    value: "0.8h",
    note: "Distância entre o maior e menor índice.",
  },
];

const recentAlerts = [
  "Sudeste manteve liderança de uso por 3 meses consecutivos.",
  "Classe média cresceu 4% no tempo médio diário.",
  "Norte teve redução de 2% no último período medido.",
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
    ? "border-neutral-800 bg-black text-neutral-200 hover:border-neutral-600 hover:text-white"
    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 hover:text-black";
  const heroClass = isDark ? "border-neutral-800" : "border-neutral-200";
  const badgeClass = isDark
    ? "border-neutral-700 text-neutral-400"
    : "border-neutral-300 text-neutral-600";
  const headingClass = isDark ? "text-white" : "text-black";
  const textClass = isDark ? "text-neutral-400" : "text-neutral-600";
  const smallCardClass = isDark
    ? "border-neutral-800 text-neutral-400"
    : "border-neutral-200 text-neutral-600";
  const smallCardAccentClass = isDark ? "text-white" : "text-black";
  const panelClass = isDark ? "border-neutral-800" : "border-neutral-200";
  const panelHeadingClass = isDark ? "text-white" : "text-black";
  const panelSubtextClass = isDark ? "text-neutral-400" : "text-neutral-600";
  const chipClass = isDark ? "border border-neutral-700 text-neutral-400" : "border border-neutral-300 text-neutral-600";
  const rankingLabelClass = isDark ? "text-neutral-300" : "text-neutral-700";
  const rankingValueClass = isDark ? "text-white" : "text-black";
  const barTrackClass = isDark ? "bg-neutral-800" : "bg-neutral-200";
  const insightCardClass = isDark ? "border-neutral-800" : "border-neutral-200";
  const insightTitleClass = isDark ? "text-neutral-500" : "text-neutral-500";
  const insightValueClass = isDark ? "text-white" : "text-black";
  const alertCardClass = isDark
    ? "border-neutral-800 text-neutral-400"
    : "border-neutral-200 text-neutral-600";
  const helpBoxClass = isDark
    ? "border-neutral-800 bg-black text-neutral-200"
    : "border-neutral-200 bg-white text-neutral-700";

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
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#525252;margin-bottom:4px;">
              <span>${item.name}</span>
              <strong>${item.horas}h</strong>
            </div>
            <div style="height:8px;background:#e5e5e5;overflow:hidden;">
              <div style="height:100%;width:${width}%;background:#000000;"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const tableRows = regionalData
      .map(
        (item, index) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;"><strong>${item.horas}h</strong></td>
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
          <title>ScreenTime BI - Relatório</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #0a0a0a; background: #ffffff; }
            .header { margin-bottom: 20px; }
            .badge { display: inline-block; font-size: 11px; font-weight: 700; color: #ffffff; background: #000000; padding: 5px 10px; }
            h1 { margin: 12px 0 6px; font-size: 24px; }
            .sub { color: #525252; font-size: 13px; margin: 0; }
            .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 18px; }
            .card { border: 1px solid #e5e5e5; background: white; padding: 16px; }
            .card h2 { margin: 0 0 10px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; color: #525252; font-size: 12px; letter-spacing: .02em; border-bottom: 1px solid #d4d4d4; padding: 8px; }
            .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
            .kpi { border: 1px solid #e5e5e5; background: white; padding: 12px; }
            .kpi .label { font-size: 12px; color: #737373; margin-bottom: 6px; }
            .kpi .value { font-size: 20px; font-weight: 700; color: #0a0a0a; }
            .foot { margin-top: 18px; font-size: 11px; color: #737373; }
            @media print { body { background: white; padding: 16px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">Relatório em PDF</span>
            <h1>ScreenTime BI - Panorama de Tempo de Tela</h1>
            <p class="sub">Gerado em ${generatedAt} | Base consolidada: Março 2026</p>
          </div>

          <div class="grid">
            <section class="card">
              <h2>Gráfico por região (horas/dia)</h2>
              ${barRows}
            </section>
            <section class="card">
              <h2>Ranking regional</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Região</th>
                    <th style="text-align:right;">Horas</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
            </section>
          </div>

          <section class="kpis">
            <div class="kpi">
              <div class="label">Média nacional</div>
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

          <p class="foot">Dica: no diálogo de impressão, selecione "Salvar como PDF".</p>
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
        className={`fixed right-4 top-4 z-50 inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold transition md:right-6 md:top-6 ${backButtonClass}`}
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <section ref={overviewRef} className={`border p-6 md:p-8 ${heroClass}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className={`inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
            >
              <Sparkles size={14} />
              Panorama atualizado
            </p>
            <h1 className={`mt-4 text-3xl font-bold tracking-tight md:text-4xl ${headingClass}`}>
              Dashboard Analítico de Tempo de Tela
            </h1>
            <p className={`mt-3 max-w-2xl text-sm md:text-base ${textClass}`}>
              Acompanhe consumo diário por região e perfil social com foco em comportamento digital
              e variações de tendência.
            </p>
          </div>
          <div className={`border px-4 py-3 text-sm ${smallCardClass}`}>
            Última consolidação: <span className={`font-semibold ${smallCardAccentClass}`}>Março 2026</span>
          </div>
        </div>
      </section>

      <section ref={classesRef} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          title="Média nacional"
          value="2.5h"
          subtitle="Tempo médio diário por usuário"
          trend="+12% vs 2025"
          trendUp
          icon={Clock3}
          tone="blue"
        />
        <KPI
          title="Região com maior uso"
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
          title="Sinal de atenção"
          value="Noite"
          subtitle="Faixa de maior exposição digital"
          trend="-3% no controle de pausa"
          trendUp={false}
          icon={Activity}
          tone="rose"
        />
      </section>

      <section ref={regionsRef} className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className={`xl:col-span-2 border p-5 md:p-6 ${panelClass}`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Tempo médio por região</h2>
              <p className={`text-sm ${panelSubtextClass}`}>
                Comparativo direto entre as principais regiões do país.
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs ${chipClass}`}>
              <BarChart3 size={14} />
              Em horas/dia
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 6, right: 6, left: -8, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#262626" : "#e5e5e5"} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? "#a3a3a3" : "#525252", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  unit="h"
                  tick={{ fill: isDark ? "#a3a3a3" : "#525252", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#000000" : "#ffffff",
                    borderColor: isDark ? "#262626" : "#e5e5e5",
                    color: isDark ? "#f5f5f5" : "#0a0a0a",
                    borderRadius: "0px",
                  }}
                />
                <Bar dataKey="horas" fill={isDark ? "#ffffff" : "#000000"} radius={[0, 0, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`border p-5 md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Ranking regional</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Ordenado por média de horas diárias.</p>

          <ul className="mt-6 space-y-4">
            {regionalData.map((item, index) => (
              <li key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={rankingLabelClass}>
                    {index + 1}. {item.name}
                  </span>
                  <span className={`font-semibold ${rankingValueClass}`}>{item.horas}h</span>
                </div>
                <div className={`h-2 ${barTrackClass}`}>
                  <div
                    className={isDark ? "h-full bg-white" : "h-full bg-black"}
                    style={{ width: `${(item.horas / 3.2) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section ref={analysesRef} className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className={`border p-5 md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Insights rápidos</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Destaques para leitura executiva.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {highlightCards.map((card) => (
              <div key={card.title} className={`border p-4 ${insightCardClass}`}>
                <p className={`text-xs uppercase tracking-wider ${insightTitleClass}`}>{card.title}</p>
                <p className={`mt-2 text-xl font-semibold ${insightValueClass}`}>{card.value}</p>
                <p className={`mt-1 text-xs ${panelSubtextClass}`}>{card.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={`border p-5 md:p-6 ${panelClass}`}>
          <h2 className={`text-xl font-semibold ${panelHeadingClass}`}>Eventos recentes</h2>
          <p className={`mt-1 text-sm ${panelSubtextClass}`}>Mudanças observadas na última consolidação.</p>
          <ul className="mt-5 space-y-3">
            {recentAlerts.map((alert) => (
              <li key={alert} className={`border px-4 py-3 text-sm ${alertCardClass}`}>
                {alert}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {showHelp && (
        <aside
          className={`fixed bottom-5 right-5 z-50 max-w-sm border p-4 ${helpBoxClass}`}
        >
          <p className="text-sm font-semibold">Como usar o dashboard</p>
          <p className="mt-2 text-xs leading-relaxed">
            Use os botões do menu lateral para ir direto nas seções. Em "Exportar", o sistema abre
            um relatório com gráfico para salvar em PDF.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className={`mt-3 px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"}`}
          >
            Fechar
          </button>
        </aside>
      )}
    </DashboardLayout>
  );
}
