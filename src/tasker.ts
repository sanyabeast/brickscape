import { findIndex, indexOf } from "lodash"
import { logd } from "./utils"
import { monitoringData } from "./gui"


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
    _queue: Task[] = []
    _running: boolean = false
    _locked: boolean = false
    constructor({ rate }) {
        setInterval(() => {
            if (this._running) {
                this.tick()
            }
        }, 1000 / rate)
        this._done = this._done.bind(this)
    }
    tick() {
        if (this._locked === false) {
            let task = undefined

            if (task === undefined) {
                task = this._queue.pop()
            }

            if (task !== undefined) {
                // console.log('task found')
                this._locked = true
                task.run(this._done)
            }

            monitoringData.totalTasks = (this._queue.length).toString()
        } else {
            console.log('tasker is locked')
        }
    }
    flush(tags?: String[]) {
        tags = tags || []
        let cleanedNormalQueue = []

        this._queue.forEach((task) => {
            if (!task.match(tags)) {
                cleanedNormalQueue.push(task)
            }
        })

        this._queue = cleanedNormalQueue
        this._locked = false
    }
    add(runner: TaskFunction, tags: String[], replaceMatch: boolean = true): Task {
        let task = new Task({
            tags,
            runner
        })
        let targetQueue = this._queue;

        let index = replaceMatch ? findIndex(targetQueue, (el) => el.match(tags)) : -1

        if (index >= 0) {
            targetQueue[index] = task
        } else {
            targetQueue.unshift(task)
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