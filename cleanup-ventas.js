// cleanup-ventas.js - Eliminar solo ventas y proformas
import admin from "firebase-admin";
import serviceAccount from "./davidnuevo-42c5a-firebase-adminsdk-fbsvc-171a94f6f9.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://davidnuevo-42c5a.firebaseio.com"
});

const db = admin.firestore();

async function deleteCollection(collectionName) {
  console.log(`🗑️  Eliminando colección: ${collectionName}`);
  const docs = await db.collection(collectionName).get();
  let count = 0;
  for (const doc of docs.docs) {
    await doc.ref.delete();
    count++;
  }
  console.log(`✅ Eliminados ${count} documentos de ${collectionName}`);
}

async function cleanup() {
  try {
    // Solo limpiar ventas, proformas y counters
    await deleteCollection("ventas");
    await deleteCollection("proformas");
    await deleteCollection("counters");
    
    console.log("\n✅ HISTORIAL DE VENTAS ELIMINADO - Clientes y Productos se conservaron");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

cleanup();
