import { BezierMapper } from "./bezier-mapper.mjs";

export function createPressureMap() {
    const pressureMap = new BezierMapper;

    const triggerDiv = document.createElement('div');
    console.log(triggerDiv);
    triggerDiv.style.position = 'absolute'; // Positions the div absolutely
    triggerDiv.style.zIndex = '1000'; // Ensures it appears above other elements
    triggerDiv.textContent = 'Pressure Map';
    triggerDiv.style.width = '100px';
    triggerDiv.style.height = '50px';
    triggerDiv.style.backgroundColor = 'lightblue';
    triggerDiv.style.textAlign = 'center';
    triggerDiv.style.lineHeight = '50px';
    triggerDiv.style.cursor = 'pointer';
    document.body.appendChild(triggerDiv);

    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.display = 'none';
    canvasWrapper.style.position = 'absolute';
    canvasWrapper.style.top = '50%';
    canvasWrapper.style.left = '50%';
    canvasWrapper.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(canvasWrapper);

    const canO = 24;
    const canvi = document.createElement('canvas');
    canvi.id = 'myCanvas';
    canvi.width = 360 + canO * 2;
    canvi.height = 360 + canO * 2;
    canvi.style.backgroundColor = 'lightgray';
    canvasWrapper.appendChild(canvi);
    const ctxP = canvi.getContext('2d');
    ctxP.translate(canO, canO);
    const [canX, canY] = [canvi.width - canO * 2, canvi.height - canO * 2];

    function drawPressureMap() {
        ctxP.clearRect(-canO, -canO, canvi.width, canvi.height);
        ctxP.fillStyle = "rgba(255, 255, 255, 1)";
        ctxP.fillRect(0, 0, canX, canY);
        ctxP.strokeStyle = "rgb(255,0,0)";
        ctxP.beginPath();
        ctxP.moveTo(pressureMap.controlPoints[0][0] * canX, canY);
        ctxP.lineTo(pressureMap.controlPoints[0][0] * canX, (1 - pressureMap.controlPoints[0][1]) * canY);
        ctxP.stroke();
        ctxP.strokeStyle = "rgb(0,0,0)";
        ctxP.beginPath();
        ctxP.moveTo(pressureMap.controlPoints[0][0] * canX, (1 - pressureMap.controlPoints[0][1]) * canY);
        for (let i = 1; i < pressureMap.controlPoints.length - 1; ++i) {
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
            ctxP.quadraticCurveTo(x1 * canX, (1 - y1) * canY, x2 * canX, (1 - y2) * canY);
        }
        ctxP.lineTo((pressureMap.controlPoints[pressureMap.controlPoints.length - 1][0]) * canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
        ctxP.stroke();
        ctxP.beginPath();
        ctxP.moveTo((pressureMap.controlPoints[pressureMap.controlPoints.length - 1][0]) * canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
        ctxP.strokeStyle = "rgb(255, 0, 0)";
        ctxP.lineTo(canX, (1 - pressureMap.controlPoints[pressureMap.controlPoints.length - 1][1]) * canY);
        ctxP.stroke();
        for (let i = 0; i < pressureMap.controlPoints.length; ++i) {
            const [x, y] = pressureMap.controlPoints[i];
            ctxP.fillStyle = (i === 0 || i === pressureMap.controlPoints.length - 1) ? "red" : "blue";
            ctxP.beginPath();
            ctxP.arc(x * canX, (1 - y) * canY, 5, 0, 6.2831853);
            ctxP.fill();
        }
    }
    drawPressureMap();

    let conPtI = -1;
    canvi.addEventListener('pointerdown', (e) => {
        const tolerance = 0.1;
        const eX = (e.offsetX - canO) / canX;
        const eY = (canY - e.offsetY + canO) / canY;
        conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
        if (conPtI === -1) {
            pressureMap.addControlPoint(eX, eY);
            conPtI = pressureMap.getControlPointIdx([eX, eY], tolerance);
        }
    });

    addEventListener('pointerup', (e) => {
        if (conPtI !== -1) {
            const maxDist = 0.2;
            const eX = (e.offsetX - canO) / canX;
            const eY = (canY - e.offsetY + canO) / canY;
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
            pressureMap.setControlPoint(conPtI, eX / canX, 1 - eY / canY);
            drawPressureMap();
        }
    });
    // Show canvas when clicking on trigger div
    triggerDiv.addEventListener('click', () => {
        canvasWrapper.style.display = 'block';
    });
    // Hide canvas when clicking outside the canvas
    document.addEventListener('pointerdown', (event) => {
        if (!canvasWrapper.contains(event.target) && event.target !== triggerDiv) {
            canvasWrapper.style.display = 'none';
        }
    });
    return pressureMap;
}
