import { notes } from './notes'

const masterGainCtrl = document.querySelector('#master-gain');
const masterMuteCtrl = document.querySelector('#master-mute');
const masterPanCtrl = document.querySelector('#master-pan');
const playPauseBtn = document.querySelector('#play-pause');
const waveletSpacingSldr = document.querySelector('#wavelet-sldr');

const activeKeys = {};

let isPlaying = false;
let audioCtx = new AudioContext();


const masterGainNode = audioCtx.createGain();

const pannerOpts = { pan: 0 };
const masterPanNode = new StereoPannerNode(audioCtx, pannerOpts);

masterGainNode.connect(masterPanNode);
// masterGainNode.gain.value = 0;

masterPanNode.connect(audioCtx.destination)

function createTrack(note, shape = 'sine') {
    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = notes[note];
    oscillator.type = shape;

    const gainNode = audioCtx.createGain();
    const panNode = new StereoPannerNode(audioCtx, pannerOpts);

    oscillator.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(masterGainNode);

    gainNode.gain.value = 0;

    return { oscillator, gainNode, panNode };
}

// Master controls 
masterGainCtrl.addEventListener('input', function () {
    masterGainNode.gain.value = this.value;
}, false);

masterMuteCtrl.addEventListener('click', function () {
    masterGainNode.gain.value = this.classList.contains('muted') ? masterGainCtrl.value : 0;
    this.classList.toggle('muted')
}, false);

masterPanCtrl.addEventListener('input', function () {
    masterPanNode.pan.value = this.value;
}, false);



const waveletDuration = 0.2;


let meanWaitTime = 0.2;
waveletSpacingSldr.addEventListener('input', function () {
    meanWaitTime = this.value;
    console.log(meanWaitTime);
})

function applyEnvelope(track) {
    track.panNode.pan.value = 2 * Math.random() - 1;
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