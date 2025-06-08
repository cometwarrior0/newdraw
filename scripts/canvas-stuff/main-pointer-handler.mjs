import { handleTouch } from './transform-handler.mjs';
import { initPen } from './pen-handler.mjs';
import { initTouch } from './touch-draw-handler.mjs';

/**
   * Handles pointer events for scrolling/transforming the origin.
   * @returns {Function} A function to clean up event listeners and intervals.
 */
export const handlePointerEvents = (rect) => {
  handleTouch(rect);
  initPen(rect);
  initTouch(rect);
};
