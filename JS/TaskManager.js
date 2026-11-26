class TaskManager {
  constructor(currentId = 0) {
    this.tasks = [];
    this.currentId = currentId;
  }

  addTask(name, description, dueDate, status = "PORHACER", extras = {}) {
    this.currentId++;

    const nuevaTarea = {
      id: this.currentId,
      name: name,
      description: description,
      dueDate: dueDate,
      status: "PORHACER",
      ...extras, 
    };

    this.tasks.push(nuevaTarea);
    return nuevaTarea;
  }
  toggleTaskStatus(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = task.status === "COMPLETADA" ? "PORHACER" : "COMPLETADA";
  }

  deleteTask(taskId) {
    const newTasks = [];
    for (let task of this.tasks) {
      if (task.id !== taskId) {
        newTasks.push(task);
      }
    }
    this.tasks = newTasks;
  }

  save() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
    localStorage.setItem("currentId", String(this.currentId));
  }

  load() {
    const tasks = localStorage.getItem("tasks");
    if (tasks) {
      this.tasks = JSON.parse(tasks);
    }
    const currentId = localStorage.getItem("currentId");
    if (currentId) {
      this.currentId = Number(currentId);
    }
  }
}