// https://stackoverflow.com/a/1781750/2234742
function touchHandler(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;        
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }

    // initMouseEvent(type, canBubble, cancelable, view, clickCount, 
    //                screenX, screenY, clientX, clientY, ctrlKey, 
    //                altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                                  first.screenX, first.screenY, 
                                  first.clientX, first.clientY, false, 
                                  false, false, false, 0/*left*/, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

document.addEventListener("touchstart", touchHandler, true);
document.addEventListener("touchmove", touchHandler, true);
document.addEventListener("touchend", touchHandler, true);
document.addEventListener("touchcancel", touchHandler, true);

// fetchyboy

window.FetchAnimations = {
    walkRight: {
        frames: [
            {i: 4, d: 100},
            {i: 5, d: 100},
            {i: 6, d: 100},
            {i: 7, d: 100},
        ]
    },
    walkUp: {
        frames: [
            {i: 8, d: 100},
            {i: 9, d: 100},
            {i: 10, d: 100},
            {i: 11, d: 100},
        ]
    },
    walkDown: {
        frames: [
            {i: 0, d: 100},
            {i: 1, d: 100},
            {i: 2, d: 100},
            {i: 3, d: 100},
        ]
    },
    idle: {
        frames: [
            {i: 18, d: 200},
            {i: 19, d: 300}
        ]
    }
};

class WrapStack {
    constructor(max) {
        this.stack = [];
        this.oldest = 0;
        this.max = max;
    }

    push(point) {
        if (this.stack.length < this.max) {
            this.stack.push(point);
        } else {
            this.stack[this.oldest] = point;
            this.oldest++;
            if (this.oldest >= this.stack.length) this.oldest = 0;
        }
    }

    getOldest() {
        return this.stack[this.oldest];
    }
}

class FetchAnimator {
    constructor(el, url, sswidthpx, ssheightpx, xcount, ycount) {
        this.timeout = null;
        this.currentAnimation = null;
        this.xcount = xcount;
        this.ycount = ycount;
        this.scale = 2;
        this.width = sswidthpx/xcount * this.scale;
        this.height = ssheightpx/ycount * this.scale;
        this.el = document.createElement("div");
        el.appendChild(this.el);
        this.el.style.width = (this.width) + "px";
        this.el.style.height =  (this.height) + "px";
        this.el.style.backgroundImage = "url(" + url + ")";
        this.el.style.backgroundSize = (sswidthpx * this.scale) + "px";
    }

    showFrame(i) {
        this.el.style.backgroundPosition = (-(i % this.xcount) * this.width) + "px " + (-Math.floor(i / this.xcount) * this.height) + "px";
    }

    playAnimation(ani, mirrored = false) {
        if (mirrored) this.el.style.transform = "scale(-1, 1)";
        else this.el.style.transform = "none";
        if (this.currentAnimation === ani) return;
        function doTimeout() {
            this.showFrame(frames[this.currentFrame].i);
            this.timeout = setTimeout(doTimeout.bind(this), frames[this.currentFrame].d);
            this.currentFrame++;
            if (this.currentFrame >= frames.length) this.currentFrame = 0;
        }
        const frames = ani.frames;
        if (this.timeout) this.stopAnimation();
        this.currentFrame = 0;
        this.currentAnimation = ani;
        doTimeout.bind(this)();
    }

    stopAnimation() {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.currentAnimation = null;
        this.showFrame(19);
    }
}

class FetchMarker {
    constructor() {
        this.el = document.createElement("div");
        this.el.className = "fetch-marker";
        this.el.style.position = "absolute";
        this.el.style.background = "gray";
        this.width = 25;
        this.height = 3;
        this.el.style.width = this.width + "px";
        this.el.style.height = this.height + "px";
        document.body.appendChild(this.el);
        this.recenter = () => {
            this.setPos(window.innerWidth / 2, 3 * window.innerHeight / 4);
        };
        this.recenter();
        window.addEventListener('resize', this.recenter);
    }

    setPos(newx, newy) {
        this.x = newx;
        this.y = newy;
        this.el.style.transform = "translate(" + (newx - this.width / 2) + "px," + (newy - this.height / 2 + 16) + "px)";
    }
}

class FetchBall {
    constructor() {
        this.el = document.createElement("div");
        this.el.className = "fetch-ball";
        this.el.style.position = "absolute";
        this.width = 70;
        this.height = 70;
        this.el.style.width = this.width + "px";
        this.el.style.height = this.height + "px";
        document.body.appendChild(this.el);
        this.setPos(window.innerWidth / 2, window.innerHeight / 2);

        this.mouseStack = new WrapStack(10);

        this.eventBallRelease = [];

        this.mousedown = false;

        this.velocity = new Vector(0, 0);

        this.el.addEventListener("mousedown", (e) => {
            const moveFunc = (e) => {
                this.mousex = e.clientX;
                this.mousey = e.clientY;
                this.mouseStack.push({x: e.clientX, y: e.clientY, date: Date.now()});
                this.setPos(e.clientX, e.clientY);
            };
            this.mousedown = true;
            window.addEventListener("mousemove", moveFunc);
            window.addEventListener("mouseup", (e) => {
                this.mousedown = false;
                window.removeEventListener("mousemove", moveFunc);
                // Process release
                const oldest = this.mouseStack.getOldest();
                if (oldest) {
                    const now = Date.now();
                    const deltaTime = now - oldest.date;
                    this.velocity = new Vector((e.clientX - oldest.x) / deltaTime * 6, (e.clientY - oldest.y) / deltaTime * 6);
                }
                for (const func of this.eventBallRelease) {
                    func();
                }
            }, { once: true });
        });

        this.doFrame();
    }

