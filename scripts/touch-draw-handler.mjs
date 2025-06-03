// import { pressureMap } from "./pressure-map.mjs";
// import { color } from "./color-picker.mjs";
// import { radius } from "./head-size.mjs";
// import { erase } from "./eraser.mjs";

// const bground = document.getElementById("bground");
// let worker, rect;

// let deactivated = false;
// let activatedNew = false;
// let touchCount = 0;

// const minTime = 200;
// const minDist = 20;

// /** @param {TouchEvent} e */
// function touchStart(e) {
//     touchCount = e.touches.length;
//     if (touchCount === 1) {
//         activatedNew = true;
//         const tmp = e.touches[0];
//         actCoord = [tmp.clientX, tmp.clientY];
//     }
//     else if (touchCount === 2) {
//         deactivated = true;
//     }
// }

// /** @param {TouchEvent} e */
// function touchFinish(e) {
//     touchCount = e.touches.length;
//     if (touchCount === 1) {
//         activatedNew = true;
//         const tmp = e.touches[0];
//         actCoord = { x: tmp.clientX, y: tmp.clientY };
//     }
//     else if (touchCount === 0) {
//         deactivated = true;
//         pointerMove(e);
//     }
// }

// let activationDate = null;
// let actCoord = null;
// let touchActive = false;
// /** @param {PointerEvent} e */
// function pointerMove(e) {
//     if(e.pointerType !== 'touch') return

//     if (Math.hypot(actCoord.x - e.clientX, actCoord.y - e.clientY) < minDist) return;

//     // Use getCoalescedEvents if available; otherwise, fall back to a single-event array.
//     const coalescedEvents = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
//     // Extract only x, y, and pressure values in order
//     const eventData = coalescedEvents.map(e => ({
//         x: e.offsetX - rect.x,
//         y: e.offsetY - rect.y,
//         pressure: pressureMap.mapXToY(e.pressure || 1),
//     }));

//     if (activatedNew) {
//         activatedNew = false;
//         worker.postMessage({
//             type: 'pointerDown',
//             event: eventData,
//             color: color,
//             radius: radius,
//             erase: erase,
//         });
//     }
//     else {
//         worker.postMessage({
//             type: 'pointerMove',
//             event: eventData,
//         });
//     }
// }

// export function initTouch(workeri, recti) {
//     worker = workeri;
//     rect = { x: 16384 - recti.x / 2, y: 16384 - recti.y / 2 }; // magic values, 16384 = half of 32768 to get the center, and subtract half of width and height of canvas to fit x y values to canvas

//     bground.addEventListener('touchstart', touchStart);
//     bground.addEventListener('pointermove', pointerMove);
//     bground.addEventListener('touchend', touchFinish);
//     bground.addEventListener('touchcancel', touchFinish);
// }


export function initTouch(workeri, recti) { }