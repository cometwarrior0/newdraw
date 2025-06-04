import { layers } from "./layer-handler.mjs";

async function compositeLayers() {
    // All layers share the same dimensions.
    const { width, height } = layers[0].canvas;
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

const savePNGButton = document.getElementById('saveaspng');

// Usage example:
savePNGButton.onclick = async () => {
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
                a.download = 'drawing.png'; // The desired file name

                // Some browsers require the link to be in the document.
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Clean up the URL object
                URL.revokeObjectURL(url);
            }
        }, 'image/png');
    } catch (error) {
        console.error('Error composing layers:', error);
    }
};