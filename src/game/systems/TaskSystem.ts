import type { TaskType } from '../types';

export interface TaskSaveState {
  currentTask: TaskType | null;
  queue: TaskType[];
}

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

  load(state?: Partial<TaskSaveState>) {
    if (!state) return;
    this.currentTask = state.currentTask ?? null;
    this.queue.splice(0, this.queue.length, ...(state.queue ?? []));
  }

  serialize(): TaskSaveState {
    return {
      currentTask: this.currentTask,
      queue: [...this.queue],
    };
  }
}
