const colorDiv = document.getElementById('colorpicker');
const colorButton = document.getElementById('colorbutton');
const bgElements = document.querySelectorAll('.bgclr');
export let color = '#000f';

const colorPicker = new window.iro.ColorPicker('#colorpicker', {
    // Set the size of the color picker
    width: colorDiv.offsetWidth,
    // Set the initial color to pure black
    color: "#000f",
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
                // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
                sliderType: 'hue',
            }
        },
        {
            component: iro.ui.Slider,
            options: {
                // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
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

colorButton.onclick = () => {
    colorDiv.style.visibility = 'visible';
}
window.document.addEventListener('pointerdown', (event) => {
    if (!colorDiv.contains(event.target) && event.target !== colorDiv) {
        colorDiv.style.visibility = 'hidden';
    }
});