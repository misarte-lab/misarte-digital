(() => {
  const client = window.misarteSupabase;
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const loginButton = document.querySelector("#loginButton");
  const forgotPasswordButton = document.querySelector("#forgotPasswordButton");
  const loginMessage = document.querySelector("#loginMessage");
  const togglePassword = document.querySelector("#togglePassword");
  const RECOVERY_URL = "https://misarte-lab.github.io/misarte-digital/admin/nova-senha.html";

  const setMessage = (message, type = "") => {
    loginMessage.textContent = message;
    loginMessage.className = `form-message ${type}`.trim();
  };

  togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Mostrar" : "Ocultar";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    loginButton.disabled = true;
    forgotPasswordButton.disabled = true;
    loginButton.querySelector("span").textContent = "Entrando...";

    const { error } = await client.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      setMessage(
        msg.includes("email not confirmed")
          ? "O e-mail ainda não foi confirmado no Supabase."
          : "E-mail ou senha incorretos.",
        "error"
      );
      loginButton.disabled = false;
      forgotPasswordButton.disabled = false;
      loginButton.querySelector("span").textContent = "Entrar";
      return;
    }

    setMessage("Acesso autorizado. Abrindo painel...", "success");
    window.location.replace("./dashboard.html");
  });

  forgotPasswordButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email || !emailInput.checkValidity()) {
      setMessage("Digite primeiro o seu e-mail.", "error");
      emailInput.focus();
      return;
    }

    forgotPasswordButton.disabled = true;
    loginButton.disabled = true;
    forgotPasswordButton.textContent = "Enviando...";

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: RECOVERY_URL
    });

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      setMessage(
        msg.includes("rate limit")
          ? "O limite temporário de e-mails foi atingido. Aguarde e tente novamente mais tarde."
          : "Não foi possível enviar o e-mail de recuperação.",
        "error"
      );
    } else {
      setMessage("E-mail enviado. Abra somente a mensagem mais recente.", "success");
    }

    forgotPasswordButton.disabled = false;
    loginButton.disabled = false;
    forgotPasswordButton.textContent = "Esqueci minha senha";
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session) window.location.replace("./dashboard.html");
  });
})();