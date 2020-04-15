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
        this.setPos(window.innerWidth / 2, 3 * window.innerHeight / 4);
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
        this.el.style.background = "red";
        this.width = 30;
        this.height = 30;
        this.el.style.width = this.width + "px";
        this.el.style.height = this.height + "px";
        this.el.style.borderRadius = "50%";
        document.body.appendChild(this.el);
        this.setPos(window.innerWidth / 4, window.innerHeight / 4);

        this.mousex = 0;
        this.mousey = 0;
        this.lastmousex = 0;
        this.lastmousey = 0;

        this.eventBallRelease = [];

        this.mousedown = false;

        this.velocity = new Vector(0, 0);

        this.el.addEventListener("mousedown", (e) => {
            const moveFunc = (e) => {
                this.lastmousex = this.mousex;
                this.lastmousey = this.mousey;
                this.mousex = e.clientX;
                this.mousey = e.clientY;
                this.setPos(e.clientX, e.clientY);
            };
            console.log("click");
            this.mousedown = true;
            window.addEventListener("mousemove", moveFunc);
            window.addEventListener("mouseup", (e) => {
                console.log("unclick");
                this.mousedown = false;
                window.removeEventListener("mousemove", moveFunc);
                // Process release
                this.velocity = new Vector(e.clientX - this.lastmousex, e.clientY - this.lastmousey);
                for (const func of this.eventBallRelease) {
                    func();
                }
                console.log(this.velocity);
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
        this.setPos(window.innerWidth / 2, window.innerHeight / 2);
        console.log(this);
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

        this.target = this.marker;
        this.holding = null;

        this.maxSpeed = 5;
        this.minSpeed = 2;
        this.speed = 0;
        this.acceleration = 0.2;
        this.doFrame();
    }

    setPos(newx, newy) {
        this.x = newx;
        this.y = newy;
        this.el.style.transform = "translate(" + (newx - 32) + "px," + (newy - 32) + "px)";
    }

    doFrame() {
        let directionVector = new Vector(this.target.x - this.x, this.target.y - this.y);
        if (directionVector.length() > this.maxSpeed) {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastTime;
            directionVector.normalize();
            const angle = directionVector.toAngles();
            if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
                this.animator.playAnimation(FetchAnimations.walkRight);
            } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
                this.animator.playAnimation(FetchAnimations.walkDown);
            } else if (angle > 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) {
                this.animator.playAnimation(FetchAnimations.walkRight, true);
            } else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
                this.animator.playAnimation(FetchAnimations.walkUp, true);
            }
            this.setPos(this.x + directionVector.x * this.speed * (deltaTime / 17), this.y + directionVector.y * this.speed * (deltaTime / 17));
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            this.lastTime = currentTime;
            if (this.holding === this.ball) {
                this.ball.x = this.x;
                this.ball.y = this.y;
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
                this.ball.x = this.marker.x;
                this.ball.y = this.marker.y + 45;
            }
        }
        requestAnimationFrame(this.doFrame.bind(this));
    }
}

const theball = new FetchBall();
const themarker = new FetchMarker();
const thedog = new FetchDog(theball, themarker);
