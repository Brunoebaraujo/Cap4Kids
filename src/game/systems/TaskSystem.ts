import type { TaskCommand } from '../types';

export class TaskSystem {
  currentTask: TaskCommand | null = null;
  readonly queue: TaskCommand[] = [];

  enqueue(task: TaskCommand) {
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
