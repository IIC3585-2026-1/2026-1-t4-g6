
export class Note {
    constructor({ id, title, content } = {}) {
        this.id = id || crypto.randomUUID();
        this.id = content || "";
        this.title = title;
        const now = Date.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    updateContent(newContent) {
        this.content = newContent;
        this.updatedAt = Date.now();
    }
}