import { useCallback, useEffect, useState } from "react";
import { Ban, Check, Clock, LockOpen, MessageSquareText, Send } from "lucide-react";
import { dashboardService } from "../services/dashboardService";

const LIMITE_MENSAGEM = 500;

const MENSAGENS_PRONTAS = [
  "Você está há muito tempo nesse app.",
  "Hora de dar uma pausa no celular.",
  "Hora de dormir! Deixe o celular de lado.",
];

const DURACOES = [
  { id: "30", label: "30 min" },
  { id: "60", label: "1 hora" },
  { id: "120", label: "2 horas" },
  { id: "fim_do_dia", label: "Até o fim do dia" },
  { id: "ate_liberar", label: "Até eu liberar" },
];

// Converte a duracao escolhida na data/hora em que a suspensao acaba (null = ate liberar).
function calcularFim(duracao) {
  if (duracao === "ate_liberar") return null;
  if (duracao === "fim_do_dia") {
    const fim = new Date();
    fim.setHours(23, 59, 59, 0);
    return fim.toISOString();
  }
  return new Date(Date.now() + Number(duracao) * 60000).toISOString();
}

function formatarHora(iso) {
  const data = new Date(iso);
  const hoje = new Date().toDateString() === data.toDateString();
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return hoje ? hora : `${data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${hora}`;
}

