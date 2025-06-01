const eraserButton = document.getElementById('eraserbutton');
const eraserSvg = document.getElementById('erasersvg');

export let erase = false;

eraserButton.onclick = () => {
    erase = !erase;
    eraserButton.style.outline = (erase) ? '4px solid #333' : '0';
    eraserButton.style.border = (erase) ? '4px solid #555' : '4px solid #333';
    const fillColor = (erase) ? '#777' : '#555';
    eraserSvg.setAttribute("fill", fillColor);
}