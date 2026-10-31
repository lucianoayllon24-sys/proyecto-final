// Validación sencilla del formulario de registro
// (no guarda datos: aquí en caso que lo hagamos oficial en un futuro lo conectaría a un servidor)
const form = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clave = document.getElementById("clave").value;

  let error = "";
  if (nombre.length < 3) error = "Escribe tu nombre completo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) error = "Ingresa un correo válido.";
  else if (clave.length < 6) error = "La contraseña debe tener al menos 6 caracteres.";

  mensaje.className = error ? "error" : "ok";
  mensaje.textContent = error || "¡Registro exitoso! Bienvenido a Cineverse 🎬";
  if (!error) form.reset();
});
