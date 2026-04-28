const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : "/api")).replace(/\/$/, "");

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export const authService = {
  async login(credentials) {
    const data = await request("/auth/login", credentials);

    if (data?.token) {
      localStorage.setItem("auth_token", data.token);
    }
    if (data?.user) {
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    }

    return data;
  },

  async register(payload) {
    return request("/auth/register", payload);
  },

  getCurrentUser() {
    try {
      const value = localStorage.getItem("auth_user");
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
};
