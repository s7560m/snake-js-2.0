/**
 * Abstract away some of the canvas functions by making a custom canvas class
 */
class CanvasHandler {
    static canvas = document.getElementById('canvas')
    static canvasCtx = CanvasHandler.canvas.getContext('2d')

    static clear() {
        CanvasHandler.canvasCtx.fillStyle = "white"
        CanvasHandler.canvasCtx.fillRect(0, 0, 1000, 1000)
    }

    static draw(x, y, size, color) {
        if (color) CanvasHandler.canvasCtx.fillStyle = color
        else CanvasHandler.canvasCtx.fillStyle = "black"
        CanvasHandler.canvasCtx.fillRect(x, y, size, size)
    }

    static drawText(x, y, text, fontsize) {
        CanvasHandler.canvasCtx.fillStyle = "black"
        CanvasHandler.canvasCtx.font = fontsize
        CanvasHandler.canvasCtx.fillText(text, x, y)
    }
}

class ArenaFactory {

    static #arena = []
    static #size
    static #length
    static #height

    /**
     * Build an arena, returns arena array
     * @param size - The size of each square unit
     * @param length - The length (x) of the arena arena
     * @param height - The height (y) of the arena
     */
    static build(size, length, height) {
        this.#size = size
        for (let x = 0; x < length; x += size) {
            this.#arena.push({x, y: 0})
            this.#arena.push({x, y: height})
        }

        for (let y = 0; y < height; y += size) {
            this.#arena.push({x: 0, y})
            this.#arena.push({x: length, y})
        }

        this.#length = length
        this.#height = height

        this.#arena.push({x: length, y: height})

        this.draw()

        return this
    }

    static draw() {
        if (!this.#size || !this.#arena) throw("Arena has not been built yet")
        this.#arena.forEach(coords => {
            CanvasHandler.draw(coords.x, coords.y, this.#size)
        })
    }

    static getArenaBounds() {
        return {
            lowerX: this.#size,
            lowerY: this.#size,
            upperX: this.#length - this.#size,
            upperY: this.#height - this.#size
        }
    }

}

class SnakeFactory {
    static coords = []
    static direction
    static speed
    static size
    static opposingDirs = new Map()
    static isInitialized = false
    static pendingDirectionsQueue = []

    static build(x, y, speed, size, direction) {
        // already initialized
        if (this.isInitialized) return this

        this.coords.push({x, y})
        this.direction = direction
        this.size = size
        this.speed = speed
        this.opposingDirs.set("left", "right")
        this.opposingDirs.set("right", "left")
        this.opposingDirs.set("up", "down")
        this.opposingDirs.set("down", "up")
        this.isInitialized = true
        return this
    }

    /**
     * Get the head of the snake
     */
    static getHead() {
        return this.coords[this.coords.length - 1]
e    }

    static eat(growthSize) {
        this.counter = growthSize
    }

    /**
     * Set direction to new direction, and prevent opposing directions from occurring
     * by using a queue
     * @param direction
     */
    static setDirection(newDirection) {
        this.pendingDirectionsQueue.push(newDirection)
    }

    static update() {
        if (this.pendingDirectionsQueue.length) {

            if (this.opposingDirs.get(this.pendingDirectionsQueue[0]) === this.direction) {
                this.pendingDirectionsQueue.splice(0, 1)
                return
            }

            this.direction = this.pendingDirectionsQueue.splice(0, 1)[0]
        }
    }

    static moveHead() {
        switch (this.direction) {
            case "left":
                this.coords.push({x: this.coords[this.coords.length - 1].x - this.speed, y: this.coords[this.coords.length - 1].y})
                // this.coords[0].x -= this.speed
                break
            case "right":
                this.coords.push({x: this.coords[this.coords.length - 1].x + this.speed, y: this.coords[this.coords.length - 1].y})
                // this.coords[0].x += this.speed
                break
            case "up":
                this.coords.push({x: this.coords[this.coords.length - 1].x, y: this.coords[this.coords.length - 1].y - this.speed})
                // this.coords[0].y -= this.speed
                break
            case "down":
                this.coords.push({x: this.coords[this.coords.length - 1].x, y: this.coords[this.coords.length - 1].y + this.speed})
                // this.coords[0].y += this.speed
                break
            default:
                throw(`invalid direction for snake: ${this.direction}`)
        }

        if (this.counter > 0) {
            this.counter--
        } else {
            this.coords.splice(0, 1)
        }
    }

    static run() {
        this.update()
        this.moveHead()
        this.draw()
        return this
    }

    static reset(x, y, speed, size, direction) {
        this.coords = [{x, y}]
        this.speed = speed
        this.size = size
        this.direction = direction
    }

    static draw() {
        if (!this.coords) throw("Snake has not been initialized")
        this.coords.forEach((coord) => {
            CanvasHandler.draw(coord.x, coord.y, this.size)
        })
    }


}

class FoodEngine {
    static x
    static y
    static boxSize
    static rndX = Math.random()
    static rndY = Math.random()

    static generate(boxSize) {
        this.x = this.rndX * ArenaFactory.getArenaBounds().upperX - (this.rndX * ArenaFactory.getArenaBounds().upperX) % boxSize
        this.y = this.rndY * ArenaFactory.getArenaBounds().upperY - (this.rndY * ArenaFactory.getArenaBounds().upperY) % boxSize

        // manually ensure that x and y are within bounds
        if (this.x < boxSize) this.x += boxSize
        if (this.x >= ArenaFactory.getArenaBounds().upperX) this.x -= boxSize
        if (this.y < boxSize) this.y += boxSize
        if (this.y >= ArenaFactory.getArenaBounds().upperY) this.y -= boxSize

        this.boxSize = boxSize
    }

