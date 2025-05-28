import { handleTransform } from './transform-handler.mjs';
import { handlePen } from './pen-handler.mjs';

/**
   * Handles pointer events for scrolling/transforming the origin.
   * @param {HTMLElement} origin - The element to be transformed.
   * @param {Worker} worker
   * @returns {Function} A function to clean up event listeners and intervals.
 */
export const handlePointerEvents = (origin, worker, rect) => {
  // Initial state for transformation and active pointers.
  const state = {
    transX: (origin.getBoundingClientRect().left) | 0,
    transY: (origin.getBoundingClientRect().top) | 0,
    rotation: 0,
    zoom: 1,
    activePointers: new Map(),
  };

  // Pointer down handler: capture the pointer and register its initial state.
  /** @param {PointerEvent} e */
  function pointerDown(e) {
    // worker.postMessage({
    //   type: 'pointerDown',
    //   x: e.clientX,
    //   y: e.clientY,
    // })
    // Capture pointer events so the element receives all related events.
    e.target.setPointerCapture(e.pointerId);

    state.activePointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      prevX: e.clientX,
      prevY: e.clientY,
    });

    worker.postMessage({
      type: 'pointerDown',
      x: e.offsetX - rect.x,
      y: e.offsetY - rect.y,
      radius: e.pressure * 20,
      color: [1, 0, 0, e.pressure],
    });

    // Process immediate movement.
    coalEvents.push(e);
    pointerMove(e);
  }

  let coalEvents = [];
  let meow = 0;
  // Pointer move handler: update pointer tracking then delegate appropriately.
  /** @param {PointerEvent} e */
  function pointerMove(e) {
    if (!state.activePointers.has(e.pointerId))
      return;

    coalEvents.push(...e.getCoalescedEvents());
    for (let event of coalEvents) {
      if (meow === 0)
        worker.postMessage({
          type: 'pointerMove',
          x: event.offsetX - rect.x,
          y: event.offsetY - rect.y,
          radius: e.pressure * 20,
          color: [1, 0, 0, e.pressure],
        });
      meow = ++meow & 0;
    }
    coalEvents.length = 0;

    // worker.postMessage({
    //   type: 'pointerMove',
    //   x: e.offsetX - rect.x,
    //   y: e.offsetY - rect.y,
    // })

    const pointer = state.activePointers.get(e.pointerId);
    state.activePointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      prevX: pointer.x,
      prevY: pointer.y,
    });

    // Dispatch to specialized handlers based on pointer type.
    if (e.pointerType === 'touch') {
      handleTransform(e, state);
    }
    else if (e.pointerType === 'pen') {
      handlePen(e, state);
    }
    // else{
    //   handleTransform(e, state);
    // }

    // Apply the combined CSS transform.
    origin.style.transform = `
            translate(${state.transX}px, ${state.transY}px)
            scale(${state.zoom})
            rotate(${state.rotation}rad)
        `;
  }

  // Pointer up & cancel handler: release pointer capture and clean-up tracking.
  /** @param {PointerEvent} e */
  function pointerUp(e) {
    meow = 0;
    // worker.postMessage({
    //   type: 'pointerUp',
    //   x: e.clientX,
    //   y: e.clientY,
    // })
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    state.activePointers.delete(e.pointerId);
  }

  const bground = document.getElementById("bground");

  // Attach pointer event listeners on the background element.
  bground.addEventListener('pointerdown', pointerDown);
  bground.addEventListener('pointermove', pointerMove);
  bground.addEventListener('pointerup', pointerUp);
  bground.addEventListener('pointercancel', pointerUp);

  // Return a cleanup function to remove listeners and intervals.
  return () => {
    bground.removeEventListener('pointerdown', pointerDown);
    bground.removeEventListener('pointermove', pointerMove);
    bground.removeEventListener('pointerup', pointerUp);
    bground.removeEventListener('pointercancel', pointerUp);
  };
};
