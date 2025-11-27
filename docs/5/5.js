// Get the canvas element by its ID
const canvas = document.getElementById('canvas5');

// Check if the canvas is supported
if (canvas.getContext) {
    // Get the 2D drawing context
    const ctx = canvas.getContext('2d');

    // Set the font properties
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';

    // Draw the text on the canvas
    ctx.fillText('page 5 canvas', 50, 50);
} 
