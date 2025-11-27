// Get the canvas element by its ID
const canvas = document.getElementById('canvas1');

const ctx = canvas.getContext('2d');

// *** POSITIONS FOR THE BEAGLE ***
// [0] tail,
// [1] head, ear, snout
// [2] forelimb, lower forelimb, paw
// [3] hindlimb, lower hindlimb, paw
// [4] body rotation
// [5] body translation
/** @type {Number[]} */
const stand = [[0],[0,0,0],[0,0,0],[0,0,0],[0], [0,20]]; // animation position for standing
/** @type {Number[]} */
const sit = [[0],[0.2,0.3,0],[0.3,0.3,0],[-0.3,-0.3,0],[-0.5], [0,60]]; // animation position for sitting
/** @type {Number[]} */
const eat = [[0.5],[0.2,0.3,0.5],[-0.3,-1.3,0.3],[-0.5,0,0.2],[0.5],[0,20]]; // animation position for eating (mouth open)
/** @type {Number[]} */
const munch = [[-0.5],[0.2,0.3,0],[-0.3,-1.3,0.3],[-0.5,0,0.2],[0.5],[0,20]]; // animation position for eating (mouth closed)

// *** ANIMATION VARIABLES ***

// current position of the beagle; default position is sitting
/** @type {Number[]} */
let beaglePos = [[0],[0.2,0.3,0],[0.3,0.3,0],[-0.3,-0.3,0],[-0.5], [0,60]];

let dogPosFunc = dogStandsToEat; // animation function for the beagle; default animation is standing to eat
let numMunches = 7; // number of munches the beagle will do before returning to standing position
let move = false; // Is the animation in progress? Also prevents feeding the beagle while animation is in progress.
let currTime = 0; // current time for the animation - 0 is just starting the transition between positions

// *** FOOD VARIABLES ***
let foodInBowl = false; // will the food be in the bowl?
let foodBagPosition = [500, 200, 560, 280]; // hitbox for the food bag


// Check if the canvas is supported
if (canvas.getContext) {
    // Get the 2D drawing context
    //ctx = canvas.getContext('2d');

    // Set the font properties
    ctx.font = '30px Calibri';
    ctx.fillStyle = 'black';

    // Draw the text on the canvas
    ctx.fillText('Feed the Beagle', 50, 50);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";

    draw();
}

/**
 * The dog will start eating when the food bag is clicked
 * 
 * @param {*} event 
 */
canvas.onmousedown = function(event) {

    if (!move && !foodInBowl) {
        let box = canvas.getBoundingClientRect();
        let x = event.clientX - box.left;
        let y = event.clientY - box.top;

        if (x > foodBagPosition[0] && x < foodBagPosition[2] && y > foodBagPosition[1] && y < foodBagPosition[3]) {
            foodInBowl = true;
            move = true;
        } 
    }
}

/**
 * The dog moves to stand
 * This is the first step in the eating animation
 * It sets the next animation function to dogEats
 */
function dogStandsToEat(timestamp) {
    // if the animation has not started, set the current time to the timestamp
    if (currTime == 0) {
        currTime = timestamp;
    }

    // calculate how far along the animation should be based
    // start of animation occurs at u = 0, end of animation occurs at u = 1
    let u = (timestamp - currTime) / 1000;

    // animation step is complete if u > 1; switch animation function
    if (u > 1) {
        dogPosFunc = dogEats;
        currTime = 0;
        return;
    }

    // interpolate between current position and standing position
    for(let i = 0; i < stand.length; i++) {

        for(let j = 0; j < stand[i].length; j++) {
            beaglePos[i][j] = (1-u)*beaglePos[i][j] + u*stand[i][j];
        }
    }
}

/**
 * The dog moves to eat
 * This is the second step in the eating animation
 * It sets the next animation function to dogMunches
 */
