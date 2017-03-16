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

}

function setupAudio() {
    var errorCallback = function(e) {
        console.log('Reeeejected!', e);
    };

    audioContext = new AudioContext();

    // Not showing vendor prefixes.
    navigator.getUserMedia({video: false, audio: true}, function(localMediaStream) {

        audioSource = audioContext.createMediaStreamSource(localMediaStream);
        filter = audioContext.createBiquadFilter();

        // removed to avoid feedback loop
        // audioSource -> filter -> destination
        // audioSource.connect(filter);
        // filter.connect(audioContext.destination);

        // connect to the analyzer
        audioAnalyzer = audioContext.createAnalyser();
        audioSource.connect(audioAnalyzer);
        rawFrequencyData = new Uint8Array(audioAnalyzer.frequencyBinCount);

        barAudioAnalyzer = audioContext.createAnalyser();
        audioSource.connect(barAudioAnalyzer);
        barAudioAnalyzer.fftSize = freqData_fftSize;
        barFrequencyData = new Uint8Array(barAudioAnalyzer.frequencyBinCount);   

        var background_music = new Audio("res/sounds/vitas.mp3");
        background_music.volume = 0.1;
        background_music.loop = true;
        background_music.play();

        var exhaust_music = new Audio("res/sounds/fire.mp3");
        exhaust_music.volume = 1.0;
        exhaust_music.loop = true;
        exhaust_music.play();
        
    }, errorCallback);
}

function getRawFrequencyData() {
    if (audioAnalyzer) {
        rawFrequencyData = new Uint8Array(audioAnalyzer.frequencyBinCount);
        audioAnalyzer.getByteFrequencyData(rawFrequencyData);
    } else {
        rawFrequencyData = new Uint8Array(0);
    }
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
    textureNames.push("text.png");
    textureNames.push("res/background/planet.jpg");
    textureNames.push("res/asteroid/ast4.jpg");
    textureNames.push("res/background/star.gif");
    textureNames.push("res/space-ship/exhaust.png");
    textureNames.push("res/space-ship/original-texture.jpg");
    textureNames.push("res/space-ship/laser.jpg");
    textureNames.push("res/space-ship/laserBlue.png");
    textureNames.push("res/beginning-screens/startTexture.png");
    textureNames.push("res/beginning-screens/loadingTexture.png");

    
    for (var i = 1; i <= 7; ++i) {
        textureNames.push("res/ending-screens/dead" + i.toString() + ".png");
    }
    
    for (var i = 0; i < textureNames.length; ++i) {
        textures_in_use[textureNames[i]] = new Texture(textureNames[i], true);
    }
    
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

        // 60 FPS
        function( callback, element) { window.setTimeout(callback, 1000/60);  }
        );
})();