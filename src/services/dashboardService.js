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
    throw new Error(data?.message || "Erro ao conectar com servidor.");
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

  async carregarDashboard(userId, filhoId = null, periodo = "semana", data = null) {
    const query = new URLSearchParams({ user_id: String(userId), periodo });
    if (filhoId) {
      query.set("filho_id", String(filhoId));
    }
    if (data) {
      query.set("data", data);
    }
    return request(`/dashboard?${query.toString()}`, {
      method: "GET",
    });
  },

  async carregarControle(userId, filhoId) {
    return request(`/dashboard/filhos/${filhoId}/controle?user_id=${userId}`, { method: "GET" });
  },

  async enviarMensagem(userId, filhoId, texto) {
    return request(`/dashboard/filhos/${filhoId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, texto }),
    });
  },

  // fim: data ISO de quando a suspensao acaba, ou null para "ate liberar".
  async suspenderApp(userId, filhoId, appId, fim) {
    return request(`/dashboard/filhos/${filhoId}/suspensoes`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, app_id: appId, fim }),
    });
  },

  async liberarApp(userId, filhoId, suspensaoId) {
    return request(`/dashboard/filhos/${filhoId}/suspensoes/${suspensaoId}?user_id=${userId}`, {
      method: "DELETE",
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