function dogEats(timestamp) {
    // if the animation has not started, set the current time to the timestamp
    if (currTime == 0) {
        currTime = timestamp;
    }

    // calculate how far along the animation should be based
    // start of animation occurs at u = 0, end of animation occurs at u = 1
    let u = (timestamp - currTime) / 1000;

    // animation step is complete if u > 1; switch animation function
    if (u > 1) {
        currTime = 0;
        dogPosFunc = dogMunches
        return;
    }

    // interpolate between current position and eating position
    for(let i = 0; i < stand.length; i++) {

        for(let j = 0; j < stand[i].length; j++) {
            beaglePos[i][j] = (1-u)*beaglePos[i][j] + u*eat[i][j];
        }
    }
}

/**
 * The dog munches on the food
 * This is the third step in the eating animation
 * It sets the next animation function to dogStandsToSit
 */
function dogMunches(timestamp) {
    // if the animation has not started, set the current time to the timestamp
    if (currTime == 0) {
        currTime = timestamp;
    }

    // calculate how far along the animation should be based
    // start of animation occurs at u = 0, end of animation occurs at u = 1
    let u = (timestamp - currTime) / 300;

    // Switch between open and closed mouth after each completed step
    if (u > 1) {
        currTime = timestamp;
        u = 0;
        numMunches--;
    }

    // if finished with number of munches:
    // switch animation function to start standing up
    // reset number of munches for next eating session
    // food in bowl is gone
    if (numMunches == 0) {
        currTime = 0;
        dogPosFunc = dogStandsToSit;
        numMunches = 7;
        foodInBowl = false;
        return;
    }

    // Choose between closing and opening the mouth during the munch
    let munchPos = munch;

    if (numMunches % 2 == 0) {
        munchPos = eat;
    }

    // interpolate between current position and open/closed mouth position
    for(let i = 0; i < stand.length; i++) {

        for(let j = 0; j < stand[i].length; j++) {
            beaglePos[i][j] = (1-u)*beaglePos[i][j] + u*munchPos[i][j];
        }
    }

}

/**
 * The dog stands up
 * This is the fourth step in the eating animation
 * It sets the next animation function to dogSits
 */
function dogStandsToSit(timestamp) {
    // if the animation has not started, set the current time to the timestamp
    if (currTime == 0) {
        currTime = timestamp;
    }

    // calculate how far along the animation should be based
    // start of animation occurs at u = 0, end of animation occurs at u = 1
    let u = (timestamp - currTime) / 1500;

    // animation step is complete if u > 1; switch animation function
    if (u > 1) {
        dogPosFunc = dogSits;
        currTime = 0;
        return;
    }

    // interpolate between current position and standing position
    for(let i = 0; i < stand.length; i++) {

        for(let j = 0; j < stand[i].length; j++) {
            beaglePos[i][j] = (1-u)*beaglePos[i][j] + u*stand[i][j];
        }
    }
}

/**
 * The dog sits down
 * This is the fifth and final step in the eating animation
 * It resets the animation variables to their initial state so that the animation can be repeated
 */
function dogSits(timestamp) {
    // if the animation has not started, set the current time to the timestamp
    if (currTime == 0) {
        currTime = timestamp;
    }

    // calculate how far along the animation should be based
    // start of animation occurs at u = 0, end of animation occurs at u = 1
    let u = (timestamp - currTime) / 1500;

    // animation step is complete if u > 1
    // reset variables to initial state and stop the animation
    if (u > 1) {
        move = false;
        currTime = 0;
        dogPosFunc = dogStandsToEat;
        return;
    }

    // interpolate between current position and sitting position
    for(let i = 0; i < sit.length; i++) {

        for(let j = 0; j < sit[i].length; j++) {
            beaglePos[i][j] = (1-u)*beaglePos[i][j] + u*sit[i][j];
        }
    }
}

function draw(timestamp) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // *** BACKGROUND ***
    drawBackground();

    // *** BEAGLE ***
    ctx.strokeStyle = "black";
    ctx.save();
    ctx.translate(200,320);
    drawBeagle(beaglePos);
    ctx.restore();

    // *** FOOD ***
    if(!move) {
        ctx.save();
        ctx.translate(foodBagPosition[0], foodBagPosition[1]);
        drawDogFood();
        ctx.restore();
    }

    // does the dog change positions?
    if (move) {
        dogPosFunc(timestamp);
    }

    window.requestAnimationFrame(draw);
}

