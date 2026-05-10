import { MainController } from "./controller/mainController.js";
import { EditorView } from "./views/EditorView.js";
import { SidebarView } from "./views/SidebarView.js";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new MainController();
  const sidebarView = new SidebarView();
  const editorView = new EditorView();
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
  const sidebar = document.getElementById("sidebar");

  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  try {
    await app.init();
    console.log("Aplicación iniciada correctamente");

    const notes = app.getSortedNotes();
    let currentNote = notes.length > 0 ? notes : null;

    if (currentNote) {
      app.setCurrentNote(currentNote.id);
    } else {
      currentNote = await app.createNewNote(
        "TO DO List",
        "# TO DO\n\n- Hacer la tarea\n- Comprar pan\n...",
      );
      app.setCurrentNote(currentNote.id);
    }

    sidebarView.renderNotes(app.getSortedNotes(), currentNote?.id);
    editorView.renderEditor(currentNote);

    sidebarView.bindOnNewNote(async () => {
      const newNote = await app.createNewNote("Nueva Nota", "");
      app.setCurrentNote(newNote.id);
      sidebarView.renderNotes(app.getSortedNotes(), newNote.id);
      editorView.renderEditor(newNote);
    });

    sidebarView.bindOnSelectNote((id) => {
      const selectedNote = app.setCurrentNote(id);
      sidebarView.renderNotes(app.getSortedNotes(), selectedNote.id);
      editorView.renderEditor(selectedNote);
      document.getElementById("sidebar").classList.remove("open");
    });

    editorView.bindOnContentChange(async (newContent, noteId) => {
      if (noteId) {
        const lines = newContent.split("\n");
        const title = lines[0].replace(/^#+\s*/, "").trim() || "Sin título";

        await app.handleUpdateNote(noteId, newContent);
        await app.handleUpdateTitle(noteId, title);

        sidebarView.renderNotes(app.getSortedNotes(), app.currentNote?.id);
      }
    });
  } catch (err) {
    console.error("Error al inicar la app:", err);
  }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log(
        "Service Worker registrado con éxito. Scope:",
        registration.scope,
      );
    } catch (err) {
      console.error("Falló el registro del Service Worker:", err);
    }
  }
});
