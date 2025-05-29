import { handlePointerEvents } from './main-pointer-handler.mjs';

console.log("Hello World");
const dpr = window.devicePixelRatio || 1;

const ctx = document.createElement('canvas');
// const gl = ctx.getContext('webgl2', { antialias: false, alpha: true }) || ctx.getContext('webgl', { antialias: false, alpha: true });

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

    document.getElementById('bgorigin').style.transform = `translate(${(bground.offsetWidth / 2) | 0}px, ${(bground.offsetHeight / 2) | 0}px)`

    ctx.width = x;
    ctx.height = y;

    checkerbg.appendChild(ctx);

    const offscreenCanvas = ctx.transferControlToOffscreen();

    const worker = new Worker('scripts/canvas-worker.js');
    worker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);

    handlePointerEvents(document.getElementById('bgorigin'), worker, { x: 16384 - x / 2, y: 16384 - y / 2 });

    document.getElementById('create-panel').remove();

    window.getSelection().removeAllRanges(); // Clear any existing selection
});
