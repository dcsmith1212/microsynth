import { notes } from './notes'

// const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');







let audioCtx = new AudioContext();

function createOscillator(note, shape = 'sine') {
    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = notes[note];
    oscillator.type = shape;
    oscillator.connect(audioCtx.destination);
    return oscillator;
}


const oscillator1 = createOscillator('C4');
// const oscillator2 = createOscillator('E4');
// const oscillator3 = createOscillator('G4');
// const oscillator4 = createOscillator('C5');

playPauseBtn.addEventListener('click', () => {
    oscillator1.start();
    // oscillator2.start();
    // oscillator3.start();
    // oscillator4.start();
})

stopBtn.addEventListener('click', () => {
    oscillator1.stop();
    // oscillator2.stop();
    // oscillator3.stop();
    // oscillator4.stop();
})
