(() => {
  const client = window.misarteSupabase;
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const loginButton = document.querySelector("#loginButton");
  const loginMessage = document.querySelector("#loginMessage");
  const togglePassword = document.querySelector("#togglePassword");

  const setMessage = (message, type = "") => {
    loginMessage.textContent = message;
    loginMessage.className = `form-message ${type}`.trim();
  };

  const setLoading = (loading) => {
    loginButton.disabled = loading;
    loginButton.classList.toggle("is-loading", loading);
    loginButton.querySelector("span").textContent = loading ? "Entrando..." : "Entrar";
  };

  const translateError = (error) => {
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }
    if (message.includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }
    if (message.includes("failed to fetch")) {
      return "Não foi possível conectar. Verifique sua internet.";
    }

    return "Não foi possível entrar. Tente novamente.";
  };

  const redirectAuthenticatedUser = async () => {
    const { data, error } = await client.auth.getSession();

    if (!error && data.session) {
      window.location.replace("./dashboard.html");
    }
  };

  togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Mostrar" : "Ocultar";
    togglePassword.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);

    const { error } = await client.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) {
      setMessage(translateError(error), "error");
      setLoading(false);
      return;
    }

    setMessage("Acesso autorizado. Abrindo painel...", "success");
    window.location.replace("./dashboard.html");
  });

  redirectAuthenticatedUser().catch(() => {
    setMessage("Não foi possível validar sua sessão.", "error");
  });
})();
