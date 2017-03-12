// TODO:
//      Add any new desired shapes here by extending the Shape object
//      Follow example in example-shapes.js or in surfacesofrevolution.js
//      You need to put (inside populate):
//          vertices                    in          this.positions
//          texture coordinates         in          this.texture_coords
//          normals                     in          this.normals
//          indices (optional)          in          this.indices
//                  if you don't want to use indices, call this.indexed=false at beginning of populate function.

Declare_Any_Class( "Shape_From_File",       // A versatile standalone shape that imports all its arrays' data from an
  { populate: function( filename )          // .obj file.  See webgl-obj-loader.js for the rest of the relevant code.
      {
        this.filename = filename;
        this.webGLStart = function(meshes)
          {
            for( var j = 0; j < meshes.mesh.vertices.length/3; j++ )
            {
              this.positions.push( vec3( meshes.mesh.vertices[ 3*j ], meshes.mesh.vertices[ 3*j + 1 ], meshes.mesh.vertices[ 3*j + 2 ] ) );
              
              this.normals.push( vec3( meshes.mesh.vertexNormals[ 3*j ], meshes.mesh.vertexNormals[ 3*j + 1 ], meshes.mesh.vertexNormals[ 3*j + 2 ] ) );
              this.texture_coords.push( vec2( meshes.mesh.textures[ 2*j ],meshes.mesh.textures[ 2*j + 1 ]  ));
            }
            this.indices  = meshes.mesh.indices;
            this.normalize_positions();
            this.copy_onto_graphics_card();
            this.ready = true;
          }                                                 // Begin downloading the mesh, and once it completes return control to our webGLStart function
        OBJ.downloadMeshes( { 'mesh' : filename }, ( function(self) { return self.webGLStart.bind(self) } ( this ) ) );
      },
    draw: function( graphicsState, model_transform, material )
      { if( this.ready ) Shape.prototype.draw.call(this, graphicsState, model_transform, material );		}	  
  }, Shape )

Declare_Any_Class( "Body",
  { 'construct'(s) {
//      this.randomize(s);
      this.define_data_members( { shape: s, scale: [1, 1, 1],
                                    location_matrix: mat4(), 
//                                    linear_velocity: 0, 
//                                    angular_velocity: 0,
//                                    material: new Material( Color( 1,Math.random(),Math.random(),1 ), .1, 1, 1, 40, "stars.png" )
                                } );
  },
//    'randomize'(s)
//      { this.define_data_members( { shape: s, scale: [1, 1+Math.random(), 1],
//                                    location_matrix: mult( rotation( 360 * Math.random(), random_vec3(1) ), translation( random_vec3(10) ) ), 
//                                    linear_velocity: random_vec3(.1), 
//                                    angular_velocity: .5*Math.random(), spin_axis: random_vec3(1),
//                                    material: new Material( Color( 1,Math.random(),Math.random(),1 ), .1, 1, 1, 40, "stars.png" ) } )
//      },
//    'advance'( b, time_amount )   // Do one timestep.
//      { var delta = translation( scale_vec( time_amount, b.linear_velocity ) );  // Move proportionally to real time.
//        b.location_matrix = mult( delta, b.location_matrix );                    // Apply translation velocity - pre-multiply to keep translations together
//        
//        delta = rotation( time_amount * b.angular_velocity, b.spin_axis );       // Move proportionally to real time.
//        b.location_matrix = mult( b.location_matrix, delta );                    // Apply angular velocity - post-multiply to keep rotations together    
//      },
//    'check_if_colliding'( b, a_inv, shape )   // Collision detection function
    'check_if_colliding'( b, a_inv, shape )   // Collision detection function
      { if ( this == b ) return false;        // Nothing collides with itself
//       var a_inv = inverse(b.location_matrix, scale(b.scale));
       
        var T = mult( a_inv, mult( b.location_matrix, scale( b.scale ) ) );  // Convert sphere b to a coordinate frame where a is a unit sphere
        for( let p of shape.positions )                                      // For each vertex in that b,
        { var Tp = mult_vec( T, p.concat(1) ).slice(0,3);                    // Apply a_inv*b coordinate frame shift
          if( dot( Tp, Tp ) < 1.2 )   return true;     // Check if in that coordinate frame it penetrates the unit sphere at the origin.     
        }
        return false;
      }
  });