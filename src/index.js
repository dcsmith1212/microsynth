import { notes } from './notes'

const masterGainCtrl = document.querySelector('#master-gain');
const masterMuteCtrl = document.querySelector('#master-mute');
const masterPanCtrl = document.querySelector('#master-pan');


const activeKeys = {};


let audioCtx = new AudioContext();


const masterGainNode = audioCtx.createGain();

const pannerOpts = { pan: 0 };
const masterPanNode = new StereoPannerNode(audioCtx, pannerOpts);

masterGainNode.connect(masterPanNode);
masterPanNode.connect(audioCtx.destination)

function createOscillator(note, shape = 'sine') {
    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = notes[note];
    oscillator.type = shape;
    oscillator.connect(masterGainNode);
    return oscillator;
}



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

window.addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        e.target.classList.toggle('active-key')
        const noteName = `${e.target.textContent}4`

        if (activeKeys[noteName]) {
            activeKeys[noteName].stop();
            activeKeys[noteName] = undefined;
        } else {
            const oscillator = createOscillator(noteName);
            oscillator.start();
            activeKeys[noteName] = oscillator;
        }
    }
});
