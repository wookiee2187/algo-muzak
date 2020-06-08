/*
  Experimented with the ADSR envelope and the Oscillator
  combined with the basic visualizations two
  Used the random function for the ADSR envelope
  creates somewhat painful music but I found the visualization interesting to
  look at, and the sound was always interesting/
  Source - https://nbriz.github.io/intermediate-netart/notes/web-audio/
  Last updated - June 7th 2020
*/
const ctx = new (window.AudioContext || window.webkitAudioContext)()
const tone = new OscillatorNode(ctx)
const lvl = new GainNode(ctx, { gain: 0.001 })
const fft = new AnalyserNode(ctx)

tone.connect(lvl)
lvl.connect(ctx.destination)
lvl.connect(fft)

function adsr (param, peak, val, time, a, d, s, r) {
  const initVal = param.value
  param.setValueAtTime(initVal, time)
  param.linearRampToValueAtTime(peak, time+a)
  param.linearRampToValueAtTime(val, time+a+d)
  param.linearRampToValueAtTime(val, time+a+d+s)
  param.linearRampToValueAtTime(initVal, time+a+d+s+r)
}

const p = 0.8 // peak value for all tones
const v = 0.7 // sustained value for all tones
// chooses random notes ten times and plays them in succession
for (i = 0; i < 10; i++) {
  tone.frequency.setValueAtTime((Math.random() * 530)+ 200, ctx.currentTime)
  adsr(lvl.gain, p,v, ctx.currentTime, 0.2,0.1,0.4,0.2) // 0.9s

  tone.frequency.setValueAtTime((Math.random() * 530)+ 200, ctx.currentTime + 1)
  adsr(lvl.gain, p,v, ctx.currentTime + 1+ i*7, 0.2,0.1,0.4,0.2) // 0.9s

  tone.frequency.setValueAtTime((Math.random() * 530)+ 200, ctx.currentTime + 2)
  adsr(lvl.gain, p,v, ctx.currentTime + 2+ i*7, 0.2,0.1,0.4,0.2) // 0.9s

  tone.frequency.setValueAtTime((Math.random() * 530)+ 200, ctx.currentTime + 3)
  adsr(lvl.gain, p,v, ctx.currentTime + 3+ i*7, 0.2,0.1,0.7,0.2) // 1.2s

  tone.frequency.setValueAtTime((Math.random() * 530)+ 200, ctx.currentTime + 4.5)
  adsr(lvl.gain, p,v, ctx.currentTime + 4.5+ i*7, 0.2,0.1,2.0,0.2) // 2.5s


}
tone.start(ctx.currentTime)
tone.stop(ctx.currentTime + 70)

const osc = new OscillatorNode( ctx )
const gn = new GainNode(ctx, {gain:0.5})

osc.connect(gn)
gn.connect(fft)
fft.connect(ctx.destination)

// oscillate experiment
let inc = 10
function oscFreq(){
    requestAnimationFrame(oscFreq)
    if(osc.frequency.value > 1060 || osc.frequency.value < 40) inc=-inc
    osc.frequency.value += inc
}

osc.start()
oscFreq()

// ------------------------------------------------
// ------------- canvas animations ----------------
// ------------------------------------------------

// create canvas...
const canvas = document.createElement('canvas')
canvas.width = document.querySelector('section').offsetWidth
document.querySelector('section').appendChild(canvas)
const canvasCtx = canvas.getContext("2d")
canvasCtx.fillStyle = "#23241f"
canvasCtx.strokeStyle = "#f92672"

// create array to store data in
let bufferLength = fft.frequencyBinCount
let dataArray = new Uint8Array(bufferLength)

function animate(){
    setTimeout(animate,1000/12) // 12fps
    canvasCtx.fillStyle = "#23241f"
    canvasCtx.fillRect(0,0,canvas.width,canvas.height)

    // fill dataArray w/ time domain data (ints 0-128)...
    fft.getByteTimeDomainData(dataArray)

    // draw time domain data (waveform)...
    canvasCtx.beginPath()
    let column = canvas.width/bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i++) {
        // normalize data scale to canvas
        let y = (dataArray[i]/128) * (canvas.height/2)
        if (i===0) canvasCtx.moveTo(x, y)
        else canvasCtx.lineTo(x, y)
        x += column
    }
    canvasCtx.lineTo(canvas.width, canvas.height/2)
    canvasCtx.stroke()

    // now fill dataArray w/ frequency domain data (ints 0-255)...
    fft.getByteFrequencyData(dataArray)

    // draw frequency domain data (bar graph)...
    x = 0
    let barH, barW = canvas.width/bufferLength
    for(let i = 0; i < bufferLength; i++) {
        //normalize data scale to 75% of canvas height
        barH = dataArray[i]/255 * canvas.height * 0.75
        // yellow, but the higher the data value the more saturated
        canvasCtx.fillStyle = `rgb(${dataArray[i]},${dataArray[i]},50)`
        canvasCtx.fillRect(x, canvas.height-barH, barW,barH )
        x += barW + 1
    }

    // draw current osc frequency value
    canvasCtx.fillStyle = '#fff'
    canvasCtx.font = '24px Arial'
    canvasCtx.fillText(`${osc.frequency.value}Hz`, 10, 30)

}
animate()
