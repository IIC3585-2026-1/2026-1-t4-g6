const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const admin = require("firebase-admin");

const PORT = process.env.PUSH_SERVER_PORT || 3000;
const SERVER_VERSION = "reminder-delay-v1";
const serviceAccountPath = path.resolve(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, "serviceAccountKey.json"),
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    `No existe la llave de Firebase Admin en ${serviceAccountPath}.
Descargala desde Firebase Console > Project settings > Service accounts > Generate new private key
y guardala como server/serviceAccountKey.json.`,
  );
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8001", "http://127.0.0.1:8001"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: SERVER_VERSION });
});

app.post("/send-note-push", async (req, res) => {
  const { token, noteTitle, noteId } = req.body || {};
  const reminderDelaySeconds = req.body?.reminderDelaySeconds ?? 10;

  if (!token) {
    return res.status(400).json({ error: "Falta el token FCM" });
  }

  const reminderDelayMs = Math.max(0, Number(reminderDelaySeconds) || 0) * 1000;
  const safeNoteTitle = noteTitle || "Nueva Nota";

  const sendPush = async ({ type, title, body, delaySeconds = 0 }) => {
    console.log("Ejecutando envio push:", {
      type,
      delaySeconds,
      noteId: noteId || null,
      noteTitle: safeNoteTitle,
    });

    const messageId = await admin.messaging().send({
      token,
      webpush: {
        headers: {
          Urgency: "high",
        },
      },
      data: {
        title,
        body,
        noteId: noteId || "",
        url: "/index.html",
        source: type,
      },
    });

    console.log("Push enviada por Firebase:", {
      messageId,
      type,
      delaySeconds,
      noteId: noteId || null,
      noteTitle: safeNoteTitle,
    });

    return messageId;
  };

  try {
    const immediateMessageId = await sendPush({
      type: "local-note-created",
      title: "Nueva nota creada",
      body: `Se creo "${safeNoteTitle}" en Banglen't.`,
    });

    if (reminderDelayMs > 0) {
      setTimeout(() => {
        console.log("Timer de recordatorio cumplido, enviando push...");
        sendPush({
          type: "local-note-reminder",
          title: "Recordatorio de nota",
          body: `Recuerda revisar "${safeNoteTitle}" en Banglen't.`,
          delaySeconds: reminderDelaySeconds,
        }).catch((error) => {
          console.error("Error enviando recordatorio push:", error);
        });
      }, reminderDelayMs);

      console.log("Recordatorio push programado:", {
        delaySeconds: reminderDelaySeconds,
        noteId: noteId || null,
        noteTitle: safeNoteTitle,
      });
    }

    res.json({
      ok: true,
      immediateMessageId,
      reminderScheduled: reminderDelayMs > 0,
      reminderDelaySeconds,
    });
  } catch (error) {
    console.error("Error enviando push con Firebase Admin:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor local de push escuchando en http://localhost:${PORT}`);
});
