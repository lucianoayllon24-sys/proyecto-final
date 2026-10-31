// ----- Datos (edita aquí películas, horas, salas y precios) -----
const SALAS = {
  1: { nombre: "Sala 1 · Prime",    filas: 7, columnas: 10, pasillo: 5, precio: 18000 },
  2: { nombre: "Sala 2 · VIP",      filas: 5, columnas: 8,  pasillo: 4, precio: 25000 },
  3: { nombre: "Sala 3 · Kids",     filas: 5, columnas: 8,  pasillo: 4, precio: 10000 },
  4: { nombre: "Sala 4 · Estándar", filas: 6, columnas: 10, pasillo: 5, precio: 12000 }
};

const PELICULAS = [
  { id: 1, titulo: "El Coyote vs. ACME", genero: "Acción",    duracion: "2h 08min", poster: "../img/CoyotevsAcne.jpg", sala: 1, horas: ["14:30", "17:15", "20:00"] },
  { id: 2, titulo: "Avengers: Doomsday",  genero: "Terror",    duracion: "1h 42min", poster: "../img/Doomsday.jpg", sala: 2, horas: ["16:00", "18:30", "21:00"] },
  { id: 3, titulo: "Avengers: Endgame", genero: "Animación", duracion: "1h 36min", poster: "../img/Endgame.jpg", sala: 3, horas: ["11:00", "13:15", "15:30"] },
  { id: 4, titulo: "Spider-Man: Brand New Day",genero: "Comedia",   duracion: "1h 51min", poster: "../img/Spiderman.jpg", sala: 4, horas: ["15:00", "17:20", "19:40"] },
];

const DIAS_DISPONIBLES = 3;   // hoy + los 2 días siguientes
const MAX_BUTACAS = 8;        // máximo por compra
const LS_KEY = "cineverse_reservas";

// ----- Estado de la compra -----
let peli = null, fecha = null, hora = null, elegidas = [];

// ----- Atajos -----
const $ = (id) => document.getElementById(id);
const dinero = (n) => "$" + n.toLocaleString("es-CO");
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ----- Reservas guardadas en el navegador (butacas ya compradas) -----
function leerReservas() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
}
function guardarReservas(r) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch (e) { /* sin almacenamiento */ }
}
const clave = () => `${peli.id}|${fecha.iso}|${hora}`;

// Butacas "ocupadas de antemano": siempre las mismas para la misma función
function semilla(texto) {
  let h = 2166136261;
  for (const c of texto) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function butacasOcupadas() {
  const sala = SALAS[peli.sala];
  const azar = semilla(clave());
  const ocupadas = new Set();
  for (let f = 0; f < sala.filas; f++)
    for (let c = 1; c <= sala.columnas; c++)
      if (azar() < 0.22) ocupadas.add(String.fromCharCode(65 + f) + c);
  (leerReservas()[clave()] || []).forEach((b) => ocupadas.add(b));
  return ocupadas;
}

// ----- 1. Películas -----
function dibujarPeliculas() {
  $("peliculas").innerHTML = PELICULAS.map((p) => `
    <article data-id="${p.id}">
      <img src="${p.poster}" alt="Póster de ${p.titulo}" />
      <h3>${p.titulo}</h3>
      <p>${p.genero} · ${p.duracion}</p>
      <p class="times">${p.horas.join(" · ")}</p>
      <button type="button" class="btn" data-id="${p.id}">Comprar entradas</button>
    </article>`).join("");
}

$("peliculas").addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-id]");
  if (boton) abrirReserva(Number(boton.dataset.id));
});

