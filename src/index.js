import { notes } from './notes'

const masterGainCtrl = document.querySelector('#master-gain');
const masterMuteCtrl = document.querySelector('#master-mute');
const masterPanCtrl = document.querySelector('#master-pan');
const playPauseBtn = document.querySelector('#play-pause');
const waveletSpacingSldr = document.querySelector('#wavelet-sldr');
const waveletLengthSldr = document.querySelector('#wavelet-len-sldr');
const waveletVisual = document.querySelector('.wavelet-vis');
const visualContainer = document.querySelector('.visual');
const panUniformRadio = document.getElementById('uniform');
const panNormalRadio = document.getElementById('normal');


const activeKeys = {};

let isPlaying = false;

let audioCtx = new AudioContext();
const masterGainNode = audioCtx.createGain();
const pannerOpts = { pan: 0 };
const masterPanNode = new StereoPannerNode(audioCtx, pannerOpts);
masterGainNode.connect(masterPanNode);
masterPanNode.connect(audioCtx.destination)

const visualWidth = 500;
const visualHeight = 200;
visualContainer.style.width = visualWidth;
visualContainer.style.height = visualHeight;

let panDistribution = 'uniform';

// Standard Normal variate using Box-Muller transform.
function normal(mean, standardDeviation) {
    let u, v, s;
    do {
        u = 2 * Math.random() - 1;
        v = 1 * Math.random() - 1;
        s = u * u + v * v;
    } while (s >= 1);
    if (s === 0) return 0;
    return mean + standardDeviation * u * Math.sqrt(-2 * Math.log(s) / s);
}

function createTrack(note, shape = 'sine') {
    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = notes[note];
    oscillator.type = shape;

    const gainNode = audioCtx.createGain();
    const panNode = new StereoPannerNode(audioCtx, pannerOpts);

    oscillator.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(masterGainNode);

    return { oscillator, gainNode, panNode };
}

function generateRandomVisual(lengthSldrVal, waveletSpacing) {
    const waveletWidth = visualWidth * (10 * lengthSldrVal + 1) / 100;
    const minTime = waveletWidth / 2;
    const maxTime = visualWidth - minTime;
    visualContainer.innerHTML = '';

    const numWavelets = Math.ceil(360 * (0.5001 - waveletSpacing) + 20);
    for (let i = 0; i < numWavelets; i++) {
        const time = Math.round((visualWidth - waveletWidth) * Math.random());
        let pan;
        if (panDistribution === 'uniform') {
            pan = Math.round((visualHeight - 2) * Math.random());
        } else if (panDistribution === 'normal') {
            pan = Math.round((visualHeight - 2) * normal(0.5, 1 / 6));
        }

        if (0 <= pan && pan <= visualHeight) {
            const wavelet = document.createElement('div');
            wavelet.style.top = `${pan}px`;
            wavelet.style.left = `${time}px`;
            wavelet.style.width = `${waveletWidth}px`;
            wavelet.classList.add('wavelet-vis');
            visualContainer.appendChild(wavelet);
        }
    }
}

generateRandomVisual(waveletLengthSldr.value, waveletSpacingSldr.value);

// Master controls 
masterGainCtrl.addEventListener('input', function () {
    masterGainNode.gain.value = this.value;
    const sliderValueSpan = masterGainCtrl.parentElement.querySelector('.numerical');
    sliderValueSpan.textContent = this.value;
}, false);

masterMuteCtrl.addEventListener('click', function () {
    masterGainNode.gain.value = this.classList.contains('muted') ? masterGainCtrl.value : 0;
    this.classList.toggle('muted')
}, false);

masterPanCtrl.addEventListener('input', function () {
    masterPanNode.pan.value = this.value;
    const sliderValueSpan = masterPanCtrl.parentElement.querySelector('.numerical');
    sliderValueSpan.textContent = this.value;
}, false);



let waveletDuration = 0.2;
waveletLengthSldr.addEventListener('input', function () {
    waveletDuration = parseFloat(this.value);
    generateRandomVisual(this.value, waveletSpacingSldr.value);
})

let meanWaitTime = 0.2;
waveletSpacingSldr.addEventListener('input', function () {
    meanWaitTime = parseFloat(this.value);
    console.log(waveletLengthSldr);
    generateRandomVisual(waveletLengthSldr.value, this.value);
})

function applyEnvelope(track) {
    if (panDistribution === 'uniform') {
        track.panNode.pan.value = 2 * Math.random() - 1;
    } else if (panDistribution === 'normal') {
        let panValue;
        do {
            panValue = normal(0, 0.25);
        } while (panValue > 1 || panValue < -1);
        track.panNode.pan.value = panValue;
    }
    track.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    track.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    track.gainNode.gain.linearRampToValueAtTime(masterGainCtrl.value, audioCtx.currentTime + (waveletDuration / 2));
    track.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + waveletDuration);
}


const lookahead = 25.0 // msec
const scheduleAheadTime = 0.1 // sec

function nextWavelet(track) {
    track.nextWaveletTime += 2 * meanWaitTime * Math.random() + waveletDuration;
    applyEnvelope(track)
}

let timerID;
function scheduler(track) {
    while (track.nextWaveletTime < audioCtx.currentTime + scheduleAheadTime) {
        nextWavelet(track);
    }
    timerID = window.setTimeout(scheduler, lookahead, track);
}

playPauseBtn.addEventListener('click', function () {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';

    if (isPlaying) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        for (const key in activeKeys) {
            activeKeys[key].nextWaveletTime = audioCtx.currentTime;
            scheduler(activeKeys[key])
        }
    } else {
        audioCtx.suspend();
        window.clearTimeout(timerID);
    }
});


// Listener for keys
window.addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        e.target.classList.toggle('active-key')
        const noteName = `${e.target.textContent}4`

        if (activeKeys[noteName]) {
            activeKeys[noteName].oscillator.stop();
            delete activeKeys[noteName];
            window.clearTimeout(timerID);
        } else {
            const track = createTrack(noteName);
            track.oscillator.start();
            track.nextWaveletTime = audioCtx.currentTime;
            activeKeys[noteName] = track;
            scheduler(track)
        }

        isPlaying = Object.keys(activeKeys).length > 0 ? true : false;
        playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    }
});


function updatePanDistribution(e) {
    panDistribution = e.target.value;
    generateRandomVisual(waveletLengthSldr.value, waveletSpacingSldr.value);

}

panUniformRadio.addEventListener('click', updatePanDistribution);
panNormalRadio.addEventListener('click', updatePanDistribution);
