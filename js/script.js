"use strict"; //activa el modo estricto de js que de otra manera, podrian pasar inadvertidos

const STORAGE_KEY = "camiPlans_objetivos"; //clave para hacer la persistencia y traer los datos

const COLUMNAS_DESKTOP = 3; 
const COLUMNAS_MOBILE = 2;

const GRILLA_TOTAL = 15; //limite de tareas 15 prioridad baja, 3 prioridad media o 1 prioridad maxima

const BREAKPOINT_MOBILE = 576; 

const DIMENSIONES_TARJETAS = {
  "prioridad-maxima": {
    ancho: 2,
    alto: 3,
    espacios: 6,
  },

  "prioridad-media-ancha": {
    ancho: 2,
    alto: 1,
    espacios: 2,
  },

  "prioridad-media-alta": {
    ancho: 1,
    alto: 2,
    espacios: 2,
  },

  "prioridad-baja": {
    ancho: 1,
    alto: 1,
    espacios: 1,
  },

  // Compatibilidad con registros anteriores.
  "": {
    ancho: 1,
    alto: 1,
    espacios: 1,
  },
};


function inicializarAplicacion() {
  // ----------------------------------------------------------
  // Referencias DOM
  // ----------------------------------------------------------

  const inputObjetivo = document.getElementById("inputObjetivo");
  const inputMetrica = document.getElementById("inputMetrica");
  const inputAlcanzable = document.getElementById("inputAlcanzable");
  const inputRelevante = document.getElementById("inputRelevante");
  const inputTiempo = document.getElementById("inputTiempo");

  const barraPrioridad = document.getElementById("barraPrioridad");
  const textoPrioridadDetectada = document.getElementById(
    "textoPrioridadDetectada",
  );

  const btnAbrirModalTarea = document.getElementById("btnAbrirModalTarea");
  const btnCrearSmart = document.getElementById("btnCrearSmart");
  const contadorTareas = document.getElementById("contadorTareas");

  const contenedorObjetivos = document.getElementById("contenedorObjetivos");

  const alertaSmart = document.getElementById("alertaSmart");
  const alertaTarea = document.getElementById("alertaTarea");

  const elModalCrearTarea = document.getElementById("modalCrearTarea");
  const elModalVerSmart = document.getElementById("modalVerSmart");

  const selectVerbo = document.getElementById("selectVerbo");
  const inputDescTarea = document.getElementById("inputDescTarea");
  const checkContrato = document.getElementById("checkContrato");
  const btnGuardarTarea = document.getElementById("btnGuardarTarea");

  const tituloModalVer = document.getElementById("tituloModalVer");
  const cuerpoModalVer = document.getElementById("cuerpoModalVer");

  // ----------------------------------------------------------
  // Validar dependencias
  // ----------------------------------------------------------

  const elementosRequeridos = {
    inputObjetivo,
    inputMetrica,
    inputAlcanzable,
    inputRelevante,
    inputTiempo,
    barraPrioridad,
    textoPrioridadDetectada,
    btnAbrirModalTarea,
    btnCrearSmart,
    contadorTareas,
    contenedorObjetivos,
    alertaSmart,
    alertaTarea,
    elModalCrearTarea,
    elModalVerSmart,
    selectVerbo,
    inputDescTarea,
    checkContrato,
    btnGuardarTarea,
    tituloModalVer,
    cuerpoModalVer,
  };

  const faltantes = Object.entries(elementosRequeridos)
    .filter(([, elemento]) => !elemento)
    .map(([nombre]) => nombre);

  if (faltantes.length > 0) {
    console.error("Faltan elementos HTML:", faltantes);
    return;
  }

  if (!window.bootstrap || !window.Swal) {
    console.error(
      "Debes cargar Bootstrap JS y SweetAlert2 antes de este archivo.",
    );
    return;
  }

  // ----------------------------------------------------------
  // Modales Bootstrap
  // ----------------------------------------------------------

  const modalCrearTarea = new bootstrap.Modal(elModalCrearTarea);

  const modalVerSmart = new bootstrap.Modal(elModalVerSmart);

  // ----------------------------------------------------------
  // Estado
  // ----------------------------------------------------------

  let objetivosSmart = cargarObjetivos();

  let tareasTemporales = [];

  // ==========================================================
  // 3. CONFIGURACIÓN RESPONSIVE
  // ==========================================================

  function obtenerConfiguracionGrilla() {
    const esMobile = window.matchMedia(
      `(max-width: ${BREAKPOINT_MOBILE}px)`,
    ).matches;

    const columnas = esMobile ? COLUMNAS_MOBILE : COLUMNAS_DESKTOP;

    // En móvil utilizamos 8 filas para conservar
    // capacidad suficiente para los 15 espacios lógicos.

    const filas = Math.ceil(GRILLA_TOTAL / columnas);

    return {
      columnas,
      filas,
      total: GRILLA_TOTAL,
      esMobile,
    };
  }

  // ==========================================================
  // 4. UTILIDADES
  // ==========================================================

  function generarId() {
    return Date.now() + Math.random();
  }

  function escaparHTML(texto) {
    const div = document.createElement("div");

    div.textContent = String(texto ?? "");

    return div.innerHTML;
  }

  function normalizarClaseGrid(clase) {
    if (Object.prototype.hasOwnProperty.call(DIMENSIONES_TARJETAS, clase)) {
      return clase || "prioridad-baja";
    }

    return "prioridad-baja";
  }

  // ==========================================================
  // 5. LOCAL STORAGE
  // ==========================================================

  function cargarObjetivos() {
    try {
      const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (!Array.isArray(datos)) {
        return [];
      }

      return datos.map((objetivo, index) => {
        const tareas = Array.isArray(objetivo.tareas) ? objetivo.tareas : [];

        return {
          ...objetivo,

          id: objetivo.id ?? generarId(),

          numero: objetivo.numero ?? index + 1,

          objetivo: objetivo.objetivo ?? "",

          metrica: objetivo.metrica ?? "",

          alcanzable: objetivo.alcanzable ?? "",

          relevante: objetivo.relevante ?? "",

          tiempo: objetivo.tiempo ?? "",

          claseGrid: normalizarClaseGrid(objetivo.claseGrid),

          etiquetaPrioridad: objetivo.etiquetaPrioridad ?? "Prioridad baja",

          tareas: tareas.map((tarea) => ({
            ...tarea,

            id: tarea.id ?? generarId(),

            texto: tarea.texto ?? "",

            completada: Boolean(tarea.completada),
          })),
        };
      });
    } catch (error) {
      console.error("Error al cargar objetivos:", error);

      return [];
    }
  }

  function guardarYRenderizar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(objetivosSmart));

      renderizarGrilla();

      actualizarTextoPrioridad(
        calcularPrioridad(inputRelevante.value),
        inputRelevante.value.trim().length,
      );
    } catch (error) {
      console.error("Error al guardar objetivos:", error);

      mostrarAlerta(
        alertaSmart,
        "No se pudieron guardar los cambios.",
        "danger",
      );
    }
  }

  // ==========================================================
  // 6. ALERTAS
  // ==========================================================

  const iconosAlerta = {
    danger: "fa-circle-exclamation",

    warning: "fa-triangle-exclamation",

    success: "fa-circle-check",

    info: "fa-circle-info",
  };

  function mostrarAlerta(
    contenedor,
    mensaje,
    tipo = "danger",
    duracion = 4000,
  ) {
    if (!contenedor) return;

    clearTimeout(contenedor._timerAlerta);

    contenedor.innerHTML = "";

    const alerta = document.createElement("div");

    alerta.className = `alert alert-${tipo} alert-dismissible fade show
       d-flex align-items-center gap-2 mb-3`;

    alerta.setAttribute("role", "alert");

    const icono = document.createElement("i");

    icono.className = `fa-solid ${iconosAlerta[tipo] || iconosAlerta.info}`;

    const texto = document.createElement("div");

    texto.textContent = mensaje;

    const btnCerrar = document.createElement("button");

    btnCerrar.type = "button";

    btnCerrar.className = "btn-close";

    btnCerrar.setAttribute("data-bs-dismiss", "alert");

    btnCerrar.setAttribute("aria-label", "Cerrar");

    alerta.append(icono, texto, btnCerrar);

    contenedor.appendChild(alerta);

    if (duracion > 0) {
      contenedor._timerAlerta = setTimeout(() => {
        if (alerta.isConnected) {
          bootstrap.Alert.getOrCreateInstance(alerta).close();
        }
      }, duracion);
    }
  }

  function limpiarAlerta(contenedor) {
    if (!contenedor) return;

    clearTimeout(contenedor._timerAlerta);

    contenedor.innerHTML = "";
  }

  elModalCrearTarea.addEventListener("show.bs.modal", () =>
    limpiarAlerta(alertaTarea),
  );

  elModalCrearTarea.addEventListener("hidden.bs.modal", () =>
    limpiarAlerta(alertaTarea),
  );

  // ==========================================================
  // 7. SISTEMA DE PRIORIDADES
  // ==========================================================

  function calcularPrioridad(texto) {
    const longitud = texto.trim().length;

    if (longitud >= 100) {
      return {
        claseGrid: "prioridad-maxima",

        etiqueta: "Prioridad alta",

        porcentaje: "100%",

        colorBarra: "bg-danger",
      };
    }

    if (longitud >= 60) {
      return {
        claseGrid: "prioridad-media-alta",

        etiqueta: "Prioridad media (alta)",

        porcentaje: "70%",

        colorBarra: "bg-warning",
      };
    }

    if (longitud >= 30) {
      return {
        claseGrid: "prioridad-media-ancha",

        etiqueta: "Prioridad media (ancha)",

        porcentaje: "45%",

        colorBarra: "bg-info",
      };
    }

    return {
      claseGrid: "prioridad-baja",

      etiqueta: "Prioridad baja",

      porcentaje: "15%",

      colorBarra: "bg-secondary",
    };
  }

  // ==========================================================
  // 8. CAPACIDAD DE LA GRILLA
  // ==========================================================

  function espaciosDeObjetivos(objetivos) {
    return objetivos.reduce((total, objetivo) => {
      const dimensiones =
        DIMENSIONES_TARJETAS[normalizarClaseGrid(objetivo.claseGrid)];

      return total + dimensiones.espacios;
    }, 0);
  }

  function espaciosUsados() {
    return espaciosDeObjetivos(objetivosSmart);
  }

  function espaciosLibres() {
    return Math.max(0, GRILLA_TOTAL - espaciosUsados());
  }

  // ==========================================================
  // 9. ALGORITMO DE DISTRIBUCIÓN GEOMÉTRICA
  // ==========================================================

  function calcularDistribucion(objetivos) {
    const configuracion = obtenerConfiguracionGrilla();

    const { columnas, filas } = configuracion;

    const matriz = Array.from({ length: filas }, () =>
      Array(columnas).fill(false),
    );

    const posiciones = new Map();

    // --------------------------------------------------------
    // Validación de capacidad matemática
    // --------------------------------------------------------

    if (espaciosDeObjetivos(objetivos) > GRILLA_TOTAL) {
      return null;
    }

    // --------------------------------------------------------
    // Ordenar tarjetas por tamaño.
    // Primero se intentan ubicar las más grandes.
    // --------------------------------------------------------

    const objetivosOrdenados = [...objetivos].sort((a, b) => {
      const dimA = DIMENSIONES_TARJETAS[normalizarClaseGrid(a.claseGrid)];

      const dimB = DIMENSIONES_TARJETAS[normalizarClaseGrid(b.claseGrid)];

      return dimB.espacios - dimA.espacios;
    });

    const visitados = new Set();

    // --------------------------------------------------------
    // Backtracking
    // --------------------------------------------------------

    function buscarPosiciones(indice, mascara) {
      if (indice === objetivosOrdenados.length) {
        return true;
      }

      const estado = `${indice}-${mascara}`;

      if (visitados.has(estado)) {
        return false;
      }

      const objetivo = objetivosOrdenados[indice];

      const dimensiones =
        DIMENSIONES_TARJETAS[normalizarClaseGrid(objetivo.claseGrid)];

      const { ancho, alto } = dimensiones;

      // Buscar posibles posiciones.

      for (let fila = 0; fila <= filas - alto; fila++) {
        for (let columna = 0; columna <= columnas - ancho; columna++) {
          let mascaraTarjeta = 0;

          let disponible = true;

          // Comprobar todas las celdas necesarias.

          for (let y = fila; y < fila + alto; y++) {
            for (let x = columna; x < columna + ancho; x++) {
              if (matriz[y][x]) {
                disponible = false;

                break;
              }

              const bit = 1 << (y * columnas + x);

              mascaraTarjeta |= bit;
            }

            if (!disponible) break;
          }

          if (!disponible) continue;

          if ((mascara & mascaraTarjeta) !== 0) continue;

          // Reservar espacio.

          for (let y = fila; y < fila + alto; y++) {
            for (let x = columna; x < columna + ancho; x++) {
              matriz[y][x] = true;
            }
          }

          posiciones.set(objetivo.id, {
            fila,

            columna,

            ancho,

            alto,
          });

          // Intentar ubicar la siguiente tarjeta.

          if (buscarPosiciones(indice + 1, mascara | mascaraTarjeta)) {
            return true;
          }

          // Backtracking: liberar las celdas.

          for (let y = fila; y < fila + alto; y++) {
            for (let x = columna; x < columna + ancho; x++) {
              matriz[y][x] = false;
            }
          }

          posiciones.delete(objetivo.id);
        }
      }

      visitados.add(estado);

      return false;
    }

    const resultado = buscarPosiciones(0, 0);

    return resultado ? posiciones : null;
  }

  // ==========================================================
  // 10. TERMÓMETRO DE PRIORIDAD
  // ==========================================================

  function actualizarTextoPrioridad(info, longitud) {
    const libres = espaciosLibres();

    textoPrioridadDetectada.textContent =
      `Prioridad detectada: ${info.etiqueta.toUpperCase()} ` +
      `(${longitud} caracteres) · ` +
      `${libres}/${GRILLA_TOTAL} espacios libres`;
  }

  inputRelevante.addEventListener("input", (e) => {
    const info = calcularPrioridad(e.target.value);

    barraPrioridad.style.width = info.porcentaje;

    barraPrioridad.className = `progress-bar ${info.colorBarra}`;

    actualizarTextoPrioridad(info, e.target.value.trim().length);
  });

  // ==========================================================
  // 11. AUTOCOMPLETAR VERBO
  // ==========================================================

  selectVerbo.addEventListener("change", (e) => {
    if (e.target.value) {
      inputDescTarea.value = e.target.value;

      inputDescTarea.focus();
    }
  });

  // ==========================================================
  // 12. VALIDACIÓN SMART
  // ==========================================================

  const camposSmart = [
    {
      input: inputObjetivo,
      nombre: "Objetivo (¿Qué esperas lograr?)",
    },

    {
      input: inputMetrica,
      nombre: "Métrica",
    },

    {
      input: inputAlcanzable,
      nombre: "¿Es alcanzable?",
    },

    {
      input: inputRelevante,
      nombre: "¿Por qué te importa?",
    },

    {
      input: inputTiempo,
      nombre: "Tiempo límite",
    },
  ];

  camposSmart.forEach(({ input }) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });

    input.addEventListener("change", () => {
      input.classList.remove("is-invalid");
    });
  });

  btnAbrirModalTarea.addEventListener("click", () => {
    if (espaciosLibres() === 0) {
      mostrarAlerta(
        alertaSmart,

        "Tu grilla está completa. Termina o elimina algún objetivo.",

        "danger",

        6000,
      );

      return;
    }

    const faltantes = camposSmart.filter(({ input }) => !input.value.trim());

    camposSmart.forEach(({ input }) => {
      input.classList.remove("is-invalid");
    });

    faltantes.forEach(({ input }) => {
      input.classList.add("is-invalid");
    });

    if (faltantes.length > 0) {
      const nombres = faltantes.map((campo) => campo.nombre).join(", ");

      const mensaje =
        faltantes.length === 1
          ? `Falta completar este campo: ${nombres}.`
          : `Faltan ${faltantes.length} campos por completar: ${nombres}.`;

      mostrarAlerta(alertaSmart, mensaje, "warning", 6000);

      faltantes[0].input.focus();

      return;
    }

    limpiarAlerta(alertaSmart);

    modalCrearTarea.show();
  });

  // ==========================================================
  // 13. CREAR TAREAS TEMPORALES
  // ==========================================================

  btnGuardarTarea.addEventListener("click", () => {
    const textoTarea = inputDescTarea.value.trim();

    if (!textoTarea) {
      mostrarAlerta(
        alertaTarea,
        "Escribe la descripción de la tarea.",
        "danger",
      );

      inputDescTarea.focus();

      return;
    }

    if (!checkContrato.checked) {
      mostrarAlerta(
        alertaTarea,

        "Marca la casilla de compromiso de 48 horas.",

        "warning",
      );

      return;
    }

    tareasTemporales.push({
      id: generarId(),

      texto: textoTarea,

      completada: false,
    });

    contadorTareas.textContent = tareasTemporales.length;

    btnCrearSmart.classList.remove("oculto");

    inputDescTarea.value = "";

    selectVerbo.value = "";

    checkContrato.checked = false;

    modalCrearTarea.hide();

    mostrarAlerta(
      alertaSmart,

      `Tarea agregada. Llevas ${tareasTemporales.length} para este objetivo.`,

      "success",

      3000,
    );
  });

  // ==========================================================
  // 14. CREAR OBJETIVO SMART
  // ==========================================================

  btnCrearSmart.addEventListener("click", () => {
    if (tareasTemporales.length === 0) return;

    const infoPrioridad = calcularPrioridad(inputRelevante.value);

    const nuevoSmart = {
      id: generarId(),

      numero: objetivosSmart.length + 1,

      objetivo: inputObjetivo.value.trim(),

      metrica: inputMetrica.value.trim(),

      alcanzable: inputAlcanzable.value.trim(),

      relevante: inputRelevante.value.trim(),

      tiempo: inputTiempo.value,

      claseGrid: infoPrioridad.claseGrid,

      etiquetaPrioridad: infoPrioridad.etiqueta,

      tareas: [...tareasTemporales],
    };

    // Comprobar distribución antes de guardar.

    const distribucion = calcularDistribucion([...objetivosSmart, nuevoSmart]);

    if (!distribucion) {
      Swal.fire({
        title: "¡Grilla completa!",

        text:
          "Este objetivo no cabe en tu tablero. " +
          "Termina o elimina algún objetivo para liberar espacio.",

        icon: "warning",

        background: "#0b0c0c",

        color: "#f9f9f9",

        confirmButtonColor: "#bf2d59",
      });

      return;
    }

    objetivosSmart.push(nuevoSmart);

    guardarYRenderizar();

    limpiarFormulario();

    Swal.fire({
      title: "¡Objetivo SMART creado!",

      text:
        `Se asignó automáticamente con ` +
        `${infoPrioridad.etiqueta.toUpperCase()} en tu grilla.`,

      icon: "success",

      background: "#0b0c0c",

      color: "#f9f9f9",

      confirmButtonColor: "#bf2d59",

      confirmButtonText: "¡A darle!",
    });
  });

  // ==========================================================
  // 15. RENDERIZAR BENTO GRID
  // ==========================================================

  function renderizarGrilla() {
    contenedorObjetivos.innerHTML = "";

    console.log("========== BENTO GRID ==========");

    console.log("Objetivos:", objetivosSmart.length);

    console.log("Espacios utilizados:", espaciosUsados());

    console.log("Configuración:", obtenerConfiguracionGrilla());

    const posiciones = calcularDistribucion(objetivosSmart);

    if (!posiciones) {
      console.error("No se pudo encontrar una distribución válida.");

      contenedorObjetivos.innerHTML = `

        <div class="alert alert-warning">

          No se pudo distribuir los objetivos en la grilla.

          Revisa la capacidad y los datos guardados.

        </div>

      `;

      return;
    }

    objetivosSmart.forEach((item) => {
      let claseTitulo = "h6";

      let claseDetalle = "small";

      const claseGrid = normalizarClaseGrid(item.claseGrid);

      if (claseGrid === "prioridad-maxima") {
        claseTitulo = "display-6";

        claseDetalle = "fs-5";
      } else if (claseGrid.includes("prioridad-media")) {
        claseTitulo = "h4";

        claseDetalle = "";
      }

      const completadas = item.tareas.filter(
        (tarea) => tarea.completada,
      ).length;

      const card = document.createElement("div");

      card.className =
        `p-3 text-white card-custom border border-dark ` +
        `d-flex flex-column ${claseGrid}`;

      card.style.cursor = "pointer";

      const posicion = posiciones.get(item.id);

      if (!posicion) {
        console.error("No se encontró posición para:", item);

        return;
      }

      // Posicionamiento calculado por JavaScript.

      card.style.gridColumn = `${posicion.columna + 1} / span ${posicion.ancho}`;

      card.style.gridRow = `${posicion.fila + 1} / span ${posicion.alto}`;

      card.innerHTML = `

        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">

          <h6 class="${claseTitulo} mb-0">

            ${escaparHTML(item.objetivo)}

          </h6>

          <span class="badge bg-dark flex-shrink-0">

            ${completadas}/${item.tareas.length} tareas

          </span>

        </div>

        <div class="p-2 description-box d-flex flex-column h-100 ${claseDetalle}">

          <p class="mb-1">

            <strong>Métrica:</strong>

            ${escaparHTML(item.metrica)}

          </p>

          <p class="mb-1">

            <strong>¿Alcanzable?:</strong>

            ${escaparHTML(item.alcanzable)}

          </p>

          <p class="mb-2">

            <strong>¿Por qué importa?:</strong>

            ${escaparHTML(item.relevante)}

          </p>

          <div class="deadline rounded-4 text-center p-2 mt-auto align-self-end">

            <p class="fw-semibold mb-0 small text-white">

              ${escaparHTML(item.tiempo)}

            </p>

          </div>

        </div>

        <div class="align-self-end mt-auto pt-2">

          <p class="fw-semibold mb-0 small text-uppercase">

            ${escaparHTML(item.etiquetaPrioridad)}

          </p>

        </div>

      `;

      card.addEventListener("click", () => {
        mostrarModalDetalle(item.id);
      });

      contenedorObjetivos.appendChild(card);
    });

    console.log("Tarjetas renderizadas:", contenedorObjetivos.children.length);
  }

  // ==========================================================
  // 16. MODAL DETALLE
  // ==========================================================

  function mostrarModalDetalle(idSmart) {
    const item = objetivosSmart.find((obj) => obj.id === idSmart);

    if (!item) return;

    tituloModalVer.textContent = item.objetivo;

    cuerpoModalVer.dataset.smartId = String(item.id);

    const listaTareasHTML = item.tareas
      .map(
        (tarea) => `

      <li class="list-group-item bg-dark text-white border-secondary d-flex align-items-center gap-2">

        <input

          class="form-check-input mt-0"

          type="checkbox"

          data-tarea-id="${escaparHTML(tarea.id)}"

          ${tarea.completada ? "checked" : ""}

        />

        <span class="${
          tarea.completada ? "text-decoration-line-through text-secondary" : ""
        }">

          ${escaparHTML(tarea.texto)}

        </span>

      </li>

    `,
      )
      .join("");

    cuerpoModalVer.innerHTML = `

      <h6 class="font-pink">

        Tareas asociadas:

      </h6>

      <ul class="list-group mb-3">

        ${listaTareasHTML}

      </ul>

      <div id="alertaExtra"></div>

      <div class="input-group mb-2">

        <input

          type="text"

          id="nuevaTareaExtra"

          class="form-control"

          placeholder="Añadir otra tarea..."

        />

        <button

          class="btn btn-primary"

          type="button"

          data-action="agregar-tarea"

        >

          + Agregar

        </button>

      </div>

      <div class="d-flex justify-content-end mt-3 pt-3 border-top border-secondary">

        <button

          class="btn btn-outline-danger btn-sm rounded-5"

          type="button"

          data-action="eliminar-objetivo"

        >

          <i class="fa-solid fa-trash"></i>

          Eliminar objetivo

        </button>

      </div>

    `;

    modalVerSmart.show();
  }

  // ==========================================================
  // 17. EVENTOS DEL MODAL DE DETALLE
  // ==========================================================

  // Cambiar estado de una tarea.

  cuerpoModalVer.addEventListener("change", (e) => {
    if (!e.target.matches("[data-tarea-id]")) return;

    const idSmart = Number(cuerpoModalVer.dataset.smartId);

    const idTarea = Number(e.target.dataset.tareaId);

    const smart = objetivosSmart.find((obj) => obj.id === idSmart);

    if (!smart) return;

    const tarea = smart.tareas.find((t) => t.id === idTarea);

    if (!tarea) return;

    tarea.completada = e.target.checked;

    guardarYRenderizar();

    mostrarModalDetalle(idSmart);
  });

  // Agregar o eliminar tareas y objetivos.

  cuerpoModalVer.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-action]");

    if (!boton) return;

    const accion = boton.dataset.action;

    const idSmart = Number(cuerpoModalVer.dataset.smartId);

    if (accion === "agregar-tarea") {
      agregarTareaExtra(idSmart);
    }

    if (accion === "eliminar-objetivo") {
      eliminarObjetivo(idSmart);
    }
  });

  // ==========================================================
  // 18. AGREGAR TAREA EXTRA
  // ==========================================================

  function agregarTareaExtra(idSmart) {
    const inputExtra = document.getElementById("nuevaTareaExtra");

    const texto = inputExtra.value.trim();

    const alertaExtra = document.getElementById("alertaExtra");

    if (!texto) {
      mostrarAlerta(
        alertaExtra,

        "Escribe una tarea antes de agregar.",

        "danger",
      );

      inputExtra.focus();

      return;
    }

    const smart = objetivosSmart.find((obj) => obj.id === idSmart);

    if (!smart) return;

    smart.tareas.push({
      id: generarId(),

      texto,

      completada: false,
    });

    guardarYRenderizar();

    mostrarModalDetalle(idSmart);
  }

  // ==========================================================
  // 19. ELIMINAR OBJETIVO
  // ==========================================================

  function eliminarObjetivo(idSmart) {
    const item = objetivosSmart.find((obj) => obj.id === idSmart);

    if (!item) return;

    Swal.fire({
      title: "¿Eliminar este objetivo?",

      text:
        `"${item.objetivo}" y sus ${item.tareas.length} ` +
        "tarea(s) se borrarán. Esta acción no se puede deshacer.",

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sí, eliminar",

      cancelButtonText: "Cancelar",

      background: "#0b0c0c",

      color: "#f9f9f9",

      confirmButtonColor: "#bf2d59",

      cancelButtonColor: "#495057",
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;

      objetivosSmart = objetivosSmart.filter((obj) => obj.id !== idSmart);

      objetivosSmart.forEach((obj, index) => {
        obj.numero = index + 1;
      });

      modalVerSmart.hide();

      guardarYRenderizar();
    });
  }

  // ==========================================================
  // 20. LIMPIAR FORMULARIO
  // ==========================================================

  function limpiarFormulario() {
    inputObjetivo.value = "";

    inputMetrica.value = "";

    inputAlcanzable.value = "";

    inputRelevante.value = "";

    inputTiempo.value = "";

    tareasTemporales = [];

    contadorTareas.textContent = "0";

    btnCrearSmart.classList.add("oculto");

    limpiarAlerta(alertaSmart);

    barraPrioridad.style.width = "15%";

    barraPrioridad.className = "progress-bar bg-secondary";

    camposSmart.forEach(({ input }) => {
      input.classList.remove("is-invalid");
    });

    actualizarTextoPrioridad(calcularPrioridad(""), 0);
  }

  // ==========================================================
  // 21. ADAPTACIÓN RESPONSIVE
  // ==========================================================

  let temporizadorResize;

  window.addEventListener("resize", () => {
    clearTimeout(temporizadorResize);

    temporizadorResize = setTimeout(() => {
      renderizarGrilla();

      actualizarTextoPrioridad(
        calcularPrioridad(inputRelevante.value),
        inputRelevante.value.trim().length,
      );
    }, 150);
  });

  // ==========================================================
  // 22. INICIALIZACIÓN FINAL
  // ==========================================================

  renderizarGrilla();

  actualizarTextoPrioridad(calcularPrioridad(""), 0);

  contadorTareas.textContent = "0";

  btnCrearSmart.classList.add("oculto");

  console.log("Aplicación SMART inicializada correctamente.");
}

// ============================================================
// 23. ESPERAR A QUE EL DOM ESTÉ DISPONIBLE
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarAplicacion);
} else {
  inicializarAplicacion();
}
