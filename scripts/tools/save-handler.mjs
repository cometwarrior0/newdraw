import { layers } from "../layers/layer-handler.mjs";

const savePNGButton = document.getElementById('saveaspng');

async function compositeLayers() {
    const { width, height } = layers[0].canvas;
    // All layers share the same dimensions.
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

savePNGButton.onpointerdown = async () => {
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
        console.log("Image saved successfully!");
    } catch (error) {
        console.error('Error composing layers:', error);
    }
};

const saveProjectButton = document.getElementById('saveproject');

function saveProject() {
    const { width, height } = layers[0].canvas;
    try {
        // Build up a project object containing an array of layers.
        // Each layer is stored with its image data (as a data URL) and any additional metadata.
        const projectData = {
            width,
            height,
            layerData: [],
        };

        // Iterate over each layer and save its canvas as a data URL.
        for (const layer of layers) {
            // Convert the layer's canvas to a data URL (PNG format).
            const dataURL = layer.canvas.toDataURL('image/png');
            projectData.layerData.push(dataURL);
        }

        // Serialize the project data to JSON.
        const projectJSON = JSON.stringify(projectData);

        // Create a Blob from the JSON, then an object URL for it.
        const blob = new Blob([projectJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link element and trigger a download.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.json'; // The filename for your saved project.
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the object URL.
        URL.revokeObjectURL(url);
        console.log("Project saved successfully!");
    } catch (error) {
        console.error('Error saving project:', error);
    }
}

// Bind the click (or pointerdown) event to your project saving button.
saveProjectButton.onpointerdown = saveProject;
