const sliderContainer = document.getElementById('slidercontainer');
const sizeButton = document.getElementById('sizebutton');
const sizeBg = document.getElementById('sizebg');

export let radius = 12;
slider.value = 24;
slider.oninput = (event) => {
    let diameter = parseInt(event.target.value);
    radius = diameter / 2;
    sizeBg.style.width = diameter + 'px';
    sizeBg.style.height = diameter + 'px';
}

sizeButton.onclick = () => {
    sliderContainer.style.visibility = 'visible';
}

window.document.addEventListener('pointerdown', (event) => {
    if (!sliderContainer.contains(event.target) && event.target !== sliderContainer) {
        sliderContainer.style.visibility = 'hidden';
    }
});