Declare_Any_Class( "Main_Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
{    
    'construct': function( context )     // third-person style camera matrix controls to the canvas.
    {
        // Get shared scratchpad
        this.shared_scratchpad = context.shared_scratchpad;
        
        // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        this.shared_scratchpad.graphics_state = new Graphics_State( translation(0, 0,-20), perspective(50, canvas.width/canvas.height, .1, 1000), 0 );
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
var SceneGraphNode = function(in_shape = null, in_material = null, in_localMatrix = mat4(), in_useGouraud = false, in_texTransform = mat4()) {
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
    
    // Store list of update functions to be called if necessary
    //      Each must take as an argument a SceneGraphNode and a deltaTime
    this.updateFunctions = [];
    
    
    
    // Update function to be called during draw if needed to update matrices, etc.
//    this.performUpdate = function(deltaTime, args) {
//        
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
//        
//    };
    
    
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

function generateRotateFunction(RPM, rotationAxis) {
    return function(node, deltaTime) {
        var rotAngle = (RPM * deltaTime * 360 / 60) % 360;
        node.localMatrix = mult(
            rotation(rotAngle,
                     (rotationAxis ? rotationAxis : [0, 1, 0])),
            node.localMatrix);
    };
}

function generateTranslateFunction(translateVectorPerSecond) {
    return function(node, deltaTime) {
        var transVec = [
            translateVectorPerSecond[0] * deltaTime,
            translateVectorPerSecond[1] * deltaTime,
            translateVectorPerSecond[2] * deltaTime
        ];
        node.localMatrix = mult(
            translation(
                transVec[0],
                transVec[1],
                transVec[2]
            ),
            node.localMatrix
        );
    };
}

function generateNode(in_shape, in_material, in_scaleVec, in_rotateAngle, in_rotateVec, in_translationVec) {
    return new SceneGraphNode(
            in_shape,
            in_material,
            in_localMatrix =
                mult(
                    translation(
                        in_translationVec[0],
                        in_translationVec[1],
                        in_translationVec[2]
                    ),
                    mult(
                        rotation(
                            in_rotateAngle,
                            [
                                in_rotateVec[0],
                                in_rotateVec[1],
                                in_rotateVec[2]   
                            ]
                        ),
                        scale(
                            in_scaleVec[0],
                            in_scaleVec[1],
                            in_scaleVec[2]
                        )
                    )
                )
        
//                mult(
//                    scale(
//                        in_scaleVec[0],
//                        in_scaleVec[1],
//                        in_scaleVec[2]
//                    ),
//                    mult(
//                        rotation(
//                            in_rotateAngle,
//                            [
//                                in_rotateVec[0],
//                                in_rotateVec[1],
//                                in_rotateVec[2]   
//                            ]
//                        ),
//                        translation(
//                            in_translationVec[0],
//                            in_translationVec[1],
//                            in_translationVec[2]
//                        )
//                    )
//                )
        );
}

function generateNode_wall(in_material, in_wallScaleVec, in_raiseRate = 0, in_startY = 0, in_startRotAngle = 0) {
    var radius = (3/2)*in_wallScaleVec[0];
    var radians = in_startRotAngle * (Math.PI/180);
    var temp = generateNode(
        shapes_in_use.cube,
        in_material,
        in_wallScaleVec,
        in_startRotAngle, [0, 1, 0],
        [radius * Math.cos(radians), in_startY, radius * Math.sin(radians)]
//        [(3/2)*in_wallScaleVec[0], in_startY, 0]
    );
    temp.updateFunctions.push(
        generateTranslateFunction(
            [0, in_raiseRate * in_wallScaleVec[1], 0]
        )
    );
    
    return temp;
}


Declare_Any_Class( "Main_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
{
    'construct': function( context )
    {
        // Note:
        // T * R * S
        
        // DO NOT REMOVE THIS SCRATCHPAD LINE
        this.shared_scratchpad    = context.shared_scratchpad;
        //
        
        this.deltaTime = 0;
        this.lastDrawTime = 0;
        
        
        // TODO:
        //      Create shapes needed for drawing here
        shapes_in_use.cylinder = new Cylindrical_Tube(50, 50);
        shapes_in_use.cube = new Cube();
        
        
        // Scene Graph
        
        this.sceneGraphBaseNode = new SceneGraphNode();
        
        // Nodes
        this.sceneGraphNodes = [];
        
        // Central Rotation
        this.cylinder_RPM = -10;
        
        // Central Cylinder
        this.cylinder_scaleX = 4;
        this.cylinder_scaleY = 18;
        this.cylinder_scaleZ = 4;
        this.node_cylinder = new SceneGraphNode(
            shapes_in_use.cylinder,
            new Material(Color((188.0/255.0), (134.0/255.0), (96.0/255.0), 1), .4, .6, 0.3, 100, "candy-cane-wallpaper-25.png"),
            in_localMatrix = mult(
                scale(
                    this.cylinder_scaleX,
                    this.cylinder_scaleY,
                    this.cylinder_scaleZ
                ),
                rotation(90, [1, 0, 0])
            )
        );
        this.node_cylinder.updateFunctions.push(
            generateRotateFunction(this.cylinder_RPM, [0, 1, 0])
        );
        this.sceneGraphBaseNode.addChild(this.node_cylinder);
        
        
        // Path Items Translation
        
        this.wallSpawnInterval = 5;                     // In seconds
        
        this.timeSinceLastPathItemCreation = 0;         // In seconds
        
        this.wallStartRotAngle = 0;
        
        
        // Wall
        this.nodes_pathRotations = [];
        this.nodes_pathItems = [];
        
        this.wall_scaleX = 1;
        this.wall_scaleY = 1.4;
        this.wall_scaleZ = 0.1;
        this.wall_scaleVec = [this.wall_scaleX, this.wall_scaleY, this.wall_scaleZ];
        
        // END: Nodes
        
        // END: Scene Graph
        
        
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
            
            for (var i = 0; i < rootNode.updateFunctions.length; ++i) {
                rootNode.updateFunctions[i](rootNode, deltaTime);
            }
            
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
//        this.shared_scratchpad.graphics_state.lights.push(new Light(vec4(10, 10, 10, 1), Color(1, 0, 0, 1), 100000));
        
        // Point lighting from inside sun
        graphics_state.lights.push(new Light(vec4(100, 100, 0, 1), Color(1, 1, 1, 1), 100000));
        
        // Extra light source below sun just to light up sun's geometry so it doesn't look so bland and like a circle
//        graphics_state.lights.push(new Light(vec4(0, 0, 0, 1), Color(1, 1, 1, 1), 100000));
        
        
        
        // Get delta time for animation
        this.deltaTime = (time - this.lastDrawTime)/1000.0;
        this.lastDrawTime = time;
        
        
        // Create next wall node if necessary
        
        this.timeSinceLastPathItemCreation += this.deltaTime;
        if (this.timeSinceLastPathItemCreation >= this.wallSpawnInterval) {
            
            var tempPlacement = new SceneGraphNode(
                null, null,
                in_localMatrix = translation(this.cylinder_scaleX, 0, 0)
            );
            tempPlacement.updateFunctions.push(
                generateRotateFunction(this.cylinder_RPM, [0, 1, 0])
            );
            this.sceneGraphBaseNode.addChild(tempPlacement);
            
            
            var temp = generateNode_wall(
                new Material(Color((188.0/255.0), (134.0/255.0), (96.0/255.0), 1), .4, .6, 0.3, 100),
                this.wall_scaleVec,
                1,
                -11 + (this.wall_scaleVec[1])
            );
            tempPlacement.addChild(temp);
            
            this.timeSinceLastPathItemCreation = 0;
        }
        
        
        // Remove Walls that have risen above the top
        for (var i = 0; i < this.nodes_pathItems; ++i) {
            // TODO: Figure out how to remove walls if they cross the upper boundary
            // TODO:        Possibly use collision detection with invisible boundary/polygon at the top (maybe a giant square or circle)
        }
        
        this.drawSceneGraph(this.deltaTime, this.sceneGraphBaseNode);
        
    }
}, Animation );