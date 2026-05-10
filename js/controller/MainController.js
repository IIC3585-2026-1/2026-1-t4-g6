import { Note } from "../models/NoteModel.js";
import { StorageManager } from "../utils/storage.js";

export class MainController {
    constructor() {
        this.storage = new StorageManager();
        this.notes = [];
        this.currentNote = null;
    }

    async init() {
        await this.storage.init();
        await this.loadNotes();
    }

    async loadNotes() {
        const notes = await this.storage.getAllNotes();
        this.notes = notes.map(n => new Note(n));
    }

    async createNewNote(initialTitle = "Nueva Nota", initialContent = "") {
        const newNote = new Note({
            title: initialTitle,
            content: initialContent
        });
        await this.storage.saveNote(newNote);
        this.notes.push(newNote);
        return newNote;
    }

    async handleUpdateNote(id, newContent) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.updateContent(newContent);
            await this.storage.saveNote(note);
            return note;
        }
        return null;
    }

    async deleteNote(id) {
        await this.storage.deleteNote(id);

        this.notes = this.notes.filter(n => n.id !== id);

        if (this.currentNote && this.currentNote.id === id) {
            this.currentNote = null;
        }
    }

    setCurrentNote(id) {
        this.currentNote = this.notes.find(n => n.id === id) || null;
        return this.currentNote;
    }

    getSortedNotes() {
        return [...this.notes].sort((a, b) => b.updatedAt - a.updatedAt);
    }
}