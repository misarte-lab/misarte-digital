(() => {
  const db = window.misarteSupabase;
  const params = new URLSearchParams(location.search);
  const clientId = params.get("id");

  const el = {
    loader: document.querySelector("#pageLoader"),
    app: document.querySelector("#dashboardApp"),
    email: document.querySelector("#userEmail"),
    logout: document.querySelector("#logoutButton"),
    menu: document.querySelector("#menuButton"),
    sidebar: document.querySelector(".sidebar"),
    clientName: document.querySelector("#clientName"),
    back: document.querySelector("#backToClient"),
    identityTab: document.querySelector("#identityTab"),
    appearanceTab: document.querySelector("#appearanceTab"),
    catalogsTab: document.querySelector("#catalogsTab"),
    form: document.querySelector("#qrForm"),
    name: document.querySelector("#qrName"),
    url: document.querySelector("#qrUrl"),
    preview: document.querySelector("#qrPreview"),
    previewTitle: document.querySelector("#previewTitle"),
    download: document.querySelector("#downloadButton"),
    save: document.querySelector("#saveQrButton"),
    message: document.querySelector("#formMessage"),
    library: document.querySelector("#qrLibrary"),
    libraryState: document.querySelector("#libraryState"),
    count: document.querySelector("#qrCount"),
    toast: document.querySelector("#toast")
  };

  let currentQr = null;
  let savedItems = [];

  const storageKey = () => `misarte_qrcodes_${clientId || "sem-cliente"}`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const slugify = (value) =>
    String(value || "qrcode")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "qrcode";

  const showToast = (message, type = "success") => {
    el.toast.textContent = message;
    el.toast.className = `toast ${type}`;
    el.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { el.toast.hidden = true; }, 3000);
  };

  const setMessage = (message = "", type = "") => {
    el.message.textContent = message;
    el.message.className = `form-message ${type}`.trim();
  };

  const publicUrlFor = (id) => {
    const url = new URL("../publico.html", window.location.href);
    url.searchParams.set("cliente", id);
    return url.href;
  };

  const canvasFromPreview = () => el.preview.querySelector("canvas");
  const imageFromPreview = () => el.preview.querySelector("img");

  const qrDataUrl = () => {
    const canvas = canvasFromPreview();
    if (canvas) return canvas.toDataURL("image/png");
    const image = imageFromPreview();
    return image?.src || "";
  };

  const createQr = (name, url) => {
    if (typeof QRCode === "undefined") {
      setMessage("Não foi possível carregar o gerador. Verifique a internet e atualize a página.", "error");
      return false;
    }

    el.preview.innerHTML = "";
    new QRCode(el.preview, {
      text: url,
      width: 280,
      height: 280,
      colorDark: "#07140f",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    currentQr = { name, url };
    el.previewTitle.textContent = name;
    el.download.disabled = false;
    el.save.disabled = false;
    setMessage("QR Code gerado com sucesso.", "success");
    return true;
  };

  const downloadDataUrl = (dataUrl, name) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${slugify(name)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadCurrent = () => {
    if (!currentQr) return;
    const dataUrl = qrDataUrl();
    if (!dataUrl) {
      showToast("Não foi possível preparar o PNG.", "error");
      return;
    }
    downloadDataUrl(dataUrl, currentQr.name);
  };

  const loadSaved = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey()) || "[]");
      savedItems = Array.isArray(value) ? value : [];
    } catch {
      savedItems = [];
    }
  };

  const persistSaved = () => {
    localStorage.setItem(storageKey(), JSON.stringify(savedItems));
  };

  const renderLibrary = () => {
    el.count.textContent = `${savedItems.length} ${savedItems.length === 1 ? "salvo" : "salvos"}`;

    if (!savedItems.length) {
      el.library.hidden = true;
      el.libraryState.hidden = false;
      el.libraryState.textContent = "Nenhum QR Code salvo para este cliente.";
      return;
    }

    el.library.innerHTML = savedItems.map((item) => `
      <article class="qr-library-card" data-id="${escapeHtml(item.id)}">
        <div class="qr-library-image">
          <img src="${escapeHtml(item.dataUrl)}" alt="QR Code ${escapeHtml(item.name)}">
        </div>
        <div class="qr-library-content">
          <p class="eyebrow">QR CODE</p>
          <h3>${escapeHtml(item.name)}</h3>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a>
          <small>Salvo em ${escapeHtml(item.createdAt)}</small>
          <div class="qr-card-actions">
            <button class="button button-secondary button-small" type="button" data-action="download">Baixar</button>
            <button class="button button-text-danger button-small" type="button" data-action="delete">Remover</button>
          </div>
        </div>
      </article>
    `).join("");

    el.libraryState.hidden = true;
    el.library.hidden = false;
  };

  const saveCurrent = () => {
    if (!currentQr) return;

    const dataUrl = qrDataUrl();
    if (!dataUrl) {
      showToast("Gere novamente o QR Code antes de salvar.", "error");
      return;
    }

    savedItems.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: currentQr.name,
      url: currentQr.url,
      dataUrl,
      createdAt: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date())
    });

    persistSaved();
    renderLibrary();
    showToast("QR Code salvo na biblioteca.");
  };

  const loadClient = async () => {
    if (!clientId) {
      el.clientName.textContent = "Cliente não identificado";
      el.url.value = new URL("../publico.html", window.location.href).href;
      el.back.href = "./clientes.html";
      return;
    }

    const { data, error } = await db
      .from("clientes")
      .select("id,nome,empresa")
      .eq("id", clientId)
      .single();

    if (error || !data) {
      el.clientName.textContent = "Cliente não encontrado";
      setMessage("Não foi possível carregar os dados do cliente.", "error");
      return;
    }

    const name = data.nome || data.empresa || "Cliente";
    el.clientName.textContent = name;
    el.name.value = `QR Code — ${name}`;
    el.url.value = publicUrlFor(data.id);

    const query = `?id=${encodeURIComponent(data.id)}`;
    el.back.href = `./cliente.html${query}`;
    el.identityTab.href = `./cliente.html${query}`;
    el.appearanceTab.href = `./aparencia.html${query}`;
    el.catalogsTab.href = `./catalogos.html${query}`;
  };

  const protectPage = async () => {
    const { data, error } = await db.auth.getSession();

    if (error || !data.session) {
      window.location.replace("./login.html");
      return;
    }

    el.email.textContent = data.session.user.email || "Usuária autenticada";
    await loadClient();
    loadSaved();
    renderLibrary();
    el.loader.hidden = true;
    el.app.hidden = false;
  };

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    setMessage();

    const name = el.name.value.trim();
    const url = el.url.value.trim();

    if (!name || !url) {
      setMessage("Preencha o nome e a URL.", "error");
      return;
    }

    try {
      new URL(url);
    } catch {
      setMessage("Digite uma URL válida, começando com https://", "error");
      return;
    }

    createQr(name, url);
  });

  el.download.addEventListener("click", downloadCurrent);
  el.save.addEventListener("click", saveCurrent);

  el.library.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const card = event.target.closest("[data-id]");
    if (!button || !card) return;

    const item = savedItems.find((entry) => entry.id === card.dataset.id);
    if (!item) return;

    if (button.dataset.action === "download") {
      downloadDataUrl(item.dataUrl, item.name);
      return;
    }

    if (button.dataset.action === "delete") {
      savedItems = savedItems.filter((entry) => entry.id !== item.id);
      persistSaved();
      renderLibrary();
      showToast("QR Code removido.");
    }
  });

  el.logout.addEventListener("click", async () => {
    el.logout.disabled = true;
    await db.auth.signOut();
    window.location.replace("./login.html");
  });

  el.menu.addEventListener("click", () => el.sidebar.classList.toggle("is-open"));

  db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) window.location.replace("./login.html");
  });

  protectPage().catch((error) => {
    console.error(error);
    window.location.replace("./login.html");
  });
})();
