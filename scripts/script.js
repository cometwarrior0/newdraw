import { handlePointerEvents } from './main-pointer-handler.mjs';

const canvas = document.createElement('canvas');

document.getElementById('create-button').addEventListener('click', () => {
    const checkerbg = document.getElementById('checker-bg');

    const x = Math.round(document.getElementById('width-input').value);
    const y = Math.round(document.getElementById('height-input').value);

    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    checkerbg.style.width = x + 'px';
    checkerbg.style.height = y + 'px';

    canvas.width = x;
    canvas.height = y;

    checkerbg.appendChild(canvas);

    const offscreenCanvas = canvas.transferControlToOffscreen();

    const worker = new Worker('scripts/canvas-worker.js', { type: "module" });
    worker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);

    handlePointerEvents(worker, { x: 16384 - x / 2, y: 16384 - y / 2 });

    document.getElementById('create-panel').remove();

    window.getSelection().removeAllRanges(); // Clear any existing selection
});