/**
 * Draws the beagle
 * @param {Number[]} position 
 */
function drawBeagle(position) {

    // do specific translations and rotations for the beagle based on position (sit, stand, eat)
    ctx.save();
    ctx.translate(position[5][0], position[5][1]);
    ctx.rotate(position[4]);

    // draw tail
    ctx.save();
    ctx.translate(-52, 6);
    ctx.rotate(position[0]);
    drawBeagleTail();
    ctx.restore();

    // draw legs that are hidden behind the body

    ctx.save();
    ctx.translate(-19, 30);
    ctx.rotate(position[3][0]);
    drawBeagleHindLimb(position[3]);
    ctx.restore();

    ctx.save();
    ctx.translate(91, 0);
    ctx.rotate(position[2][0]);
    drawBeagleForeLimb(position[2]);
    ctx.restore();

    ctx.restore();

    // *** BOWL ***
    ctx.save();
    ctx.translate(100, 130);
    ctx.scale(1,1.05)
    drawDogBowl();
    ctx.restore();

    // do specific translations and rotations for the beagle based on position (sit, stand, eat)
    ctx.save();
    ctx.translate(position[5][0], position[5][1]);
    ctx.rotate(position[4]);

    // draw body

    // White Fur (Body)
    ctx.fillStyle = "white";

    // back of neck
    ctx.beginPath();
    ctx.moveTo(80, -70);
    ctx.bezierCurveTo(70, -60, 50, -40, 40, -10);
    ctx.bezierCurveTo(20, 0, 10, 0, 0, 0);
    ctx.bezierCurveTo(-10, 0, -20, 0, -30, 0); // back

    ctx.bezierCurveTo(-30, 0, -40, 0, -50, 10);
    ctx.bezierCurveTo(-60, 20, -70, 30, -70, 40);
    ctx.bezierCurveTo(-70, 60, -63, 65, -55, 72);
    ctx.bezierCurveTo(-40, 80, -20, 80, -10, 75);
    ctx.bezierCurveTo(0, 75, -10, 73, 20, 75); // stomach
    ctx.bezierCurveTo(30, 75, 40, 75, 50, 73);
    ctx.bezierCurveTo(60, 70, 80, 60, 90, 40);
    ctx.bezierCurveTo(95, 30, 100, 20, 105, 0);

    ctx.fill();
    ctx.stroke();

    // Black Fur (Body)
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(40, -10);
    ctx.bezierCurveTo(20, 0, 10, 0, 0, 0);
    ctx.bezierCurveTo(-30, 0, -40, 0, -50, 5);
    ctx.bezierCurveTo(-60, 10, -80, 30, -70, 50);
    ctx.bezierCurveTo(-50, 50, -40, 55, -30, 55);
    ctx.bezierCurveTo(-20, 55, -10, 55, 5, 52);
    ctx.bezierCurveTo(25, 50, 35, 55, 48, 50);
    ctx.bezierCurveTo(55, 50, 65, 45, 72, 35);
    ctx.bezierCurveTo(75, 30, 80, 20, 80, 10);
    ctx.bezierCurveTo(70, 10, 60, 5, 50, 0);
    ctx.bezierCurveTo(48, 0, 43, -2, 40, -10);

    ctx.fill();
    ctx.stroke();

    // draw head
    ctx.save();
    ctx.translate(80, -20);
    ctx.rotate(position[1][0]);
    drawBeagleHead(position[1]);
    ctx.restore();

    // draw limbs that are in front of the body
    ctx.save();
    ctx.translate(75, 10);
    ctx.rotate(position[2][0]);
    drawBeagleForeLimb(position[2]);
    ctx.restore();

    ctx.save();
    ctx.translate(-34, 40);
    ctx.rotate(position[3][0]);
    drawBeagleHindLimb(position[3]);
    ctx.restore();

    ctx.restore();

}

