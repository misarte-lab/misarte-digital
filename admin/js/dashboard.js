(() => {
  const client = window.misarteSupabase;
  const loader = document.querySelector("#pageLoader");
  const app = document.querySelector("#dashboardApp");
  const logoutButton = document.querySelector("#logoutButton");
  const userEmail = document.querySelector("#userEmail");
  const totalProjects = document.querySelector("#totalProjects");
  const activeProjects = document.querySelector("#activeProjects");
  const featuredProjects = document.querySelector("#featuredProjects");
  const projectsState = document.querySelector("#projectsState");
  const projectsTable = document.querySelector("#projectsTable");
  const projectsTableBody = document.querySelector("#projectsTableBody");
  const menuButton = document.querySelector("#menuButton");
  const sidebar = document.querySelector(".sidebar");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const statusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();
    const label = normalized === "ativo" ? "Ativo" : normalized === "inativo" ? "Inativo" : status || "Não informado";
    const className = normalized === "ativo" ? "status-active" : "status-neutral";
    return `<span class="status-badge ${className}">${escapeHtml(label)}</span>`;
  };

  const renderProjects = (projects) => {
    totalProjects.textContent = projects.length;
    activeProjects.textContent = projects.filter(
      (project) => String(project.status || "").toLowerCase() === "ativo"
    ).length;
    featuredProjects.textContent = projects.filter((project) => project.destaque === true).length;

    if (!projects.length) {
      projectsState.textContent = "Nenhum projeto cadastrado.";
      projectsTable.hidden = true;
      return;
    }

    projectsTableBody.innerHTML = projects.map((project) => `
      <tr>
        <td>
          <div class="client-cell">
            <span class="client-initial">${escapeHtml((project.nome || project.empresa || "?").charAt(0).toUpperCase())}</span>
            <div>
              <strong>${escapeHtml(project.nome || project.empresa || "Sem nome")}</strong>
              <small>${escapeHtml(project.cidade || "")}${project.estado ? ` · ${escapeHtml(project.estado)}` : ""}</small>
            </div>
          </div>
        </td>
        <td>${escapeHtml(project.categoria || "—")}</td>
        <td>${statusBadge(project.status)}</td>
        <td>${project.destaque === true ? "Sim" : "Não"}</td>
        <td>${escapeHtml(project.ordem ?? "—")}</td>
        <td>
          <div class="table-actions">
            <a class="button button-primary button-small" href="./cliente.html?id=${escapeHtml(project.id)}">Abrir</a>
            <a class="button button-secondary button-small" href="./aparencia.html?id=${escapeHtml(project.id)}">Aparência</a>
          </div>
        </td>
      </tr>
    `).join("");

    projectsState.hidden = true;
    projectsTable.hidden = false;
  };

  const loadProjects = async () => {
    const { data, error } = await client
      .from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,status,destaque,ordem")
      .order("ordem", { ascending: true });

    if (error) {
      projectsState.textContent = "Não foi possível carregar os projetos.";
      totalProjects.textContent = "—";
      activeProjects.textContent = "—";
      featuredProjects.textContent = "—";
      console.error(error);
      return;
    }

    renderProjects(data || []);
  };

  const protectPage = async () => {
    const { data, error } = await client.auth.getSession();

    if (error || !data.session) {
      window.location.replace("./login.html");
      return;
    }

    userEmail.textContent = data.session.user.email || "Usuária autenticada";
    loader.hidden = true;
    app.hidden = false;
    await loadProjects();
  };

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Saindo...";

    await client.auth.signOut();
    window.location.replace("./login.html");
  });

  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      window.location.replace("./login.html");
    }
  });

  protectPage().catch(() => {
    window.location.replace("./login.html");
  });
})();
