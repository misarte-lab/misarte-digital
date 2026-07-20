(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("id");

  const el = {
    loader: document.querySelector("#pageLoader"),
    app: document.querySelector("#dashboardApp"),
    email: document.querySelector("#userEmail"),
    logout: document.querySelector("#logoutButton"),
    menu: document.querySelector("#menuButton"),
    sidebar: document.querySelector(".sidebar"),
    name: document.querySelector("#clientName"),
    meta: document.querySelector("#clientMeta"),
    back: document.querySelector("#backToClient"),
    identityTab: document.querySelector("#identityTab"),
    total: document.querySelector("#catalogTotal"),
    published: document.querySelector("#catalogPublished"),
    drafts: document.querySelector("#catalogDrafts"),
    search: document.querySelector("#searchInput"),
    statusFilter: document.querySelector("#statusFilter"),
    sortFilter: document.querySelector("#sortFilter"),
    state: document.querySelector("#catalogState"),
    grid: document.querySelector("#catalogGrid"),
    newButton: document.querySelector("#newCatalogButton"),
    drawer: document.querySelector("#catalogDrawer"),
    backdrop: document.querySelector("#drawerBackdrop"),
    closeDrawer: document.querySelector("#closeDrawerButton"),
    cancel: document.querySelector("#cancelButton"),
    form: document.querySelector("#catalogForm"),
    id: document.querySelector("#catalogId"),
    catalogName: document.querySelector("#catalogName"),
    type: document.querySelector("#catalogType"),
    status: document.querySelector("#catalogStatus"),
    order: document.querySelector("#catalogOrder"),
    featured: document.querySelector("#catalogFeatured"),
    description: document.querySelector("#catalogDescription"),
    drawerTitle: document.querySelector("#drawerTitle"),
    formMessage: document.querySelector("#formMessage"),
    save: document.querySelector("#saveButton"),
    modal: document.querySelector("#confirmModal"),
    confirmText: document.querySelector("#confirmText"),
    cancelDelete: document.querySelector("#cancelDeleteButton"),
    confirmDelete: document.querySelector("#confirmDeleteButton"),
    toast: document.querySelector("#toast")
  };

  let catalogs = [];
  let deleteTarget = null;

  const normalize = (value) =>
    String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const escapeHtml = (value) =>
    String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const typeLabel = (value) => ({
    cardapio: "Cardápio",
    cervejas: "Carta de cervejas",
    drinks: "Carta de drinks",
    vinhos: "Carta de vinhos",
    menu_executivo: "Menu executivo",
    promocoes: "Promoções",
    outro: "Outro"
  }[value] || "Catálogo");

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

  const filteredCatalogs = () => {
    const term = normalize(el.search.value);
    const status = normalize(el.statusFilter.value);
    const sort = el.sortFilter.value;

    const list = catalogs.filter((item) => {
      const text = normalize([item.nome, item.tipo, item.descricao].join(" "));
      return (!term || text.includes(term)) && (!status || normalize(item.status) === status);
    });

    return list.sort((a, b) => {
      if (sort === "nome") return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
      if (sort === "recentes") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return Number(a.ordem || 0) - Number(b.ordem || 0);
    });
  };

  const render = () => {
    el.total.textContent = catalogs.length;
    el.published.textContent = catalogs.filter(item => item.status === "publicado").length;
    el.drafts.textContent = catalogs.filter(item => item.status === "rascunho").length;

    const list = filteredCatalogs();
    if (!list.length) {
      el.state.textContent = catalogs.length
        ? "Nenhum catálogo corresponde aos filtros."
        : "Nenhum catálogo cadastrado. Clique em “Novo catálogo” para começar.";
      el.state.hidden = false;
      el.grid.hidden = true;
      return;
    }

    el.grid.innerHTML = list.map(item => `
      <article class="catalog-card">
        <div class="catalog-card-top">
          <div>
            <p class="eyebrow">${escapeHtml(typeLabel(item.tipo))}</p>
            <h2>${escapeHtml(item.nome)}</h2>
          </div>
          <span class="status-badge ${item.status === "publicado" ? "status-active" : "status-neutral"}">
            ${escapeHtml(item.status === "publicado" ? "Publicado" : item.status === "arquivado" ? "Arquivado" : "Rascunho")}
          </span>
        </div>
        <p class="catalog-description">${escapeHtml(item.descricao || "Sem descrição.")}</p>
        <div class="catalog-card-meta">
          <span>Ordem <strong>${escapeHtml(item.ordem ?? 0)}</strong></span>
          <span>Destaque <strong>${item.destaque ? "Sim" : "Não"}</strong></span>
        </div>
        <div class="client-actions">
          <a class="button button-primary" href="./categorias.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(item.id)}">Gerenciar categorias</a>
          <button class="button button-secondary" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Editar</button>
          <button class="button button-text-danger" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">Excluir</button>
        </div>
      </article>
    `).join("");

    el.state.hidden = true;
    el.grid.hidden = false;
  };

  const loadCatalogs = async () => {
    el.state.hidden = false;
    el.state.textContent = "Carregando catálogos...";
    el.grid.hidden = true;

    const { data, error } = await db
      .from("catalogos")
      .select("id,cliente_id,nome,tipo,descricao,status,destaque,ordem,created_at")
      .eq("cliente_id", clientId)
      .order("ordem", { ascending: true });

    if (error) {
      console.error(error);
      el.state.textContent = "Não foi possível carregar os catálogos. Execute primeiro o SQL da versão v1.3.0.";
      showToast(error.message || "Erro ao carregar catálogos.", "error");
      return;
    }

    catalogs = data || [];
    render();
  };

  const loadClient = async () => {
    const { data, error } = await db
      .from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado")
      .eq("id", clientId)
      .single();

    if (error) throw error;
    el.name.textContent = data.nome || data.empresa || "Cliente";
    el.meta.textContent = [data.categoria, data.cidade, data.estado].filter(Boolean).join(" · ");
  };

  const openDrawer = (item = null) => {
    el.form.reset();
    el.id.value = item?.id || "";
    el.catalogName.value = item?.nome || "";
    el.type.value = item?.tipo || "cardapio";
    el.status.value = item?.status || "rascunho";
    el.order.value = item?.ordem ?? (catalogs.length ? Math.max(...catalogs.map(c => Number(c.ordem || 0))) + 1 : 1);
    el.featured.checked = item?.destaque === true;
    el.description.value = item?.descricao || "";
    el.drawerTitle.textContent = item ? "Editar catálogo" : "Novo catálogo";
    el.save.textContent = item ? "Salvar alterações" : "Salvar catálogo";
    setFormMessage();
    el.backdrop.hidden = false;
    el.drawer.classList.add("is-open");
    el.drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    setTimeout(() => el.catalogName.focus(), 150);
  };

  const closeDrawer = () => {
    el.drawer.classList.remove("is-open");
    el.drawer.setAttribute("aria-hidden", "true");
    el.backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
    setFormMessage();
  };

  const saveCatalog = async (event) => {
    event.preventDefault();
    if (!el.form.checkValidity()) {
      el.form.reportValidity();
      return;
    }

    el.save.disabled = true;
    el.save.textContent = "Salvando...";
    const payload = {
      cliente_id: clientId,
      nome: el.catalogName.value.trim(),
      tipo: el.type.value,
      status: el.status.value,
      ordem: Number(el.order.value || 0),
      destaque: el.featured.checked,
      descricao: el.description.value.trim() || null
    };

    const id = el.id.value;
    const query = id
      ? db.from("catalogos").update(payload).eq("id", id).eq("cliente_id", clientId)
      : db.from("catalogos").insert(payload);

    const { error } = await query;
    el.save.disabled = false;
    el.save.textContent = id ? "Salvar alterações" : "Salvar catálogo";

    if (error) {
      console.error(error);
      setFormMessage(error.message || "Não foi possível salvar.", "error");
      return;
    }

    closeDrawer();
    await loadCatalogs();
    showToast(id ? "Catálogo atualizado com sucesso." : "Catálogo criado com sucesso.");
  };

  const openDelete = (item) => {
    deleteTarget = item;
    el.confirmText.textContent = `Você está prestes a excluir “${item.nome}”.`;
    el.modal.hidden = false;
  };

  const closeDelete = () => {
    deleteTarget = null;
    el.modal.hidden = true;
    el.confirmDelete.disabled = false;
    el.confirmDelete.textContent = "Excluir";
  };

  const deleteCatalog = async () => {
    if (!deleteTarget) return;
    el.confirmDelete.disabled = true;
    el.confirmDelete.textContent = "Excluindo...";

    const { error } = await db
      .from("catalogos")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("cliente_id", clientId);

    if (error) {
      console.error(error);
      closeDelete();
      showToast(error.message || "Não foi possível excluir.", "error");
      return;
    }

    closeDelete();
    await loadCatalogs();
    showToast("Catálogo excluído com sucesso.");
  };

  const start = async () => {
    if (!clientId) {
      location.replace("./clientes.html");
      return;
    }

    const { data } = await db.auth.getSession();
    if (!data.session) {
      location.replace("./login.html");
      return;
    }

    el.email.textContent = data.session.user.email || "Usuária autenticada";
    el.back.href = `./cliente.html?id=${encodeURIComponent(clientId)}`;
    el.identityTab.href = `./cliente.html?id=${encodeURIComponent(clientId)}`;

    await loadClient();
    el.loader.hidden = true;
    el.app.hidden = false;
    await loadCatalogs();
  };

  el.newButton.addEventListener("click", () => openDrawer());
  el.closeDrawer.addEventListener("click", closeDrawer);
  el.cancel.addEventListener("click", closeDrawer);
  el.backdrop.addEventListener("click", closeDrawer);
  el.form.addEventListener("submit", saveCatalog);

  [el.search, el.statusFilter, el.sortFilter].forEach(control => {
    control.addEventListener(control === el.search ? "input" : "change", render);
  });

  el.grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = catalogs.find(catalog => String(catalog.id) === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "edit") openDrawer(item);
    if (button.dataset.action === "delete") openDelete(item);
  });

  el.cancelDelete.addEventListener("click", closeDelete);
  el.confirmDelete.addEventListener("click", deleteCatalog);
  el.menu.addEventListener("click", () => el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click", async () => {
    await db.auth.signOut();
    location.replace("./login.html");
  });

  start().catch(error => {
    console.error(error);
    el.loader.hidden = true;
    el.app.hidden = false;
    el.state.textContent = error.message || "Não foi possível abrir esta área.";
  });
})();