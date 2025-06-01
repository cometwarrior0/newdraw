import { BezierMapper } from "./bezier-mapper.mjs";

export const pressureMap = createPressureMap();

function createPressureMap() {
    const pressureMap = new BezierMapper;

    const fground = window.document.getElementById('fground');

    const triggerDiv = window.document.createElement('div');
    triggerDiv.style.position = 'absolute'; // Positions the div absolutely
    triggerDiv.style.top = '0';
    triggerDiv.style.zIndex = '1000'; // Ensures it appears above other elements
    triggerDiv.textContent = 'Pressure Map';
    triggerDiv.style.color = 'white';
    triggerDiv.style.width = '8rem';
    triggerDiv.style.height = '4rem';
    triggerDiv.style.backgroundColor = '#222';
    triggerDiv.style.textAlign = 'center';
    triggerDiv.style.lineHeight = '4rem';
    triggerDiv.style.cursor = 'pointer';
    triggerDiv.style.borderRadius = '0 0 12px 0';
    triggerDiv.style.outline = '8px solid #333';
    triggerDiv.style.pointerEvents = 'auto';
    fground.appendChild(triggerDiv);

    const canvasWrapper = window.document.createElement('div');
    canvasWrapper.style.display = 'none';
    canvasWrapper.style.borderRadius = '2rem';
    canvasWrapper.style.backgroundColor = '#444';
    canvasWrapper.style.position = 'absolute';
    canvasWrapper.style.top = '50%';
    canvasWrapper.style.left = '50%';
    canvasWrapper.style.transform = 'translate(-50%, -50%)';
    canvasWrapper.style.pointerEvents = 'auto';
    fground.appendChild(canvasWrapper);

    const canO = 32;
    const canvi = window.document.createElement('canvas');
    canvi.id = 'myCanvas';
    canvi.width = 360;
    canvi.height = 360;
    canvasWrapper.appendChild(canvi);
    const ctxP = canvi.getContext('2d');
    ctxP.translate(canO, canO);
    const [canW, canH] = [canvi.width - canO * 2, canvi.height - canO * 2];

    function drawPressureMap() {
        const lastIndex = pressureMap.controlPoints.length - 1;

        ctxP.clearRect(-canO, -canO, canvi.width, canvi.height);
        ctxP.fillStyle = "#bbb";
        ctxP.fillRect(0, 0, canW, canH);

        ctxP.setLineDash([5, 5]);
        ctxP.lineWidth = 1;
        ctxP.strokeStyle = "#f0f";
        ctxP.beginPath();
        ctxP.moveTo(pressureMap.controlPoints[0][0] * canW, (1 - pressureMap.controlPoints[0][1]) * canH);
        for (let i = 0; i < pressureMap.controlPoints.length; ++i) {
            const [x1, y1] = pressureMap.controlPoints[i];
            ctxP.lineTo(x1 * canH, (1 - y1) * canH);
        }
        ctxP.stroke();

        ctxP.setLineDash([0]);
        ctxP.lineWidth = 1.5;
        ctxP.strokeStyle = "#f00";
        ctxP.beginPath();
        ctxP.moveTo(pressureMap.controlPoints[0][0] * canW, canH);
        ctxP.lineTo(pressureMap.controlPoints[0][0] * canW, (1 - pressureMap.controlPoints[0][1]) * canH);
        ctxP.stroke();

        ctxP.strokeStyle = "#000";
        ctxP.beginPath();
        ctxP.moveTo(pressureMap.controlPoints[0][0] * canW, (1 - pressureMap.controlPoints[0][1]) * canH);
        for (let i = 1; i < lastIndex; ++i) {
            const [x1, y1] = pressureMap.controlPoints[i];
            let x2 = 0, y2 = 0;
            if (i < pressureMap.controlPoints.length - 2) {
                x2 = (pressureMap.controlPoints[i + 1][0] + x1) / 2;
                y2 = (pressureMap.controlPoints[i + 1][1] + y1) / 2;
            }
            else {
                x2 = pressureMap.controlPoints[i + 1][0];
                y2 = pressureMap.controlPoints[i + 1][1];
            }
            ctxP.quadraticCurveTo(x1 * canW, (1 - y1) * canH, x2 * canW, (1 - y2) * canH);
        }
        ctxP.lineTo((pressureMap.controlPoints[lastIndex][0]) * canW, (1 - pressureMap.controlPoints[lastIndex][1]) * canH);
        ctxP.stroke();

        ctxP.strokeStyle = "#f00";
        ctxP.beginPath();
        ctxP.moveTo((pressureMap.controlPoints[lastIndex][0]) * canW, (1 - pressureMap.controlPoints[lastIndex][1]) * canH);
        ctxP.lineTo(canW, (1 - pressureMap.controlPoints[lastIndex][1]) * canH);
        ctxP.stroke();
        for (let i = 0; i < pressureMap.controlPoints.length; ++i) {
            const [x, y] = pressureMap.controlPoints[i];
            ctxP.fillStyle = (i === 0 || i === lastIndex) ? "red" : "blue";
            ctxP.beginPath();
            ctxP.arc(x * canW, (1 - y) * canH, 5, 0, 6.2831853);
            ctxP.fill();
        }
    }
    drawPressureMap();

    let conPtI = -1;
    canvi.addEventListener('pointerdown', (e) => {
        e.target.setPointerCapture(e.pointerId);
        const tolerance = 0.1;
        const eX = (e.offsetX - canO) / canW;
        const eY = (canH - e.offsetY + canO) / canH;
        conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
        if (conPtI === -1) {
            pressureMap.addControlPoint(eX, eY);
            conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
            drawPressureMap();
        }
    });

    addEventListener('pointerup', (e) => {
        e.target.releasePointerCapture(e.pointerId);
        if (conPtI !== -1) {
            const maxDist = 0.2;
            const eX = (e.offsetX - canO) / canW;
            const eY = (canH - e.offsetY + canO) / canH;
            if (pressureMap.getControlPointDist(conPtI, [eX, eY]) > maxDist) {
                pressureMap.removeControlPoint(conPtI);
                drawPressureMap();
            }
        }
        conPtI = -1;
    });

    canvi.addEventListener('pointermove', (e) => {
        if (conPtI !== -1) {
            const eX = (e.offsetX - canO);
            const eY = (e.offsetY - canO);
            pressureMap.setControlPoint(conPtI, eX / canW, 1 - eY / canH);
            drawPressureMap();
        }
    });
    // Show canvas when clicking on trigger div
    triggerDiv.addEventListener('click', () => {
        canvasWrapper.style.display = (canvasWrapper.style.display === 'block') ? 'none' : 'block';
    });
    // Hide canvas when clicking outside the canvas
    window.document.addEventListener('pointerdown', (event) => {
        if (!canvasWrapper.contains(event.target) && event.target !== triggerDiv) {
            canvasWrapper.style.display = 'none';
        }
    });
    return pressureMap;
}
