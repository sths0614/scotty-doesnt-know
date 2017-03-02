"use strict";

var mainCanvas;
var graphicsState;

window.onload = function init() {
    
    mainCanvas = new Canvas_Manager("gl-canvas", Color(0, 0, 0, 1)),
         graphicsState = mainCanvas.shared_scratchpad.graphics_state;
    
    shaders_in_use["Default"] = new Phong_or_Gouraud_Shader(graphicsState);
    
    var textureNames = [];
    textureNames.push("res/candy-cane-wallpaper-25.png");
    
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