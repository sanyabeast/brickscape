/**
 * Enumeration representing the type of queue for a task.
 */
export declare enum QueueType {
    Pre = 0,
    Normal = 1,
    Post = 2
}
/**
 * Type for the function that represents a task to be executed.
 */
export type TaskFunction = (done: () => void) => void;
/**
 * Represents a single task to be executed.
 */
export declare class Task {
    _tags: String[];
    _runner: TaskFunction;
    _canceled: boolean;
    _completed: boolean;
    /**
     * Constructor for Task class.
     * @param {Object} options - Options object for the task.
     * @param {string[]} options.tags - Tags associated with the task.
     * @param {TaskFunction} options.runner - Function representing the task to be executed.
     */
    constructor({ tags, runner }: {
        tags: any;
        runner: any;
    });
    /**
     * Run the task.
     * @param {Function} done - Callback function to be called when the task is completed.
     */
    run(done: () => void): Promise<void>;
    /**
     * Check if the task matches the provided tags.
     * @param {string[]} tags - Tags to check against.
     * @returns {boolean} - True if the task matches all the tags, false otherwise.
     */
    match(tags: String[]): boolean;
    /**
     * Cancel the task.
     */
    cancel(): void;
}
/**
 * Represents a task manager that handles task queues and execution.
 */
export declare class Tasker {
    _queues: Task[][];
    _running: boolean;
    _locked: boolean;
    /**
     * Constructor for Tasker class.
     * @param {Object} options - Options object for the tasker.
     * @param {number} options.rate - The rate at which tasks should be executed (in milliseconds).
     */
    constructor({ rate }: {
        rate: any;
    });
    /**
     * Execute the tasks in the queues.
     */
    tick(): void;
    /**
     * Flush the tasks in the queues based on tags.
     * @param {string[]} tags - Tags to filter the tasks to be flushed.
     */
    flush(tags?: String[]): void;
    /**
     * Add a new task to the appropriate queue.
     * @param {TaskFunction} runner - Function representing the task to be executed.
     * @param {string[]} tags - Tags associated with the task.
     * @param {QueueType} queueType - The type of queue for the task.
     * @param {boolean} replaceMatch - If true, replace any existing task in the queue that matches the provided tags.
     * @returns {Task} - The newly created task.
     */
    add(runner: TaskFunction, tags: String[], queueType: QueueType, replaceMatch?: boolean): Task;
    /**
     * Start executing the tasks in the queues.
     */
    start(): void;
    /**
     * Stop executing the tasks in the queues.
     */
    stop(): void;
    /**
     * Callback function to unlock the tasker after a task is completed.
     * @private
     */
    _done(): void;
}
/**
 * The global tasker instance that can be used throughout the application.
 */
export declare const tasker: Tasker;
