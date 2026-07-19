(() => {
  const db = window.misarteSupabase;
  const $ = (s) => document.querySelector(s);
  const state = { clients: [], filtered: [], page: 1, pageSize: 8, deletingId: null };

  const els = {
    loader: $("#pageLoader"), app: $("#dashboardApp"), sidebar: $(".sidebar"),
    menu: $("#menuButton"), logout: $("#logoutButton"), email: $("#userEmail"),
    total: $("#totalClients"), active: $("#activeClients"), featured: $("#featuredClients"),
    search: $("#searchInput"), statusFilter: $("#statusFilter"), categoryFilter: $("#categoryFilter"),
    sortFilter: $("#sortFilter"), grid: $("#clientsGrid"), listState: $("#clientsState"),
    pagination: $("#pagination"), prev: $("#prevPage"), next: $("#nextPage"), pageInfo: $("#pageInfo"),
    drawer: $("#clientDrawer"), backdrop: $("#drawerBackdrop"), form: $("#clientForm"),
    drawerTitle: $("#drawerTitle"), formMessage: $("#formMessage"), save: $("#saveButton"),
    modal: $("#confirmModal"), confirmText: $("#confirmText"), confirmDelete: $("#confirmDeleteButton"),
    toast: $("#toast")
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const notify = (message, type = "success") => {
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    els.toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { els.toast.hidden = true; }, 3200);
  };

  const normalize = (value) => String(value || "").trim().toLocaleLowerCase("pt-BR");

  const renderStats = () => {
    els.total.textContent = state.clients.length;
    els.active.textContent = state.clients.filter(c => normalize(c.status) === "ativo").length;
    els.featured.textContent = state.clients.filter(c => c.destaque === true).length;
  };

  const populateCategories = () => {
    const current = els.categoryFilter.value;
    const categories = [...new Set(state.clients.map(c => c.categoria).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b, "pt-BR"));
    els.categoryFilter.innerHTML = '<option value="">Todas</option>' +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    els.categoryFilter.value = categories.includes(current) ? current : "";
  };

  const applyFilters = () => {
    const term = normalize(els.search.value);
    const status = normalize(els.statusFilter.value);
    const category = normalize(els.categoryFilter.value);
    const sort = els.sortFilter.value;

    state.filtered = state.clients.filter(client => {
      const haystack = normalize([client.nome, client.empresa, client.cidade, client.estado, client.categoria].join(" "));
      return (!term || haystack.includes(term)) &&
        (!status || normalize(client.status) === status) &&
        (!category || normalize(client.categoria) === category);
    }).sort((a,b) => {
      if (sort === "ordem") return Number(a.ordem ?? 0) - Number(b.ordem ?? 0);
      return String(a[sort] || "").localeCompare(String(b[sort] || ""), "pt-BR");
    });

    const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;
    renderClients();
  };

  const renderClients = () => {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    const start = (state.page - 1) * state.pageSize;
    const items = state.filtered.slice(start, start + state.pageSize);

    if (!items.length) {
      els.grid.hidden = true;
      els.pagination.hidden = true;
      els.listState.hidden = false;
      els.listState.textContent = state.clients.length ? "Nenhum cliente encontrado com esses filtros." : "Nenhum cliente cadastrado.";
      return;
    }

    els.listState.hidden = true;
    els.grid.hidden = false;
    els.grid.innerHTML = items.map(client => {
      const name = client.nome || client.empresa || "Sem nome";
      const status = normalize(client.status) === "ativo" ? "Ativo" : "Inativo";
      return `<article class="client-card">
        <div class="client-card-top">
          <span class="client-initial">${escapeHtml(name.charAt(0).toUpperCase())}</span>
          <span class="status-badge ${status === "Ativo" ? "status-active" : "status-neutral"}">${status}</span>
        </div>
        <div class="client-card-body">
          <p class="client-category">${escapeHtml(client.categoria || "Sem categoria")}</p>
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(client.cidade || "Cidade não informada")}${client.estado ? ` · ${escapeHtml(client.estado)}` : ""}</p>
          <div class="client-meta"><span>Ordem ${escapeHtml(client.ordem ?? 0)}</span>${client.destaque ? "<span>★ Destaque</span>" : ""}</div>
        </div>
        <div class="client-actions">
          <button class="button button-secondary" data-action="edit" data-id="${escapeHtml(client.id)}">Editar</button>
          <button class="text-danger" data-action="delete" data-id="${escapeHtml(client.id)}">Excluir</button>
        </div>
      </article>`;
    }).join("");

    els.pagination.hidden = state.filtered.length <= state.pageSize;
    els.pageInfo.textContent = `Página ${state.page} de ${totalPages}`;
    els.prev.disabled = state.page <= 1;
    els.next.disabled = state.page >= totalPages;
  };

  const loadClients = async () => {
    els.listState.hidden = false;
    els.listState.textContent = "Carregando clientes...";
    const { data, error } = await db.from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,status,destaque,ordem")
      .order("ordem", { ascending: true });

    if (error) {
      console.error(error);
      els.listState.textContent = "Não foi possível carregar os clientes.";
      notify("Erro ao carregar clientes.", "error");
      return;
    }
    state.clients = data || [];
    renderStats();
    populateCategories();
    applyFilters();
  };

  const openDrawer = (client = null) => {
    els.form.reset();
    $("#clientId").value = client?.id || "";
    $("#nome").value = client?.nome || "";
    $("#empresa").value = client?.empresa || "";
    $("#categoria").value = client?.categoria || "";
    $("#status").value = normalize(client?.status) === "inativo" ? "inativo" : "ativo";
    $("#cidade").value = client?.cidade || "";
    $("#estado").value = client?.estado || "";
    $("#ordem").value = client?.ordem ?? 0;
    $("#destaque").checked = client?.destaque === true;
    els.drawerTitle.textContent = client ? "Editar cliente" : "Novo cliente";
    els.save.textContent = client ? "Salvar alterações" : "Salvar cliente";
    els.formMessage.textContent = "";
    els.backdrop.hidden = false;
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#nome").focus(), 120);
  };

  const closeDrawer = () => {
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    els.backdrop.hidden = true;
  };

  const saveClient = async (event) => {
    event.preventDefault();
    if (!els.form.checkValidity()) return els.form.reportValidity();

    const id = $("#clientId").value;
    const payload = {
      nome: $("#nome").value.trim(),
      empresa: $("#empresa").value.trim() || null,
      categoria: $("#categoria").value.trim() || null,
      cidade: $("#cidade").value.trim() || null,
      estado: $("#estado").value.trim().toUpperCase() || null,
      status: $("#status").value,
      destaque: $("#destaque").checked,
      ordem: Number($("#ordem").value || 0)
    };

    els.save.disabled = true;
    els.save.textContent = id ? "Salvando..." : "Cadastrando...";
    const query = id
      ? db.from("clientes").update(payload).eq("id", id)
      : db.from("clientes").insert(payload);
    const { error } = await query;

    els.save.disabled = false;
    els.save.textContent = id ? "Salvar alterações" : "Salvar cliente";

    if (error) {
      console.error(error);
      els.formMessage.textContent = "Não foi possível salvar. Verifique as permissões e os campos.";
      els.formMessage.className = "form-message error";
      return;
    }

    closeDrawer();
    notify(id ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
    await loadClients();
  };

  const askDelete = (id) => {
    const client = state.clients.find(c => String(c.id) === String(id));
    state.deletingId = id;
    els.confirmText.textContent = `Você está prestes a excluir “${client?.nome || client?.empresa || "este cliente"}”.`;
    els.modal.hidden = false;
  };

  const deleteClient = async () => {
    if (!state.deletingId) return;
    els.confirmDelete.disabled = true;
    els.confirmDelete.textContent = "Excluindo...";
    const { error } = await db.from("clientes").delete().eq("id", state.deletingId);
    els.confirmDelete.disabled = false;
    els.confirmDelete.textContent = "Excluir";
    if (error) {
      console.error(error);
      notify("Não foi possível excluir o cliente.", "error");
      return;
    }
    els.modal.hidden = true;
    state.deletingId = null;
    notify("Cliente excluído.");
    await loadClients();
  };

  const protect = async () => {
    const { data, error } = await db.auth.getSession();
    if (error || !data.session) return window.location.replace("./login.html");
    els.email.textContent = data.session.user.email || "Usuária autenticada";
    els.loader.hidden = true;
    els.app.hidden = false;
    await loadClients();
  };

  $("#newClientButton").addEventListener("click", () => openDrawer());
  $("#closeDrawerButton").addEventListener("click", closeDrawer);
  $("#cancelButton").addEventListener("click", closeDrawer);
  els.backdrop.addEventListener("click", closeDrawer);
  els.form.addEventListener("submit", saveClient);
  [els.search, els.statusFilter, els.categoryFilter, els.sortFilter].forEach(el => el.addEventListener("input", () => { state.page = 1; applyFilters(); }));
  els.prev.addEventListener("click", () => { if (state.page > 1) { state.page--; renderClients(); } });
  els.next.addEventListener("click", () => { if (state.page < Math.ceil(state.filtered.length/state.pageSize)) { state.page++; renderClients(); } });
  els.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const client = state.clients.find(c => String(c.id) === String(button.dataset.id));
    if (button.dataset.action === "edit") openDrawer(client);
    if (button.dataset.action === "delete") askDelete(button.dataset.id);
  });
  $("#cancelDeleteButton").addEventListener("click", () => { els.modal.hidden = true; state.deletingId = null; });
  els.confirmDelete.addEventListener("click", deleteClient);
  els.menu.addEventListener("click", () => els.sidebar.classList.toggle("is-open"));
  els.logout.addEventListener("click", async () => { await db.auth.signOut(); window.location.replace("./login.html"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeDrawer(); els.modal.hidden = true; } });
  db.auth.onAuthStateChange((event, session) => { if (event === "SIGNED_OUT" || !session) window.location.replace("./login.html"); });
  protect().catch(() => window.location.replace("./login.html"));
})();