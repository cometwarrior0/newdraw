/** @param {HTMLDivElement} e */
const layerContainer = document.getElementById('layercontainer');

layerContainer.onpointerdown = pointerDown;
layerContainer.onpointermove = pointerMove;
layerContainer.onpointerup = pointerUp;
layerContainer.onpointercancel = pointerUp;

let lastY, pointerID = null;

/** @param {PointerEvent} e */
function pointerDown(e) {
    pointerID = e.pointerId;
    layerContainer.setPointerCapture(pointerID);
    lastY = e.clientY;
}

/** @param {PointerEvent} e */
function pointerMove(e) {
    if (e.pointerId !== pointerID) return;

    const deltaY = lastY - e.clientY;
    layerContainer.scrollBy(0, deltaY);

    lastY = e.clientY
}

/** @param {PointerEvent} e */
function pointerUp(e) {
    if (e.pointerId !== pointerID) return;
    layerContainer.releasePointerCapture(pointerID);
    pointerID = null;
}