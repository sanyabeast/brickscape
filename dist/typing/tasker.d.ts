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
    _queue: Task[];
    _running: boolean;
    _locked: boolean;
    constructor({ rate }: {
        rate: any;
    });
    tick(): void;
    flush(tags?: String[]): void;
    add(runner: TaskFunction, tags: String[], replaceMatch?: boolean): Task;
    start(): void;
    stop(): void;
    _done(): void;
}
