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
var SceneGraphNode = function(in_shape = null, in_material = null, in_localMatrix = mat4(), in_useGouraud = false, in_texTransform = mat4(), in_shaderName = "Default", in_useBody = false) {
    // Store local matrix used in local world. Needs to be updated externally as appropriate
    this.localMatrix = in_localMatrix;
    
    // Store the current world matrix for the next children to use
    this.currWorldMatrix = in_localMatrix;
    
    // Body
    if (in_shape) {
        this.body = new Body(in_shape);
        if (in_useBody)
            bodies.push(this);
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
        var bodyIndex = bodies.indexOf(childNode);
        if (bodyIndex > -1) {
            bodies.splice(bodyIndex, 1);
        }
        
        var index = this.children.indexOf(childNode);
        if (index > -1) {
            childNode.parent = null;
            this.children.splice(index, 1);
        }
    }
};
var score=0;
var GravityTime = 0;
var SPACESHIP_X_POS = -11;
var spaceshipYPos = 8;
var CEILING = 8;
var FLOOR = -3;
var EXHAUST_HISTORY_ARRAY_SIZE = 31; 
var NUM_EXHAUST_CLUSTERS = 20;
var DELAY_FACTOR = (EXHAUST_HISTORY_ARRAY_SIZE - 1) / NUM_EXHAUST_CLUSTERS;
var ExhaustHistory = [];
var curExhaustIndex = 0;

var SMOKE_PARTICLE_SPEED = -3;
var SMOKE_PARTICLE_SPAWN_INTERVAL = 0.01;
var SMOKE_PARTICLE_TIME_LIMIT = 0.9;      // in seconds
var SMOKE_PARTICLE_LIMIT = SPACESHIP_X_POS - 100;
var SMOKE_PARTICLE_MAX_SCALE = 0.3;


var ASTEROID_MAX_SPEED = 5;
var ASTEROID_MIN_SPEED = 1;
var ASTEROID_SPAWN_INTERVAL = 2;
//var SMOKE_PARTICLE_TIME_LIMIT = 0.9;      // in seconds
var ASTEROID_LIMIT = -40;//SPACESHIP_X_POS - 100;
var ASTEROID_MAX_SCALE = 1;
var ASTEROID_MIN_SCALE = 0.3;
var ASTEROID_MAX_YDISPLACEMENT = 5;


// TODO
var totalDistance = 8;
var distanceIncrement = totalDistance/NUM_EXHAUST_CLUSTERS;
var maxScale = 0.50;
var minScale = 0.08;
var scaleDecrement = (maxScale - minScale) / NUM_EXHAUST_CLUSTERS;
var exhaust_material = new Material(Color(1, 0.1, 0.1, 0), 1, 0, 0, 20, "res/fire_PNG6025.png");
//var exhaust_material = new Material(Color(0.8, 0.8, 0.8, 1.0), .6, .2, 0, 20);
// var exhaust_material = new Material(Color((188.0/255.0), (134.0/255.0), (96.0/255.0), 1), .4, .6, 0.3, 100);

var bodies = [];

var AMPLITUDE_THRESHOLD = 100  ;
var laserExists = false;
var LASER_SPEED = 5;
// var laserTime = 0;
var LASER_LIFETIME = 5.5;


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
        
        this.timeSinceLastSmokeSpawn = 0;
        this.timeSinceLastAsteroidSpawn = 0;
        
        // TODO:
        //      Create shapes needed for drawing here
        shapes_in_use.sphere = new Subdivision_Sphere(5);
        shapes_in_use["shape_asteroid"] = new Shape_From_File("res/asteroid/asteroid.obj");
        shapes_in_use["shape_ship"] = new Shape_From_File("res/space-ship/ship5.obj");
        shapes_in_use["shape_text"] = new Text_Line(35);
        shapes_in_use["shape_textScore"] = new Text_Line(35);

        shapes_in_use["cube"] = new Cube();
        
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
            ),
            false,
            mat4(),
            "Default",
            false
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
            in_localMatrix = scale(this.background_frame_scale, this.background_frame_scale, this.background_frame_scale),
            false,
            mat4(),
            "Default",
            false
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
            translation(SPACESHIP_X_POS, spaceshipYPos, 0),
            false,
            mat4(),
            "Default",
            false
        );
        this.sceneGraphBaseNode.addChild(this.node_objectsFrame);
        
        
        this.node_spaceship = new SceneGraphNode(
            shapes_in_use.shape_ship,
            new Material(Color(0, 0, 0, 1), 0.7, 0.8, 0, 20, "res/space-ship/original-texture.jpg"),
            mult(rotation(110, [0.1, 1, 0.2]), scale(0.8, 0.8, 0.6)),
            false,
            mat4(),
            "Bump Map",
            true
        );
        this.node_spaceship.body.bodyID = "spaceship";
        this.node_spaceship.updateFunctions.push(
           this.generateGravityFunction(0.18, -10/20) // initial velocity and gravity
       );
        this.node_objectsFrame.addChild(this.node_spaceship);
        
        
        this.node_text = new SceneGraphNode(
            shapes_in_use["shape_text"],
            Color(0, 0, 0, 1),
            mult(translation(-16, 8.5, 0), scale(0.3,0.3,0.3)),
            false,
            null,
            "Default",
            false
        );
        this.node_text.updateFunctions.push(
            function(node, deltaTime) {
                shapes_in_use.shape_text.set_string("Panang Curry");
        });
         this.sceneGraphBaseNode.addChild(this.node_text);
        
        this.node_textScore = new SceneGraphNode(
            shapes_in_use["shape_textScore"],
            Color(0, 0, 0, 1),
            mult(translation(-16, 7.5, 0), scale(0.3,0.3,0.3)),
            false,
            null,
            "Default",
            false
        );
        this.node_textScore.updateFunctions.push(
            function(node, deltaTime) {
                //shapes_in_use.shape_text.set_string("Space Invaders");
        });
         this.sceneGraphBaseNode.addChild(this.node_textScore);
        
        // Asteroid stuff
        this.node_asteroidFrame = new SceneGraphNode(
            null,
            null,
            translation(20, 3, 0),
            false,
            "Default",
            false
        );
        this.sceneGraphBaseNode.addChild(this.node_asteroidFrame);
        
        //
        
        
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
                
                if (tempTexTransform)
                    rootNode.body.shape.draw(this.shared_scratchpad.graphics_state, modelTransform, rootNode.material, tempTexTransform);
                else
                    rootNode.body.shape.draw(this.shared_scratchpad.graphics_state, modelTransform, rootNode.material);
                
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

        
        
