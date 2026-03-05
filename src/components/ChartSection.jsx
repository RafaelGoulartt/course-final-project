import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ChartSection() {
  const [tipo, setTipo] = useState("classe");
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const dadosClasse = [
    { name: "Classe Alta", horas: 3.15 },
    { name: "Classe Media", horas: 2.46 },
    { name: "Classe Baixa", horas: 2.05 },
  ];

  const dadosRegiao = [
    { name: "Sudeste", horas: 2.9 },
    { name: "Sul", horas: 2.7 },
    { name: "Nordeste", horas: 2.3 },
    { name: "Norte", horas: 2.1 },
    { name: "Centro-Oeste", horas: 2.5 },
  ];

  const data = tipo === "classe" ? dadosClasse : dadosRegiao;

  return (
    <section id="dados" className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/20 md:p-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Comparacao de tempo de uso diario
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
              Compare o tempo medio de uso de celular por classe social ou por regiao.
            </p>
          </div>

          <div className="mt-6 flex justify-center md:mt-8">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 md:w-auto"
            >
              <option value="classe">Por classe social</option>
              <option value="regiao">Por regiao</option>
            </select>
          </div>

          <div className="mt-6 h-[320px] rounded-2xl border border-slate-800 bg-slate-950/60 p-3 md:mt-8 md:h-[420px] md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                barCategoryGap="22%"
                margin={{
                  top: 10,
                  right: 10,
                  left: isMobile ? -20 : 0,
                  bottom: isMobile ? 40 : 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: isMobile ? 10 : 12 }}
                  tickMargin={isMobile ? 12 : 10}
                  interval={0}
                  angle={isMobile ? -25 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  unit="h"
                  tick={{ fill: "#94a3b8", fontSize: isMobile ? 10 : 12 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                  }}
                />

                <Bar
                  dataKey="horas"
                  fill="#38bdf8"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </article>
      </div>
    </section>
  );
}