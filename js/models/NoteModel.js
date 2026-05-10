
export class Note {
    constructor({ id, title, content, createdAt, updatedAt } = {}) {
        this.id = id || crypto.randomUUID();
        this.content = content || "";
        this.title = title || "Sin título";
        const now = Date.now();
        this.createdAt = createdAt || now;
        this.updatedAt = updatedAt || now;
    }

    updateContent(newContent) {
        this.content = newContent;
        this.updatedAt = Date.now();
    }

    updateTitle(newTitle) {
        this.title = newTitle;
        this.updatedAt = Date.now();
    }
}