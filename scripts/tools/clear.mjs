const clearButton = document.getElementById('clearbutton');

/** @type {Worker} */
import { canvasWorker } from "../script.js";

clearButton.onpointerdown = () => {
    canvasWorker.postMessage({ type: 'clear' });
}