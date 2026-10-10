// Datas no formato YYYY-MM-DD, sempre no fuso do navegador (sem conversao para UTC).

export const PERIODOS = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hojeIso() {
  return toIso(new Date());
}

export function addDias(iso, dias) {
  const date = fromIso(iso);
  date.setDate(date.getDate() + dias);
  return toIso(date);
}

// Anda um periodo para tras (-1) ou para frente (+1) a partir da data de referencia.
export function moverPeriodo(periodo, iso, direcao) {
  if (periodo === "dia") return addDias(iso, direcao);
  if (periodo === "semana") return addDias(iso, 7 * direcao);
  const date = fromIso(iso);
  return toIso(new Date(date.getFullYear(), date.getMonth() + direcao, 1));
}

// Formata "30/09" a partir de "2026-09-30", sem passar por Date (evita erro de fuso).
export function diaMes(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function diaDaSemanaCurto(iso) {
  return fromIso(iso).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

// Texto do periodo exibido entre as setas. inicio/fim vem da API (fim exclusivo).
export function rotuloPeriodo(periodo) {
  if (!periodo) return "";
  const { tipo, inicio, fim } = periodo;
  const hoje = hojeIso();

  if (tipo === "dia") {
    if (inicio === hoje) return "Hoje";
    if (inicio === addDias(hoje, -1)) return "Ontem";
    return fromIso(inicio).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  }
  if (tipo === "semana") {
    return `${diaMes(inicio)} a ${diaMes(addDias(fim, -1))}`;
  }
  const texto = fromIso(inicio).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// true quando o periodo exibido ja inclui hoje (nao da para avancar mais).
export function periodoIncluiHoje(periodo) {
  if (!periodo) return true;
  const hoje = hojeIso();
  return periodo.inicio <= hoje && hoje < periodo.fim;
}

// Dias do periodo que ja passaram (ate hoje), para calcular a media diaria.
export function diasDecorridos(periodo) {
  if (!periodo) return 1;
  const hoje = hojeIso();
  const fim = hoje < periodo.fim ? addDias(hoje, 1) : periodo.fim;
  const dias = Math.round((fromIso(fim) - fromIso(periodo.inicio)) / 86400000);
  return Math.max(1, dias);
}

export function formatarMinutos(minutos) {
  const total = Math.round(Number(minutos) || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
