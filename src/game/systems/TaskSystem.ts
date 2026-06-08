import type { TaskType } from '../types';

export class TaskSystem {
  currentTask: TaskType | null = null;
  readonly queue: TaskType[] = [];

  enqueue(task: TaskType) {
    if (this.currentTask) {
      this.queue.push(task);
      return false;
    }

    this.currentTask = task;
    return true;
  }

  completeCurrent() {
    this.currentTask = this.queue.shift() ?? null;
    return this.currentTask;
  }
}