    static randomize() {
        this.rndX = Math.random()
        this.rndY = Math.random()
    }

    static draw() {
        CanvasHandler.draw(this.x, this.y, this.boxSize, "red")
    }

    static run() {
        this.draw()
    }
}

/**
 * CollisionEngine handles collisions between snake and obstacles
 */
class CollisionEngine {
    static hasCollidedWithArena() {
        return SnakeFactory.getHead().x < ArenaFactory.getArenaBounds().lowerX ||
            SnakeFactory.getHead().x > ArenaFactory.getArenaBounds().upperX ||
            SnakeFactory.getHead().y < ArenaFactory.getArenaBounds().lowerY ||
            SnakeFactory.getHead().y > ArenaFactory.getArenaBounds().upperY
    }

    static hasCollidedWithFood() {
        return SnakeFactory.getHead().x === FoodEngine.x && SnakeFactory.getHead().y === FoodEngine.y
    }

    static hasCollidedWithSelf() {
        return SnakeFactory.coords.some((coord, index) => coord.x === SnakeFactory.getHead().x && coord.y === SnakeFactory.getHead().y && index !== SnakeFactory.coords.length - 1)
    }
    static run(successHandlerCallback) {
        if (!successHandlerCallback) throw("CollisionEngine success handler callback must be defined")
        if (this.hasCollidedWithFood()) {
            SnakeFactory.eat(5)
            FoodEngine.randomize()
            FoodEngine.generate(20)
            GameHandler.score++
        }
        if (CollisionEngine.hasCollidedWithArena() || CollisionEngine.hasCollidedWithSelf()) {
            successHandlerCallback()
        }
    }
}

/**
 * GameHandler has a lifecycle.
 * Init -> initialize the game. Init the arena, set score to zero, build the start screen.
 * Run -> run the game and update the game at an interval
 * Death -> end the game and prompt user to reinitialize
 */
class GameHandler {

    static BOX_SIZE = 20
    static ARENA_HEIGHT = 500
    static ARENA_LENGTH = 500
    static SNAKE_START_X = 100
    static SNAKE_START_Y = 100
    static FRAME_RATE = 1000 / 15
    static scene = "init"

    static SCENES = {
        INIT: "init",
        LOOP: "loop",
        DEATH: "death"
    }

    static score = 0

    static buildGameScreen() {
        CanvasHandler.drawText(100, 100, "Snake 2.0", "40px Verdana")
        CanvasHandler.drawText(100, 150, "Press enter to continue", "20px Verdana")
    }

    static buildDeadScreen() {
        CanvasHandler.drawText(100, 100, "You died lmao skill issue L mans", "40px Verdana")
        CanvasHandler.drawText(100, 150, `Your score was ${this.score}`, "20px Verdana")
        CanvasHandler.drawText(100, 200, "Press enter to continue", "20px Verdana")
    }

    static drawScore() {
        CanvasHandler.drawText(this.ARENA_LENGTH + 100, 100, `Score: ${this.score}`)
        const highscore = window.localStorage.getItem("highscore")
        CanvasHandler.drawText(this.ARENA_LENGTH + 100, 150, `Highscore: ${(!highscore || this.score > highscore) ? this.score : highscore}`)
    }

    static setHighScore() {
        const highscore = window.localStorage.getItem("highscore")
        if (!highscore || this.score > highscore) window.localStorage.setItem("highscore", this.score)
    }

    /**
     * Lifecyle methods
     */
    static init() {
        CanvasHandler.clear()
        ArenaFactory.build(this.BOX_SIZE, this.ARENA_LENGTH, this.ARENA_HEIGHT)
        SnakeFactory.build(this.SNAKE_START_X, this.SNAKE_START_Y, this.BOX_SIZE, this.BOX_SIZE, "right")
        this.buildGameScreen()
        FoodEngine.randomize()
        FoodEngine.generate(this.BOX_SIZE)
    }

    static loop() {
        CanvasHandler.clear()
        ArenaFactory.draw()
        SnakeFactory.run()
        CollisionEngine.run(() => this.scene = this.SCENES.DEATH)
        FoodEngine.run()
        this.drawScore()
    }

    static death() {
        CanvasHandler.clear()
        ArenaFactory.draw()
        SnakeFactory.reset(this.SNAKE_START_X, this.SNAKE_START_Y, this.BOX_SIZE, this.BOX_SIZE, "right")
        this.setHighScore()
        this.buildDeadScreen()
    }

    static run() {
        this[GameHandler.scene]()
    }

    static handleKeyEvents(e) {
        switch (e.key) {
            case "Enter":
                if (GameHandler.scene === GameHandler.SCENES.INIT) {
                    GameHandler.score = 0
                    GameHandler.scene = GameHandler.SCENES.LOOP
                }

                if (GameHandler.scene === GameHandler.SCENES.DEATH) {
                    GameHandler.score = 0
                    GameHandler.scene = GameHandler.SCENES.LOOP
                }

                break
            case "ArrowLeft":
                SnakeFactory.setDirection("left")
                break
            case "ArrowRight":
                SnakeFactory.setDirection("right")
                break
            case "ArrowUp":
                SnakeFactory.setDirection("up")
                break
            case "ArrowDown":
                SnakeFactory.setDirection("down")
                break
        }
    }
}

window.addEventListener("keydown", GameHandler.handleKeyEvents)

setInterval(() => {
    GameHandler.run()
}, GameHandler.FRAME_RATE)