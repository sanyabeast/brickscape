import { findIndex, indexOf } from "lodash"
import { logd } from "./utils"
import { monitoringData } from "./gui"
import { featureLevel } from "./state"

/**
 * Enumeration representing the type of queue for a task.
 */
export enum QueueType {
    Pre,     // Pre-queue for tasks that should be executed before other tasks.
    Normal,  // Normal queue for tasks that should be executed in a regular order.
    Post     // Post-queue for tasks that should be executed after other tasks.
}

/**
 * Type for the function that represents a task to be executed.
 */
export type TaskFunction = (done: () => void) => void

/**
 * Represents a single task to be executed.
 */
export class Task {
    _tags: String[] = null
    _runner: TaskFunction
    _canceled: boolean = false
    _completed: boolean = false

    /**
     * Constructor for Task class.
     * @param {Object} options - Options object for the task.
     * @param {string[]} options.tags - Tags associated with the task.
     * @param {TaskFunction} options.runner - Function representing the task to be executed.
     */
    constructor({ tags, runner }) {
        this._tags = tags || []
        this._runner = runner
    }

    /**
     * Run the task.
     * @param {Function} done - Callback function to be called when the task is completed.
     */
    async run(done: () => void) {
        if (this._canceled || this._completed) {
            done()
        } else {
            this._completed = true;
            this._runner(done)
        }
    }

    /**
     * Check if the task matches the provided tags.
     * @param {string[]} tags - Tags to check against.
     * @returns {boolean} - True if the task matches all the tags, false otherwise.
     */
    match(tags: String[]) {
        for (let i = 0; i < tags.length; i++) {
            let t = tags[i]
            if (this._tags.indexOf(t) < 0) {
                return false
            }
        }
        return true
    }

    /**
     * Cancel the task.
     */
    cancel() {
        this._canceled = true
    }
}

/**
 * Represents a task manager that handles task queues and execution.
 */
export class Tasker {
    _queues: Task[][] = null
    _running: boolean = false
    _locked: boolean = false

    /**
     * Constructor for Tasker class.
     * @param {Object} options - Options object for the tasker.
     * @param {number} options.rate - The rate at which tasks should be executed (in milliseconds).
     */
    constructor({ rate }) {
        this._queues = [
            [],
            [],
            []
        ]
        setInterval(() => {
            if (this._running) {
                this.tick()
            }
        }, 1000 / rate)
        this._done = this._done.bind(this)
    }

    /**
     * Execute the tasks in the queues.
     */
    tick() {
        if (this._locked === false) {
            for (let q = 0; q < this._queues.length; q++) {
                let task = this._queues[q].pop()
                if (task) {
                    this._locked = true
                    task.run(this._done)
                    break;
                }
            }
        } else {
            console.log('tasker is locked')
        }

        monitoringData.totalTasks = (this._queues[0].length + this._queues[1].length + this._queues[2].length).toString()
    }

    /**
     * Flush the tasks in the queues based on tags.
     * @param {string[]} tags - Tags to filter the tasks to be flushed.
     */
    flush(tags?: String[]) {
        tags = tags || []

        this._queues.forEach((queue, index) => {
            let cleaned = []
            queue.forEach((task) => {
                if (!task.match(tags)) {
                    cleaned.push(task)
                }
            })

            this._queues[index] = cleaned
        })

        this._locked = false
    }

    /**
     * Add a new task to the appropriate queue.
     * @param {TaskFunction} runner - Function representing the task to be executed.
     * @param {string[]} tags - Tags associated with the task.
     * @param {QueueType} queueType - The type of queue for the task.
     * @param {boolean} replaceMatch - If true, replace any existing task in the queue that matches the provided tags.
     * @returns {Task} - The newly created task.
     */
    add(runner: TaskFunction, tags: String[], queueType: QueueType, replaceMatch: boolean = true): Task {
        let task = new Task({
            tags,
            runner
        })

        let queue = this._queues[queueType];

        let index = replaceMatch ? findIndex(queue, (el) => el.match(tags)) : -1

        if (index >= 0) {
            queue[index] = task
        } else {
            queue.unshift(task)
        }
        return task
    }

    /**
     * Start executing the tasks in the queues.
     */
    start() {
        this._running = true;
    }

    /**
     * Stop executing the tasks in the queues.
     */
    stop() {
        this._running = false;
    }

    /**
     * Callback function to unlock the tasker after a task is completed.
     * @private
     */
    _done(): void {
        this._locked = false;
    }
}

/**
 * The global tasker instance that can be used throughout the application.
 */
export const tasker = new Tasker({ rate: (featureLevel + 1) * 15 })