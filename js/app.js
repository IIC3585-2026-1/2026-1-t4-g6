import { MainController } from "./controller/mainController";

document.addEventListener('DOMContentLoaded', async () => {
  const app = new MainController();
  
  try {
    await app.init();
    console.log("Aplicación iniciada correctamente");
  } catch (err) {
    console.error("Error al inicar la app:", err);
  }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registrado con éxito. Scope:", registration.scope);
    } catch (err) {
      console.error("Falló ell registro del Service Worker:", err);
    }
  }
});