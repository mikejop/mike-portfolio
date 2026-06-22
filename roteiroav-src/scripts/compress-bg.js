const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '..', 'public', 'img', 'dojo_final_2.1.1.png');
const output = path.join(__dirname, '..', 'public', 'img', 'bg.webp');

sharp(input)
    .webp({ quality: 80 })
    .toFile(output)
    .then(info => {
        console.log('Image compressed successfully:', info);
    })
    .catch(err => {
        console.error('Error compressing image:', err);
    });
