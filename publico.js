(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("cliente");
  const $ = (selector) => document.querySelector(selector);

  const el = {
    loader: $("#publicLoader"),
    app: $("#publicApp"),
    hero: $("#hero"),
    logo: $("#clientLogo"),
    clientName: $("#clientName"),
    clientMeta: $("#clientMeta"),
    chooser: $("#catalogChooser"),
    buttons: $("#catalogButtons"),
    catalogType: $("#catalogType"),
    catalogName: $("#catalogName"),
    catalogDescription: $("#catalogDescription"),
    empty: $("#emptyState"),
    categories: $("#categoriesContainer")
  };

  let catalogs = [];
  let selectedCatalogId = null;

  const esc = (value) =>
    String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const money = (value) =>
    value === null || value === ""
      ? ""
      : new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(Number(value));

  const typeLabel = (value) => ({
    cardapio:"Cardápio", cervejas:"Carta de cervejas", drinks:"Carta de drinks",
    vinhos:"Carta de vinhos", menu_executivo:"Menu executivo",
    promocoes:"Promoções", outro:"Catálogo"
  }[value] || "Catálogo");

  const showError = (message) => {
    el.loader.hidden = true;
    el.app.hidden = false;
    el.clientName.textContent = "Catálogo indisponível";
    el.clientMeta.textContent = message;
    el.chooser.hidden = true;
    el.empty.hidden = false;
    el.empty.textContent = "Este catálogo não está disponível no momento.";
  };

  async function loadClient() {
    const { data, error } = await db
      .from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,status,logo_url,capa_url")
      .eq("id", clientId)
      .eq("status", "ativo")
      .single();

    if (error || !data) throw new Error("Cliente não encontrado ou página ainda não publicada.");

    const name = data.nome || data.empresa || "Cliente";
    document.title = `${name} | Catálogo Digital`;
    el.clientName.textContent = name;
    el.clientMeta.textContent = [data.categoria, data.cidade, data.estado].filter(Boolean).join(" · ");

    if (data.logo_url) {
      el.logo.src = data.logo_url;
      el.logo.alt = `Logo de ${name}`;
      el.logo.hidden = false;
    }

    if (data.capa_url) {
      el.hero.style.backgroundImage = `url("${data.capa_url}")`;
    }
  }

  async function loadCatalogs() {
    const { data, error } = await db
      .from("catalogos")
      .select("id,nome,tipo,descricao,destaque,ordem")
      .eq("cliente_id", clientId)
      .eq("status", "publicado")
      .order("destaque", { ascending:false })
      .order("ordem", { ascending:true });

    if (error) throw error;
    catalogs = data || [];

    if (!catalogs.length) {
      el.empty.hidden = false;
      el.empty.textContent = "Nenhum catálogo publicado no momento.";
      return;
    }

    selectedCatalogId = catalogs[0].id;

    if (catalogs.length > 1) {
      el.chooser.hidden = false;
      el.buttons.innerHTML = catalogs.map((catalog, index) => `
        <button class="catalog-button ${index === 0 ? "active" : ""}" data-id="${esc(catalog.id)}">
          ${esc(catalog.nome)}
        </button>
      `).join("");
    }

    await renderCatalog(selectedCatalogId);
  }

  async function renderCatalog(catalogId) {
    selectedCatalogId = catalogId;
    const catalog = catalogs.find(item => String(item.id) === String(catalogId));
    if (!catalog) return;

    el.catalogType.textContent = typeLabel(catalog.tipo).toUpperCase();
    el.catalogName.textContent = catalog.nome;
    el.catalogDescription.textContent = catalog.descricao || "";
    el.empty.hidden = true;
    el.categories.innerHTML = '<div class="public-empty">Carregando itens...</div>';

    el.buttons.querySelectorAll(".catalog-button").forEach(button => {
      button.classList.toggle("active", String(button.dataset.id) === String(catalogId));
    });

    const { data: categories, error: categoryError } = await db
      .from("categorias")
      .select("id,nome,descricao,ordem")
      .eq("catalogo_id", catalogId)
      .eq("status", "ativa")
      .order("ordem", { ascending:true });

    if (categoryError) throw categoryError;

    if (!categories?.length) {
      el.categories.innerHTML = "";
      el.empty.hidden = false;
      el.empty.textContent = "Este catálogo ainda não possui categorias publicadas.";
      return;
    }

    const categoryIds = categories.map(category => category.id);
    const { data: products, error: productError } = await db
      .from("produtos")
      .select("id,categoria_id,nome,descricao,preco,destaque,ordem")
      .in("categoria_id", categoryIds)
      .eq("status", "disponivel")
      .order("destaque", { ascending:false })
      .order("ordem", { ascending:true });

    if (productError) throw productError;

    el.categories.innerHTML = categories.map(category => {
      const items = (products || []).filter(product => String(product.categoria_id) === String(category.id));
      if (!items.length) return "";

      return `
        <section class="category-section">
          <div class="category-header">
            <h3>${esc(category.nome)}</h3>
            ${category.descricao ? `<p>${esc(category.descricao)}</p>` : ""}
          </div>
          <div class="products-grid">
            ${items.map(product => `
              <article class="product-item">
                <div class="product-top">
                  <div>
                    <h4>${esc(product.nome)}</h4>
                    ${product.destaque ? '<div class="product-tags"><span class="product-tag">Destaque</span></div>' : ""}
                  </div>
                  ${product.preco !== null ? `<span class="product-price">${esc(money(product.preco))}</span>` : ""}
                </div>
                ${product.descricao ? `<p class="product-description">${esc(product.descricao)}</p>` : ""}
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");

    if (!el.categories.innerHTML.trim()) {
      el.empty.hidden = false;
      el.empty.textContent = "Nenhum produto disponível neste catálogo.";
    }
  }

  el.buttons.addEventListener("click", async (event) => {
    const button = event.target.closest(".catalog-button");
    if (!button) return;
    await renderCatalog(button.dataset.id);
    document.querySelector("#catalogContent").scrollIntoView({ behavior:"smooth", block:"start" });
  });

  (async () => {
    if (!clientId) {
      showError("O endereço do cliente está incompleto.");
      return;
    }

    try {
      await loadClient();
      await loadCatalogs();
      el.loader.hidden = true;
      el.app.hidden = false;
    } catch (error) {
      console.error(error);
      showError(error.message || "Não foi possível abrir o catálogo.");
    }
  })();
})();