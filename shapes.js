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