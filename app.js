fetch("clientes.json")
  .then(response => {
    if (!response.ok) throw new Error("Falha ao carregar clientes");
    return response.json();
  })
  .then(data => {
    const list = document.getElementById("clients");
    const counter = document.getElementById("counter");
    counter.textContent = data.clientes.length;
    list.innerHTML = "";

    data.clientes.forEach(cliente => {
      const card = document.createElement("a");
      card.className = "client-card";
      card.href = cliente.url;
      card.innerHTML = `
        <span class="tag">${cliente.categoria}</span>
        <h3>${cliente.nome}</h3>
        <p>Status: ${cliente.status}</p>
        <span class="open">Abrir catálogo →</span>
      `;
      list.appendChild(card);
    });
  })
  .catch(() => {
    document.getElementById("clients").innerHTML =
      '<div class="loading">Não foi possível carregar os projetos.</div>';
  });