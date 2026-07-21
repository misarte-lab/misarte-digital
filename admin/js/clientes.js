(() => {
  const client = window.misarteSupabase;
  const PAGE_SIZE = 8;

  const elements = {
    loader: document.querySelector("#pageLoader"),
    app: document.querySelector("#dashboardApp"),
    logout: document.querySelector("#logoutButton"),
    userEmail: document.querySelector("#userEmail"),
    menu: document.querySelector("#menuButton"),
    sidebar: document.querySelector(".sidebar"),
    newButton: document.querySelector("#newClientButton"),
    state: document.querySelector("#clientsState"),
    grid: document.querySelector("#clientsGrid"),
    total: document.querySelector("#clientTotal"),
    active: document.querySelector("#clientActive"),
    featured: document.querySelector("#clientFeatured"),
    search: document.querySelector("#searchInput"),
    statusFilter: document.querySelector("#statusFilter"),
    categoryFilter: document.querySelector("#categoryFilter"),
    sortFilter: document.querySelector("#sortFilter"),
    pagination: document.querySelector("#pagination"),
    prev: document.querySelector("#prevPage"),
    next: document.querySelector("#nextPage"),
    pageInfo: document.querySelector("#pageInfo"),
    drawer: document.querySelector("#clientDrawer"),
    backdrop: document.querySelector("#drawerBackdrop"),
    closeDrawer: document.querySelector("#closeDrawerButton"),
    cancel: document.querySelector("#cancelButton"),
    form: document.querySelector("#clientForm"),
    id: document.querySelector("#clientId"),
    nome: document.querySelector("#nome"),
    empresa: document.querySelector("#empresa"),
    categoria: document.querySelector("#categoria"),
    cidade: document.querySelector("#cidade"),
    estado: document.querySelector("#estado"),
    status: document.querySelector("#status"),
    destaque: document.querySelector("#destaque"),
    ordem: document.querySelector("#ordem"),
    title: document.querySelector("#drawerTitle"),
    formMessage: document.querySelector("#formMessage"),
    save: document.querySelector("#saveButton"),
    confirmModal: document.querySelector("#confirmModal"),
    confirmText: document.querySelector("#confirmText"),
    cancelDelete: document.querySelector("#cancelDeleteButton"),
    confirmDelete: document.querySelector("#confirmDeleteButton"),
    toast: document.querySelector("#toast")
  };

  let clients = [];
  let currentPage = 1;
  let deleteTarget = null;

  const normalize = (value) =>
    String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const showToast = (message, type = "success") => {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3200);
  };

  const setFormMessage = (message = "", type = "") => {
    elements.formMessage.textContent = message;
    elements.formMessage.className = `form-message ${type}`.trim();
  };

  const getFilteredClients = () => {
    const term = normalize(elements.search.value);
    const status = normalize(elements.statusFilter.value);
    const category = normalize(elements.categoryFilter.value);
    const sort = elements.sortFilter.value;

    const filtered = clients.filter((item) => {
      const haystack = normalize([
        item.nome, item.empresa, item.categoria, item.cidade, item.estado
      ].join(" "));
      const matchesTerm = !term || haystack.includes(term);
      const matchesStatus = !status || normalize(item.status) === status;
      const matchesCategory = !category || normalize(item.categoria) === category;
      return matchesTerm && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      if (sort === "nome") return String(a.nome || a.empresa || "").localeCompare(String(b.nome || b.empresa || ""), "pt-BR");
      if (sort === "cidade") return String(a.cidade || "").localeCompare(String(b.cidade || ""), "pt-BR");
      return Number(a.ordem ?? 0) - Number(b.ordem ?? 0);
    });
  };

  const updateCategories = () => {
    const current = elements.categoryFilter.value;
    const categories = [...new Set(clients.map((item) => item.categoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    elements.categoryFilter.innerHTML =
      '<option value="">Todas</option>' +
      categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    elements.categoryFilter.value = categories.includes(current) ? current : "";
  };

  const render = () => {
    elements.total.textContent = clients.length;
    elements.active.textContent = clients.filter((item) => normalize(item.status) === "ativo").length;
    elements.featured.textContent = clients.filter((item) => item.destaque === true).length;

    const filtered = getFilteredClients();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    if (!pageItems.length) {
      elements.state.textContent = clients.length
        ? "Nenhum cliente corresponde aos filtros."
        : "Nenhum cliente cadastrado. Clique em “Novo cliente” para começar.";
      elements.state.hidden = false;
      elements.grid.hidden = true;
      elements.pagination.hidden = true;
      return;
    }

    elements.grid.innerHTML = pageItems.map((item) => {
      const name = item.nome || item.empresa || "Sem nome";
      const location = [item.cidade, item.estado].filter(Boolean).join(" · ") || "Local não informado";
      const active = normalize(item.status) === "ativo";
      return `
        <article class="client-card">
          <div class="client-card-top">
            <span class="client-initial">${escapeHtml(name.charAt(0).toUpperCase())}</span>
            <div class="client-card-title">
              <h3>${escapeHtml(name)}</h3>
              <p>${escapeHtml(location)}</p>
            </div>
            <span class="status-badge ${active ? "status-active" : "status-neutral"}">
              ${active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <dl class="client-meta">
            <div><dt>Categoria</dt><dd>${escapeHtml(item.categoria || "—")}</dd></div>
            <div><dt>Ordem</dt><dd>${escapeHtml(item.ordem ?? "—")}</dd></div>
            <div><dt>Destaque</dt><dd>${item.destaque === true ? "Sim" : "Não"}</dd></div>
          </dl>
          <div class="client-actions">
            <a class="button button-primary" href="./cliente.html?id=${escapeHtml(item.id)}">Abrir</a>
            <a class="button button-secondary" href="./aparencia.html?id=${escapeHtml(item.id)}">Aparência</a>
            <a class="button button-secondary" href="../publico.html?cliente=${escapeHtml(item.id)}" target="_blank" rel="noopener">Ver página pública</a>
            <button class="button button-secondary" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Editar</button>
            <button class="button button-text-danger" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">Excluir</button>
          </div>
        </article>`;
    }).join("");

    elements.state.hidden = true;
    elements.grid.hidden = false;
    elements.pagination.hidden = filtered.length <= PAGE_SIZE;
    elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    elements.prev.disabled = currentPage === 1;
    elements.next.disabled = currentPage === totalPages;
  };

  const loadClients = async () => {
    elements.state.hidden = false;
    elements.state.textContent = "Carregando clientes...";
    elements.grid.hidden = true;

    const { data, error } = await client
      .from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,status,destaque,ordem,logo_url,capa_url")
      .order("ordem", { ascending: true });

    if (error) {
      console.error(error);
      elements.state.textContent = "Não foi possível carregar os clientes.";
      showToast("Erro ao carregar os clientes.", "error");
      return;
    }

    clients = data || [];
    updateCategories();
    render();
  };

  const openDrawer = (item = null) => {
    elements.form.reset();
    elements.id.value = item?.id || "";
    elements.nome.value = item?.nome || "";
    elements.empresa.value = item?.empresa || "";
    elements.categoria.value = item?.categoria || "";
    elements.cidade.value = item?.cidade || "";
    elements.estado.value = item?.estado || "";
    elements.status.value = normalize(item?.status) === "inativo" ? "inativo" : "ativo";
    elements.destaque.checked = item?.destaque === true;
    elements.ordem.value = item?.ordem ?? 0;
    elements.title.textContent = item ? "Editar cliente" : "Novo cliente";
    elements.save.textContent = item ? "Salvar alterações" : "Salvar cliente";
    setFormMessage();

    elements.backdrop.hidden = false;
    elements.drawer.classList.add("is-open");
    elements.drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    setTimeout(() => elements.nome.focus(), 150);
  };

  const closeDrawer = () => {
    elements.drawer.classList.remove("is-open");
    elements.drawer.setAttribute("aria-hidden", "true");
    elements.backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
    setFormMessage();
  };

  const saveClient = async (event) => {
    event.preventDefault();
    if (!elements.form.checkValidity()) {
      elements.form.reportValidity();
      return;
    }

    elements.save.disabled = true;
    elements.save.textContent = "Salvando...";
    setFormMessage();

    const payload = {
      nome: elements.nome.value.trim(),
      empresa: elements.empresa.value.trim() || null,
      categoria: elements.categoria.value.trim() || null,
      cidade: elements.cidade.value.trim() || null,
      estado: elements.estado.value.trim().toUpperCase() || null,
      status: elements.status.value,
      destaque: elements.destaque.checked,
      ordem: Number(elements.ordem.value || 0)
    };

    const id = elements.id.value;
    const query = id
      ? client.from("clientes").update(payload).eq("id", id)
      : client.from("clientes").insert(payload);

    const { error } = await query;

    elements.save.disabled = false;
    elements.save.textContent = id ? "Salvar alterações" : "Salvar cliente";

    if (error) {
      console.error(error);
      setFormMessage(`Não foi possível salvar: ${error.message}`, "error");
      return;
    }

    closeDrawer();
    await loadClients();
    showToast(id ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
  };

  const openDeleteModal = (item) => {
    deleteTarget = item;
    elements.confirmText.textContent = `Você está prestes a excluir “${item.nome || item.empresa || "este cliente"}”.`;
    elements.confirmModal.hidden = false;
  };

  const closeDeleteModal = () => {
    deleteTarget = null;
    elements.confirmModal.hidden = true;
    elements.confirmDelete.disabled = false;
    elements.confirmDelete.textContent = "Excluir";
  };

  const deleteClient = async () => {
    if (!deleteTarget) return;
    elements.confirmDelete.disabled = true;
    elements.confirmDelete.textContent = "Excluindo...";

    const { error } = await client.from("clientes").delete().eq("id", deleteTarget.id);

    if (error) {
      console.error(error);
      closeDeleteModal();
      showToast(`Não foi possível excluir: ${error.message}`, "error");
      return;
    }

    closeDeleteModal();
    await loadClients();
    showToast("Cliente excluído com sucesso.");
  };

  const protectPage = async () => {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      window.location.replace("./login.html");
      return;
    }

    elements.userEmail.textContent = data.session.user.email || "Usuária autenticada";
    elements.loader.hidden = true;
    elements.app.hidden = false;
    await loadClients();

    if (new URLSearchParams(window.location.search).get("novo") === "1") openDrawer();
  };

  elements.newButton.addEventListener("click", () => openDrawer());
  elements.closeDrawer.addEventListener("click", closeDrawer);
  elements.cancel.addEventListener("click", closeDrawer);
  elements.backdrop.addEventListener("click", closeDrawer);
  elements.form.addEventListener("submit", saveClient);

  [elements.search, elements.statusFilter, elements.categoryFilter, elements.sortFilter].forEach((control) => {
    control.addEventListener(control === elements.search ? "input" : "change", () => {
      currentPage = 1;
      render();
    });
  });

  elements.grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = clients.find((clientItem) => String(clientItem.id) === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "edit") openDrawer(item);
    if (button.dataset.action === "delete") openDeleteModal(item);
  });

  elements.prev.addEventListener("click", () => { currentPage -= 1; render(); });
  elements.next.addEventListener("click", () => { currentPage += 1; render(); });
  elements.cancelDelete.addEventListener("click", closeDeleteModal);
  elements.confirmDelete.addEventListener("click", deleteClient);

  elements.menu.addEventListener("click", () => elements.sidebar.classList.toggle("is-open"));
  elements.logout.addEventListener("click", async () => {
    elements.logout.disabled = true;
    elements.logout.textContent = "Saindo...";
    await client.auth.signOut();
    window.location.replace("./login.html");
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) window.location.replace("./login.html");
  });

  protectPage().catch((error) => {
    console.error(error);
    window.location.replace("./login.html");
  });
})();