//        console.log("length of bodies: " + bodies.length);
        var toKill = [];
        for( var i = 0; i < bodies.length; ++i) 
        // for( let b of bodies )
        { 
            var bnode = bodies[i];
            var b = bodies[i].body;
            var b_inv = inverse( mult( b.location_matrix, scale( b.scale ) ) );               // Cache b's final transform

            var center = mult_vec( b.location_matrix, vec4( 0, 0, 0, 1 ) ).slice(0,3);        // Center of the body
//            b.linear_velocity = subtract( b.linear_velocity, scale_vec( .0003, center ) );    // Apply a small centripetal force to everything
//            b.material = new Material( Color( 1,1,1,1 ), .1,1, 1, 40 );                      // Default color: white

            for( var j = i; j < bodies.length; ++j)
            // for( let c of bodies ) {
            {

                var cnode = bodies[j];
                var c = bodies[j].body;
                // Collision process starts here
              if( b.check_if_colliding( c, b_inv, this.collider ) )          // Send the two bodies and the collision shape
              { 
                  console.log("hit detected");
                  console.log("bodies: " + b.bodyID + " and " + c.bodyID);
                var bID = b.bodyID;
                var cID = c.bodyID;

                if ((bID == "spaceship" && cID == "asteroid") || 
                    (bID == "asteroid" && cID == "spaceship")) {
                    // Trigger End Game State
                    alert("you died haha");
                } else if ((bID == "laser" && cID == "asteroid") || 
                    (bID == "asteroid" && cID == "laser")) {
                    laserExists = false;
                    toKill.push(bnode);
                    toKill.push(cnode);
                } else if ((bID == cID) && (bID == "asteroid")) {
                    // Momentum

                }
              }
            }
        }

        for ( let a of toKill) {
            if (a && a.parent) {
                a.parent.removeChild(a);
            }
        }
        
        var barFreqData = getBarFrequencyData();
        var sumAmplitude = 0;
        for (let amp of barFreqData) {
            sumAmplitude += amp;
        };


        if (!laserExists && sumAmplitude > AMPLITUDE_THRESHOLD) {
            this.generateNode_laser(0.3, 0.1, 0.1);
        }


           
        // Spawn Smoke
        this.timeSinceLastSmokeSpawn += this.deltaTime;
        if (this.timeSinceLastSmokeSpawn > SMOKE_PARTICLE_SPAWN_INTERVAL) {
            this.generateNode_smokeParticle();
            this.timeSinceLastSmokeSpawn = 0;
        }
        
        // Spawn Asteroids
        this.timeSinceLastAsteroidSpawn += this.deltaTime;
//        console.log(this.timeSinceLastAsteroidSpawn);
//        console.log(ASTEROID_SPAWN_INTERVAL);
        if (this.timeSinceLastAsteroidSpawn > ASTEROID_SPAWN_INTERVAL) {
//            console.log("stuff");
            this.generateNode_asteroid();
            this.timeSinceLastAsteroidSpawn = 0;
        }
        

        this.drawSceneGraph(this.deltaTime, this.sceneGraphBaseNode);
        score = score + 1/60;
        this.node_textScore.body.shape.set_string("Score: " + Math.round(score));