    setPos(newx, newy) {
        this.x = newx;
        this.y = newy;
        this.el.style.transform = "translate(" + (newx - this.width / 2) + "px," + (newy - this.width / 2) + "px)";
    }

    doFrame() {
        if (this.mouseDown) return;

        const damping = 0.8;

        // Bounce
        if (this.x > window.innerWidth) {
            this.velocity.x = damping * -Math.abs(this.velocity.x);
        } else if (this.x < 0) {
            this.velocity.x = damping * Math.abs(this.velocity.x);
        }
        if (this.y > window.innerHeight) {
            this.velocity.y = damping * -Math.abs(this.velocity.y);
        }
        if (this.y < 0) {
            this.velocity.y = damping * Math.abs(this.velocity.y);
        }

        // Process
        this.setPos(this.x + this.velocity.x, this.y + this.velocity.y);
        this.velocity.multiply(0.99);
        if (this.velocity.length() < 0.25) this.velocity = new Vector(0, 0);
        requestAnimationFrame(this.doFrame.bind(this));
    }
}

class FetchDog {
    constructor(ball, marker) {
        this.mousex = 0;
        this.mousey = 0;
        this.el = document.createElement("div");
        this.el.className = "fetch-dog";
        this.el.style.position = "absolute";
        document.body.appendChild(this.el);
        this.animator = new FetchAnimator(this.el, "dog.png", 128, 288, 4, 9);
        this.lastTime = Date.now();
        this.ball = ball;
        this.marker = marker;

        document.body.addEventListener("mousemove", (e) => {
            this.mousex = e.clientX;
            this.mousey = e.clientY;
        });

        this.ball.eventBallRelease.push(() => {
            this.target = this.ball;
        });

        let doneResizing = () => {
            this.target = this.ball;
        }
        let resizeId;
        window.addEventListener('resize', function() {
            this.target = null;
            clearTimeout(resizeId);
            resizeId = setTimeout(doneResizing, 500);
        });

        this.target = this.marker;
        this.holding = null;

        this.maxSpeed = 5;
        this.minSpeed = 2;
        this.speed = 0;
        this.acceleration = 0.2;
        this.setPos(this.marker.x, this.marker.y - 200);
        this.doFrame();
    }

    setPos(newx, newy) {
        this.x = newx;
        this.y = newy;
        this.el.style.transform = "translate(" + (newx - 32) + "px," + (newy - 32) + "px)";
    }

    doFrame() {
        if (this.target) {
            let directionVector = new Vector(this.target.x - this.x, this.target.y - this.y);
            if (directionVector.length() > this.maxSpeed) {
                const currentTime = Date.now();
                const deltaTime = currentTime - this.lastTime;
                directionVector.normalize();
                const angle = directionVector.toAngles();
                let ballOffset = {x: 0, y: 0};
                if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
                    this.ball.el.style.zIndex = "3";
                    ballOffset = {x: 25, y: 15};
                    this.animator.playAnimation(FetchAnimations.walkRight);
                } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
                    this.ball.el.style.zIndex = "3";
                    ballOffset = {x: 0, y: 25};
                    this.animator.playAnimation(FetchAnimations.walkDown);
                } else if (angle > 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) {
                    this.ball.el.style.zIndex = "3";
                    ballOffset = {x: -25, y: 15};
                    this.animator.playAnimation(FetchAnimations.walkRight, true);
                } else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
                    this.ball.el.style.zIndex = "1";
                    ballOffset = {x: 0, y: 0};
                    this.animator.playAnimation(FetchAnimations.walkUp);
                }
                this.setPos(this.x + directionVector.x * this.speed * (deltaTime / 17), this.y + directionVector.y * this.speed * (deltaTime / 17));
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
                this.lastTime = currentTime;
                if (this.holding === this.ball) {
                    this.ball.setPos(this.x + ballOffset.x, this.y + ballOffset.y);
                }
            } else {
                // Reached target
                this.speed = 0;
                this.animator.playAnimation(FetchAnimations.idle);
                if (this.target === this.ball) {
                    this.holding = this.ball;
                    this.target = this.marker;
                } else if (this.target === this.marker && this.holding === this.ball) {
                    this.holding = null;
                    this.ball.velocity = new Vector(0, 0);
                    this.ball.setPos(this.marker.x, this.marker.y + 45);
                    this.target = null;
                } else {
                    this.target = null;
                }
            }
        }
        requestAnimationFrame(this.doFrame.bind(this));
    }
}

const theball = new FetchBall();
const themarker = new FetchMarker();
const thedog = new FetchDog(theball, themarker);
