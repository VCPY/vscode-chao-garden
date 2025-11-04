import * as fs from 'fs';

const chaoTypes = ['neutral_chao', 'dark_chao', 'hero_chao'];
const gifStates = [
    'idle',
    'walking',
    'falling',
    'sitting',
    'standing_happy',
    'sitting_happy',
];

function checkChaoGifFilenames(folder: string) {
    chaoTypes.forEach((chaoType) => {
        gifStates.forEach((state) => {
            const filename = `${chaoType}_${state}.gif`;
            const filePath = `${folder}/${chaoType}/${filename}`;
            if (!fs.existsSync(filePath)) {
                // \x1b[31m is the ANSI escape code for red, and \x1b[0m resets the color back to the terminal's default.
                console.error(`\x1b[31mFile "${filePath}" does not exist.\x1b[0m`);
            } else {
                console.error(`File "${filePath}" exists.`);
            }
        });
    });
}

const mediaFolder = './media';
checkChaoGifFilenames(mediaFolder);
