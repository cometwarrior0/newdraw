import { handlePointerEvents } from './main-pointer-handler.mjs';

const canvas = document.getElementById('canvas');

document.getElementById('create-button').addEventListener('click', () => {
    const x = clamp(Math.round(document.getElementById('width-input').value));
    const y = clamp(Math.round(document.getElementById('height-input').value));
    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }
    canvas.width = x;
    canvas.height = y;

    const offscreenCanvas = canvas.transferControlToOffscreen();

    const worker = new Worker('scripts/canvas-worker.js', { type: "module" });
    worker.postMessage({ type: 'init', canvas: offscreenCanvas}, [offscreenCanvas]);

    handlePointerEvents(worker, { x: 16384 - x / 2, y: 16384 - y / 2 });

    resizeTest(x, y);

    document.getElementById('create-panel').remove();
    window.getSelection().removeAllRanges(); // Clear any existing selection
});


function resizeTest(x, y) {
    const test = document.getElementById('test');
    test.style.width = x + 'px';
    test.style.height = y + 'px';
}

function clamp(x, l = 1, u = 16384) {
    return Math.min(Math.max(x, l), u);
}