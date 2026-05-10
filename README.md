# Banglen't - Progressive Web App


## Estructura relevante

```text
.
├── index.html
├── manifest.json
├── sw.js
├── css/
├── js/
│   ├── app.js
│   ├── config/firebase-config.js
│   ├── controller/
│   ├── models/
│   ├── services/notifications.js
│   ├── utils/
│   └── views/
└── server/
    ├── push-server.js
    ├── serviceAccountKey.example.json
    └── serviceAccountKey.json
```


## Instalacion

Instalar dependencias:

```bash
npm install
```

## Configuracion de Firebase

### Frontend

La configuracion publica de Firebase esta en:

```text
js/config/firebase-config.js
```

Ese archivo contiene los datos de la Web App de Firebase y la VAPID key de Cloud Messaging.

Sirve para:

- Inicializar Firebase en el navegador.
- Obtener el token FCM del navegador.
- Recibir notificaciones push.

### Servidor local

Para enviar push reales desde localhost se usa:

```text
server/push-server.js
```

Este servidor necesita una llave privada de Firebase Admin:

```text
server/serviceAccountKey.json
```

Para obtenerla:

1. Ir a Firebase Console.
2. Abrir el proyecto.
3. Ir a Project settings.
4. Entrar a Service accounts.
5. Presionar Generate new private key.
6. Guardar el JSON descargado como `server/serviceAccountKey.json`.

Importante: `server/serviceAccountKey.json` no debe subirse al repositorio.

## Como correr la app

Se necesitan dos terminales.

### Terminal 1: frontend PWA

```bash
npm run serve
```

Esto levanta la app en:

```text
http://localhost:8001
```

### Terminal 2: servidor local de push

```bash
npm run push-server
```

Esto levanta el servidor en:

```text
http://localhost:3000
```

Puedes revisar que este activo con:

```bash
curl http://localhost:3000/health
```

## Flujo de notificaciones

1. El usuario abre Banglen't en `http://localhost:8001`.
2. Presiona **Activar notificaciones**.
3. El navegador pide permiso.
4. Firebase genera un token FCM.
5. Al crear una nota, el frontend manda el token y datos de la nota al servidor local.
6. El servidor local usa Firebase Admin SDK para enviar una push inmediata.
7. El servidor programa otra push 10 segundos despues como recordatorio.
8. El Service Worker recibe las notificaciones en background y las muestra.

## Como probar las push

1. Correr `npm run serve`.
2. Correr `npm run push-server`.
3. Abrir `http://localhost:8001`.
4. Presionar **Activar notificaciones**.
5. Aceptar el permiso del navegador.
6. Crear una nota con **+ Nueva Nota**.
7. Deberia llegar una notificacion inmediata.
8. Diez segundos despues deberia llegar una segunda notificacion de recordatorio.

En la terminal del servidor deberias ver logs como:

```text
Ejecutando envio push
Push enviada por Firebase
Recordatorio push programado
Timer de recordatorio cumplido, enviando push...
Push enviada por Firebase
```

## Como probar offline

1. Abrir la app una vez online.
2. Crear o editar una nota.
3. Abrir DevTools.
4. Ir a Application > Service Workers o Network.
5. Activar modo Offline.
6. Recargar la pagina.
7. La app deberia cargar desde cache y mantener las notas locales.

## Como probar instalabilidad

1. Abrir `http://localhost:8001` en Chrome.
2. Ir a DevTools > Application > Manifest.
3. Confirmar que el manifest carga correctamente.
4. Instalar la app desde el icono de instalacion de Chrome.
5. Abrir Banglen't instalada y verificar que corre en modo standalone.

## Scripts disponibles

```bash
npm run serve
```

Levanta el frontend en `localhost:8001`.

```bash
npm run push-server
```

Levanta el servidor local de push en `localhost:3000`.

## Notas importantes

- El frontend puede obtener y recibir notificaciones, pero no debe enviar push directamente.
- El envio de push se hace desde `server/push-server.js` porque usa credenciales privadas de Firebase Admin.
- `firebase-config.js` puede estar en el frontend porque no contiene la llave privada de servidor.
- `serviceAccountKey.json` es privado y debe permanecer fuera de Git.
- Para que el recordatorio de 10 segundos funcione, `npm run push-server` debe seguir corriendo.

## Referencias

- https://firebase.google.com/docs/cloud-messaging
- https://firebase.google.com/docs/admin/setup
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- https://www.loginradius.com/blog/engineering/build-pwa-using-vanilla-javascript
