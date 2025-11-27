/*jshint esversion: 6 */
// @ts-check

// these two things are the main UI code for the train
// students learned about them in last week's workbook

import { draggablePoints } from "../../libs/CS559/dragPoints.js";
import { RunCanvas } from "../../libs/CS559/runCanvas.js";

// this is a utility that adds a checkbox to the page 
// useful for turning features on and off
import { makeCheckbox } from "../../libs/CS559/inputHelpers.js";

/**
 * Have the array of control points for the track be a
 * "global" (to the module) variable
 *
 * Note: the control points are stored as Arrays of 2 numbers, rather than
 * as "objects" with an x,y. Because we require a Cardinal Spline (interpolating)
 * the track is defined by a list of points.
 *
 * things are set up with an initial track
 */
/** @type Array<number[]> */
let thePoints = [
  [150, 150],
  [150, 450],
  [450, 450],
  [450, 150]
];

let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas2"));
let context = canvas.getContext("2d");

// add checkboxes for choosing simple track, arc length parameterization
let simpleTrack = /** @type {HTMLInputElement} */ document.getElementById("check-simple-track");
let arcLength = /** @type {HTMLInputElement} */ (document.getElementById("check-arc-length"));
let smokeCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("check-smoke"));
//let useBezier = /** @type {HTMLInputElement} */ (document.getElementById("check-bezier"));
let tensionSlider = /** @type {HTMLInputElement} */ (document.getElementById("tension"));
let tensionScript = /** @type {HTMLInputElement} */ document.getElementById("tensionScript");
let cabooseSlider = /** @type {HTMLInputElement} */ document.getElementById("caboose");
let cabooseScript = /** @type {HTMLInputElement} */ document.getElementById("cabooseScript");

arcLength.checked = true;

let tension = (Number)(tensionSlider.value);
tensionScript.innerHTML = tension + "";

let numCaboose = (Number)(cabooseSlider.value);
cabooseScript.innerHTML = numCaboose + "";

let tracks = [];
let lookUpTable = [];
let bckgrd = "#336840";
let trainLength = 50
let trainWidth = 20;
let edgeCurve = 5;

let smoke = [];
let useSmoke = smokeCheckbox.checked;

tensionSlider.oninput = function() {
    tension = (Number)(tensionSlider.value);
    tensionScript.innerHTML = tension + "";
    wrapDraw();
}

cabooseSlider.oninput = function() {
    numCaboose = (Number)(cabooseSlider.value);
    cabooseScript.innerHTML = numCaboose + "";
    wrapDraw();
}

arcLength.onchange = wrapDraw;
simpleTrack.onchange = wrapDraw;
//useBezier.onchange = wrapDraw;
smokeCheckbox.onchange = function() {
    useSmoke = smokeCheckbox.checked;
}

class TrackSegment {
  /**
   * @param {Point} p1 
   * @param {Point} p2 
   * @param {Point} p3 
   * @param {Point} p4
   */
  constructor(p1,p2,p3,p4) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.pts = [p1,p2,p3,p4];
    this.length = approximateLength(this);
  }
  
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Smoke {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.alpha = 0.7;
    }
}

/**
 * Draw function - this is the meat of the operation
 *
 * It's the main thing that needs to be changed
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} param
 */
