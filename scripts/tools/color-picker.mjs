const colorDiv = document.getElementById('colorpicker');
const colorButton = document.getElementById('colorbutton');
const bgElements = document.querySelectorAll('.bgclr');
export let color = '#000000ff';

const colorPicker = new window.iro.ColorPicker('#colorpicker', {
    // Set the size of the color picker
    width: colorDiv.offsetWidth,
    // Set the initial color to pure black
    color: "#000000ff",
    borderWidth: 2,
    borderColor: '#000',
    layout: [
        {
            component: iro.ui.Box,
            options: {}
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'hue',
            }
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'alpha',
            }
        },

    ],
});

colorPicker.on('color:change', function (newColor) {
    color = newColor.hex8String;
    bgElements.forEach(element => {
        element.style.backgroundColor = newColor.hex8String;
    });
});

window.document.addEventListener('pointerdown', (event) => {
    const parentDiv = colorDiv.parentElement;
    if (parentDiv.contains(event.target)) {
        colorDiv.style.visibility = 'visible';
    }
    else {
        colorDiv.style.visibility = 'hidden';
    }
});