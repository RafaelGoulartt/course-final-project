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
        <article className="border border-neutral-800 bg-black p-5 md:p-8">

          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Comparacao de tempo de uso diario
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-400 md:text-base">
              Compare o tempo medio de uso de celular por classe social ou por regiao.
            </p>
          </div>

          <div className="mt-6 flex justify-center md:mt-8">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-neutral-700 bg-black px-4 py-2 text-neutral-100 outline-none transition focus:border-white md:w-auto"
            >
              <option value="classe">Por classe social</option>
              <option value="regiao">Por regiao</option>
            </select>
          </div>

          <div className="mt-6 h-[320px] border border-neutral-800 p-3 md:mt-8 md:h-[420px] md:p-6">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />

                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a3a3a3", fontSize: isMobile ? 10 : 12 }}
                  tickMargin={isMobile ? 12 : 10}
                  interval={0}
                  angle={isMobile ? -25 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  unit="h"
                  tick={{ fill: "#a3a3a3", fontSize: isMobile ? 10 : 12 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "#262626",
                    borderRadius: "0px",
                  }}
                />

                <Bar
                  dataKey="horas"
                  fill="#ffffff"
                  radius={[0, 0, 0, 0]}
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