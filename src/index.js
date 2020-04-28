import { notes } from './notes'

const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');
const freqSlider = document.getElementById('freqSlider');

const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'blue',
    progressColor: 'purple'
});

wavesurfer.load('audio/test.wav');



let audioCtx = new AudioContext();
let oscillator = audioCtx.createOscillator();
oscillator.frequency.value = 440;

freqSlider.addEventListener('input', e => {
    console.log(e.target.value);
    oscillator.frequency.value = parseInt(e.target.value);
})

let playing = false;
playPauseBtn.addEventListener('click', () => {
    playing ? wavesurfer.pause() : wavesurfer.play();
    playing = !playing;
})

stopBtn.addEventListener('click', () => {
    playing = false;
    wavesurfer.stop();
    oscillator.stop();
})

oscillator.connect(audioCtx.destination);
oscillator.start()
//oscillator.stop(audioCtx.currentTime + 3);

