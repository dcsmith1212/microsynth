const MIN_OCTAVE = 0;
const MAX_OCTAVE = 9;
const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const noteNames = [];
const notes = {};

// Reference from A0, to maintain numerical precision 
const referenceFreq = 27.5;
const referenceIndex = noteNames.findIndex(name => name === 'A0');

// Generate note names with octave number
let noteIndex = 0;
for (let octave = MIN_OCTAVE; octave < MAX_OCTAVE; octave++) {
    letters.forEach(letter => {
        const noteName = `${letter}${octave}`;
        noteNames.push(noteName);
        noteIndex++;

        // Include sharps
        if (!['E', 'B'].includes(letter)) {
            const noteName = `${letter}#${octave}`
            noteNames.push(noteName);
            noteIndex++;
        }
    });
}

// Create mapping from note names to frequency
for (let i = referenceIndex; i < noteNames.length; i++) {
    notes[noteNames[i]] = referenceFreq * Math.pow(2, (i - referenceIndex) / 12);
}
for (let i = referenceIndex - 1; i >= 0; i--) {
    notes[noteNames[i]] = referenceFreq * Math.pow(2, (i - referenceIndex) / 12);
}

export { notes }