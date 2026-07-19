(() => {
  const client = window.misarteSupabase;
  const form = document.querySelector("#newPasswordForm");
  const newPassword = document.querySelector("#newPassword");
  const confirmPassword = document.querySelector("#confirmPassword");
  const saveButton = document.querySelector("#savePasswordButton");
  const message = document.querySelector("#passwordMessage");
  const invalidRecovery = document.querySelector("#invalidRecovery");
  const intro = document.querySelector("#recoveryIntro");
  let ready = false;

  const showForm = () => {
    ready = true;
    form.hidden = false;
    invalidRecovery.hidden = true;
    intro.textContent = "Use pelo menos 8 caracteres.";
    message.textContent = "";
  };

  const showInvalid = () => {
    if (ready) return;
    form.hidden = true;
    invalidRecovery.hidden = false;
    intro.textContent = "Não foi possível validar a recuperação.";
  };

  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) showForm();
  });

  setTimeout(async () => {
    const params = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (params.get("error") || hash.get("error")) return showInvalid();

    const { data } = await client.auth.getSession();
    if (data.session) showForm();
    else showInvalid();
  }, 900);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      message.textContent = "As duas senhas precisam ser iguais.";
      message.className = "form-message error";
      return;
    }

    saveButton.disabled = true;
    saveButton.querySelector("span").textContent = "Salvando...";

    const { error } = await client.auth.updateUser({ password: newPassword.value });

    if (error) {
      message.textContent = "Não foi possível salvar. Solicite outro link.";
      message.className = "form-message error";
      saveButton.disabled = false;
      saveButton.querySelector("span").textContent = "Salvar nova senha";
      return;
    }

    message.textContent = "Senha alterada com sucesso. Abrindo o painel...";
    message.className = "form-message success";
    setTimeout(() => location.replace("./dashboard.html"), 1200);
  });
})();