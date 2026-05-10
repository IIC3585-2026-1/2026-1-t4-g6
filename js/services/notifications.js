const FIREBASE_APP_URL =
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js";
const FIREBASE_MESSAGING_URL =
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js";
const PUSH_SERVER_URL = "http://localhost:3000/send-note-push";

const CONFIG_PLACEHOLDER = "REEMPLAZA_CON_TU_";

let firebaseScriptsPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });

      if (existingScript.dataset.loaded === "true") {
        resolve();
      }

      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.dataset.firebaseSdk = "true";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureFirebaseScripts() {
  if (window.firebase?.messaging) {
    return window.firebase;
  }

  if (!firebaseScriptsPromise) {
    firebaseScriptsPromise = loadScript(FIREBASE_APP_URL).then(() =>
      loadScript(FIREBASE_MESSAGING_URL),
    );
  }

  await firebaseScriptsPromise;
  return window.firebase;
}

function hasFirebaseConfig() {
  const config = window.BANGLENT_FIREBASE_CONFIG;
  const vapidKey = window.BANGLENT_FIREBASE_VAPID_KEY;

  if (!config || !vapidKey) return false;

  return Object.values(config).every(
    (value) => typeof value === "string" && !value.includes(CONFIG_PLACEHOLDER),
  ) && !vapidKey.includes(CONFIG_PLACEHOLDER);
}

function isSecureOrigin() {
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function initializeFirebase(firebase) {
  if (!firebase.apps.length) {
    firebase.initializeApp(window.BANGLENT_FIREBASE_CONFIG);
  }
}

export class NotificationService {
  constructor({ button, status, tokenOutput, toast }) {
    this.button = button;
    this.status = status;
    this.tokenOutput = tokenOutput;
    this.toast = toast;
    this.messaging = null;
    this.serviceWorkerRegistration = null;
    this.currentToken = localStorage.getItem("banglent-fcm-token");
  }

  init() {
    if (!this.button || !this.status || !this.tokenOutput) return;

    this.button.addEventListener("click", () => this.enableNotifications());
    this.updateInitialState();
  }

  updateInitialState() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      this.setStatus("Notificaciones no soportadas", "error");
      this.button.disabled = true;
      return;
    }

    if (!isSecureOrigin()) {
      this.setStatus("Requiere HTTPS o localhost", "error");
      this.button.disabled = true;
      return;
    }

    if (!hasFirebaseConfig()) {
      this.setStatus("Configura Firebase para activar push", "pending");
      this.button.disabled = true;
      return;
    }

    if (Notification.permission === "granted") {
      this.setStatus("Permiso concedido. Presiona para obtener token", "ready");
      this.button.textContent = "Obtener token";
      return;
    }

    if (Notification.permission === "denied") {
      this.setStatus("Permiso bloqueado en el navegador", "error");
      this.button.disabled = true;
      return;
    }

    this.setStatus("Listo para solicitar permiso", "pending");
  }

  async enableNotifications() {
    this.setLoading(true, "Activando...");

    try {
      if (!hasFirebaseConfig()) {
        throw new Error("Falta completar js/config/firebase-config.js");
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        this.setStatus("Permiso denegado por el usuario", "error");
        return;
      }

      const token = await this.ensureFcmToken();

      if (!token) {
        this.setStatus("No se pudo generar un token FCM", "error");
        return;
      }

      this.setStatus("Token listo para Firebase Console y push local", "success");
      this.button.textContent = "Actualizar token";
    } catch (error) {
      console.error("No se pudieron activar las notificaciones:", error);
      this.setStatus(error.message || "Error activando notificaciones", "error");
    } finally {
      this.setLoading(false);
    }
  }

  async ensureFcmToken() {
    if (this.currentToken && Notification.permission === "granted") {
      return this.currentToken;
    }

    if (Notification.permission !== "granted") {
      return null;
    }

    if (!hasFirebaseConfig()) {
      throw new Error("Falta completar js/config/firebase-config.js");
    }

      const firebase = await ensureFirebaseScripts();
      this.serviceWorkerRegistration =
        await navigator.serviceWorker.register("/sw.js");

    initializeFirebase(firebase);

      this.messaging = firebase.messaging();
      const token = await this.messaging.getToken({
        vapidKey: window.BANGLENT_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: this.serviceWorkerRegistration,
      });

    if (!token) return null;

      this.currentToken = token;
      localStorage.setItem("banglent-fcm-token", token);
      this.renderToken(token);
      this.bindForegroundMessages();
    return token;
  }

  bindForegroundMessages() {
    if (!this.messaging || this.messaging.hasForegroundListener) return;

    this.messaging.onMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Banglen't";
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        "Recibiste una notificación nueva";

      this.showToast(title, body);
      navigator.serviceWorker.ready
        .then((registration) =>
          registration.showNotification(title, {
            body,
            icon: "/images/pwa-icon-256.png",
            badge: "/images/pwa-icon-256.png",
            data: {
              url: payload.data?.url || "/index.html",
            },
          }),
        )
        .catch((error) => {
          console.warn("No se pudo mostrar la notificacion foreground:", error);
        });
      this.setStatus("Notificación recibida en primer plano", "success");
    });

    this.messaging.hasForegroundListener = true;
  }

  async sendNoteCreatedPush(note) {
    if (Notification.permission !== "granted") {
      this.setStatus("Activa notificaciones antes de crear la push", "pending");
      return;
    }

    try {
      const token = await this.ensureFcmToken();

      if (!token) {
        this.setStatus("No hay token FCM para enviar la push", "error");
        return;
      }

      this.setStatus("Enviando push y programando recordatorio...", "pending");
      console.log("Solicitando push inmediata y recordatorio:", {
        url: PUSH_SERVER_URL,
        noteId: note.id,
        noteTitle: note.title || "Nueva Nota",
        reminderDelaySeconds: 10,
      });

      const response = await fetch(PUSH_SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          noteTitle: note.title || "Nueva Nota",
          noteId: note.id,
          reminderDelaySeconds: 10,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "El servidor local rechazo la push");
      }

      console.log("Servidor local acepto push y recordatorio:", result);
      this.setStatus("Push enviada y recordatorio programado para 10 segundos", "success");
    } catch (error) {
      console.error("No se pudo enviar la push al crear nota:", error);
      this.setStatus("Levanta npm run push-server para automaticas", "error");
    }
  }

  renderToken(token) {
    this.tokenOutput.hidden = false;
    this.tokenOutput.value = token;
    this.tokenOutput.select();

    navigator.clipboard?.writeText(token).catch(() => {
      console.info("No se pudo copiar el token automáticamente.");
    });
  }

  showToast(title, body) {
    if (!this.toast) return;

    this.toast.hidden = false;
    this.toast.querySelector(".notification-toast-title").textContent = title;
    this.toast.querySelector(".notification-toast-body").textContent = body;

    window.clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.toast.hidden = true;
    }, 6000);
  }

  setStatus(text, state) {
    this.status.textContent = text;
    this.status.dataset.state = state;
  }

  setLoading(isLoading, loadingText = "Activando...") {
    this.button.disabled = isLoading;

    if (isLoading) {
      this.previousButtonText = this.button.textContent;
      this.loadingText = loadingText;
      this.button.textContent = loadingText;
    } else if (
      this.previousButtonText &&
      this.button.textContent === this.loadingText
    ) {
      this.button.textContent = this.previousButtonText;
    }

    if (!isLoading) {
      this.previousButtonText = null;
      this.loadingText = null;
    }
  }
}
