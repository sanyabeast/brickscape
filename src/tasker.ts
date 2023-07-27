

type TaskFunction = (done: () => void) => void

export class Tasker {
    _tasks: TaskFunction[] = []
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
            // let task = this._tasks.pop()
            let task = this._tasks.shift()
            if (task !== undefined) {
                console.log('task found')
                this._locked = true
                task(this._done)
            }
        } else {
            console.log('tasker is locked')
        }
    }
    add(task: TaskFunction) {
        this._tasks.unshift(task)
    }
    start() {
        this._running = true;
    }
    stop() {
        this._running = false;
    }
    flush(){
        this._tasks = []
        this._locked = false
    }
    _done(): void {
        this._locked = false;
    }
}