//        console.log(this.node_asteroidFrame.children.length);
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
            if (spaceshipYPos + dy >= CEILING) {
                dy = CEILING - spaceshipYPos;
                spaceshipYPos = CEILING;
            }

            // ball hits lower bound
            else if (spaceshipYPos + dy <= FLOOR) {
                // TODO: Game end
                dy = FLOOR - spaceshipYPos;
                spaceshipYPos = FLOOR;
            }

            // ball changes by dy 
            else {
                spaceshipYPos += dy;
            }

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
    
    'generateNode_smokeParticle' : function() {
        var randScale = Math.random() * SMOKE_PARTICLE_MAX_SCALE;
        var nodeParticle = new SceneGraphNode(
            shapes_in_use["cube"],
            exhaust_material,
            mult(
                mult(
                    translation(SPACESHIP_X_POS-1.8, spaceshipYPos, 0),
                    rotation(Math.random() * 360, [Math.random(), Math.random(), Math.random()])
                ),
                scale(randScale, randScale, randScale)
            ),
            false,
            mat4(),
            "Default",
            false
        );
        nodeParticle.currXLoc = 0;
        nodeParticle.totalTime = 0;
        nodeParticle.updateFunctions.push(
            this.generateTranslateFunction([SMOKE_PARTICLE_SPEED, 0, 0])
        );
        nodeParticle.updateFunctions.push(
            function(node, deltaTime) {
//                node.currXLoc += SMOKE_PARTICLE_SPEED;
                node.currXLoc += (deltaTime * SMOKE_PARTICLE_SPEED);
                node.totalTime += deltaTime;
//                if (node.currXLoc < SMOKE_PARTICLE_LIMIT) {
//                    node.parent.removeChild(node);
//                }
                if (node.totalTime > SMOKE_PARTICLE_TIME_LIMIT) {
                    node.parent.removeChild(node);
                }
            }
        );
        this.sceneGraphBaseNode.addChild(nodeParticle);
        return nodeParticle;
    },
    
    'generateNode_asteroid' : function() {
        console.log("creating asteroid");
        var randScale = (Math.random() * (ASTEROID_MAX_SCALE - ASTEROID_MIN_SCALE) + ASTEROID_MIN_SCALE);
        
        var nodeAsteroid = new SceneGraphNode(
            shapes_in_use["shape_asteroid"],
            new Material(Color(0, 0, 0, 1), 0.7, 0.8, 0, 20, "res/asteroid/ast4.jpg"),
            mult(
                mult(
                    translation(0, (Math.random()*ASTEROID_MAX_YDISPLACEMENT) - (ASTEROID_MAX_YDISPLACEMENT/2), 0),
                    rotation(Math.random() * 360, [Math.random(), Math.random(), Math.random()])
                ),
                scale(randScale, randScale, randScale)
            ),
            false,
            mat4(),
            "Default",
            true
        );
        nodeAsteroid.body.bodyID = "asteroid";
        nodeAsteroid.currXLoc = 0;
        nodeAsteroid.totalTime = 0;
        var speed = -(Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED);
        nodeAsteroid.updateFunctions.push(
            this.generateTranslateFunction([speed, 0, 0])
        );
        nodeAsteroid.updateFunctions.push(
            function(node, deltaTime) {
                node.currXLoc += (deltaTime * speed);
                node.totalTime += deltaTime;
                if (node.currXLoc < ASTEROID_LIMIT) {
                    node.parent.removeChild(node);
                }
//                if (node.totalTime > SMOKE_PARTICLE_TIME_LIMIT) {
//                    node.parent.removeChild(node);
//                }
            }
        );
        this.node_asteroidFrame.addChild(nodeAsteroid);
        return nodeAsteroid;
        
    },

    'generateNode_laser' : function(laserXScale, laserYScale, laserZScale) {
        this.node_laser = new SceneGraphNode(
            shapes_in_use.sphere,
            new Material(Color(1.0, 1.0, 0.0, 1.0), .4, .6, .6, 20),
            in_localMatrix = mult(
                translation(SPACESHIP_X_POS + 1, spaceshipYPos, 0),
                scale(laserXScale, laserYScale, laserZScale)
            ),
            false,
            mat4(),
            "Default",
            true
        );
        this.node_laser.body.bodyID = "laser";
        laserExists = true;
        this.node_laser.time = 0;
        this.node_laser.updateFunctions.push(
            this.generateTranslateFunction([LASER_SPEED, 0, 0])
        );
        this.node_laser.updateFunctions.push(
            function(node, deltaTime) {
                node.time += deltaTime;
                if (node.time > LASER_LIFETIME) {
                    laserExists = false;
                    node.parent.removeChild(node);
                }
            }
        );

        this.sceneGraphBaseNode.addChild(this.node_laser);
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