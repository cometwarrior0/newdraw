import { handlePointerEvents } from './main-pointer-handler.mjs';

const createID = (() => {
    let id = 0;
    return () => id++;
})();

// Global arrays
const layers = []; // Each layer is an object: { canvas, offscreenCanvas }
const canvasContainer = document.getElementById('canvascontainer');
let worker = new Worker('scripts/canvas-worker.js', { type: "module" });
let x, y;

const layerContainer = document.getElementById('layercontainer');

export function initLayerHandler(ix, iy) {
    [x, y] = [ix, iy];

    // Setup container dimensions
    canvasContainer.style.width = x + 'px';
    canvasContainer.style.height = y + 'px';

    addLayer();

    // Set up pointer events for the worker
    handlePointerEvents(worker, { x, y });
}








async function compositeLayers() {
    // Assume all layers share the same dimensions.
    const { width, height } = layers[0].canvas; // or layers[0].offscreenCanvas
    console.log(width, height);
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const ctx = finalCanvas.getContext('2d');

    // Draw each layer in order. The first layer is drawn first,
    // and the last one is drawn on top.
    for (const layer of layers) {
        // If you want to make sure you work with a bitmap,
        // convert the offscreen canvas to an ImageBitmap.
        const imageBitmap = await createImageBitmap(layer.canvas);
        ctx.drawImage(imageBitmap, 0, 0);
    }

    return finalCanvas;
}

const link = document.createElement('div');
document.body.appendChild(link);
link.style.position = 'absolute';
link.style.left = '0';
link.style.top = '0';
link.style.width = '1024px';
link.style.height = '64px';
link.style.background = 'blue';

// Usage example:
link.onclick = async () => {
    try {
        // Generate the composite canvas
        const finalCanvas = await compositeLayers();

        // Convert the canvas to a Blob in PNG format
        finalCanvas.toBlob((blob) => {
            if (blob) {
                // Create an object URL for the Blob
                const url = URL.createObjectURL(blob);

                // Create a temporary <a> element to trigger the download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'composite.png'; // The desired file name

                // Append the link to the document (optional)
                document.body.appendChild(a);
                // Programmatically click the link to start the download
                a.click();

                // Clean up the URL object and remove the link element if desired
                URL.revokeObjectURL(url);
                a.remove();
            }
        }, 'image/png');
    } catch (error) {
        console.error('Error composing layers:', error);
    }
};











document.getElementById('addlayer').onclick = addLayer;

function addLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = x;
    canvas.height = y;
    canvas.style.position = 'absolute';
    canvasContainer.appendChild(canvas);

    // Create an offscreen canvas from the DOM canvas.
    const offscreenCanvas = canvas.transferControlToOffscreen();

    // Generate a unique ID and store the layer.
    const id = createID();
    layers.push({ canvas, offscreenCanvas, id });

    // Inform the worker about the new layer.
    worker.postMessage({ type: 'newcanvas', canvas: offscreenCanvas, id: id }, [offscreenCanvas]);

    createDiv(id);

    updateZIndex();
}

function findIndexFromID(id) {
    return layers.findIndex(layer => layer.id === id);
}

function removeLayer(index) {
    if (index > layers.length || index < 0) {
        console.warn('Invalid layer index:', index);
        return -1
    }
    if (layers.length <= 1) {
        console.warn("Cannot remove the last layer.");
        return -1;
    }

    const removedLayer = layers.splice(index, 1)[0];
    const removedID = removedLayer.id;  // Store the removed layer ID.

    removedLayer.canvas.remove();

    worker.postMessage({ type: "removecanvas", id: removedID });

    updateZIndex();

    return 1;
}

function updateZIndex() {
    layers.forEach((layer, index) => {
        layer.canvas.style.zIndex = index.toString();
    });
}


function reorderLayer(oldIndex, newIndex) {
    if (
        oldIndex < 0 ||
        oldIndex >= layers.length ||
        newIndex < 0 ||
        newIndex >= layers.length
    ) {
        console.warn("Invalid indices for reordering:", oldIndex, newIndex);
        return -1;
    }

    // Remove the layer from its original position and insert it at the new position.
    const [movedLayer] = layers.splice(oldIndex, 1);
    layers.splice(newIndex, 0, movedLayer);

    // Update the DOM z-indices.
    updateZIndex();
    return 1;
}

function removeClassFromChildren(parentElement, className) {
    // Loop through all child elements
    parentElement.querySelectorAll("*").forEach(child => {
        if (child.classList.contains(className)) {
            child.classList.remove(className);
        }
    });
}

function focusLayer(index) {
    if (index < 0 || index >= layers.length) {
        console.warn('Invalid layer index:', index);
        return;
    }
    const id = layers[index].id;
    worker.postMessage({ type: 'focuscanvas', id: id });
}

function focusDiv(id) {
    const index = findIndexFromID(id);
    if (index < 0 || index >= layers.length) {
        console.warn('Invalid layer index:', index);
        return;
    }
    focusLayer(index);
    removeClassFromChildren(layerContainer, 'bg-[#555]')

    const div = document.getElementById(id);
    div.classList.add("bg-[#555]");
}

function createDiv(id) {
    const div = document.createElement('div');

    div.style.textAlign = "center"; // Center horizontally
    div.style.position = 'relative';
    div.style.width = '128px';
    div.style.height = '96px';
    div.style.lineHeight = '88px';
    div.style.borderTop = '8px solid #333'
    div.style.color = '#fff';
    div.textContent = `Layer ${id}`;
    div.id = id;
    layerContainer.insertAdjacentElement('afterbegin', div);

    div.onclick = focusDiv.bind(null, id);
    focusDiv(id);

    const dltDiv = document.createElement('div');
    const deldivc = "absolute top-2 right-1 border-[#0000] border-x-[#711f] border-[10px]";
    dltDiv.classList.add(...deldivc.split(' '));
    dltDiv.onclick = deleteDiv;
    div.appendChild(dltDiv);

    function deleteDiv() {
        let idx = findIndexFromID(id);
        if (idx !== -1) {
            if (removeLayer(idx) !== -1) {
                div.remove();
                if (idx >= layers.length) idx--;
                focusDiv(layers[idx].id);
            }
        };
    }

    const upDiv = document.createElement('div');
    const udivc = "absolute top-2 left-1 border-[#0000] border-b-[#111f] border-b-[24px] border-x-[12px]";
    upDiv.classList.add(...udivc.split(' '));
    upDiv.onclick = raiseDiv;
    div.appendChild(upDiv);

    function raiseDiv() {
        let idx = findIndexFromID(id);
        if (reorderLayer(idx, idx + 1) === 1) {
            const previousElem = div.previousElementSibling;
            layerContainer.insertBefore(div, previousElem);
        }
    }

    const downDiv = document.createElement('div');
    const ddivc = "absolute bottom-2 left-1 border-[#0000] border-t-[#111f] border-t-[24px] border-x-[12px]";
    downDiv.classList.add(...ddivc.split(' '));
    downDiv.onclick = lowerDiv;
    div.appendChild(downDiv);

    function lowerDiv() {
        let idx = findIndexFromID(id);
        if (reorderLayer(idx, idx - 1) === 1) {
            let nextElement = div.nextElementSibling;
            nextElement.insertAdjacentElement('afterend', div);
        }
    }

    return;
}