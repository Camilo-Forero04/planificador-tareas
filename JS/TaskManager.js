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
}