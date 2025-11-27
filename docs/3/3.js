class Boid {
    constructor(x,y,angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.boid = document.createElementNS(svg, 'g');
        this.boid.setAttribute('id', 'boid');
        this.boid.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + angle + ')');
        this.boid.setAttribute('fill', 'black');

        this.head = document.createElementNS(svg, 'g');
        this.head.setAttribute('id', 'head');
        this.boid.appendChild(this.head);

        this.headCircle = document.createElementNS(svg, 'circle');
        this.headCircle.setAttribute('cx', '0');
        this.headCircle.setAttribute('cy', '0');
        this.headCircle.setAttribute('r', '5');
        this.head.appendChild(this.headCircle);

        this.headPath = document.createElementNS(svg, 'path');
        this.headPath.setAttribute('d', 'M 3 4 L 10 0 L 3 -4 Z');
        this.head.appendChild(this.headPath);

        this.wing = document.createElementNS(svg, 'g');
        this.wing.setAttribute('id', 'wing');
        this.wing.setAttribute('transform', 'translate(5,0)');
        this.boid.appendChild(this.wing);

        this.wingPath = document.createElementNS(svg, 'path');
        this.wingPath.setAttribute('d', 'M -5 0   C -10, 10  -20, 16  -30, 12  C   -20, 8  -10, -2  -5,0   Z');
        this.wing.appendChild(this.wingPath);

        this.wingUse = document.createElementNS(svg, 'use');
        this.wingUse.setAttribute('href', '#wing');
        this.wingUse.setAttribute('transform', 'scale(1,-1)');
        this.boid.appendChild(this.wingUse);

        this.body = document.createElementNS(svg, 'circle');
        this.body.setAttribute('cx', '-10');
        this.body.setAttribute('cy', '0');
        this.body.setAttribute('r', '8');
        this.boid.appendChild(this.body);

        this.tail = document.createElementNS(svg, 'path');
        this.tail.setAttribute('d', 'M -15 4 L -25 8 A 2,2,0,0,1,-25,-8 L -15 -4 Z');
        this.boid.appendChild(this.tail);

        svgElement.appendChild(this.boid);

    }
}

class Obstacle {
    constructor(x,y,r) {
        this.x = x;
        this.y = y;

        this.obstacle = document.createElementNS(svg, 'g');
        this.obstacle.setAttribute('id', 'obstacle');
        this.obstacle.setAttribute('transform', 'translate(' + x + ',' + y + ')');
        this.obstacle.setAttribute('fill', 'black');

        this.obstacleCircle = document.createElementNS(svg, 'circle');
        this.obstacleCircle.setAttribute('cx', '0');
        this.obstacleCircle.setAttribute('cy', '0');
        this.obstacleCircle.setAttribute('r', r);
        this.obstacle.appendChild(this.obstacleCircle);

        svgElement.appendChild(this.obstacle);
    }
}

let svg = "http://www.w3.org/2000/svg";

let svgElement = document.getElementById("svg");

let boidCountInput = document.getElementById("boidCount");
let boidSpeedInput = document.getElementById("speed");
let boidAngleInput = document.getElementById("angle");

let boidCountScript = document.getElementById("countScript"); 
let boidSpeedScript = document.getElementById("speedScript"); 
let boidAngleScript = document.getElementById("angleScript");  

let boids = [];
let obstacles = [];

let boidCount = (Number)(boidCountInput.value);
let boidSpeed = (Number)(boidSpeedInput.value);
let boidAngle = (Number)(boidAngleInput.value);

boidCountScript.innerHTML = boidCount;
boidSpeedScript.innerHTML = boidSpeed;
boidAngleScript.innerHTML = boidAngle + "°";

boidCountInput.oninput = function() {
    boidCount = (Number)(boidCountInput.value);
    boidCountScript.innerHTML = boidCount;
}

