/**
 * Script para asignar rol de admin a un usuario en Firebase Auth
 * 
 * PASO 1: Obtener Service Account Key desde Firebase Console:
 * 1. Ve a: https://console.firebase.google.com/project/davidnuevo-42c5a/settings/serviceaccounts/adminsdk
 * 2. Click en "Generar nueva clave privada"
 * 3. Guarda el archivo JSON descargado en la raíz del proyecto
 * 4. Renombra el archivo a: service-account-key.json
 * 
 * PASO 2: Ejecutar este script:
 * node set-admin-role.cjs <email-del-usuario>
 */

const admin = require('firebase-admin');

// Intentar cargar service account key
let serviceAccount;
try {
  serviceAccount = require('./service-account-key.json');
} catch (error) {
  console.error('\n❌ ERROR: No se encontró el archivo service-account-key.json');
  console.error('\n📋 INSTRUCCIONES:');
  console.error('1. Ve a: https://console.firebase.google.com/project/davidnuevo-42c5a/settings/serviceaccounts/adminsdk');
  console.error('2. Click en "Generar nueva clave privada"');
  console.error('3. Guarda el archivo descargado como "service-account-key.json" en la raíz del proyecto');
  console.error('4. Vuelve a ejecutar: node set-admin-role.cjs <email>\n');
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminRole(email) {
  try {
    // Obtener usuario por email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.email} (UID: ${user.uid})`);

    // Asignar custom claim "role: admin"
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`✅ Rol "admin" asignado a ${email}`);

    // Verificar
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('📋 Custom claims actuales:', updatedUser.customClaims);

    console.log('\n⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar para que el cambio tenga efecto.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Leer email de argumentos de línea de comandos
const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node set-admin-role.cjs <email-del-usuario>');
  console.error('Ejemplo: node set-admin-role.cjs jhonatanbinner10@gmail.com');
  process.exit(1);
}

setAdminRole(email);
