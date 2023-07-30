import { findIndex, indexOf } from "lodash"
import { logd } from "./utils"
import { monitoringData } from "./gui"
import { featureLevel } from "./state"

export enum QueueType {
    Pre,
    Normal,
    Post
}

export type TaskFunction = (done: () => void) => void

export class Task {
    _tags: String[] = null
    _runner: TaskFunction
    _canceled: boolean = false
    _completed: boolean = false
    constructor({ tags, runner }) {
        this._tags = tags || []
        this._runner = runner
    }
    async run(done: () => void) {
        if (this._canceled || this._completed) {
            done()
        } else {
            this._completed = true;
            this._runner(done)
        }
    }
    match(tags: String[]) {
        for (let i = 0; i < tags.length; i++) {
            let t = tags[i]
            if (this._tags.indexOf(t) < 0) {
                return false
            }
        }
        return true
    }
    cancel() {
        this._canceled = true
    }
}

export class Tasker {
    _queues: Task[][] = null
    _running: boolean = false
    _locked: boolean = false
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
    start() {
        this._running = true;
    }
    stop() {
        this._running = false;
    }
    _done(): void {
        this._locked = false;
    }
}

export const tasker = new Tasker({ rate: (featureLevel + 1) * 15 })