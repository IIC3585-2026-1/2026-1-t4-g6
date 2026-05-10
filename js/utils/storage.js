export class StorageManager {
    constructor(dbName = "BanglentDB", version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    init () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("notes")) {
                    db.createObjectStore("notes", { keyPath: "id" });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            }

            request.onerror = (event) => reject("Error abriendo IndexedDB: " + event.target.error);
        });
    }

    async saveNote(note) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            const request = store.put({ ...note });

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => {
                if (event.target.error.name == 'QuotaExceededError') {
                    reject("Te has quedado sin espacio en el navegador para guardar notas");
                } else {
                    reject("Error al guardar nota:", event.target.error);
                }
            }
        });
    }

    async getAllNotes() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readonly");
            const store = transaction.objectStore("notes");
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error al obtener notas");
        });
    }

    async deleteNote(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["notes"], "readwrite");
            const store = transaction.objectStore("notes");
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject("Error al eliminar nota");
        });
    }

    async checkQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const quota = await navigator.storage.estimate();
            const percentageUsed = (quota.usage / quota.quota) * 100;
            return percentageUsed;
        }
        return 0
    }
}