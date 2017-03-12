"use strict";

var audioContext;
var audioSource;
var filter;

var audioAnalyzer;
var rawFrequencyData;
var freqData_fftSize = 128;

var barAudioAnalyzer;
var barFrequencyData;

var mainCanvas;
var glCanvas;
var graphicsState;

window.onload = function init() {
    setupAudio();
    setupCanvas();
}

window.onresize = function() {
    glCanvas.width = window.innerWidth;
    glCanvas.height = window.innerHeight;
}

function setupAudio() {
    var errorCallback = function(e) {
        console.log('Reeeejected!', e);
    };

    audioContext = new AudioContext();

    // Not showing vendor prefixes.
    navigator.getUserMedia({video: false, audio: true}, function(localMediaStream) {
        // TODO: remove video elements
//        var video = document.querySelector('video');
//        video.src = window.URL.createObjectURL(localMediaStream);

        // TODO: may need 2 identical source for 2 connects
        audioSource = audioContext.createMediaStreamSource(localMediaStream);
        filter = audioContext.createBiquadFilter();

        // audioSource -> filter -> destination
        audioSource.connect(filter);
        filter.connect(audioContext.destination);

        // connect to the analyzer
        audioAnalyzer = audioContext.createAnalyser();
        audioSource.connect(audioAnalyzer);
        rawFrequencyData = new Uint8Array(audioAnalyzer.frequencyBinCount);

        barAudioAnalyzer = audioContext.createAnalyser();
        audioSource.connect(barAudioAnalyzer);
        barAudioAnalyzer.fftSize = freqData_fftSize;
        barFrequencyData = new Uint8Array(barAudioAnalyzer.frequencyBinCount);

        // console.log(audioAnalyzer.frequencyBinCount);
        // console.log(barAudioAnalyzer.frequencyBinCount);   

        // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
        // See crbug.com/110938.
//        video.onloadedmetadata = function(e) {
//          // Ready to go. Do some stuff.
//        };
        
        
    }, errorCallback);
    // console.log(audioContext);
    // console.log(audioSource);
    // console.log(audioAnalyzer);
}

function getRawFrequencyData() {
    if (audioAnalyzer) {
        rawFrequencyData = new Uint8Array(audioAnalyzer.frequencyBinCount);
        audioAnalyzer.getByteFrequencyData(rawFrequencyData);
    } else {
        rawFrequencyData = new Uint8Array(0);
    }
//    console.log("Frequency Data: " + rawFrequencyData);
    return rawFrequencyData;
}

function getBarFrequencyData() {
    if (barAudioAnalyzer) {
        barFrequencyData = new Uint8Array(barAudioAnalyzer.frequencyBinCount);
        barAudioAnalyzer.getByteFrequencyData(barFrequencyData);
    } else {
        barFrequencyData = new Uint8Array(0);

    }
    return barFrequencyData;
}

function setupCanvas() {
    glCanvas = document.getElementById("gl-canvas");
    glCanvas.width = window.innerWidth;
    glCanvas.height = window.innerHeight;

    mainCanvas = new Canvas_Manager("gl-canvas", Color(0, 0, 0, 1)),
         graphicsState = mainCanvas.shared_scratchpad.graphics_state;
    
    shaders_in_use["Default"] = new Phong_or_Gouraud_Shader(graphicsState);
    shaders_in_use["Bump Map"] = new Fake_Bump_Mapping(graphicsState);
    
    var textureNames = [];
//    textureNames.push("res/candy-cane-wallpaper-25.png");
    textureNames.push("res/earthmap1-test.jpg");
    textureNames.push("res/smoke.jpg");
    textureNames.push("res/smoke.png");
    
    for (var i = 0; i < textureNames.length; ++i) {
        textures_in_use[textureNames[i]] = new Texture(textureNames[i], true);
    }
    
//    textures_in_use[pic1] = new Texture(pic1, false);
//    textures_in_use[pic2] = new Texture(pic2, true);
    
    mainCanvas.register_display_object(new Main_Scene(mainCanvas));
    mainCanvas.register_display_object(new Main_Camera(mainCanvas));
    
    

    
    mainCanvas.render();
}


window.requestAnimFrame = ( function()						// Use the correct browser's version of requestAnimationFrame() when queue-ing up re-display events. 
{
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||

        function( callback, element) { window.setTimeout(callback, 1000/60);  }
        );
})();