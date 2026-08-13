import { CircleCheckBig } from "lucide-react";
import { useTheme } from "../context/useTheme";

const impacts = [
  "Informar sem alarmismo e sem linguagem complicada",
  "Apoiar diálogos entre família, escola e comunidade",
  "Transformar dados em orientações fáceis de entender",
  "Incentivar uso equilibrado e mais consciente da tecnologia",
];

export default function ProblemSection() {
  const { isDark } = useTheme();
  const leftCardClass = isDark ? "border-neutral-800" : "border-neutral-200";
  const leftTitleClass = isDark ? "text-white" : "text-black";
  const leftTextClass = isDark ? "text-neutral-400" : "text-neutral-600";
  const rightCardClass = isDark ? "bg-white text-black" : "bg-black text-white";
  const badgeClass = isDark ? "border-neutral-300 text-neutral-600" : "border-neutral-700 text-neutral-400";
  const listTextClass = isDark ? "text-neutral-700" : "text-neutral-300";
  const iconClass = isDark ? "text-black" : "text-white";

  return (
    <section id="sobre" className="py-16 md:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:grid-cols-2 md:gap-8 md:px-6">
        <article className={`border p-6 md:p-8 ${leftCardClass}`}>
          <h2 className={`text-3xl font-bold tracking-tight md:text-4xl ${leftTitleClass}`}>
            Por que este site foi criado
          </h2>

          <p className={`mt-5 leading-relaxed ${leftTextClass}`}>
            A ideia deste projeto é tornar um tema importante mais acessível para todos. Em vez de
            apresentar apenas números, queremos explicar o contexto e aproximar esse debate da vida
            real.
          </p>

          <p className={`mt-4 leading-relaxed ${leftTextClass}`}>
            Sabemos que cada família e cada escola vive uma realidade diferente. Por isso, este
            espaço busca apoiar reflexões práticas, sem julgamento e com foco em cuidado.
          </p>

          <p className={`mt-4 leading-relaxed ${leftTextClass}`}>
            Nossa proposta é contribuir para decisões mais conscientes sobre o uso de telas,
            fortalecendo a educação digital desde cedo.
          </p>
        </article>

        <article className={`p-6 md:p-8 ${rightCardClass}`}>
          <p
            className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            O que estamos tentando realizar
          </p>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">Compromissos do projeto</h3>

          <ul className="mt-6 space-y-4">
            {impacts.map((item) => (
              <li key={item} className={`flex items-start gap-3 ${listTextClass}`}>
                <CircleCheckBig className={`mt-0.5 ${iconClass}`} size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
