import { CircleCheckBig } from "lucide-react";
import { useTheme } from "../context/useTheme";

const impacts = [
  "Informar sem alarmismo e sem linguagem complicada",
  "Apoiar dialogos entre familia, escola e comunidade",
  "Transformar dados em orientacoes faceis de entender",
  "Incentivar uso equilibrado e mais consciente da tecnologia",
];

export default function ProblemSection() {
  const { isDark } = useTheme();
  const leftCardClass = isDark
    ? "border-slate-800 bg-slate-900/70 shadow-black/20"
    : "border-slate-200 bg-white/90 shadow-slate-300/40";
  const leftTitleClass = isDark ? "text-white" : "text-slate-900";
  const leftTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const rightCardClass = isDark
    ? "border-sky-500/30 from-sky-900/40 to-cyan-900/20 shadow-black/20"
    : "border-sky-200 from-sky-50 to-cyan-50 shadow-slate-300/40";
  const badgeClass = isDark ? "bg-sky-500/20 text-sky-200" : "bg-sky-100 text-sky-700";
  const rightTitleClass = isDark ? "text-white" : "text-slate-900";
  const listTextClass = isDark ? "text-slate-200" : "text-slate-700";
  const iconClass = isDark ? "text-sky-300" : "text-sky-600";

  return (
    <section id="sobre" className="py-16 md:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:grid-cols-2 md:gap-8 md:px-6">
        <article className={`rounded-3xl border p-6 shadow-xl md:p-8 ${leftCardClass}`}>
          <h2 className={`text-3xl font-bold md:text-4xl ${leftTitleClass}`}>
            Por que este site foi criado
          </h2>

          <p className={`mt-5 leading-relaxed ${leftTextClass}`}>
            A ideia deste projeto e tornar um tema importante mais acessivel para todos. Em vez de
            apresentar apenas numeros, queremos explicar o contexto e aproximar esse debate da vida
            real.
          </p>

          <p className={`mt-4 leading-relaxed ${leftTextClass}`}>
            Sabemos que cada familia e cada escola vive uma realidade diferente. Por isso, este
            espaco busca apoiar reflexoes praticas, sem julgamento e com foco em cuidado.
          </p>

          <p className={`mt-4 leading-relaxed ${leftTextClass}`}>
            Nossa proposta e contribuir para decisoes mais conscientes sobre o uso de telas,
            fortalecendo a educacao digital desde cedo.
          </p>
        </article>

        <article className={`rounded-3xl border bg-gradient-to-br p-6 shadow-xl md:p-8 ${rightCardClass}`}>
          <p
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            O que estamos tentando realizar
          </p>
          <h3 className={`mt-4 text-2xl font-bold ${rightTitleClass}`}>Compromissos do projeto</h3>

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
