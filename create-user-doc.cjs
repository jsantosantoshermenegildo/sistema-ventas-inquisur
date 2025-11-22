/**
 * Crear documento de usuario en Firestore collection 'usuarios'
 */
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createUserDoc(email, role) {
  try {
    // Obtener usuario por email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.email} (UID: ${user.uid})`);

    // Crear documento en Firestore
    await db.collection('usuarios').doc(user.uid).set({
      email: user.email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Documento creado en Firestore: usuarios/${user.uid}`);
    console.log(`📋 Rol asignado: ${role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('❌ Uso: node create-user-doc.cjs <email> [role]');
  console.error('Ejemplo: node create-user-doc.cjs jhonatanbinner10@gmail.com admin');
  process.exit(1);
}

createUserDoc(email, role);
