Declare_Any_Class( "Main_Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
{    
    'construct': function( context )     // third-person style camera matrix controls to the canvas.
    {
        // Get shared scratchpad
        this.shared_scratchpad = context.shared_scratchpad;
        
        // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        this.shared_scratchpad.graphics_state = new Graphics_State( translation(0, 0,-10), perspective(50, canvas.width/canvas.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: this.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 0, 0 ), looking: false } );
    },
    
    
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
    {
//        controls.add("i", this, function() {
//            this.graphics_state.camera_transform = mult(
//                translation(scale_vec(1, [0, 0, 1])),
//                this.graphics_state.camera_transform
//            );
//        });
//        
//        controls.add("o", this, function() {
//            this.graphics_state.camera_transform = mult(
//                translation(scale_vec(1, [0, 0, -1])),
//                this.graphics_state.camera_transform
//            );
//        });
    },
    
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
    {},
    
    'display': function( time )
    {}
}, Animation );


// Scene Graph node stuff
var SceneGraphNode = function(in_localMatrix, in_material, in_shape, in_useGouraud = false, in_texTransform = mat4()) {
    // Store local matrix used in local world. Needs to be updated externally as appropriate
    this.localMatrix = in_localMatrix;
    
    // Store the current world matrix for the next children to use
    this.currWorldMatrix = in_localMatrix;
    
    // Stores shape to be draw
    this.shape = in_shape;
    
    // Stores material to be used when drawing this shape
    this.material = in_material;
    
    // Texture Transform. Defaults to identity matrix
    this.textureTransform = in_texTransform;
    
    // Store type of smooth shading to use
    this.useGouraud = in_useGouraud;
    
    // Store parent node reference for easy access
    this.parent = null;
    
    // Stores list of child nodes to draw as part of this world matrix
    this.children = [];
    
    
    // Update function to be called during draw if needed to update matrices, etc.
    this.performUpdate = function(deltaTime, args) {
        
//        if (args["cubeRotateOn"] && (this.RPM)) {
//            var rotAngle = (this.RPM * deltaTime * 360 / 60) % 360;
//            this.localMatrix = mult(
//                rotation(rotAngle,
//                         (this.rotationAxis ? this.rotationAxis : [0, 1, 0])),
//                this.localMatrix);
//        }
//        
//        // Peform texture rotation
//        if (args["textureRotateOn"] && (this.textureRPM)) {
//            var rotAngle = (this.RPM * deltaTime * 360 / 60) % 360;
//            this.textureTransform = mult(
//                translation([-0.5, -0.5, 0]),
//                this.textureTransform
//            );
//            this.textureTransform = mult(
//                rotation(rotAngle, [0, 0, 1]),
//                this.textureTransform
//            );
//            this.textureTransform = mult(
//                translation([0.5, 0.5, 0]),
//                this.textureTransform
//            );
//        }
//        
//        // Perform texture scrolling
//        if (args["textureScrollOn"] && this.textureTranslation) {
//            var transAmount = (this.textureTranslation * deltaTime);
//            this.textureTransform = mult(
//                translation([-transAmount, -transAmount, 0]),
//                this.textureTransform
//            );
//        }
        
    };
    
    
    // helper function for adding children
    this.addChild = function(childNode) {
        this.children.push(childNode);
        childNode.parent = this;
    }
    
    // helper function for removing children
    this.removeChild = function(childNode) {
        var index = this.children.indexOf(childNode);
        if (index > -1) {
            childNode.parent = null;
            this.children.splice(index, 1);
        }
    }
};


