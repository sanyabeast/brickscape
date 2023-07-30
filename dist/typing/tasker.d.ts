export declare enum QueueType {
    Pre = 0,
    Normal = 1,
    Post = 2
}
export type TaskFunction = (done: () => void) => void;
export declare class Task {
    _tags: String[];
    _runner: TaskFunction;
    _canceled: boolean;
    _completed: boolean;
    constructor({ tags, runner }: {
        tags: any;
        runner: any;
    });
    run(done: () => void): Promise<void>;
    match(tags: String[]): boolean;
    cancel(): void;
}
export declare class Tasker {
    _queues: Task[][];
    _running: boolean;
    _locked: boolean;
    constructor({ rate }: {
        rate: any;
    });
    tick(): void;
    flush(tags?: String[]): void;
    add(runner: TaskFunction, tags: String[], queueType: QueueType, replaceMatch?: boolean): Task;
    start(): void;
    stop(): void;
    _done(): void;
}
export declare const tasker: Tasker;
