import { handlePointerEvents } from './main-pointer-handler.mjs';


document.getElementById('create-button').addEventListener('click', () => {
    const x = clamp(document.getElementById('width-input').value);
    const y = clamp(document.getElementById('height-input').value);
    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    placeCanvas(x, y);

    document.getElementById('fground').style.visibility = 'visible';
    document.getElementById('create-panel').remove();
    window.getSelection().removeAllRanges(); // Clear any existing selection
});


function placeCanvas(x, y) {
    const canvasContainer = document.getElementById('placecanvas');
    canvasContainer.style.width = x + 'px';
    canvasContainer.style.height = y + 'px';

    const canvas = document.createElement('canvas');
    canvasContainer.appendChild(canvas);

    canvas.width = x;
    canvas.height = y;

    const offscreenCanvas = canvas.transferControlToOffscreen();

    const worker = new Worker('scripts/canvas-worker.js', { type: "module" });
    worker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);

    handlePointerEvents(worker, { x: x, y: y });
}

function clamp(x, l = 1, u = 16384) {
    return Math.round(Math.min(Math.max(x, l), u));
}