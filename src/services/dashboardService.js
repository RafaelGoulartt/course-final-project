const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/$/, "");

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
