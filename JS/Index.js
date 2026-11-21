"use strict";

const taskManager = new TaskManager();
console.log(taskManager.tasks);

function validFormFieldInput(data) {
  return (
    data.name.trim() !== "" &&
    data.description.trim() !== "" &&
    data.dueDate.trim() !== ""
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const newTaskForm = document.querySelector("#newTaskForm");
  const alertaSmart = document.querySelector("#alertaSmart");
  const contenedorObjetivos = document.querySelector("#contenedorObjetivos");

  newTaskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.querySelector("#inputObjetivo").value;
    const description = document.querySelector("#inputRelevante").value;
    const dueDate = document.querySelector("#inputTiempo").value;

    const datos = { name, description, dueDate };

    if (!validFormFieldInput(datos)) {
      mostrarAlerta(
        "Por favor completa todos los campos obligatorios.",
        "warning",
      );
      return;
    }

    ocultarAlerta();

    taskManager.addTask(name.trim(), description.trim(), dueDate, "PORHACER");
    console.log(taskManager.tasks);

    newTaskForm.reset();
    renderizarTareas();
  });

  contenedorObjetivos.addEventListener("click", (event) => {
    const btnToggle = event.target.closest("[data-action='toggle-status']");
    if (!btnToggle) return;

    const id = btnToggle.dataset.taskId;
    taskManager.toggleTaskStatus(id);
    renderizarTareas();
  });

  function mostrarAlerta(mensaje, tipo = "danger") {
    alertaSmart.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `;
  }

  function ocultarAlerta() {
    alertaSmart.innerHTML = "";
  }

  const ETIQUETA_ESTADO = {
    PORHACER: "Por hacer",
    COMPLETADA: "Completada",
  };

  function renderizarTareas() {
    contenedorObjetivos.innerHTML = taskManager.tasks
      .map((task) => {
        const completada = task.status === "COMPLETADA";
        const claseBento = calcularClaseBento(task);
        const textoEstado = ETIQUETA_ESTADO[task.status] || task.status;
        const fechaTexto = formatearFechaHumana(task.dueDate);

        return `
        <div class="p-3 text-white card-custom border ${
          completada ? "border-success caso-cerrado" : "border-dark"
        } d-flex flex-column ${claseBento}">
          <h6 class="h6 mb-2 ${completada ? "text-decoration-line-through" : ""}">
            ${task.name}
          </h6>

          <div class="p-2 description-box d-flex flex-column small mb-3">
            <p class="mb-2 ${completada ? "text-decoration-line-through" : ""}">
              ${task.description}
            </p>
            <div class="deadline text-center px-3 py-1 align-self-end">
              <p class="fw-semibold mb-0 small">${fechaTexto}</p>
            </div>
          </div>

          <div class="mt-auto pt-1 d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <span class="badge ${completada ? "bg-success" : "bg-dark"}">
              ${textoEstado}
            </span>
            <button
              type="button"
              class="btn btn-sm ${completada ? "btn-success" : "btn-outline-light"} rounded-5"
              data-action="toggle-status"
              data-task-id="${task.id}"
            >
              <i class="fa-${completada ? "solid fa-circle-check" : "regular fa-circle"}"></i>
              ${completada ? "Completada" : "Marcar completada"}
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }
});
