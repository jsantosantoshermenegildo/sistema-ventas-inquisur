// forms.js — componentes de formularios mejorados

export function LoginForm() {
  return `
    <form id="loginForm" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
        <input type="email" id="loginEmail" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-600 focus:outline-none transition" placeholder="usuario@correo.com" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">🔒 Contraseña</label>
        <input type="password" id="loginPass" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-600 focus:outline-none transition" placeholder="••••••••" />
      </div>
      <div class="flex gap-3">
        <button type="submit" class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg font-semibold transition">Iniciar sesión</button>
        <button type="button" id="btnShowRegister" class="text-indigo-600 hover:text-indigo-700 font-semibold">Crear cuenta</button>
      </div>
    </form>
  `;
}

export function RegisterForm() {
  return `
    <form id="registerForm" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
        <input type="email" id="regEmail" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-green-600 focus:outline-none transition" placeholder="usuario@correo.com" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">🔒 Contraseña</label>
        <input type="password" id="regPass" required class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-green-600 focus:outline-none transition" placeholder="mínimo 6 caracteres" />
      </div>
      <div class="flex gap-3">
        <button type="submit" class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg font-semibold transition">Registrar</button>
        <button type="button" id="btnShowLogin" class="text-indigo-600 hover:text-indigo-700 font-semibold">Ya tengo cuenta</button>
      </div>
    </form>
  `;
}
