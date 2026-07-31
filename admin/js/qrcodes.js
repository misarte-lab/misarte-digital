(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("id");
  const $ = (s) => document.querySelector(s);
  const el = {
    loader: $("#pageLoader"), app: $("#dashboardApp"), email: $("#userEmail"),
    logout: $("#logoutButton"), menu: $("#menuButton"), sidebar: $(".sidebar"),
    name: $("#clientName"), back: $("#backToClient"), identity: $("#identityTab"),
    appearance: $("#appearanceTab"), catalogs: $("#catalogsTab"), form: $("#qrForm"),
    qrName: $("#qrName"), qrUrl: $("#qrUrl"), preview: $("#qrPreview"),
    title: $("#previewTitle"), download: $("#downloadButton"), message: $("#formMessage"),
    toast: $("#toast")
  };

  const slug = (value) => String(value || "qrcode").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "qrcode";

  const setMessage = (message = "", type = "") => {
    el.message.textContent = message;
    el.message.className = `form-message ${type}`.trim();
  };

  const load = async () => {
    if (!clientId) return location.replace("./clientes.html");
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace("./login.html");
    el.email.textContent = sessionData.session.user.email || "Usuária autenticada";

    const { data, error } = await db.from("clientes")
      .select("id,nome,empresa,slug").eq("id", clientId).single();
    if (error || !data) throw error || new Error("Cliente não encontrado.");

    const name = data.nome || data.empresa || "Cliente";
    el.name.textContent = name;
    el.qrName.value = `QR Code - ${name}`;

   const publicSlug = String(data.slug || "").trim();

const publicUrl = slug
  ? `https://misarte.link/${publicSlug}/`
  : `https://misarte.link/publico.html?cliente=${encodeURIComponent(data.id)}`;

el.qrUrl.value = publicUrl;

    const query = `?id=${encodeURIComponent(data.id)}`;
    el.back.href = `./cliente.html${query}`;
    el.identity.href = `./cliente.html${query}`;
    el.appearance.href = `./aparencia.html${query}`;
    el.catalogs.href = `./catalogos.html${query}`;

    el.loader.hidden = true;
    el.app.hidden = false;
  };

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = el.qrName.value.trim();
    const url = el.qrUrl.value.trim();
    try { new URL(url); } catch { setMessage("Digite uma URL válida.", "error"); return; }

    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=900&margin=4&ecLevel=H&dark=07140f&light=ffffff`;
    const img = new Image();
    img.alt = `QR Code ${name}`;
    img.onload = () => {
      el.preview.innerHTML = "";
      el.preview.appendChild(img);
      el.title.textContent = name;
      el.download.href = qrUrl;
      el.download.download = `${slug(name)}.png`;
      el.download.classList.remove("is-disabled");
      el.download.setAttribute("aria-disabled", "false");
      setMessage("QR Code gerado com sucesso.", "success");
    };
    img.onerror = () => setMessage("Não foi possível gerar o QR Code. Verifique a internet.", "error");
    img.src = qrUrl;
  });

  el.download.addEventListener("click", async (event) => {
    if (el.download.getAttribute("aria-disabled") === "true") {
      event.preventDefault(); return;
    }
    event.preventDefault();
    try {
      const response = await fetch(el.download.href);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href; a.download = el.download.download;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(el.download.href, "_blank", "noopener");
    }
  });

  el.menu.addEventListener("click", () => el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click", async () => {
    await db.auth.signOut(); location.replace("./login.html");
  });

  load().catch((error) => {
    console.error(error);
    el.loader.hidden = true;
    el.app.hidden = false;
    el.name.textContent = "Não foi possível abrir o cliente";
    setMessage(error?.message || "Erro ao carregar o cliente.", "error");
  });
})();