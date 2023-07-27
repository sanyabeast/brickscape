import { findIndex, indexOf } from "lodash"
import { logd } from "./utils"


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

export enum QueueType {
    Normal,
    Reversed,
    Random
}

export class Tasker {
    _normalQueue: Task[] = []
    _reversedQueue: Task[] = []
    _randomQueue: Task[] = []
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
                let index = Math.floor(Math.random() * this._randomQueue.length);
                task = this._randomQueue[index]
                this._randomQueue.splice(index, 1)
            }

            if (task === undefined) {
                task = this._reversedQueue.shift()
            }

            if (task === undefined) {
                task = this._normalQueue.pop()
            }


            if (task !== undefined) {
                // console.log('task found')
                this._locked = true
                task.run(this._done)
            }
        } else {
            console.log('tasker is locked')
        }
    }
    add(runner: TaskFunction, tags: String[], type: QueueType = QueueType.Normal, replaceMatch: boolean = true): Task {
        let task = new Task({
            tags,
            runner
        })
        let targetQueue = this._normalQueue;
        switch (type) {
            case QueueType.Reversed: {
                targetQueue = this._reversedQueue;
                break
            }
            case QueueType.Random: {
                targetQueue = this._randomQueue;
                break
            }
        }

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
    flush(tags?: String[]) {
        tags = tags || []
        let cleanedNormalQueue = []
        let cleanedReversedQueue = []
        let cleanRandomQueue = []

        this._normalQueue.forEach((task) => {
            if (!task.match(tags)) {
                cleanedNormalQueue.push(task)
            }
        })

        this._reversedQueue.forEach((task) => {
            if (!task.match(tags)) {
                cleanedReversedQueue.push(task)
            }
        })

        this._randomQueue.forEach((task) => {
            if (!task.match(tags)) {
                cleanRandomQueue.push(task)
            }
        })

        this._normalQueue = cleanedNormalQueue
        this._reversedQueue = cleanedReversedQueue
        this._randomQueue = cleanRandomQueue

        // logd('Tasker.flush', `tasks removed from queue: normal - ${this._normalQueue.length - cleanedNormalQueue.length}; reversed - ${this._reversedQueue.length - cleanedReversedQueue.length}; random - ${this._randomQueue.length - cleanRandomQueue.length}`)

        this._locked = false
    }
    _done(): void {
        this._locked = false;
    }
}