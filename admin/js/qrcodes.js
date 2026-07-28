(() => {
  const db = window.misarteSupabase;
  const el = {
    loader: document.querySelector("#pageLoader"),
    app: document.querySelector("#dashboardApp"),
    email: document.querySelector("#userEmail"),
    logout: document.querySelector("#logoutButton"),
    menu: document.querySelector("#menuButton"),
    sidebar: document.querySelector(".sidebar"),
    total: document.querySelector("#qrTotal"),
    active: document.querySelector("#qrActive"),
    archived: document.querySelector("#qrArchived"),
    search: document.querySelector("#searchInput"),
    statusFilter: document.querySelector("#statusFilter"),
    typeFilter: document.querySelector("#typeFilter"),
    state: document.querySelector("#qrState"),
    grid: document.querySelector("#qrGrid"),
    newButton: document.querySelector("#newQrButton"),
    drawer: document.querySelector("#qrDrawer"),
    backdrop: document.querySelector("#drawerBackdrop"),
    closeDrawer: document.querySelector("#closeDrawerButton"),
    cancel: document.querySelector("#cancelButton"),
    form: document.querySelector("#qrForm"),
    id: document.querySelector("#qrId"),
    name: document.querySelector("#qrName"),
    client: document.querySelector("#qrClient"),
    type: document.querySelector("#qrType"),
    status: document.querySelector("#qrStatus"),
    url: document.querySelector("#qrUrl"),
    notes: document.querySelector("#qrNotes"),
    drawerTitle: document.querySelector("#drawerTitle"),
    formMessage: document.querySelector("#formMessage"),
    save: document.querySelector("#saveButton"),
    previewModal: document.querySelector("#previewModal"),
    closePreview: document.querySelector("#closePreviewButton"),
    previewTitle: document.querySelector("#previewTitle"),
    previewMeta: document.querySelector("#previewMeta"),
    previewCanvas: document.querySelector("#previewCanvas"),
    previewUrl: document.querySelector("#previewUrl"),
    downloadPreview: document.querySelector("#downloadPreviewButton"),
    toast: document.querySelector("#toast")
  };

  let qrs = [];
  let clients = [];
  let previewItem = null;

  const normalize = (value) =>
    String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const escapeHtml = (value) =>
    String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const typeLabel = (value) => ({
    cardapio: "Cardápio", instagram: "Instagram", whatsapp: "WhatsApp",
    site: "Site", google_maps: "Google Maps", personalizado: "Personalizado"
  }[value] || "Personalizado");

  const statusLabel = (value) => ({
    ativo: "Ativo", inativo: "Inativo", arquivado: "Arquivado"
  }[value] || "Inativo");

  const clientName = (item) =>
    item.clientes?.nome || item.clientes?.empresa ||
    clients.find(client => String(client.id) === String(item.cliente_id))?.nome || "Cliente";

  const dateLabel = (value) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  };

  const showToast = (message, type = "success") => {
    el.toast.textContent = message;
    el.toast.className = `toast ${type}`;
    el.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.toast.hidden = true, 3200);
  };

  const setFormMessage = (message = "", type = "") => {
    el.formMessage.textContent = message;
    el.formMessage.className = `form-message ${type}`.trim();
  };

  const makeCode = () => {
    const now = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 90 + 10);
    return `QR-${now}${random}`;
  };

  const drawQr = (container, url, size = 160) => {
    container.innerHTML = "";
    new QRCode(container, {
      text: url,
      width: size,
      height: size,
      colorDark: "#07140f",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  };

  const downloadQr = (item) => {
    const temp = document.createElement("div");
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    drawQr(temp, item.url_destino, 1200);
    setTimeout(() => {
      const canvas = temp.querySelector("canvas");
      const image = temp.querySelector("img");
      const href = canvas ? canvas.toDataURL("image/png") : image?.src;
      if (!href) {
        temp.remove();
        showToast("Não foi possível preparar o arquivo.", "error");
        return;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = `${String(item.codigo || item.nome || "qrcode").replace(/[^a-z0-9_-]+/gi, "-")}.png`;
      link.click();
      temp.remove();
    }, 80);
  };

  const filtered = () => {
    const term = normalize(el.search.value);
    const status = el.statusFilter.value;
    const type = el.typeFilter.value;
    return qrs.filter(item => {
      const haystack = normalize([item.nome, item.codigo, item.tipo, clientName(item), item.url_destino].join(" "));
      return (!term || haystack.includes(term)) &&
        (!status || item.status === status) &&
        (!type || item.tipo === type);
    });
  };

  const render = () => {
    el.total.textContent = qrs.length;
    el.active.textContent = qrs.filter(item => item.status === "ativo").length;
    el.archived.textContent = qrs.filter(item => item.status === "arquivado").length;

    const list = filtered();
    if (!list.length) {
      el.state.textContent = qrs.length
        ? "Nenhum QR Code corresponde aos filtros."
        : "Nenhum QR Code cadastrado. Clique em “Novo QR Code” para começar.";
      el.state.hidden = false;
      el.grid.hidden = true;
      return;
    }

    el.grid.innerHTML = list.map(item => `
      <article class="qr-card">
        <div class="qr-card-top">
          <div>
            <p class="eyebrow">${escapeHtml(typeLabel(item.tipo))}</p>
            <h2>${escapeHtml(item.nome)}</h2>
            <p class="qr-code-label">${escapeHtml(item.codigo)}</p>
          </div>
          <div class="qr-mini" data-qr="${escapeHtml(item.id)}"></div>
        </div>
        <span class="status-badge ${item.status === "ativo" ? "status-active" : "status-neutral"}">${escapeHtml(statusLabel(item.status))}</span>
        <dl class="qr-details">
          <div><dt>Cliente</dt><dd>${escapeHtml(clientName(item))}</dd></div>
          <div><dt>Destino</dt><dd>${escapeHtml(item.url_destino)}</dd></div>
          <div><dt>Criado em</dt><dd>${escapeHtml(dateLabel(item.created_at))}</dd></div>
        </dl>
        <div class="qr-card-actions">
          <button class="button button-primary" type="button" data-action="preview" data-id="${escapeHtml(item.id)}">Visualizar</button>
          <button class="button button-secondary" type="button" data-action="download" data-id="${escapeHtml(item.id)}">Baixar PNG</button>
          <button class="button button-secondary" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Editar</button>
          ${item.status !== "arquivado" ? `<button class="button qr-archive" type="button" data-action="archive" data-id="${escapeHtml(item.id)}">Arquivar</button>` : ""}
        </div>
      </article>
    `).join("");

    list.forEach(item => {
      const container = el.grid.querySelector(`[data-qr="${CSS.escape(String(item.id))}"]`);
      if (container) drawQr(container, item.url_destino, 76);
    });
    el.state.hidden = true;
    el.grid.hidden = false;
  };

  const loadClients = async () => {
    const { data, error } = await db.from("clientes")
      .select("id,nome,empresa,status")
      .order("nome", { ascending: true });
    if (error) throw error;
    clients = data || [];
    el.client.innerHTML = '<option value="">Selecione um cliente</option>' +
      clients.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.nome || item.empresa || "Cliente")}</option>`).join("");
  };

  const loadQrs = async () => {
    el.state.hidden = false;
    el.state.textContent = "Carregando QR Codes...";
    el.grid.hidden = true;
    const { data, error } = await db.from("qrcodes")
      .select("id,cliente_id,codigo,nome,tipo,url_destino,status,observacoes,created_at,updated_at,clientes(nome,empresa)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      el.state.textContent = "Não foi possível carregar os QR Codes. Execute o SQL da Sprint 2.3.1 no Supabase.";
      showToast(error.message || "Erro ao carregar QR Codes.", "error");
      return;
    }
    qrs = data || [];
    render();
  };

  const openDrawer = (item = null) => {
    el.form.reset();
    el.id.value = item?.id || "";
    el.name.value = item?.nome || "";
    el.client.value = item?.cliente_id || "";
    el.type.value = item?.tipo || "cardapio";
    el.status.value = item?.status === "inativo" ? "inativo" : "ativo";
    el.url.value = item?.url_destino || "";
    el.notes.value = item?.observacoes || "";
    el.drawerTitle.textContent = item ? "Editar QR Code" : "Novo QR Code";
    el.save.textContent = item ? "Salvar alterações" : "Gerar QR Code";
    setFormMessage();
    el.backdrop.hidden = false;
    el.drawer.classList.add("is-open");
    el.drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    setTimeout(() => el.name.focus(), 120);
  };

  const closeDrawer = () => {
    el.drawer.classList.remove("is-open");
    el.drawer.setAttribute("aria-hidden", "true");
    el.backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
    setFormMessage();
  };

  const saveQr = async (event) => {
    event.preventDefault();
    if (!el.form.checkValidity()) {
      el.form.reportValidity();
      return;
    }
    try {
      new URL(el.url.value);
    } catch {
      setFormMessage("Informe uma URL completa e válida.", "error");
      return;
    }

    el.save.disabled = true;
    el.save.textContent = "Salvando...";
    const payload = {
      cliente_id: el.client.value,
      nome: el.name.value.trim(),
      tipo: el.type.value,
      url_destino: el.url.value.trim(),
      status: el.status.value,
      observacoes: el.notes.value.trim() || null
    };
    const id = el.id.value;
    if (!id) payload.codigo = makeCode();

    const query = id
      ? db.from("qrcodes").update(payload).eq("id", id)
      : db.from("qrcodes").insert(payload);
    const { error } = await query;

    el.save.disabled = false;
    el.save.textContent = id ? "Salvar alterações" : "Gerar QR Code";
    if (error) {
      console.error(error);
      setFormMessage(error.message || "Não foi possível salvar.", "error");
      return;
    }
    closeDrawer();
    await loadQrs();
    showToast(id ? "QR Code atualizado." : "QR Code gerado com sucesso.");
  };

  const openPreview = (item) => {
    previewItem = item;
    el.previewTitle.textContent = item.nome;
    el.previewMeta.textContent = `${item.codigo} · ${clientName(item)}`;
    el.previewUrl.textContent = item.url_destino;
    drawQr(el.previewCanvas, item.url_destino, 228);
    el.previewModal.hidden = false;
  };

  const closePreview = () => {
    previewItem = null;
    el.previewModal.hidden = true;
  };

  const archiveQr = async (item) => {
    if (!confirm(`Arquivar “${item.nome}”?`)) return;
    const { error } = await db.from("qrcodes").update({ status: "arquivado" }).eq("id", item.id);
    if (error) {
      showToast(error.message || "Não foi possível arquivar.", "error");
      return;
    }
    await loadQrs();
    showToast("QR Code arquivado.");
  };

  const start = async () => {
    const { data } = await db.auth.getSession();
    if (!data.session) {
      location.replace("./login.html");
      return;
    }
    el.email.textContent = data.session.user.email || "Usuária autenticada";
    await loadClients();
    el.loader.hidden = true;
    el.app.hidden = false;
    await loadQrs();
  };

  el.newButton.addEventListener("click", () => openDrawer());
  el.closeDrawer.addEventListener("click", closeDrawer);
  el.cancel.addEventListener("click", closeDrawer);
  el.backdrop.addEventListener("click", closeDrawer);
  el.form.addEventListener("submit", saveQr);
  [el.search, el.statusFilter, el.typeFilter].forEach(control =>
    control.addEventListener(control === el.search ? "input" : "change", render));

  el.grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = qrs.find(qr => String(qr.id) === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "preview") openPreview(item);
    if (button.dataset.action === "download") downloadQr(item);
    if (button.dataset.action === "edit") openDrawer(item);
    if (button.dataset.action === "archive") archiveQr(item);
  });

  el.closePreview.addEventListener("click", closePreview);
  el.previewModal.addEventListener("click", event => {
    if (event.target === el.previewModal) closePreview();
  });
  el.downloadPreview.addEventListener("click", () => previewItem && downloadQr(previewItem));
  el.menu.addEventListener("click", () => el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click", async () => {
    await db.auth.signOut();
    location.replace("./login.html");
  });

  start().catch(error => {
    console.error(error);
    el.loader.hidden = true;
    showToast(error.message || "Erro ao iniciar a página.", "error");
  });
})();
