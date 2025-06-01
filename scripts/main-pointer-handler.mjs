import { handleTouch } from './transform-handler.mjs';
import { initPen } from './pen-handler.mjs';
import { initTouch } from './touch-draw-handler.mjs';

/**
   * Handles pointer events for scrolling/transforming the origin.
   * @param {Worker} worker
   * @returns {Function} A function to clean up event listeners and intervals.
 */
export const handlePointerEvents = (worker, rect) => {
  handleTouch(rect);
  initPen(worker, rect);
  initTouch(worker, rect);
};