function draw(canvas, param) {

    tracks = [];
    lookUpTable = [];

    // clear the screen
    context.clearRect(0, 0, canvas.width, canvas.height);

    // fill the background
    context.fillStyle = bckgrd;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2;

    context.fillStyle = "black";
    // draw the control points
    thePoints.forEach(function(pt) {
        context.beginPath();
        context.arc(pt[0], pt[1], 10, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    });

    // ***** TRACK *****
    //if (useBezier.checked == false) {
        formCardinalTracks(); // create the track segments using the cardinal spline
    //}
    // else {
    //     formBSplineTracks(param); // create the track segments using the B-spline
    // }

    drawTracks(); // draw the tracks

    // ***** TRAIN *****

    // train segments - one front, numCaboose cabooses
    // position and derivative for each segment
    let trainSegments = [new Point(0,0), new Point(0,0)];
    
    // Determine the position on curve for each train segment
    let trainParam = [param];

    let perimeter = 0;

    for (let i = 0; i < tracks.length; i++) {
        perimeter += tracks[i].length;
    }

    let changeInCaboose = (trainLength+10)/perimeter*thePoints.length;

    for (let i = 1; i <= numCaboose; i++) {

        if (param > changeInCaboose*i) {
            trainParam[i] = Math.abs((param - changeInCaboose*i) % thePoints.length);
        }
        else {
            trainParam[i] = thePoints.length - changeInCaboose*i + param;
        }
    }

    // ARC LENGTH PARAMETERIZATION
    if (arcLength.checked == true) {

        for (let i = 0; i < trainParam.length; i++) {
            [trainSegments[i*2], trainSegments[i*2+1]] = arcLengthPosition(trainParam[i]);
        }
    }

    // SIMPLE PARAMETERIZATION
    else {
        for (let i = 0; i < trainParam.length; i++) {
            [trainSegments[i*2], trainSegments[i*2+1]] = simpleParameterizationPosition(trainParam[i]);
        }
    }

    // Draw the train with its position and derivative
    drawTrain(trainSegments);


}

function formCardinalTracks() {
    let scale = (1-tension)/2; // scaling factor using tension

    // get tangent at the first point
    let oldDx = scale/3*(thePoints[1][0] - thePoints[thePoints.length-1][0]);
    let oldDy = scale/3*(thePoints[1][1] - thePoints[thePoints.length-1][1]);

    // add very first point to the look-up table
    lookUpTable.push({pt: new Point(thePoints[0][0], thePoints[0][1]), u: 0, derivative: new Point(oldDx, oldDy)});

    // create track segments
    for (let i = 1; i <= thePoints.length; i++) {
        let prev = thePoints[(i - 1 + thePoints.length) % thePoints.length];
        let curr = thePoints[i%thePoints.length];
        let next = thePoints[(i + 1) % thePoints.length];

        // find tangent at curr using the vector between prev and next
        // divide by 3 to convert to cubic Bezier
        let dx = scale/3*(next[0]-prev[0]);
        let dy = scale/3*(next[1]-prev[1]);

        // remember this curve for the train
        let p1 = new Point(prev[0], prev[1]);
        let p2 = new Point(prev[0] + oldDx, prev[1] + oldDy);
        let p3 = new Point(curr[0] - dx, curr[1] - dy);
        let p4 = new Point(curr[0], curr[1]);
        
        tracks[i-1] = new TrackSegment(p1, p2, p3, p4);
        
        oldDx = dx;
        oldDy = dy;
  }
}

function formBSplineTracks(param) {
    
    // get tangent at the first point
    let oldDx = (thePoints[1][0] - thePoints[thePoints.length-1][0]);
    let oldDy = (thePoints[1][1] - thePoints[thePoints.length-1][1]);

    // create track segments
    for (let i = 1; i <= thePoints.length; i++) {
        let prev = thePoints[(i - 1 + thePoints.length) % thePoints.length];
        let curr = thePoints[i%thePoints.length];
        let next = thePoints[(i + 1) % thePoints.length];

        // find tangent at curr using the vector between prev and next
        // divide by 3 to convert to cubic Bezier
        let dx = (next[0]-prev[0]);
        let dy = (next[1]-prev[1]);

        // remember this curve for the train
        let p1 = new Point(prev[0], prev[1]);
        let p2 = new Point(prev[0] + oldDx, prev[1] + oldDy);
        let p3 = new Point(curr[0] - dx, curr[1] - dy);
        let p4 = new Point(curr[0], curr[1]);
        
        tracks[i-1] = new TrackSegment(p1, p2, p3, p4);
        
        oldDx = dx;
        oldDy = dy;
  }
    
    // let n = thePoints.length;
    // let degree = 3;
    // let knots = [];

    // // Create uniform knot vector
    // for (let i = 0; i < n + degree + 1; i++) {
    //     knots.push(i);
    // }

    // // Create track segments
    // for (let i = 0; i < n; i++) {
    //     // let p1 = bsplinePoint(i, degree, knots);
    //     // let p2 = bsplinePoint(i + 1, degree, knots);
    //     // let p3 = bsplinePoint(i + 2, degree, knots);
    //     // let p4 = bsplinePoint(i + 3, degree, knots);

    //     tracks[i] = new TrackSegment(p1, p2, p3, p4);
    // }
}

// /**
//  * Calculate a point on a B-spline curve
//  * 
//  * @param {number} i - the index of the control point
//  * @param {number} degree - the degree of the B-spline
//  * @param {number[]} knots - the knot vector
//  * @returns {Point} the point on the B-spline curve
//  */
// function bsplinePoint(i, degree, knots) {
//     let x = 0;
//     let y = 0;

//     for (let j = 0; j < thePoints.length; j++) {
//         let basis = bsplineBasis(j, degree, i, knots);
//         x += basis * thePoints[j][0];
//         y += basis * thePoints[j][1];
//     }

//     return new Point(x, y);
// }

// /**
//  * Calculate the B-spline basis function
//  * 
//  * @param {number} j - the index of the control point
//  * @param {number} degree - the degree of the B-spline
//  * @param {number} i - the index of the knot span
//  * @param {number[]} knots - the knot vector
//  * @returns {number} the value of the basis function
//  */
// function bsplineBasis(j, degree, i, knots) {
//     if (degree === 0) {
//         return (knots[j] <= i && i < knots[j + 1]) ? 1 : 0;
//     } else {
//         let left = (i - knots[j]) / (knots[j + degree] - knots[j]);
//         let right = (knots[j + degree + 1] - i) / (knots[j + degree + 1] - knots[j + 1]);

//         return left * bsplineBasis(j, degree - 1, i, knots) + right * bsplineBasis(j + 1, degree - 1, i, knots);
//     }
// }

function drawTracks() {

    // SIMPLE TRACK DESIGN
    if (simpleTrack.checked == true) {

        context.beginPath();
        context.moveTo(thePoints[0][0], thePoints[0][1]);
        
        for (let i = 1; i <= thePoints.length; i++) {
            context.bezierCurveTo(tracks[i-1].p2.x, tracks[i-1].p2.y, tracks[i-1].p3.x, tracks[i-1].p3.y,tracks[i-1].p4.x, tracks[i-1].p4.y);
        }

        context.stroke();
    }

    // TRACK DESIGN WITH RAILS
    else {

        context.beginPath();
        context.moveTo(thePoints[0][0], thePoints[0][1]);

        context.save();

        // Black rails of the track
        context.lineWidth = 12;
        for (let i = 1; i <= thePoints.length; i++) {
            context.bezierCurveTo(tracks[i-1].p2.x, tracks[i-1].p2.y, tracks[i-1].p3.x, tracks[i-1].p3.y,tracks[i-1].p4.x, tracks[i-1].p4.y);
        }

        context.stroke();

        // Cover the inside of the track with the background color so you see 2 rails instead of 1 thick line
        context.moveTo(thePoints[0][0], thePoints[0][1]);
        context.lineWidth = 8;
        context.strokeStyle = bckgrd;

        for (let i = 1; i <= thePoints.length; i++) {
            context.bezierCurveTo(tracks[i-1].p2.x, tracks[i-1].p2.y, tracks[i-1].p3.x, tracks[i-1].p3.y,tracks[i-1].p4.x, tracks[i-1].p4.y);
        }

        context.stroke();

        context.restore();

        drawTies();
    }

}

function drawTies() {

    let tieWidth = 8;
    let tieLength = 20;
    let tieDist = 20;

    let perimeter = 0;

    for (let i = 0; i < tracks.length; i++) {
        perimeter += tracks[i].length;
    }

    for( let u = 0; u < perimeter; u += tieDist) {

        let newPosition = new Point(0,0);
        let derivative = new Point(0,0);

        let param = u/perimeter*thePoints.length;

        // ARC LENGTH PARAMETERIZATION
        if (arcLength.checked == true) {
            [newPosition, derivative] = arcLengthPosition(param);
        }

        // SIMPLE PARAMETERIZATION
        else {
            [newPosition, derivative] = simpleParameterizationPosition(param);
        }

        context.save();
        context.fillStyle = "#997638";
        context.translate(newPosition.x, newPosition.y);
        context.rotate(Math.atan2(derivative.y,derivative.x));
        context.translate(0, -tieLength/2);
        context.fillRect(0, 0, tieWidth, tieLength);
        context.restore();
    }
}

function drawTrain(trainSegments) {

    let bodyPos = trainSegments[0];
    let derivative = trainSegments[1];

    // draw line connecting each segment
    for (let i = 2; i < trainSegments.length; i+=2) {
        context.lineWidth = 6;
        context.beginPath();

        context.save();
        context.translate(trainSegments[i-2].x,trainSegments[i-2].y);
        context.rotate(Math.atan2(trainSegments[i-1].y,trainSegments[i-1].x));
        context.moveTo(-10,0);
        context.restore();

        context.save();
        context.translate(trainSegments[i].x, trainSegments[i].y);
        context.rotate(Math.atan2(trainSegments[i+1].y, trainSegments[i+1].x));
        context.lineTo(10,0);
        context.stroke();
        context.restore();
    }

    // draw the cabooses

    for (let i = 1; i < trainSegments.length/2; i++) {
        context.save();
        context.translate(trainSegments[i*2].x, trainSegments[i*2].y);
        context.rotate(Math.atan2(trainSegments[i*2+1].y, trainSegments[i*2+1].x));
        drawCaboose();
        context.restore();
    }
    
    // Draw the train body with its position (translation) and derivative (direction/rotation)

    context.save();
    context.translate(bodyPos.x,bodyPos.y);
    context.rotate(Math.atan2(derivative.y,derivative.x));
    
    context.fillStyle = "#101010";
    context.fillRect(-trainLength/2, -trainWidth/2-2, 30, trainWidth+4);

    context.beginPath();
    context.moveTo(-trainLength/2, -trainWidth/2);
    context.lineTo(trainLength/2, -trainWidth/2);
    context.arc(trainLength/2, 0, trainWidth/2, -Math.PI/2, Math.PI/2, false);
    context?.lineTo(-trainLength/2, trainWidth/2);
    context.fill();

    // draw smokestack
    context.fillStyle = "black";
    context.beginPath();
    context.arc(20,0,7,0,Math.PI*2,true);
    context.fill();
    context.fillStyle = "gray";
    context.beginPath();
    context.arc(20,0,4,0,Math.PI*2,true);
    context.fill();

    context.restore();


    // draw smoke
    context.save();

    smoke.push(new Smoke(bodyPos.x, bodyPos.y));

    for (let i = 0; i < smoke.length; i++) {
        context.save();
        context.globalAlpha = smoke[i].alpha;
        context.fillStyle = "rgba(100,100,100,"+smoke[i].alpha+")";
        context.beginPath();
        context.arc(smoke[i].x, smoke[i].y, smoke[i].r, 0, Math.PI*2, true);
        
        if (useSmoke) {
            context.fill();
        }
        
        context.restore();
        smoke[i].r += 0.5;
        smoke[i].alpha -= 0.02;
        if (smoke[i].alpha <= 0) {
            smoke.shift();
        }
    }

    context.restore();
}

function drawCaboose() {

    context.fillStyle = "darkred";

    // red body
    context.beginPath();
    context.moveTo(-25,-10);
    context.arc(-25+edgeCurve, -10+edgeCurve, edgeCurve, Math.PI, 3*Math.PI/2, false);
    context.lineTo(25,-10);
    context.arc(25-edgeCurve, -10+edgeCurve, edgeCurve, 3*Math.PI/2, 2*Math.PI, false);
    context.lineTo(25,10);
    context.arc(25-edgeCurve, 10-edgeCurve, edgeCurve, 2*Math.PI, Math.PI/2, false);
    context.lineTo(-25,10);
    context.arc(-25+edgeCurve, 10-edgeCurve, edgeCurve, Math.PI/2, Math.PI, false);
    context.closePath();
    context.fill();

    // black stripe
    context.fillStyle = "#101010";
    context.fillRect(-25,-7,50,14);
}

function arcLengthPosition(param) {
    let newPosition = new Point(0,0);
    let derivative = new Point(0,0);

    // the param is in terms of the number of control points

    // Step 1: Compute the total length of the track
    let perimeter = 0;

    for (let i = 0; i < tracks.length; i++) {
         perimeter += tracks[i].length;
    }

    // Step 2: Reparameterize
    let u = param*perimeter/thePoints.length;

    // Step 3: Find the segment that contains the point
    let currTrackLength = 0;

    for (let i = 0; i < tracks.length; i++) {
        let trackLength = tracks[i].length;

        currTrackLength += trackLength;

        if (u <= currTrackLength) {

            // Step 4: Compute the new position and derivative
            for (let j = 0; j < lookUpTable.length; j++) {
                let currU = lookUpTable[j].u;

                if (u == currU) {
                    newPosition = lookUpTable[j].pt;
                    derivative = lookUpTable[j].derivative;
                    break;
                }
                else if (u < currU) {
                    let prev = lookUpTable[j-1];
                    let curr = lookUpTable[j];
                    let u1 = prev.u;
                    let u2 = curr.u;
                    let p1 = prev.pt;
                    let p2 = curr.pt;
                    let d1 = prev.derivative;
                    let d2 = curr.derivative;
                    
                    let t = (u-u1)/(u2-u1);
                    newPosition.x = p1.x*(1-t) + p2.x*t;
                    newPosition.y = p1.y*(1-t) + p2.y*t;
                    derivative.x = d1.x*(1-t) + d2.x*t;
                    derivative.y = d1.y*(1-t) + d2.y*t;
                    break;
                    
                }
            }

            break;
        }
    }
    return [newPosition, derivative];
}

function simpleParameterizationPosition(param) {
    let newPosition = new Point(0,0);
    let derivative = new Point(0,0);

    for (let i = 0; i < tracks.length; i++) {
        // if param is between i and i+1, we know track[i] is the segment
        if (param >= i && param < i+1) {
            newPosition = bernstein(tracks[i],3,param-i);
            derivative = bernsteinDerivative(tracks[i],3,param-i);
            break;
        }
    }

    return [newPosition, derivative];
}
/**
 * Initialization code - sets up the UI and start the train
 */

// we need the slider for the draw function, but we need the draw function
// to create the slider - so create a variable and we'll change it later
let slider; // = undefined;

// note: we wrap the draw call so we can pass the right arguments
function wrapDraw() {
    // do modular arithmetic since the end of the track should be the beginning
    draw(canvas, Number(slider.value) % thePoints.length);
}
// create a UI
let runcanvas = new RunCanvas(canvas, wrapDraw);
// now we can connect the draw function correctly
slider = runcanvas.range;

// helper function - set the slider to have max = # of control points
function setNumPoints() {
    runcanvas.setupSlider(0, thePoints.length, 0.05);
}

setNumPoints();
runcanvas.setValue(0);

// add the point dragging UI
draggablePoints(canvas, thePoints, wrapDraw, 10, setNumPoints);

/**
 * Finds approximate length of a Bezier curve
 * 
 * @param {TrackSegment} track - control points of a Bezier curve representing a track segment
 * @return {Number} the approximate length of the Bezier curve
 */
function approximateLength(track) {

    let step = 8;

    // add end points to the list to use to approximate with

    /** @type {Point[]} */
    let appxPts = [track.p1];

    let trackLength = 0;
    for (let i = 0; i < tracks.length; i++) {
        trackLength += tracks[i].length;
    }

    let appxLength = 0;

    // Get more points along the curve, in addition to start and end points
    // approximate distance between them
    for (let u = 1; u <= step; u++) {
        appxPts[u] = bernstein(track,3,u/step);
        let derivativeAtU = bernsteinDerivative(track,3,u/step);
        appxLength += distance(appxPts[u].x, appxPts[u-1].x,appxPts[u].y, appxPts[u-1].y);

        // add this point and its length along the curve to the look-up table
        // note that appxPts[0] is not added to the look-up table, because it will have
        // been added as the end point of the previous segment
        // the very first point of the very first segment is added to the look-up table before
        // this function is called in the formCardinalTrack function
        lookUpTable.push({pt: appxPts[u], u: appxLength+trackLength, derivative: derivativeAtU});
    }

    return appxLength;
}

/**
* Computes the distance between (x1,y1) and (x2,y2)
* 
* @param {Number} x1 
* @param {Number} x2 
* @param {Number} y1 
* @param {Number} y2 
* @returns the distance between (x1,y1) and (x2,y2)
*/
function distance(x1, x2, y1, y2) {
  return Math.sqrt( Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

/**
* Bernstein basis polynomial
* determine the position of a point on a Bezier curve given parameter u
* 
* @param {TrackSegment} track - the control points of the Bezier curve
* @param {Number} degree - the degree of the curve
* @param {Number} u - the parameter indicating a position on the curve
* @returns {Point} the position of a point on the Bezier curve at parameter u
*/
function bernstein(track, degree, u) {
  let posAtU = new Point(0,0)
  let nChoosek = 1;

  for (let k = 0; k <= degree; k++) {
      nChoosek = choose(degree, k);
      posAtU.x += nChoosek * Math.pow(1-u, degree-k) * Math.pow(u, k) * track.pts[k].x;
      posAtU.y += nChoosek * Math.pow(1-u, degree-k) * Math.pow(u, k) * track.pts[k].y;
  }

  return posAtU;
}

/**
 * Computes the derivative of a Bezier curve at parameter u
 * 
 * @param {TrackSegment} track - the Bezier curve
 * @param {Number} degree - the degree of the Bezier curve
 * @param {Number} u - the parameter indicating a position on the curve; between 0 and 1
 * @returns 
 */
function bernsteinDerivative(track, degree, u) {

  if (u == 0) {
    return new Point(3*(track.pts[1].x - track.pts[0].x), 3*(track.pts[1].y - track.pts[0].y));
  }

  if (u == 1) {
    return new Point(3*(track.pts[3].x - track.pts[2].x), 3*(track.pts[3].y - track.pts[2].y));
  }

  let posAtU = new Point(0,0)
  let nChoosek = 1;

  for (let k = 0; k <= degree; k++) {
      nChoosek = choose(degree, k);
      posAtU.x += (nChoosek*Math.pow(u, k-1)*Math.pow(1-u,degree-k-1) *(-(degree-k)*u+k*(1-u))) * track.pts[k].x;
      posAtU.y += (nChoosek*Math.pow(u, k-1)*Math.pow(1-u,degree-k-1) *(-(degree-k)*u+k*(1-u))) * track.pts[k].y;
  }

  return posAtU;
}

/**
 * Computes the binomial coefficient
 * 
 * @param {Number} n - the total number
 * @param {Number} k - how many to choose
 * @returns 
 */
function choose(n, k) {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

/**
 * Computes factorials
 * 
 * @param {Number} n 
 * @returns the factorial of n
 */
function factorial(n) {
  if (n <= 1) {
      return 1;
  }
  return n * factorial(n - 1);
}