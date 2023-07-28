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
export declare enum QueueType {
    Normal = 0,
    Reversed = 1,
    Random = 2
}
export declare class Tasker {
    _normalQueue: Task[];
    _reversedQueue: Task[];
    _randomQueue: Task[];
    _running: boolean;
    _locked: boolean;
    constructor({ rate }: {
        rate: any;
    });
    tick(): void;
    add(runner: TaskFunction, tags: String[], type?: QueueType, replaceMatch?: boolean): Task;
    start(): void;
    stop(): void;
    flush(tags?: String[]): void;
    _done(): void;
}