function drawBeagleHead(pos1) {

    // Head
    ctx.fillStyle = "#965F21";
    ctx.beginPath();
    ctx.moveTo(20, -70);
    ctx.bezierCurveTo(40, -70, 80, -60, 80, -20); // forehead
    ctx.bezierCurveTo(80, 0, 90, 25, 50, 20);
    ctx.bezierCurveTo(30, 20, 10, 20, 0, 0);
    ctx.bezierCurveTo(-5, -10, -10, -20, -10, -40);
    ctx.bezierCurveTo(-5, -60, 5, -70, 20, -70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ear in front of head
    ctx.save();
    ctx.translate(20, -70);
    ctx.rotate(pos1[1]);
    drawBeagleEar();
    ctx.restore();

    // Eye
    ctx.save();
    ctx.translate(50, -30);
    drawBeagleEye();
    ctx.restore();

    // Snout
    ctx.save();
    drawBeagleSnout(pos1[2]);
    ctx.restore();

}

function drawBeagleEar() {
    ctx.fillStyle = "#6D4D29";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, 100, -50, 100, -50, 50);
    ctx.bezierCurveTo(-50, 0, -20, -10, -2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawBeagleEye() {
    // eye white
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, 2 * Math.PI, true);
    ctx.fill();
    // eye iris
    ctx.fillStyle = "#472600";
    ctx.beginPath();
    ctx.arc(2, 0, 8, 0, 2 * Math.PI, true);
    ctx.fill();
    // eye pupil
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(3, 0, 6, 0, 2 * Math.PI, true);
    ctx.fill();
    // eye highlight
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(3, -3, 3, 0, 2 * Math.PI, true);
    ctx.fill();
}

function drawBeagleSnout(angle) {

    // Snout Bottom - should rotate at (65, 10)
    ctx.fillStyle = "white";

    ctx.save();
    ctx.translate(65, 10);
    ctx.rotate(angle);
    drawBeagleMandible();
    ctx.restore();

    // Snout Top

    ctx.beginPath();
    ctx.moveTo(80, -20);
    ctx.bezierCurveTo(100, -15, 120, -15, 120, -10); // snout top
    ctx.bezierCurveTo(120, 10, 100, 10, 80, 8); // snout bottom
    ctx.bezierCurveTo(75, 6, 75, 3, 72, 0); // snout side

    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, -20);
    ctx.lineTo(80, 0);
    ctx.bezierCurveTo(70, 0, 70, -30, 80, -20); // snout side
    ctx.closePath();
    ctx.fill();

    // Nose
    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.moveTo(120, -10);
    ctx.arc(120, -10, 5, 0, 2 * Math.PI, true);

    ctx.fill();
}

function drawBeagleMandible() {
    ctx.beginPath();
    ctx.moveTo(50, -10);
    ctx.bezierCurveTo(45, 0, 35, 15, 0, 10); // lower jaw

    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, -10);
    ctx.lineTo(5, 9);
    ctx.bezierCurveTo(-5, 0, -5, -10, 5, -10);
    ctx.closePath();

    ctx.fill();

    // inside of mouth
    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.moveTo(5, -10);
    ctx.bezierCurveTo(15, -10, 30, 0, 45, -10);

    ctx.fill();
}

