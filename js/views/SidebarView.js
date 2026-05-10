export class SidebarView {
  constructor() {
    this.noteList = document.getElementById("note-list");
    this.btnNewNote = document.getElementById("btn-new-note");
  }

  bindOnNewNote(handler) {
    this.btnNewNote.addEventListener("click", () => {
      handler();
    });
  }

  bindOnSelectNote(handler) {
    this.noteList.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

      const id = li.dataset.id;
      handler(id);
    });
  }

  renderNotes(notes, currentNoteId) {
    this.noteList.innerHTML = "";

    notes.forEach((note) => {
      const li = document.createElement("li");
      li.dataset.id = note.id;

      li.textContent =
        note.title && note.title !== "Sin título"
          ? note.title
          : note.content.substring(0, 20) || "Nueva Nota...";

      if (note.id === currentNoteId) {
        li.classList.add("active");
      }

      this.noteList.appendChild(li);
    });
  }
}
