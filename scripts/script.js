import { initLayerHandler } from './layer-handler.mjs';
import './save-handler.mjs';
import './layer-container-scroll-fix.mjs';

document.getElementById('create-button').addEventListener('click', () => {
    const x = clamp(document.getElementById('width-input').value);
    const y = clamp(document.getElementById('height-input').value);
    if (isNaN(x) || isNaN(y)) {
        alert("Invalid dimensions, please enter valid numbers");
        return;
    }

    initLayerHandler(x, y);

    document.getElementById('fground').style.visibility = 'visible';
    document.getElementById('create-panel').remove();
    window.getSelection().removeAllRanges(); // Clear any existing selection
});

function clamp(x, l = 1, u = 16384) {
    return Math.round(Math.min(Math.max(x, l), u));
}