function drawBeagleForeLimb(pos2) {

    // Lower Forelimb
    ctx.save();
    ctx.translate(0,60);
    ctx.rotate(pos2[1]);
    drawBeagleLowerForeLimb(pos2[2]);
    ctx.restore();

    // Upper Forelimb
    ctx.fillStyle = "#965F21";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(25, 60, -30, 100, -40, 35);
    ctx.bezierCurveTo(-40, 0, -15, -10, -3, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawBeagleLowerForeLimb(angle) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-1, 30);
    ctx.lineTo(5,70);
    ctx.bezierCurveTo(0, 80, -20, 90, -30, 0);
    ctx.bezierCurveTo(-30, -30, 0, -30, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Paw
    ctx.save();
    ctx.translate(-18, 60);
    ctx.rotate(angle);
    drawBeaglePaw();
    ctx.restore();
}

function drawBeaglePaw() {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.bezierCurveTo(21, 0, 35, 10, 35, 20);
    ctx.bezierCurveTo(30, 25, 20, 25, 15, 23);
    ctx.bezierCurveTo(5, 20, 0, 10, 0, 0);
    ctx.fill();
    ctx.stroke();
}

function drawBeagleHindLimb(pos3) {

    // Lower Hindlimb
    ctx.save();
    ctx.translate(0,40);
    ctx.rotate(pos3[1]);
    drawBeagleLowerHindLimb(pos3[2]);
    ctx.restore();

    // Upper Hindlimb
    ctx.fillStyle = "#965F21";
    ctx.beginPath();
    ctx.moveTo(5, -20);
    ctx.bezierCurveTo(30, 40, -20, 80, -40, 25);
    ctx.bezierCurveTo(-50, -20, -15, -40, 0, -27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawBeagleLowerHindLimb(angle) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, 30);
    ctx.lineTo(10,70);
    ctx.bezierCurveTo(0, 70, -10, 75, -15, 60);
    ctx.lineTo(-30,25);
    ctx.bezierCurveTo(-35, 20, -20, 20, -30, -10);
    ctx.bezierCurveTo(-28,-30, 0, -10, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Paw
    ctx.save();
    ctx.translate(-19, 50);
    ctx.rotate(angle);
    drawBeaglePaw();
    ctx.restore();
}

function drawBeagleTail() {

    // base
    ctx.fillStyle = "#965F21";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-20, 20, -50, 20, -80, 0);
    ctx.bezierCurveTo(-70, 30, -50, 35, -30, 30);
    ctx.bezierCurveTo(-20, 27, -10, 20, 0, 15);
    ctx.bezierCurveTo(3, 14, 8, 5, 0, 0);
    ctx.fill();
    ctx.stroke();

    // black coloring
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-10, 10, -55, 20, -60, 13);
    ctx.bezierCurveTo(-48, 25, -25, 25, -15, 15);
    ctx.bezierCurveTo(-10, 15, -5, 10, 0, 10);
    ctx.bezierCurveTo(1, 14, 4, 5, 0, 0);
    ctx.fill();
    ctx.stroke();

    // white tip
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(-60,11);
    ctx.bezierCurveTo(-70, 25, -71, 20, -80, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
}

function drawDogFood() {

    // Base of Bag
    ctx.strokeStyle = "#810A0A";
    ctx.fillStyle = "#980B0B";
    ctx.beginPath();
    ctx.moveTo(0, 0); // L top corner
    ctx.bezierCurveTo(0, -10, 10, -10, 20, 0);
    ctx.bezierCurveTo(30, 5, 40, 0, 50, 5);
    ctx.bezierCurveTo(60, 10, 70, 0, 75, 5);
    ctx.bezierCurveTo(80, 10, 70, 30, 65, 45);
    ctx.bezierCurveTo(70, 60, 80, 80, 60, 80); // R bottom corner
    ctx.bezierCurveTo(40, 80, 30, 75, 20, 73);
    ctx.bezierCurveTo(10, 70, -10, 70, -10, 60); // L bottom corner
    ctx.bezierCurveTo(-10, 40, 10, 30, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Bone Design
    ctx.save();
    ctx.translate(35,30);
    drawBone();
    ctx.restore();
}

function drawBone() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 8;

    // 4 circles for the edges of the bone
    ctx.beginPath();
    ctx.arc(-15, 0, 5, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-18, 7, 5, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, 4, 5, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, 12, 5, 0, 2 * Math.PI, true);
    ctx.fill();

    // line connecting the two pairs of circles
    ctx.beginPath();
    ctx.moveTo(-15, 3);
    ctx.lineTo(15, 8);
    ctx.stroke();
}

function drawDogBowl() {
    
    // Inside of Bowl
    ctx.strokeStyle = "#810A0A";
    ctx.fillStyle = "#6B0909";
    ctx.beginPath();
    ctx.moveTo(0, 0); // L top corner
    ctx.lineTo(-10, 30);
    ctx.bezierCurveTo(0, 40, 40, 50, 80, 30);
    ctx.lineTo(70,0);
    ctx.fill();
    ctx.stroke();

    // Draw food in bowl
    if (foodInBowl) {
        ctx.save();
        ctx.fillStyle = "#A45807";
        ctx.strokeStyle = "#804403";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(0, 10, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(10, 5, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(30, 15, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(40, 5, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(60, 5, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(20, 15, 5, 0, 2 * Math.PI, true);
        ctx.beginPath();
        ctx.arc(50, 10, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(15, 7, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(30, 6, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(45, 7, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(60, 8, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(20, 15, 5, 0, 2 * Math.PI, true);
        ctx.beginPath();
        ctx.arc(8, 7, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(22, 10, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(50, 8, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(45, 10, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(25, 25, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(15, 7, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(28, 12, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(42, 13, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(60, 10, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(35, 13, 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Outside of Bowl
    ctx.fillStyle = "#980B0B";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0,0,10,10,20,13);
    ctx.bezierCurveTo(30,14,40,18,50,14);
    ctx.bezierCurveTo(60,10,65,5,70,2);
    ctx.lineTo(80,30);
    ctx.bezierCurveTo(80, 40, 30, 60, -10, 30);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.stroke();

    // Bone design
    ctx.save();
    ctx.translate(35,25);
    ctx.rotate(-0.15);
    ctx.scale(0.75,0.75);
    drawBone();
    ctx.restore();
    
}

function drawBackground() {
    // Wall
    ctx.fillStyle = "#74C3E0";
    ctx.strokeStyle = "#679EB2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wall Perspective Lines
    ctx.fillStyle = "#7DCBE7";
    ctx.beginPath();
    ctx.moveTo(100,canvas.height/2-100);
    ctx.lineTo(100, -1);
    ctx.lineTo(canvas.width-100, -1);
    ctx.lineTo(canvas.width-100,canvas.height/2-100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floor
    ctx.fillStyle = "tan";
    ctx.beginPath();
    ctx.moveTo(-1,canvas.height+1);
    ctx.lineTo(-1,canvas.height-200)
    ctx.lineTo(100, canvas.height/2-100);
    ctx.lineTo(canvas.width-100, canvas.height/2-100);
    ctx.lineTo(canvas.width+1,canvas.height-200);
    ctx.lineTo(canvas.width+1,canvas.height+1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floor perspective lines
    ctx.strokeStyle = "#A4844D";
    ctx.beginPath();
    ctx.moveTo(90, canvas.height+1);
    ctx.lineTo(200, canvas.height/2-100);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width-90, canvas.height+1);
    ctx.lineTo(canvas.width-200, canvas.height/2-100);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width/2, canvas.height+1);
    ctx.lineTo(canvas.width/2, canvas.height/2-100);
    ctx.stroke();

    // Cover up where the wall and floor meet
    ctx.strokeStyle = "#679EB2";
    ctx.beginPath();
    ctx.moveTo(100, canvas.height/2-100);
    ctx.lineTo(canvas.width-100, canvas.height/2-100);
    ctx.stroke();

    // kitchen counter
    ctx.fillStyle = "#F2E9C8";
    ctx.strokeStyle = "#E6DBB3";
    ctx.beginPath();
    ctx.moveTo(canvas.width+1, canvas.height-100);
    ctx.lineTo(canvas.width-150, canvas.height-100);
    ctx.lineTo(canvas.width-205, canvas.height/2-30);
    ctx.lineTo(canvas.width-205,canvas.height/2-150);
    ctx.lineTo(canvas.width-100,canvas.height/2-150);
    ctx.lineTo(canvas.width+1,canvas.height/2+20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // kitchen counter perspective lines
    ctx.strokeStyle = "#E6DBB3";
    ctx.fillStyle = "#F1E7C1";
    ctx.beginPath();
    ctx.moveTo(canvas.width-150, canvas.height-100);
    ctx.lineTo(canvas.width-150, canvas.height/2+20);
    ctx.lineTo(canvas.width-203, canvas.height/2-142);
    ctx.lineTo(canvas.width-205, canvas.height/2-30);
    ctx.lineTo(canvas.width-150, canvas.height-100);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#EDE4BF";
    ctx.beginPath();
    ctx.moveTo(canvas.width-150, canvas.height/2+20);
    ctx.lineTo(canvas.width+1, canvas.height/2+20);
    ctx.lineTo(canvas.width+1, canvas.height-100);
    ctx.lineTo(canvas.width-150, canvas.height-100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

console.log("page 1 js loaded")