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
        if (this.currentAnimation === ani) return;
        if (mirrored) this.el.style.transform = "scale(-1, 1)";
        else this.el.style.transform = "none";
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

class FetchBall {
    constructor() {
        
    }
}

class FetchDog {
    constructor() {
        this.mousex = 0;
        this.mousey = 0;
        this.el = document.createElement("div");
        this.el.className = "fetch-dog";
        this.el.style.position = "absolute";
        document.body.appendChild(this.el);
        this.setPos(window.innerWidth / 2, window.innerHeight / 2);
        console.log(this);
        this.animator = new FetchAnimator(this.el, "dog.png", 128, 288, 4, 9);

        document.body.addEventListener("mousemove", (e) => {
            this.mousex = e.clientX;
            this.mousey = e.clientY;
        });

        this.maxSpeed = 5;
        this.minSpeed = 2;
        this.speed = 0;
        this.acceleration = 0.2;
        this.doFrame();
    }

    setPos(newx, newy) {
        this.x = newx;
        this.y = newy;
        this.el.style.transform = "translate(" + newx + "px," + newy + "px)";
    }

    doFrame() {
        let directionVector = new Vector(this.mousex - this.x, this.mousey - this.y);
        if (directionVector.length() > this.maxSpeed) {
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
            } else {
                this.animator.stopAnimation();
            }
            this.setPos(this.x + directionVector.x * this.speed, this.y + directionVector.y * this.speed);
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } else {
            this.speed = 0;
            this.animator.stopAnimation();
        }
        requestAnimationFrame(this.doFrame.bind(this));
    }
}

const thedog = new FetchDog();