Declare_Any_Class( "Main_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
{
    'construct': function( context )
    {
        // DO NOT REMOVE THIS SCRATCHPAD LINE
        this.shared_scratchpad    = context.shared_scratchpad;
        //
        
        
        // TODO:
        //      Create shapes needed for drawing here
        
        
        shapes_in_use.sphere = new Cube();
        
        
//        this.cubeRotateOn = false;
//        this.textureRotateOn = false;
//        this.textureScrollOn = false;
//        
//        // Add cube to shapes in use
//        shapes_in_use.cube = new Cube();
//        
//        // Set up node properties
//        this.nodeLocalMatrices = [
//            translation(-4, 0, 0),
//            translation(4, 0, 0),
//            mat4(),
//            mat4()
//        ];
//        this.nodeMaterials = [
//            null,
//            null,
//            new Material(Color(0, 0, 0, 1), 1, 1, 1, 1, pic1),
//            new Material(Color(0, 0, 0, 1), 1, 1, 1, 1, pic2)
//        ];
//        this.nodeShapes = [
//            null,
//            null,
//            shapes_in_use.cube,
//            shapes_in_use.cube
//        ];
//        this.nodeUseGouraud = [false, false, false, false];
//        this.nodeRPMs = [null, null, 20, 30];
//        this.nodeRotationAxis = [null, null, [0, 1, 0], [1, 0, 0]];
//        
//        this.nodeTexTransform = [null, null, mat4(), scale(2, 2, 2)];
//        
//        this.nodeTexRPM = [null, null, 15, 0];
//        this.nodeTexTranslate = [null, null, 0, 1];
//        
//        this.parentNodes = [-1, -1, 0, 1];
//        
//        // Instantiate base scene graph node
        this.sceneGraphBaseNode = new SceneGraphNode(
            mat4(),
            null,
            null,
            false
        );
//        
//        // Instantiate scene graph nodes
//        this.sceneGraphNodes = [];
//        for (var i = 0; i < this.parentNodes.length; ++i) {
//            this.sceneGraphNodes.push(
//                new SceneGraphNode(
//                    this.nodeLocalMatrices[i],
//                    this.nodeMaterials[i],
//                    this.nodeShapes[i],
//                    this.nodeUseGouraud[i],
//                    this.nodeTexTransform[i]
//                )
//            );
//            
//            this.sceneGraphNodes[i].RPM = this.nodeRPMs[i];
//            this.sceneGraphNodes[i].rotationAxis = this.nodeRotationAxis[i];
//            
//            this.sceneGraphNodes[i].textureRPM = this.nodeTexRPM[i];
//            this.sceneGraphNodes[i].textureTranslation = this.nodeTexTranslate[i];
//            
//            if (this.parentNodes[i] >= 0) {
//                this.sceneGraphNodes[
//                    this.parentNodes[i]
//                ].addChild(
//                    this.sceneGraphNodes[i]
//                );
//            } else {
//                this.sceneGraphBaseNode.addChild(this.sceneGraphNodes[i]);
//            }
//        }
        
    },
    
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
    {
//        controls.add("r", this, function() {
//            this.cubeRotateOn = !this.cubeRotateOn;
//        });
//        
//        controls.add("t", this, function() {
//            this.textureRotateOn = !this.textureRotateOn;
//        });
//        
//        controls.add("s", this, function() {
//            this.textureScrollOn = !this.textureScrollOn;
//        });
    },
    
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
    {},
    
    'drawSceneGraph' : function (deltaTime, rootNode) {
        if (rootNode) {
//            if (typeof rootNode.performUpdate === "function") {
//                var args = {};
//                args["cubeRotateOn"] = this.cubeRotateOn;
//                args["textureRotateOn"] = this.textureRotateOn;
//                args["textureScrollOn"] = this.textureScrollOn;
//                rootNode.performUpdate(deltaTime, args);
//            }
            
            var modelTransform = rootNode.localMatrix;
            if (rootNode.parent) {
                modelTransform = mult(rootNode.parent.currWorldMatrix, modelTransform);
            }
            rootNode.currWorldMatrix = modelTransform;
            
            if (rootNode.shape) {
                var tempTexTransform = mat4();
                if (rootNode.textureTransform) {
                    tempTexTransform = rootNode.textureTransform;
                }
                this.shared_scratchpad.graphics_state.gouraud = rootNode.useGouraud;
                rootNode.shape.draw(this.shared_scratchpad.graphics_state, modelTransform, rootNode.material, tempTexTransform);
            }
            
            var children = rootNode.children;
            for (var i = 0, len = children.length; i < len; ++i) {
                this.drawSceneGraph(deltaTime, children[i]);
            }
        }
    },
    
    'display': function(time)
    {
        var graphics_state  = this.shared_scratchpad.graphics_state,
            model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
        shaders_in_use[ "Default" ].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.
        
        // Point lighting from inside sun
//        graphics_state.lights.push(new Light(vec4(this.position_sun[0], this.position_sun[1], this.position_sun[2], 1), this.color_sun, 100000));
        
        // Extra light source below sun just to light up sun's geometry so it doesn't look so bland and like a circle
//        graphics_state.lights.push(new Light(vec4(0, 0, 0, 1), Color(1, 1, 1, 1), 100000));

            
        if(this.lastDrawTime) {
            this.deltaTime = (time - this.lastDrawTime)/1000.0;
        } else {
            this.deltaTime = 0;
        }
        this.lastDrawTime = time;
        
        this.drawSceneGraph(this.deltaTime, this.sceneGraphBaseNode);
        
        
        var modelTransform = mat4();
        shapes_in_use.sphere.draw(this.shared_scratchpad.graphics_state, modelTransform, new Material(Color(1, 1, 1, 1), 1, .4, .8, 1));
        
    }
}, Animation );