export default function ControleCelular({ userId, filhoId, t }) {
  const [aba, setAba] = useState("mensagem");
  const [apps, setApps] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [suspensoes, setSuspensoes] = useState([]);
  const [texto, setTexto] = useState("");
  const [appId, setAppId] = useState("");
  const [duracao, setDuracao] = useState("60");
  const [enviando, setEnviando] = useState(false);
  const [suspendendo, setSuspendendo] = useState(false);
  const [aviso, setAviso] = useState({ tipo: "", texto: "" });

  const carregar = useCallback(async () => {
    if (!userId || !filhoId) return;
    try {
      const data = await dashboardService.carregarControle(userId, filhoId);
      setApps(data?.apps || []);
      setMensagens(data?.mensagens || []);
      setSuspensoes(data?.suspensoes || []);
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message || "Erro ao carregar controles." });
    }
  }, [userId, filhoId]);

  // Recarrega a cada 30s para atualizar o status "lida" e as suspensoes que venceram.
  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, [carregar]);

  function trocarAba(nova) {
    setAba(nova);
    setAviso({ tipo: "", texto: "" });
  }

  async function handleEnviarMensagem(event) {
    event.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setAviso({ tipo: "", texto: "" });
    try {
      await dashboardService.enviarMensagem(userId, filhoId, texto.trim());
      setTexto("");
      setAviso({ tipo: "ok", texto: "Enviada! Chega ao celular em até 1 minuto." });
      await carregar();
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message || "Erro ao enviar mensagem." });
    } finally {
      setEnviando(false);
    }
  }

  async function handleSuspender(event) {
    event.preventDefault();
    if (!appId) return;
    setSuspendendo(true);
    setAviso({ tipo: "", texto: "" });
    try {
      const data = await dashboardService.suspenderApp(userId, filhoId, Number(appId), calcularFim(duracao));
      setSuspensoes(data?.suspensoes || []);
      setAppId("");
      setAviso({ tipo: "ok", texto: "App suspenso. O bloqueio chega ao celular em até 1 minuto." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message || "Erro ao suspender app." });
    } finally {
      setSuspendendo(false);
    }
  }

  async function handleLiberar(suspensaoId) {
    setAviso({ tipo: "", texto: "" });
    try {
      const data = await dashboardService.liberarApp(userId, filhoId, suspensaoId);
      setSuspensoes(data?.suspensoes || []);
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message || "Erro ao liberar app." });
    }
  }

  const tituloSecao = `mb-2 text-xs font-semibold uppercase tracking-wider ${t.textMuted}`;
  const abas = [
    { id: "mensagem", label: "Mensagem", icon: MessageSquareText },
    { id: "suspender", label: "Suspender", icon: Ban, contador: suspensoes.length },
  ];

  return (
    <section className={`rounded-2xl p-5 md:p-6 lg:sticky lg:top-24 ${t.card}`}>
      <h2 className="font-bold">Controle do celular</h2>
      <p className={`mt-1 text-sm ${t.textMuted}`}>Mande um recado ou pause um app.</p>

      <div className={`mt-4 flex rounded-xl p-1 ${t.segment}`} role="tablist">
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            onClick={() => trocarAba(item.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold transition ${
              aba === item.id ? t.segmentActive : t.segmentIdle
            }`}
          >
            <item.icon size={15} />
            {item.label}
            {item.contador > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white">{item.contador}</span>
            )}
          </button>
        ))}
      </div>

      {aviso.texto && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${aviso.tipo === "erro" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600"}`}>
          {aviso.texto}
        </p>
      )}

      {aba === "mensagem" ? (
        <div className="mt-4">
          <form onSubmit={handleEnviarMensagem}>
            <div className="flex flex-wrap gap-1.5">
              {MENSAGENS_PRONTAS.map((pronta) => (
                <button
                  key={pronta}
                  type="button"
                  onClick={() => setTexto(pronta)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${t.chip}`}
                >
                  {pronta}
                </button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, LIMITE_MENSAGEM))}
              rows={3}
              placeholder="Escreva sua mensagem..."
              aria-label="Mensagem"
              className={`mt-3 w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none ${t.input}`}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`text-xs ${t.textMuted}`}>{texto.length}/{LIMITE_MENSAGEM}</span>
              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${t.btnPrimary}`}
              >
                <Send size={14} />
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>

          {mensagens.length > 0 && (
            <div className="mt-6">
              <p className={tituloSecao}>Enviadas</p>
              <ul className={`divide-y ${t.divider}`}>
                {mensagens.slice(0, 4).map((msg) => (
                  <li key={msg.id} className="py-2.5">
                    <p className="break-words text-sm">{msg.texto}</p>
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${msg.lida_em ? "text-emerald-500" : t.textMuted}`}>
                      {msg.lida_em ? <Check size={12} /> : <Clock size={12} />}
                      {msg.lida_em ? `Lida às ${formatarHora(msg.lida_em)}` : `Enviada às ${formatarHora(msg.criada_em)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <form onSubmit={handleSuspender}>
            <label htmlFor="app-suspender" className={tituloSecao + " block"}>App</label>
            <select
              id="app-suspender"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              disabled={apps.length === 0}
              className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none ${t.input}`}
            >
              <option value="">{apps.length === 0 ? "Nenhum app registrado ainda" : "Escolha um app"}</option>
              {apps.map((app) => (
                <option key={app.id} value={String(app.id)}>{app.nome}</option>
              ))}
            </select>

            <p className={`${tituloSecao} mt-4`}>Por quanto tempo</p>
            <div className="flex flex-wrap gap-1.5">
              {DURACOES.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setDuracao(opcao.id)}
                  aria-pressed={duracao === opcao.id}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    duracao === opcao.id ? "bg-blue-500 text-white" : t.chip
                  }`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!appId || suspendendo}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${t.btnPrimary}`}
            >
              <Ban size={15} />
              {suspendendo ? "Suspendendo..." : "Suspender app"}
            </button>
          </form>

          <div className="mt-6">
            <p className={tituloSecao}>Suspensos agora</p>
            {suspensoes.length === 0 ? (
              <p className={`text-sm ${t.textMuted}`}>Nenhum app suspenso.</p>
            ) : (
              <ul className={`divide-y ${t.divider}`}>
                {suspensoes.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.nome}</p>
                      <p className={`text-xs ${t.textMuted}`}>{s.fim ? `Até ${formatarHora(s.fim)}` : "Até você liberar"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLiberar(s.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${t.btnGhost}`}
                    >
                      <LockOpen size={13} />
                      Liberar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