boidSpeedInput.oninput = function() {
    boidSpeed = (Number)(boidSpeedInput.value);
    boidSpeedScript.innerHTML = boidSpeed;
}

boidAngleInput.oninput = function() {
    boidAngle = (Number)(boidAngleInput.value);
    boidAngleScript.innerHTML = boidAngle + "°";
}

// set up the obstacles
obstacles.push(new Obstacle(100,100,20));
obstacles.push(new Obstacle(400,200,10));
obstacles.push(new Obstacle(500,300,30));
obstacles.push(new Obstacle(200,400,15));

draw();

function draw() {

    // Add or remove boids as needed
    if (boids.length < boidCount) {
        for(; boids.length < boidCount; ) {
            let x = Math.random() * svgElement.clientWidth;
            let y = Math.random() * svgElement.clientHeight;

            // ensure the boid was not placed in a obstacle
            for (let i = 0; i < obstacles.length; i++) {
                let obstacle = obstacles[i];
                let dx = x - obstacle.x;
                let dy = y - obstacle.y;

                if (Math.sqrt(dx*dx + dy*dy) < obstacle.obstacleCircle.r.baseVal.value + 20) {
                    x = 200;
                    y = 200;
                }
            }

            let angle = Math.random() * 360;
            boids.push(new Boid(x, y, angle));
        }
    }

    if (boids.length > boidCount) {
        for(; boids.length > boidCount; ) {
            svgElement.removeChild(boids[boids.length-1].boid);
            boids.pop();
        }
    }
    
    // Move the boids
    for(let i = 0; i < boids.length; i++) {
        let boid = boids[i];
        boid.x += boidSpeed*Math.cos(boid.angle*Math.PI/180);
        boid.y += boidSpeed*Math.sin(boid.angle*Math.PI/180);
        checkBoid(boid, i);
        boid.boid.setAttribute('transform', 'translate(' + boid.x + ',' + boid.y + ') rotate(' + boid.angle + ')');
    }

    window.requestAnimationFrame(draw);
}

/**
 * Determines if a boid is out of bounds and turns it around if it is
 * 
 * @param {Boid} boid 
 */
function checkBoid(boid, i) {
    let needToTurn = false;
    let angle = boidAngle;

    if(boid.x > svgElement.clientWidth-10) {
        boid.x = svgElement.clientWidth-10;
        needToTurn = true;
    }
    else if(boid.x < 10) {
        boid.x = 10;
        needToTurn = true;
    }
    if(boid.y > svgElement.clientHeight-10) { 
        boid.y = svgElement.clientHeight - 10;
        needToTurn = true;
    }
    else if(boid.y < 10) {
        boid.y = 10;
        needToTurn = true;
    }

    // check for collisions with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        let dx = boid.x - obstacle.x;
        let dy = boid.y - obstacle.y;

        if (Math.sqrt(dx*dx + dy*dy) < obstacle.obstacleCircle.r.baseVal.value + 20) {

            // calculate the angle to the obstacle
            let angleToObstacle = Math.atan2(dy, dx) * 180 / Math.PI;
            angle = angleToObstacle - boid.angle;

            needToTurn = true;
            break;
        }
    }

    // check for collisions with previous boids
    for (let j = 0; j < i; j++) {
        let otherBoid = boids[j];
        let dx = boid.x - otherBoid.x;
        let dy = boid.y - otherBoid.y;

        if (Math.sqrt(dx*dx + dy*dy) < 20) {

            if (dx > 0) {
                boid.x += 5;
            }
            else {
                boid.x -= 5;
            }
            if (dy > 0) {
                boid.y += 5;
            }
            else {
                boid.y -= 5;
            }

            // calculate the angle to the other boid
            let angleToObstacle = Math.atan2(dy, dx) * 180 / Math.PI;
            angle = angleToObstacle - boid.angle;

            needToTurn = true;
            break;
        }
    }

    if(needToTurn) {
        
        boid.angle += angle;
        boid.angle = boid.angle % 360;
    }
}
