const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail ? ` (${data.detail})` : "";
    throw new Error((data?.message || "Erro ao conectar com servidor.") + detail);
  }

  return data;
}

export const dashboardService = {
  async gerarToken(userId) {
    return request("/dashboard/gerar-token", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async enviarNotificacao(userId, token, mensagem) {
    return request("/dashboard/notificacoes", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, token, mensagem }),
    });
  },

  async carregarAppsRegistrados(userId, token, filhoId = null) {
    const query = new URLSearchParams({ user_id: String(userId), token });
    if (filhoId) query.set("filho_id", String(filhoId));
    return request(`/dashboard/apps-registrados?${query.toString()}`, { method: "GET" });
  },

  async bloquearApp(userId, token, packageName, durationMinutes) {
    return request("/dashboard/bloqueios", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        token,
        package_name: packageName,
        duration_minutes: durationMinutes,
      }),
    });
  },

  async carregarDashboard(userId, filhoId = null) {
    const query = new URLSearchParams({ user_id: String(userId) });
    if (filhoId) {
      query.set("filho_id", String(filhoId));
    }
    return request(`/dashboard?${query.toString()}`, {
      method: "GET",
    });
  },

  async enviarTempoUso(payload) {
    return request("/dashboard/tempo-uso", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async atualizarFilho(filhoId, payload) {
    return request(`/dashboard/filhos/${filhoId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