// ----- Panel de compra -----
function abrirReserva(id) {
  peli = PELICULAS.find((p) => p.id === id);
  fecha = hora = null;
  elegidas = [];

  document.querySelectorAll(".movies article").forEach((a) => a.classList.toggle("elegida", Number(a.dataset.id) === id));
  $("rPoster").src = peli.poster;
  $("rPoster").alt = "Póster de " + peli.titulo;
  $("rTitulo").textContent = peli.titulo;
  $("rSala").textContent = `${SALAS[peli.sala].nombre} · ${dinero(SALAS[peli.sala].precio)} por entrada`;

  $("pasos").hidden = false;
  $("ticket").hidden = true;
  $("pasoHora").hidden = true;
  $("pasoButacas").hidden = true;
  $("reserva").hidden = false;

  dibujarFechas();
  $("reserva").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarReserva() {
  $("reserva").hidden = true;
  document.querySelectorAll(".movies article").forEach((a) => a.classList.remove("elegida"));
  peli = fecha = hora = null;
  elegidas = [];
}
$("cerrar").addEventListener("click", cerrarReserva);
$("otra").addEventListener("click", cerrarReserva);

// ----- 2. Fechas: hoy y los 2 días siguientes -----
function dibujarFechas() {
  const etiquetas = ["Hoy", "Mañana", "Pasado mañana"];
  const cont = $("fechas");
  cont.innerHTML = "";
  for (let i = 0; i < DIAS_DISPONIBLES; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const texto = mayus(d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" }));
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opcion";
    b.innerHTML = `${texto}<small>${etiquetas[i]}</small>`;
    b.addEventListener("click", () => {
      fecha = { iso, texto };
      hora = null;
      elegidas = [];
      marcar(cont, b);
      dibujarHoras();
    });
    cont.appendChild(b);
  }
}

// ----- 3. Horas: las mismas 3 horas todos los días -----
function dibujarHoras() {
  const cont = $("horas");
  cont.innerHTML = "";
  peli.horas.forEach((h) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opcion";
    b.textContent = h;
    b.addEventListener("click", () => {
      hora = h;
      elegidas = [];
      marcar(cont, b);
      dibujarMapa();
    });
    cont.appendChild(b);
  });
  $("pasoHora").hidden = false;
  $("pasoButacas").hidden = true;
}

function marcar(contenedor, boton) {
  contenedor.querySelectorAll(".opcion").forEach((o) => o.classList.remove("activa"));
  boton.classList.add("activa");
}

// ----- 4. Butacas de la sala -----
function dibujarMapa() {
  const sala = SALAS[peli.sala];
  const ocupadas = butacasOcupadas();
  const mapa = $("mapa");
  mapa.innerHTML = "";

  for (let f = 0; f < sala.filas; f++) {
    const letra = String.fromCharCode(65 + f);
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.innerHTML = `<span class="fila-letra">${letra}</span>`;
    for (let c = 1; c <= sala.columnas; c++) {
      const id = letra + c;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "butaca" + (c === sala.pasillo ? " pasillo" : "");
      b.textContent = c;
      b.dataset.id = id;
      b.setAttribute("aria-label", `Fila ${letra}, butaca ${c}`);
      if (ocupadas.has(id)) {
        b.disabled = true;
        b.setAttribute("aria-label", `Fila ${letra}, butaca ${c} (ocupada)`);
      }
      b.addEventListener("click", () => alternarButaca(id, b));
      fila.appendChild(b);
    }
    mapa.appendChild(fila);
  }
  $("mensaje").textContent = "";
  actualizarResumen();
  $("pasoButacas").hidden = false;
}

function alternarButaca(id, boton) {
  const i = elegidas.indexOf(id);
  if (i >= 0) {
    elegidas.splice(i, 1);
    boton.classList.remove("elegida");
    $("mensaje").textContent = "";
  } else {
    if (elegidas.length >= MAX_BUTACAS) {
      $("mensaje").textContent = `Máximo ${MAX_BUTACAS} butacas por compra.`;
      return;
    }
    elegidas.push(id);
    boton.classList.add("elegida");
    $("mensaje").textContent = "";
  }
  actualizarResumen();
}

function ordenar(lista) {
  return [...lista].sort((a, b) => a[0].localeCompare(b[0]) || parseInt(a.slice(1)) - parseInt(b.slice(1)));
}

function actualizarResumen() {
  const precio = SALAS[peli.sala].precio;
  if (!elegidas.length) {
    $("resumenTexto").textContent = "Aún no has elegido butacas.";
    $("confirmar").disabled = true;
    return;
  }
  $("resumenTexto").textContent =
    `Butacas: ${ordenar(elegidas).join(", ")} · ${elegidas.length} × ${dinero(precio)} = ${dinero(elegidas.length * precio)}`;
  $("confirmar").disabled = false;
}

// ----- 5. Confirmar compra -----
$("confirmar").addEventListener("click", () => {
  if (!elegidas.length) return;
  const sala = SALAS[peli.sala];
  const butacas = ordenar(elegidas);

  // Guardar: esas butacas quedan ocupadas para esta función
  const reservas = leerReservas();
  reservas[clave()] = [...(reservas[clave()] || []), ...butacas];
  guardarReservas(reservas);

  const codigo = "CV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  $("ticketDatos").innerHTML = `
    <p class="codigo">${codigo}</p>
    <p><b>Película:</b> ${peli.titulo}</p>
    <p><b>Fecha:</b> ${fecha.texto}</p>
    <p><b>Hora:</b> ${hora}</p>
    <p><b>Sala:</b> ${sala.nombre}</p>
    <p><b>Butacas:</b> ${butacas.join(", ")}</p>
    <p><b>Total:</b> ${dinero(butacas.length * sala.precio)}</p>`;

  $("pasos").hidden = true;
  $("ticket").hidden = false;
  $("reserva").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ----- Inicio -----
dibujarPeliculas();
