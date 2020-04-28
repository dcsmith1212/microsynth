const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');

const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'blue',
    progressColor: 'purple'
});

wavesurfer.load('audio/test.wav');

let playing = false;
playPauseBtn.addEventListener('click', () => {
    playing ? wavesurfer.pause() : wavesurfer.play();
    playing = !playing;
})

stopBtn.addEventListener('click', () => {
    playing = false;
    wavesurfer.stop();
})