const fillButton = document.getElementById('fillbutton');

/** @type {Worker} */
import { canvasWorker } from "../script.js";
import { color } from "./color-picker.mjs";

fillButton.onpointerdown = () => {
    canvasWorker.postMessage({ type: 'fill', color });
}