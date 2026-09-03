import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";
import { authService } from "../services/authService";

const initialLogin = { email: "", password: "" };
const initialRegister = { name: "", email: "", password: "", confirmPassword: "" };

function getPasswordChecks(password) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginData, setLoginData] = useState(initialLogin);
  const [registerData, setRegisterData] = useState(initialRegister);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!showSuccessModal) return;
    if (countdown === 0) {
      setShowSuccessModal(false);
      setMode("login");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown]);

  const isLogin = mode === "login";
  const passwordChecks = getPasswordChecks(registerData.password);
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const pageClass = isDark
    ? "bg-slate-900 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const cardClass = isDark
    ? "rounded-lg border-slate-800 bg-slate-900"
    : "rounded-lg border-slate-200 bg-slate-50";

  const inputClass = useMemo(
    () =>
      `w-full rounded-md border px-4 py-3 text-sm outline-none transition focus:border-blue-500 ${
        isDark
          ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
      }`,
    [isDark],
  );

  const sidePanelClass = "bg-blue-500 text-white";

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const result = await authService.login(loginData);
      setMessage(result.message);
      if (result?.user?.id) {
        navigate("/dashboard-pais");
      }
    } catch {
      setMessage("Não foi possível fazer login.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!isPasswordStrong) {
      setMessage("A senha precisa atender aos requisitos de segurança.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setMessage("As senhas não conferem.");
      return;
    }

    setSubmitting(true);

    try {
      await authService.register(registerData);
      setRegisterData(initialRegister);
      setCountdown(5);
      setShowSuccessModal(true);
    } catch {
      setMessage("Não foi possível concluir o cadastro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={`flex min-h-screen items-center justify-center p-4 md:p-8 ${pageClass}`}>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className={`mx-4 w-full max-w-sm rounded-lg border p-8 text-center ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="mb-4 flex justify-center">
              <CheckCircle size={56} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">Conta criada!</h2>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Sua conta foi criada com sucesso. Você será redirecionado para o login em instantes.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-4xl font-bold">{countdown}</span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>segundos</span>
            </div>
            <button
              type="button"
              onClick={() => { setShowSuccessModal(false); setMode("login"); }}
              className="mt-6 w-full rounded-md bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              Ir para o login agora
            </button>
          </div>
        </div>
      )}
      <section className={`w-full max-w-5xl overflow-hidden border ${cardClass}`}>
        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-2">
          <div className="relative order-2 overflow-hidden px-5 py-8 md:px-10 lg:order-1 lg:p-12">
            <Link
              to="/"
              className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${
                isDark ? "text-slate-300 hover:text-blue-400" : "text-slate-600 hover:text-blue-600"
              }`}
            >
              <ArrowLeft size={16} />
              Voltar para Home
            </Link>

            <div className="relative min-h-[450px]">
              <form
                onSubmit={handleLoginSubmit}
                className={`absolute inset-0 space-y-5 transition-all duration-500 ${
                  isLogin ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0 pointer-events-none"
                }`}
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Use seu email e senha para acessar.
                  </p>
                </div>

                <input type="email" name="email" placeholder="Seu email" required className={inputClass} value={loginData.email} onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))} />

                <input type="password" name="password" placeholder="Sua senha" required className={inputClass} value={loginData.password}
                  onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
                />

                <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60" >
                  {submitting ? "Entrando..." : "Fazer login"}
                </button>
              </form>

              <form onSubmit={handleRegisterSubmit} className={`absolute inset-0 space-y-5 transition-all duration-500 ${ isLogin ? "translate-x-10 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Cadastrar</h1>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Crie sua conta para começar.
                  </p>
                </div>

                <input type="text" name="name" placeholder="Nome completo"required className={inputClass} value={registerData.name} onChange={(event) => setRegisterData((prev) => ({ ...prev, name: event.target.value }))}
                />

                <input type="email" name="email" placeholder="Seu email" required className={inputClass} value={registerData.email} onChange={(event) => setRegisterData((prev) => ({ ...prev, email: event.target.value }))}
                />

                <div className="space-y-3">
                  <div className="relative">
                    <input type={showRegisterPassword ? "text" : "password"} name="password" placeholder="Crie uma senha" required className={`${inputClass} pr-12`} value={registerData.password} onChange={(event) => setRegisterData((prev) => ({ ...prev, password: event.target.value }))} />

                    <button type="button" onClick={() => setShowRegisterPassword((prev) => !prev)} className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition ${ isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
                      aria-label={showRegisterPassword ? "Ocultar senha" : "Visualizar senha"}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className={`rounded-md border p-3 text-xs ${isDark ? "border-slate-700" : "border-slate-300"}`}>
                    <p className="mb-2 font-semibold">Senha deve conter:</p>
                    <ul className="space-y-1">
                      <li className={passwordChecks.minLength ? "text-emerald-500" : "text-rose-500"}>
                        Pelo menos 8 caracteres
                      </li>
                      <li className={passwordChecks.uppercase ? "text-emerald-500" : "text-rose-500"}>
                        Uma letra maiúscula
                      </li>
                      <li className={passwordChecks.lowercase ? "text-emerald-500" : "text-rose-500"}>
                        Uma letra minúscula
                      </li>
                      <li className={passwordChecks.number ? "text-emerald-500" : "text-rose-500"}>
                        Um número
                      </li>
                      <li className={passwordChecks.special ? "text-emerald-500" : "text-rose-500"}>
                        Um caractere especial
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="relative">
                  <input type={showRegisterConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirme a senha" required className={`${inputClass} pr-12`}  value={registerData.confirmPassword}
                    onChange={(event) =>
                      setRegisterData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                  />
                  <button type="button" onClick={() => setShowRegisterConfirmPassword((prev) => !prev)} className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition ${ isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100" }`} aria-label={showRegisterConfirmPassword ? "Ocultar senha" : "Visualizar senha"}>
                    {showRegisterConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button type="submit" disabled={submitting || !isPasswordStrong} className="w-full rounded-md bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60">
                  {submitting ? "Cadastrando..." : "Criar conta"}
                </button>
              </form>
            </div>

            {message && (
              <p className={`mt-3 text-sm font-medium ${
                message.includes("sucesso")
                  ? "text-emerald-500"
                  : isDark ? "text-rose-400" : "text-rose-600"
              }`}>
                {message}
              </p>
            )}
          </div>

          <div
            className={`order-1 flex flex-col justify-center p-8 transition-all duration-500 md:p-12 lg:order-2 ${sidePanelClass}`}
          >
            <p className="text-sm font-semibold uppercase tracking-widest">Acesso da plataforma</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {isLogin ? "Novo por aqui?" : "Já possui conta?"}
            </h2>
            <p className="mt-4 max-w-md text-sm md:text-base">
              {isLogin
                ? "Clique em cadastrar para criar seu acesso. A tela muda com animação sem sair desta página."
                : "Volte para login em um clique e acesse com seu email e senha."}
            </p>

            <button
              type="button"
              onClick={() => setMode(isLogin ? "register" : "login")}
              className="mt-8 w-fit rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-slate-100"
            >
              {isLogin ? "Cadastrar" : "Fazer login"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
