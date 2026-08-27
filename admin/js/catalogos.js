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
    pdfInput: document.querySelector("#catalogPdf"),
    pdfBox: document.querySelector("#currentPdfBox"),
    pdfLink: document.querySelector("#currentPdfLink"),
    pdfStatus: document.querySelector("#catalogPdfStatus"),
    description: document.querySelector("#catalogDescription"),
    drawerTitle: document.querySelector("#drawerTitle"),
    formMessage: document.querySelector("#formMessage"),
    save: document.querySelector("#saveButton"),
    modal: document.querySelector("#confirmModal"),
    confirmTitle: document.querySelector("#confirmTitle"),
    confirmText: document.querySelector("#confirmText"),
    cancelDelete: document.querySelector("#cancelDeleteButton"),
    confirmDelete: document.querySelector("#confirmDeleteButton"),
    toast: document.querySelector("#toast")
  };

  let catalogs = [];
  let actionTarget = null;
  let actionMode = null;
  let clientSlug = "";
  let clientQrCatalogId = null;

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
  const formatDateTime = (value) => {
  if (!value) return "Ainda não informado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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

  const renderPdfCovers = async () => {
    if (!window.pdfjsLib) return;

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

    const canvases = el.grid.querySelectorAll("canvas[data-pdf-url]");

    await Promise.all([...canvases].map(async canvas => {
      const preview = canvas.closest(".catalog-pdf-preview");

      try {
        const pdf = await window.pdfjsLib.getDocument(canvas.dataset.pdfUrl).promise;
        const page = await pdf.getPage(1);
        const initialViewport = page.getViewport({ scale: 1 });
        const availableWidth = preview.clientWidth;
        const scale = availableWidth / initialViewport.width;
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
          transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0]
        }).promise;
      } catch (error) {
        console.error("Não foi possível gerar a capa do PDF.", error);
        preview.classList.add("catalog-pdf-empty");
        preview.innerHTML = "<span>PDF</span><p>Não foi possível carregar a capa</p>";
      }
    }));
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
  el.published.textContent =
    catalogs.filter(item => item.status === "publicado").length;
  el.drafts.textContent =
    catalogs.filter(item => item.status === "rascunho").length;

  const list = filteredCatalogs();

  if (!list.length) {
    el.state.textContent = catalogs.length
      ? "Nenhum catálogo corresponde aos filtros."
      : "Nenhum catálogo cadastrado. Clique em “Novo catálogo” para começar.";

    el.state.hidden = false;
    el.grid.hidden = true;
    return;
  }

  el.grid.innerHTML = list.map(item => {
    const pdfUrl = String(item.pdf_url || "").trim();
    const pdfName = item.pdf_nome || "PDF do catálogo";
    const pdfUpdatedAt = formatDateTime(item.pdf_atualizado_em);
    const itemPublicCatalogUrl =
      `../publico.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(item.id)}&versao=1.6.3`;
    const isQrCatalog = String(item.id) === String(clientQrCatalogId);
    const qrAddressButton = isQrCatalog && clientSlug
      ? `<a class="button button-primary" href="https://misarte.link/${encodeURIComponent(clientSlug)}/" target="_blank" rel="noopener">Abrir endereço do QR</a>`
      : "";

    const pdfPreview = pdfUrl
      ? `
        <div class="catalog-pdf-preview">
          <canvas
            data-pdf-url="${escapeHtml(pdfUrl)}"
            role="img"
            aria-label="Primeira página de ${escapeHtml(item.nome)}"
          ></canvas>
        </div>
      `
      : `
        <div class="catalog-pdf-preview catalog-pdf-empty">
          <span>PDF</span>
          <p>Nenhum arquivo enviado</p>
        </div>
      `;

    const pdfButton = pdfUrl
      ? `
        <a
          class="button button-secondary"
          href="${escapeHtml(pdfUrl)}"
          target="_blank"
          rel="noopener"
        >
          Abrir PDF
        </a>
      `
      : `
        <button
          class="button button-secondary"
          type="button"
          disabled
        >
          PDF não disponível
        </button>
      `;

    return `
      <article class="catalog-card">
        ${pdfPreview}

        <div class="catalog-card-top">
          <div>
            <p class="eyebrow">${escapeHtml(typeLabel(item.tipo))}</p>
            <h2>${escapeHtml(item.nome)}</h2>
          </div>

          <span class="status-badge ${
            item.status === "publicado"
              ? "status-active"
              : "status-neutral"
          }">
            ${
              item.status === "publicado"
                ? "Publicado"
                : item.status === "arquivado"
                  ? "Arquivado"
                  : "Rascunho"
            }
          </span>
        </div>

        <p class="catalog-description">
          ${escapeHtml(item.descricao || "Sem descrição.")}
        </p>

        <div class="catalog-pdf-info">
          <p>
            <span>Arquivo atual</span>
            <strong>${escapeHtml(pdfUrl ? pdfName : "Nenhum PDF enviado")}</strong>
          </p>

          <p>
            <span>Última atualização</span>
            <strong>${escapeHtml(pdfUrl ? pdfUpdatedAt : "Ainda não atualizado")}</strong>
          </p>
        </div>

        <div class="catalog-card-meta">
          <span>
            Ordem
            <strong>${escapeHtml(item.ordem ?? 0)}</strong>
          </span>

          <span>
            Destaque
            <strong>${item.destaque ? "Sim" : "Não"}</strong>
          </span>

          <span>
            Catálogo do QR
            <strong>${isQrCatalog ? "Sim" : "Não"}</strong>
          </span>
        </div>

        <div class="client-actions catalog-view-actions">
          ${pdfButton}

          <a
            class="button button-secondary"
            href="../publico.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(item.id)}&preview=1"
            target="_blank"
            rel="noopener"
          >
            Prévia privada
          </a>

          <a
            class="button button-primary"
            href="${escapeHtml(itemPublicCatalogUrl)}"
            target="_blank"
            rel="noopener"
          >
            Abrir este catálogo
          </a>

          ${qrAddressButton}
        </div>

        <div class="client-actions">
          ${item.status === "publicado" && !isQrCatalog ? `
            <button class="button button-primary" type="button" data-action="setqr" data-id="${escapeHtml(item.id)}">
              Usar este catálogo no QR
            </button>
          ` : isQrCatalog ? `
            <span class="status-badge status-active">Ligado ao QR do cliente</span>
          ` : ""}

          ${item.status === "publicado" ? `
            <button class="button button-secondary" type="button" data-action="unpublish" data-id="${escapeHtml(item.id)}">
              Voltar para rascunho
            </button>
          ` : item.status === "rascunho" ? `
            <button class="button button-primary" type="button" data-action="publish" data-id="${escapeHtml(item.id)}">
              Publicar catálogo
            </button>
          ` : ""}

          <a
            class="button button-primary"
            href="./categorias.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(item.id)}"
          >
            Gerenciar categorias
          </a>

          <a
            class="button button-primary"
            href="./editor-visual.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(item.id)}"
          >
            Editor visual
          </a>

          <button
            class="button button-secondary"
            type="button"
            data-action="edit"
            data-id="${escapeHtml(item.id)}"
          >
            Editar
          </button>

          <button
            class="button button-text-danger"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(item.id)}"
          >
            Excluir
          </button>
        </div>
      </article>
    `;
  }).join("");

  el.state.hidden = true;
  el.grid.hidden = false;
  renderPdfCovers();
};

  const loadCatalogs = async () => {
    el.state.hidden = false;
    el.state.textContent = "Carregando catálogos...";
    el.grid.hidden = true;

    const { data, error } = await db
      .from("catalogos")
      .select("id,cliente_id,nome,tipo,descricao,status,destaque,ordem,pdf_url,pdf_nome,pdf_atualizado_em")
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
    .select("id,nome,empresa,categoria,cidade,estado,slug,catalogo_qr_id")
    .eq("id", clientId)
    .single();

  if (error) throw error;

  clientSlug = String(data.slug || "").trim();
  clientQrCatalogId = data.catalogo_qr_id;

  el.name.textContent =
    data.nome || data.empresa || "Cliente";

  el.meta.textContent =
    [data.categoria, data.cidade, data.estado]
      .filter(Boolean)
      .join(" · ");
};
 const openDrawer = (item = null) => {
  el.form.reset();

  el.id.value = item?.id || "";
  el.catalogName.value = item?.nome || "";
  el.type.value = item?.tipo || "cardapio";
  el.status.value = item?.status || "rascunho";
  el.status.disabled = item?.status === "publicado";
  el.order.value =
    item?.ordem ??
    (
      catalogs.length
        ? Math.max(...catalogs.map(c => Number(c.ordem || 0))) + 1
        : 1
    );

  el.featured.checked = item?.destaque === true;
  el.description.value = item?.descricao || "";

  el.drawerTitle.textContent = item
    ? "Editar catálogo"
    : "Novo catálogo";

  el.save.textContent = item
    ? "Salvar alterações"
    : "Salvar catálogo";

  setFormMessage();

  el.pdfInput.value = "";

  if (item?.pdf_url) {
    el.pdfBox.hidden = false;
    el.pdfLink.href = item.pdf_url;
    el.pdfLink.textContent =
      item.pdf_nome || "Abrir PDF atual";

    el.pdfStatus.textContent =
      "Selecione um novo PDF somente para substituir o arquivo atual.";
  } else {
    el.pdfBox.hidden = true;
    el.pdfLink.href = "#";
    el.pdfLink.textContent = "";

    el.pdfStatus.textContent =
      "Nenhum PDF enviado para este catálogo.";
  }

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

  const id = el.id.value;
  const currentCatalog = catalogs.find(item => String(item.id) === String(id));
  const originalButtonText = id
    ? "Salvar alterações"
    : "Salvar catálogo";

  el.save.disabled = true;
  el.save.textContent = "Salvando...";

  const payload = {
    cliente_id: clientId,
    nome: el.catalogName.value.trim(),
    tipo: el.type.value,
    status: currentCatalog?.status === "publicado" ? "publicado" : el.status.value,
    ordem: Number(el.order.value || 0),
    destaque: el.featured.checked,
    descricao: el.description.value.trim() || null
  };

  const pdfFile = el.pdfInput?.files?.[0];
  const MAX_PDF_SIZE = 25 * 1024 * 1024;

  if (pdfFile && pdfFile.size > MAX_PDF_SIZE) {
  el.save.disabled = false;
  el.save.textContent = originalButtonText;

  if (el.pdfStatus) {
    el.pdfStatus.textContent =
      "PDF acima do limite recomendado.";
  }

  const tamanho = (pdfFile.size / 1024 / 1024).toFixed(1);

  setFormMessage(
    `O PDF possui ${tamanho} MB. O tamanho máximo permitido é 25 MB. Exporte o PDF novamente utilizando compressão para Web.`,
    "error"
  );

  return;
}
  if (pdfFile) {
    const isPdf =
      pdfFile.type === "application/pdf" ||
      pdfFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      el.save.disabled = false;
      el.save.textContent = originalButtonText;
      setFormMessage("Selecione um arquivo PDF válido.", "error");
      return;
    }

    try {
      if (el.pdfStatus) {
        el.pdfStatus.textContent = "Enviando PDF...";
      }

      const safeFileName = pdfFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();

      const storagePath =
        `${clientId}/${id || "novo"}-${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await db.storage
        .from("catalogos-pdf")
        .upload(storagePath, pdfFile, {
          contentType: "application/pdf",
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = db.storage
        .from("catalogos-pdf")
        .getPublicUrl(storagePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Não foi possível gerar a URL pública do PDF.");
      }

      payload.pdf_url = publicUrlData.publicUrl;
      payload.pdf_nome = pdfFile.name;
      payload.pdf_atualizado_em = new Date().toISOString();

      if (el.pdfStatus) {
        el.pdfStatus.textContent =
          "PDF enviado. Finalizando o catálogo...";
      }
    } catch (error) {
      console.error(error);

      el.save.disabled = false;
      el.save.textContent = originalButtonText;

      if (el.pdfStatus) {
        el.pdfStatus.textContent =
          "Não foi possível enviar o PDF.";
      }

      setFormMessage(
        error.message || "Não foi possível enviar o PDF.",
        "error"
      );
      return;
    }
  }

  const query = id
    ? db
        .from("catalogos")
        .update(payload)
        .eq("id", id)
        .eq("cliente_id", clientId)
    : db
        .from("catalogos")
        .insert(payload);

  const { error } = await query;

  el.save.disabled = false;
  el.save.textContent = originalButtonText;

  if (error) {
    console.error(error);

    if (el.pdfStatus && pdfFile) {
      el.pdfStatus.textContent =
        "O PDF foi enviado, mas o catálogo não pôde ser salvo.";
    }

    setFormMessage(
      error.message || "Não foi possível salvar o catálogo.",
      "error"
    );
    return;
  }

  if (el.pdfStatus) {
    el.pdfStatus.textContent = pdfFile
      ? "PDF atualizado com sucesso."
      : "Nenhum novo PDF foi enviado.";
  }

  closeDrawer();
  await loadCatalogs();

  showToast(
    id
      ? "Catálogo atualizado com sucesso."
      : "Catálogo criado com sucesso."
  );
};

  const openConfirmation = (item, mode) => {
    actionTarget = item;
    actionMode = mode;
    const content = {
      publish: {
        title: "Publicar catálogo?",
        text: `“${item.nome}” ficará disponível na página pública. O QR Code e o endereço atual do cliente não serão alterados.`,
        button: "Publicar"
      },
      unpublish: {
        title: "Voltar para rascunho?",
        text: `“${item.nome}” deixará de aparecer na página pública, mas continuará salvo no painel.`,
        button: "Voltar para rascunho"
      },
      setqr: {
        title: "Usar este catálogo no QR?",
        text: `“${item.nome}” passará a ser o catálogo associado ao endereço permanente do cliente. O QR impresso não será alterado.`,
        button: "Confirmar catálogo do QR"
      },
      delete: {
        title: "Excluir catálogo?",
        text: `Você está prestes a excluir “${item.nome}”. Esta ação não poderá ser desfeita.`,
        button: "Excluir"
      }
    }[mode];
    el.confirmTitle.textContent = content.title;
    el.confirmText.textContent = content.text;
    el.confirmDelete.textContent = content.button;
    el.confirmDelete.className = mode === "delete" ? "button button-danger" : "button button-primary";
    el.modal.hidden = false;
  };

  const prepareAction = async (item, mode) => {
    if (["unpublish", "delete"].includes(mode) && String(item.id) === String(clientQrCatalogId)) {
      showToast("Escolha primeiro outro catálogo para o QR antes de retirar ou excluir este.", "error");
      return;
    }

    if (mode !== "publish") {
      openConfirmation(item, mode);
      return;
    }

    const { data: categories, error: categoryError } = await db
      .from("categorias")
      .select("id")
      .eq("catalogo_id", item.id)
      .eq("status", "ativa");

    if (categoryError) {
      showToast(categoryError.message || "Não foi possível validar o catálogo.", "error");
      return;
    }

    if (!categories?.length) {
      showToast("Crie ao menos uma categoria ativa antes de publicar.", "error");
      return;
    }

    const { count, error: productError } = await db
      .from("produtos")
      .select("id", { count: "exact", head: true })
      .in("categoria_id", categories.map(category => category.id))
      .eq("status", "disponivel");

    if (productError) {
      showToast(productError.message || "Não foi possível validar os produtos.", "error");
      return;
    }

    if (!count) {
      showToast("Adicione ao menos um produto disponível antes de publicar.", "error");
      return;
    }

    openConfirmation(item, mode);
  };

  const closeConfirmation = () => {
    actionTarget = null;
    actionMode = null;
    el.modal.hidden = true;
    el.confirmDelete.disabled = false;
  };

  const confirmAction = async () => {
    if (!actionTarget || !actionMode) return;
    el.confirmDelete.disabled = true;
    el.confirmDelete.textContent = actionMode === "delete" ? "Excluindo..." : "Salvando...";

    const query = actionMode === "setqr"
      ? db.from("clientes").update({ catalogo_qr_id: actionTarget.id }).eq("id", clientId)
      : actionMode === "delete"
        ? db.from("catalogos").delete().eq("id", actionTarget.id).eq("cliente_id", clientId)
        : db.from("catalogos").update({ status: actionMode === "publish" ? "publicado" : "rascunho" })
            .eq("id", actionTarget.id).eq("cliente_id", clientId);
    const { error } = await query;

    if (error) {
      console.error(error);
      closeConfirmation();
      showToast(error.message || "Não foi possível concluir a ação.", "error");
      return;
    }

    const successMessage = actionMode === "delete"
      ? "Catálogo excluído com sucesso."
      : actionMode === "setqr"
        ? "Catálogo associado ao QR do cliente."
      : actionMode === "publish"
        ? "Catálogo publicado com sucesso."
        : "Catálogo voltou para rascunho.";
    closeConfirmation();
    await loadClient();
    await loadCatalogs();
    showToast(successMessage);
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

  el.grid.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = catalogs.find(catalog => String(catalog.id) === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "edit") openDrawer(item);
    if (["publish", "unpublish", "delete", "setqr"].includes(button.dataset.action)) {
      button.disabled = true;
      await prepareAction(item, button.dataset.action);
      button.disabled = false;
    }
  });

  el.cancelDelete.addEventListener("click", closeConfirmation);
  el.confirmDelete.addEventListener("click", confirmAction);
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
