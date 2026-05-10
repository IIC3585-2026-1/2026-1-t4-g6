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

// // app.js

// // 1. Referencias al DOM
// const markdownInput = document.getElementById("markdown-input");
// const markdownPreview = document.getElementById("markdown-preview");
// const networkStatus = document.getElementById("network-status");
// const saveStatus = document.getElementById("save-status");

// // 2. Variables de control
// let saveTimeout; // Para hacer un "debounce" al guardar

// // 3. Renderizado de Markdown a HTML
// function updatePreview() {
//   const markdownText = markdownInput.value;

//   // Parseo de Markdown a HTML
//   markdownPreview.innerHTML = marked.parse(markdownText);

//   // Cambiar estado a "Guardando..."
//   saveStatus.textContent = "Guardando...";
//   saveStatus.className = "status saving";

//   // Debounce: Evita guardar en cada pulsación de tecla.
//   // Espera 1 segundo después de que el usuario deje de escribir para simular el autoguardado.
//   clearTimeout(saveTimeout);
//   saveTimeout = setTimeout(() => {
//     triggerSaveToDataLayer(markdownText);
//   }, 1000);
// }

// // 4. Hook para la Persona 1 (Arquitectura / IndexedDB)
// function triggerSaveToDataLayer(content) {
//   /* IMPORTANTE PARA PERSONA 1: 
//        Aquí es donde conectarás tu lógica de IndexedDB/LocalStorage.
//        Por ejemplo: window.dbManager.saveNote({ content: content });
//     */

//   console.log("Notificando a la capa de datos. Contenido a guardar:", content);

//   // Actualizamos la UI asumiendo que el guardado fue exitoso
//   saveStatus.textContent = "Guardado";
//   saveStatus.className = "status saved";
// }

// // 5. Manejo de estado Online/Offline
// function updateNetworkStatus() {
//   if (navigator.onLine) {
//     networkStatus.textContent = "Conectado";
//     networkStatus.className = "status online";
//   } else {
//     networkStatus.textContent = "Sin conexión (Modo Offline)";
//     networkStatus.className = "status offline";
//   }
// }

// // 6. Listeners de Eventos
// // Escuchar escritura en el textarea
// markdownInput.addEventListener("input", updatePreview);

// // Escuchar cambios de red (crucial para la experiencia PWA)
// window.addEventListener("online", updateNetworkStatus);
// window.addEventListener("offline", updateNetworkStatus);

// // 7. Inicialización
// function init() {
//   updateNetworkStatus();
//   // Ponemos un texto por defecto para probar el parser
//   markdownInput.value =
//     "# Hola Bangle\n\nEmpieza a escribir tu **nota** aquí...";
//   updatePreview();
// }

// // Arrancar la app
// init();
