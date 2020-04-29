import { notes } from './notes'

const masterGainCtrl = document.querySelector('#master-gain');
const masterMuteCtrl = document.querySelector('#master-mute');
const masterPanCtrl = document.querySelector('#master-pan');
const waveletCtrl = document.querySelector('#wavelet');

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

const waveletDuration = 0.2;
function applyEnvelope(track) {
    console.log('applyEnvelope called');
    track.panNode.pan.value = 2 * Math.random() - 1;
    track.gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    track.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    track.gainNode.gain.linearRampToValueAtTime(masterGainCtrl.value, audioCtx.currentTime + (waveletDuration / 2));
    track.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + waveletDuration);
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


const meanWaitTime = 0.2;

const randomizeTrackWavelets = track => {
    let startTime = audioCtx.currentTime
    for (let i = 0; i < 20; i++) {
        startTime += 2 * meanWaitTime * Math.random() + waveletDuration
        console.log(startTime, audioCtx.currentTime)
        applyEnvelope(track)
    }
}


// Listener for keys
window.addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        e.target.classList.toggle('active-key')
        const noteName = `${e.target.textContent}4`

        if (activeKeys[noteName]) {
            activeKeys[noteName].oscillator.stop();
            activeKeys[noteName] = undefined;
        } else {
            const track = createTrack(noteName);
            track.oscillator.start();
            activeKeys[noteName] = track;
        }
    }
});




const lookahead = 25.0 // msec
const scheduleAheadTime = 0.1 // sec
const waveletsInQueue = [];
let nextWaveletTime = 0.0; // when the next wavelet is due

function nextWavelet(track) {
    nextWaveletTime += 2 * meanWaitTime * Math.random() + waveletDuration;
    applyEnvelope(track)
    console.log(`nextWaveletTime: ${nextWaveletTime}`);
}

function scheduleWavelet(time) {
    waveletsInQueue.push(time);
    console.log(`waveletsInQueue: ${waveletsInQueue}`);
}

let timerID;
let activeTrack;
function scheduler() {
    while (nextWaveletTime < audioCtx.currentTime + scheduleAheadTime) {
        //scheduleWavelet(nextWaveletTime);
        nextWavelet(activeTrack);
    }
    timerID = window.setTimeout(scheduler, lookahead);
}

waveletCtrl.addEventListener('click', function () {
    isPlaying = !isPlaying;

    if (isPlaying) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        nextWaveletTime = audioCtx.currentTime;
        for (const key in activeKeys) {
            activeTrack = activeKeys[key]
            scheduler()
        }
    } else {
        window.clearTimeout(timerID);
    }

    // for (const key in activeKeys) {
    //     console.log(`Doing key ${key}`);
    //     randomizeTrackWavelets(activeKeys[key]);
    // }
});
