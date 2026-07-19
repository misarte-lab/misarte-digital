(() => {
  const db = window.misarteSupabase;
  const BUCKET = "clientes";
  const MAX_SIZE = 5 * 1024 * 1024;
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  const params = new URLSearchParams(location.search);
  const clientId = params.get("id");

  const el = {
    loader: document.querySelector("#pageLoader"),
    app: document.querySelector("#dashboardApp"),
    email: document.querySelector("#userEmail"),
    logout: document.querySelector("#logoutButton"),
    menu: document.querySelector("#menuButton"),
    sidebar: document.querySelector(".sidebar"),
    name: document.querySelector("#clientName"),
    meta: document.querySelector("#clientMeta"),
    path: document.querySelector("#storagePath"),
    warning: document.querySelector("#setupWarning"),
    logoPreview: document.querySelector("#logoPreview"),
    coverPreview: document.querySelector("#coverPreview"),
    logoInput: document.querySelector("#logoInput"),
    coverInput: document.querySelector("#coverInput"),
    logoStatus: document.querySelector("#logoStatus"),
    coverStatus: document.querySelector("#coverStatus"),
    removeLogo: document.querySelector("#removeLogo"),
    removeCover: document.querySelector("#removeCover"),
    toast: document.querySelector("#toast")
  };

  let current = null;

  const toast = (message, type = "success") => {
    el.toast.textContent = message;
    el.toast.className = `toast ${type}`;
    el.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.hidden = true, 3200);
  };

  const preview = (container, url, kind) => {
    if (!url) {
      container.innerHTML = `<div class="empty-media"><strong>Sem ${kind}</strong><span>Selecione uma imagem para enviar.</span></div>`;
      return;
    }
    container.innerHTML = `<img src="${url}" alt="${kind} do cliente">`;
  };

  const extensionFor = (file) => {
    const map = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    return map[file.type];
  };

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) throw new Error("Use uma imagem PNG, JPG ou WEBP.");
    if (file.size > MAX_SIZE) throw new Error("A imagem deve ter no máximo 5 MB.");
  };

  const upload = async (kind, file) => {
    validateFile(file);
    const status = kind === "logo" ? el.logoStatus : el.coverStatus;
    const input = kind === "logo" ? el.logoInput : el.coverInput;
    status.textContent = "Enviando imagem...";
    input.disabled = true;

    const ext = extensionFor(file);
    const path = `${clientId}/${kind}.${ext}`;

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) throw uploadError;

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const field = kind === "logo" ? "logo_url" : "capa_url";

    const { error: updateError } = await db
      .from("clientes")
      .update({ [field]: publicUrl })
      .eq("id", clientId);

    if (updateError) throw updateError;

    current[field] = publicUrl;
    preview(kind === "logo" ? el.logoPreview : el.coverPreview, publicUrl, kind);
    (kind === "logo" ? el.removeLogo : el.removeCover).hidden = false;
    status.textContent = "Upload concluído.";
    toast(`${kind === "logo" ? "Logo" : "Capa"} atualizada com sucesso.`);
    input.disabled = false;
    input.value = "";
  };

  const remove = async (kind) => {
    const status = kind === "logo" ? el.logoStatus : el.coverStatus;
    status.textContent = "Removendo...";
    const field = kind === "logo" ? "logo_url" : "capa_url";
    const currentUrl = current[field];

    if (currentUrl) {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const relative = currentUrl.split("?")[0].split(marker)[1];
      if (relative) await db.storage.from(BUCKET).remove([decodeURIComponent(relative)]);
    }

    const { error } = await db.from("clientes").update({ [field]: null }).eq("id", clientId);
    if (error) throw error;

    current[field] = null;
    preview(kind === "logo" ? el.logoPreview : el.coverPreview, null, kind);
    (kind === "logo" ? el.removeLogo : el.removeCover).hidden = true;
    status.textContent = "";
    toast(`${kind === "logo" ? "Logo" : "Capa"} removida.`);
  };

  const load = async () => {
    if (!clientId) {
      location.replace("./clientes.html");
      return;
    }

    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) {
      location.replace("./login.html");
      return;
    }

    el.email.textContent = sessionData.session.user.email || "Usuária autenticada";

    const { data, error } = await db
      .from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,logo_url,capa_url")
      .eq("id", clientId)
      .single();

    if (error) {
      console.error(error);
      if (/logo_url|capa_url/i.test(error.message || "")) el.warning.hidden = false;
      el.name.textContent = "Não foi possível abrir o cliente";
      el.meta.textContent = error.message;
      el.loader.hidden = true;
      el.app.hidden = false;
      return;
    }

    current = data;
    el.name.textContent = data.nome || data.empresa || "Cliente";
    el.meta.textContent = [data.categoria, data.cidade, data.estado].filter(Boolean).join(" · ");
    el.path.textContent = `clientes/${data.id}/`;
    preview(el.logoPreview, data.logo_url, "logo");
    preview(el.coverPreview, data.capa_url, "capa");
    el.removeLogo.hidden = !data.logo_url;
    el.removeCover.hidden = !data.capa_url;

    el.loader.hidden = true;
    el.app.hidden = false;
  };

  el.logoInput.addEventListener("change", async () => {
    const file = el.logoInput.files[0];
    if (!file) return;
    try { await upload("logo", file); }
    catch (error) {
      console.error(error);
      el.logoInput.disabled = false;
      el.logoStatus.textContent = "";
      if (/bucket|column|policy|row-level/i.test(error.message || "")) el.warning.hidden = false;
      toast(error.message || "Não foi possível enviar a logo.", "error");
    }
  });

  el.coverInput.addEventListener("change", async () => {
    const file = el.coverInput.files[0];
    if (!file) return;
    try { await upload("capa", file); }
    catch (error) {
      console.error(error);
      el.coverInput.disabled = false;
      el.coverStatus.textContent = "";
      if (/bucket|column|policy|row-level/i.test(error.message || "")) el.warning.hidden = false;
      toast(error.message || "Não foi possível enviar a capa.", "error");
    }
  });

  el.removeLogo.addEventListener("click", async () => {
    try { await remove("logo"); } catch (error) { toast(error.message, "error"); }
  });
  el.removeCover.addEventListener("click", async () => {
    try { await remove("capa"); } catch (error) { toast(error.message, "error"); }
  });
  el.menu.addEventListener("click", () => el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click", async () => {
    await db.auth.signOut();
    location.replace("./login.html");
  });

  load().catch((error) => {
    console.error(error);
    location.replace("./clientes.html");
  });
})();