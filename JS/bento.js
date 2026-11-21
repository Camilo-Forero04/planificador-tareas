"use strict";

function obtenerDiasRestantes(dueDate) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaLimite = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
}

function calcularClaseBento(task) {
  if (task.status === "COMPLETADA") {
    return "prioridad-baja";
  }

  const diasRestantes = obtenerDiasRestantes(task.dueDate);

  // Urgente: solo ocupa 2x2 si además tiene descripción larga; si no, 2x1
  if (diasRestantes <= 2) {
    return task.description.length > 100
      ? "prioridad-maxima"
      : "prioridad-media-ancha";
  }

  if (diasRestantes <= 7) {
    return task.description.length > 80
      ? "prioridad-media-alta"
      : "prioridad-media-ancha";
  }

  return "prioridad-baja";
}

function formatearFechaHumana(dueDate) {
  const dias = obtenerDiasRestantes(dueDate);

  if (dias < 0) return "Vencida";
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  if (dias <= 7) return `Faltan ${dias} días`;

  const fecha = new Date(`${dueDate}T00:00:00`);
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}