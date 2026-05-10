export class EditorView {
  constructor() {
    this.markdownInput = document.getElementById("markdown-input");
    this.markdownPreview = document.getElementById("markdown-preview");
    this.saveStatus = document.getElementById("save-status");
    this.networkStatus = document.getElementById("network-status");
    this.saveTimeout = null;
    this.currentNoteId = null;

    window.addEventListener("online", () => this.updateNetworkStatus(true));
    window.addEventListener("offline", () => this.updateNetworkStatus(false));
    this.updateNetworkStatus(navigator.onLine);
  }

  bindOnContentChange(handler) {
    this.markdownInput.addEventListener("input", () => {
      const content = this.markdownInput.value;
      const idAtTimeOfTyping = this.currentNoteId;
      this.renderPreview(content);

      this.setSaveStatus("Guardando...", "saving");

      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(async () => {
        try {
          await handler(content, idAtTimeOfTyping);
          this.setSaveStatus("Guardado", "saved");
        } catch (error) {
          console.error("Falló el guardado:", error);
          this.setSaveStatus("Error al guardar", "offline");
        }
      }, 1000);
    });
  }

  renderEditor(note) {
    if (!note) {
      this.currentNoteId = null;
      this.markdownInput.value = "";
      this.markdownInput.disabled = true;
      this.renderPreview("");
      return;
    }

    this.currentNoteId = note.id;
    this.markdownInput.disabled = false;
    const safeContent = note.content || "";
    this.markdownInput.value = note.content;
    this.renderPreview(note.content);
  }

  renderPreview(content) {
    const safeContent = content || "";
    if (window.marked) {
      this.markdownPreview.innerHTML = window.marked.parse(content);
    } else {
      this.markdownPreview.innerHTML = content;
    }
  }

  setSaveStatus(text, className) {
    this.saveStatus.textContent = text;
    this.saveStatus.className = `status ${className}`;
  }

  updateNetworkStatus(isOnline) {
    if (isOnline) {
      this.networkStatus.textContent = "Conectado";
      this.networkStatus.className = "status online";
    } else {
      this.networkStatus.textContent = "Sin conexión (Local)";
      this.networkStatus.className = "status offline";
    }
  }
}
