Declare_Any_Class( "Main_Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
{    
    'construct': function( context )     // third-person style camera matrix controls to the canvas.
    {
        // Get shared scratchpad
        this.shared_scratchpad = context.shared_scratchpad;
        
        // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        this.shared_scratchpad.graphics_state = new Graphics_State( translation(0, 0,-20), perspective(50, canvas.width/canvas.height, .1, 1000), 0 );
//        this.shared_scratchpad.graphics_state = new Graphics_State( translation(-2, 0, -20), perspective(10, canvas.width/canvas.height, .1, 1000), 0 );
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
var SceneGraphNode = function(in_shape = null, in_material = null, in_localMatrix = mat4(), in_useGouraud = false, in_texTransform = mat4(), in_shaderName = "Default", in_useBody = true) {
    // Store local matrix used in local world. Needs to be updated externally as appropriate
    this.localMatrix = in_localMatrix;
    
    // Store the current world matrix for the next children to use
    this.currWorldMatrix = in_localMatrix;
    
    // Body
    if (in_shape) {
        this.body = new Body(in_shape);
        if (in_useBody)
            bodies.push(this.body);
    }
    
    // Stores material to be used when drawing this shape
    this.material = in_material;
    
    // Texture Transform. Defaults to identity matrix
    this.textureTransform = in_texTransform;
    
    // Store type of smooth shading to use
    this.useGouraud = in_useGouraud;
    
    // Store shader to use
    this.shaderName = in_shaderName;
    
    // Store parent node reference for easy access
    this.parent = null;
    
    // Stores list of child nodes to draw as part of this world matrix
    this.children = [];
    
    // Store list of update functions to be called if necessary
    //      Each must take as an argument a SceneGraphNode and a deltaTime
    this.updateFunctions = [];
    
    
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

var GravityTime = 0;
var BallYPos = 8;
var CEILING = 8;
var FLOOR = -4;
var EXHAUST_HISTORY_ARRAY_SIZE = 31; 
var NUM_EXHAUST_CLUSTERS = 20;
var DELAY_FACTOR = (EXHAUST_HISTORY_ARRAY_SIZE - 1) / NUM_EXHAUST_CLUSTERS;
var ExhaustHistory = [];
var curExhaustIndex = 0;

// TODO
var totalDistance = 8;
var distanceIncrement = totalDistance/NUM_EXHAUST_CLUSTERS;
var maxScale = 0.50;
var minScale = 0.08;
var scaleDecrement = (maxScale - minScale) / NUM_EXHAUST_CLUSTERS;
var exhaust_material = new Material(Color(0.3, 0.3, 0.3, 1.0), .6, .2, 0, 20, "res/smoke.jpg");
// var exhaust_material = new Material(Color((188.0/255.0), (134.0/255.0), (96.0/255.0), 1), .4, .6, 0.3, 100);

var bodies = [];

Declare_Any_Class( "Main_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
{
    'construct': function( context )
    {
        // Note:
        // T * R * S
        
        // DO NOT REMOVE THIS SCRATCHPAD LINE
        this.shared_scratchpad    = context.shared_scratchpad;
        //
        
        
        this.collider = new Subdivision_Sphere(3);
        
        this.deltaTime = 0;
        this.lastDrawTime = 0;
        for (var i = 0; i < EXHAUST_HISTORY_ARRAY_SIZE; ++i) {
           ExhaustHistory[i] = 0;
        }
        // TODO:
        //      Create shapes needed for drawing here
        shapes_in_use.sphere = new Subdivision_Sphere(5);
        shapes_in_use["shape_asteroid"] = new Shape_From_File("res/asteroid/asteroid.obj");
//        shapes_in_use["shape_asteroid"] = new Shape_From_File("res/CHALLENGER71.obj");
        
        // Scene Graph
        
        this.sceneGraphBaseNode = new SceneGraphNode();
        
        // Material Syntax
//        color, ambient, diffusivity, shininess, smoothness, texture_filename
        
        // Nodes
        this.sceneGraphNodes = [];
        
        this.planet_scale = 30;
        this.planet_RPM = 3;
        this.node_planetFrame = new SceneGraphNode(
            null,
            null,
            in_localMatrix = mult(
                translation(0, -(1.1)*this.planet_scale, 0),
                scale(this.planet_scale, this.planet_scale, this.planet_scale)
            )
        );
        this.sceneGraphBaseNode.addChild(this.node_planetFrame);
        
        this.node_planet = new SceneGraphNode(
            shapes_in_use.sphere,
            new Material(Color(0, 0, 0, 1), 0.8, 0.9, 0.8, 20, "res/planet.jpg"), //"res/earthmap1-test.jpg")
            mat4(),
            false,
            mat4(),
            "Default",
            false
        );
        this.node_planet.updateFunctions.push(
            this.generateRotateFunction(this.planet_RPM, [0, 0, 1])
        );
        this.node_planetFrame.addChild(this.node_planet);
        
        this.background_frame_scale = 20;
        this.node_backgroundFrame = new SceneGraphNode(
            null,
            null,
            in_localMatrix = scale(this.background_frame_scale, this.background_frame_scale, this.background_frame_scale)
        );
        
        this.sceneGraphBaseNode.addChild(this.node_backgroundFrame);
        this.node_background = new SceneGraphNode(
             shapes_in_use.sphere,
            new Material(Color(0, 0, 0, 1), 0.9, 0.8, 1, 20, "res/star10.gif"),
            mat4(),
            false,
            mat4(),
            "Default",
            false
        );
        this.node_backgroundFrame .updateFunctions.push(
            this.generateRotateFunction(this.planet_RPM, [0, 1, 0])
        );
        this.node_backgroundFrame.addChild(this.node_background);


        this.node_objectsFrame = new SceneGraphNode(
            null,
            null,
            translation(-11, BallYPos, 0)
        );
        this.sceneGraphBaseNode.addChild(this.node_objectsFrame);
        
        
        this.node_spaceship = new SceneGraphNode(
            shapes_in_use.shape_asteroid,
            new Material(Color(0, 0, 0, 1), 0.7, 0.8, 0, 20, "res/asteroid/ast4.jpg"),
            scale(0.8, 0.8, 0.8),
            false,
            mat4(),
            "Bump Map"
        );
        this.node_spaceship.updateFunctions.push(
           this.generateGravityFunction(0.18, -10/20) // initial velocity and gravity
       );
        this.node_objectsFrame.addChild(this.node_spaceship);
        
        
        for (var i = 0; i < NUM_EXHAUST_CLUSTERS; i++) {
            this.generateNode_exhaustCluster(
                0 - (i + 1) *distanceIncrement,
                minScale + i * scaleDecrement, 
                i);
        }
        
        
        
        this.node_testingstuff = new SceneGraphNode(
            shapes_in_use.shape_asteroid,
            exhaust_material,
            translation(-11, 3, 0),
            false,
            mat4(),
            "Default",
            true
        );
        this.sceneGraphBaseNode.addChild(this.node_testingstuff);
        
        
        // END: Nodes
        
        // END: Scene Graph
        
        if (hasGetUserMedia()) {
        } else {
          alert('getUserMedia() is not supported in your browser');
        }
    },
    
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
    {
       controls.add("space", this, function() {
            GravityTime = 0;
       });
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
            
            if (rootNode.body) {
                
                shaders_in_use[rootNode.shaderName].activate();
                
                var tempTexTransform = mat4();
                if (rootNode.textureTransform) {
                    tempTexTransform = rootNode.textureTransform;
                }
                this.shared_scratchpad.graphics_state.gouraud = rootNode.useGouraud;
                rootNode.body.shape.draw(this.shared_scratchpad.graphics_state, modelTransform, rootNode.material, tempTexTransform);
                
                rootNode.body.location_matrix = modelTransform;
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
//        shaders_in_use[ "Default" ].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.
//        this.shared_scratchpad.graphics_state.lights.push(new Light(vec4(10, 10, 10, 1), Color(1, 0, 0, 1), 100000));
        
        // Point lighting from inside sun
//        graphics_state.lights.push(new Light(vec4(100, 100, 0, 1), Color(1, 1, 1, 1), 1000000000000000));
        graphics_state.lights.push(new Light(vec4(100, 100, 0, 1), Color(1, 1, 1, 1), 100000));
        
        // Extra light source below sun just to light up sun's geometry so it doesn't look so bland and like a circle
//        graphics_state.lights.push(new Light(vec4(0, 0, 0, 1), Color(1, 1, 1, 1), 100000));
        
        
        // Get delta time for animation
        this.deltaTime = (time - this.lastDrawTime)/1000.0;
        this.lastDrawTime = time;
        
        curExhaustIndex = (curExhaustIndex + 1) % EXHAUST_HISTORY_ARRAY_SIZE;
        
        this.drawSceneGraph(this.deltaTime, this.sceneGraphBaseNode);
        
        
        var rawFreqData = getRawFrequencyData();
        var sumAmplitude = 0;
        for (let amp of rawFreqData) {
            sumAmplitude += amp;
        };
        
        
        for( let b of bodies )
          { var b_inv = inverse( mult( b.location_matrix, scale( b.scale ) ) );               // Cache b's final transform

            var center = mult_vec( b.location_matrix, vec4( 0, 0, 0, 1 ) ).slice(0,3);        // Center of the body
//            b.linear_velocity = subtract( b.linear_velocity, scale_vec( .0003, center ) );    // Apply a small centripetal force to everything
//            b.material = new Material( Color( 1,1,1,1 ), .1,1, 1, 40 );                      // Default color: white

            for( let c of bodies ) {
                // Collision process starts here
              if( b.check_if_colliding( c, b_inv, this.collider ) )          // Send the two bodies and the collision shape
              { 
                  console.log("hit detected");
//                  alert("its time for stanley to scream");
                // b.material = new Material( Color( 1,0,0,1 ), .1, 1, 1, 40 ); // If we get here, we collided, so turn red
                // b.linear_velocity  = vec3();                                 // Zero out the velocity so they don't inter-penetrate more
                // b.angular_velocity = 0;
                //this.bodies.pop(c);
                // if(b != this.masterShape && c == this.masterShape){
                //   this.bodies.pop(b);
                // }
                // else if(c != this.masterShape && b == this.masterShape) {
                //     this.bodies.pop(c);
                //     //this.slaveShapes.pop(b)
                // }
                // else {
                //    b.material = new Material( Color( 1,0,0,1 ), .1, 1, 1, 40 );
                //    b.linear_velocity  = vec3(); 
                //    b.angular_velocity = 0;
                } 
                //b.linear_velocity  = vec3(); 
                //b.angular_velocity = 0;
                //this.bodies.pop(b);
              }   
          }
        
        
    },
    
    'generateGravityFunction' : function(u, g) {
        // s(t) = ut + 1/2gt^2
        // v(t) = u + gt
        return function(node, deltaTime) {
            GravityTime += deltaTime;
            // console.log(GravityTime);

            // change in y in either direction
            var dy = u + g * GravityTime;

            // ball hits upperbound
            if (BallYPos + dy >= CEILING) {
                dy = CEILING - BallYPos;
                BallYPos = CEILING;
            }

            // ball hits lower bound
            else if (BallYPos + dy <= FLOOR) {
                // TODO: Game end
                dy = FLOOR - BallYPos;
                BallYPos = FLOOR;
            }

            // ball changes by dy 
            else {
                BallYPos += dy;
            }

            node.localMatrix = mult(
                translation(
                    0, 
                    dy,
                    0
                ),
                node.localMatrix
            );
            // console.log(dy);
            // console.log(curExhaustIndex);
            ExhaustHistory[curExhaustIndex] = dy;
            // console.log(ExhaustHistory);
        };
    },
    'generateRotateFunction' : function(RPM, rotationAxis) {
        return function(node, deltaTime) {
            var rotAngle = (RPM * deltaTime * 360 / 60) % 360;
            node.localMatrix = mult(
                rotation(rotAngle,
                         (rotationAxis ? rotationAxis : [0, 1, 0])),
                node.localMatrix);
        };
    },
    
    
    'generateTranslateFunction' : function(translateVectorPerSecond) {
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
    },
    
    'generateClusterMovementFunction' : function(exhaust_cluster_index) {
        return function(node, deltaTime) {
            var index = curExhaustIndex -  DELAY_FACTOR * exhaust_cluster_index;
            if (index < 0) {
                index += EXHAUST_HISTORY_ARRAY_SIZE;
            }
            var dy = ExhaustHistory[index];
            // var rand = (Math.random() * 0.1) - 0.05;
            // dy += rand;
            node.localMatrix = mult(
                translation(
                    0,
                    dy,
                    0
                ),
                node.localMatrix
            );
        };
    },


    'generateNode' : function(in_shape, in_material, in_scaleVec, in_rotateAngle, in_rotateVec, in_translationVec) {
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
            );
    },
    
    
    'generateNode_wall' : function(in_material, in_wallScaleVec, in_raiseRate = 0, in_startY = 0, in_startRotAngle = 0) {
        var radius = (3/2)*in_wallScaleVec[0];
        var radians = in_startRotAngle * (Math.PI/180);
        var temp = this.generateNode(
            shapes_in_use.cube,
            in_material,
            in_wallScaleVec,
            in_startRotAngle, [0, 1, 0],
            [radius * Math.cos(radians), in_startY, radius * Math.sin(radians)]
    //        [(3/2)*in_wallScaleVec[0], in_startY, 0]
        );
        temp.updateFunctions.push(
            this.generateTranslateFunction(
                [0, in_raiseRate * in_wallScaleVec[1], 0]
            )
        );

        return temp;
    },

    'generateNode_exhaustCluster' : function(dx, exhaust_scale, exhaust_cluster_index) {
        numSpheres = 4;

        this.node_exhausts = [];

        this.node_exhausts[0] = new SceneGraphNode(
           shapes_in_use.sphere,
           exhaust_material,
           translation(0, 1, 0),
            false,
            mat4(),
            "Default",
            false
        );
        
        this.node_exhausts[1] = new SceneGraphNode(
           shapes_in_use.sphere,
           exhaust_material,
           translation(0, -1, 0),
            false,
            mat4(),
            "Default",
            false
        );

        this.node_exhausts[2] = new SceneGraphNode(
           shapes_in_use.sphere,
           exhaust_material,
           translation(-1, 0, 0),
            false,
            mat4(),
            "Default",
            false
        );

        this.node_exhausts[3] = new SceneGraphNode(
           shapes_in_use.sphere,
           exhaust_material,
           translation(1, 0, 0),
            false,
            mat4(),
            "Default",
            false
        );

        this.node_exhaustCluster = new SceneGraphNode(
            null,
            null,
            in_localMatrix = mult(
                translation(dx, 0, 0),
                scale(exhaust_scale, exhaust_scale, exhaust_scale)
            ),
            false,
            mat4(),
            "Default",
            false
        );
        this.node_exhaustCluster.updateFunctions.push(
            this.generateClusterMovementFunction(exhaust_cluster_index)
        );

        for (var i = 0; i < 4; i++) {
            this.node_exhaustCluster.addChild(this.node_exhausts[i]);
        }
        this.node_objectsFrame.addChild(this.node_exhaustCluster);


    }
    
    
}, Animation );

function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}




//  Corrections / additions:

Shape.prototype.normalize_positions = function()
  { var average_position = vec3(), average_length = 0;
    for( var i = 0; i < this.positions.length; i++ ) average_position  =  add( average_position, scale_vec( 1/this.positions.length, this.positions[i] ) );
    for( var i = 0; i < this.positions.length; i++ ) this.positions[i] =  subtract( this.positions[i], average_position );
    for( var i = 0; i < this.positions.length; i++ ) average_length    += 1/this.positions.length * length( this.positions[i] );
    for( var i = 0; i < this.positions.length; i++ ) this.positions[i] =  scale_vec( 1/average_length, this.positions[i] );
  }