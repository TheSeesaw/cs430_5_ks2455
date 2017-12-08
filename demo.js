var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
  gl_Position = a_position;
  v_texcoord = a_texcoord;
}
`;

var fragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
   outColor = texture(u_texture, v_texcoord);
}
`;

function loadShader(gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);

  gl.shaderSource(shader, shaderSource);

  gl.compileShader(shader);

  return shader;
}

function loadProgram(gl) {
  var program = gl.createProgram();

  var shader = loadShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  gl.attachShader(program, shader);

  shader = loadShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  gl.attachShader(program, shader);

  gl.linkProgram(program);

  return program;
}

function main() {
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");

  if (!gl) {
    return;
  }

  var program = loadProgram(gl);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
  var textureLocation = gl.getUniformLocation(program, "u_texture");

  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  var positions = [
    0, 0, // bottom left t1
    0, 1, // top left t1
    1, 0, // bottom right t1
    1, 0, // bottom right t2
    0, 1, // top left t2
    1, 1, // top right t2
  ];
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionLocation);

  gl.vertexAttribPointer(
      positionLocation, 2, gl.FLOAT, false, 0, 0);

  var texcoords = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(texcoordLocation);

  gl.vertexAttribPointer(
      texcoordLocation, 2, gl.FLOAT, true, 0, 0);

  function loadTexture(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    var img = new Image();
    img.addEventListener('load', function() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    img.src = url;

    return tex;
  }

  var image = loadTexture('stone1.png');

  function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.uniform1i(textureLocation, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, image);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

  }

  function render(time) {
    draw();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  alert("e = transform, r = rotate, t = scale, y = shear, press required keys repeatedly to perform transformations");
  // mode variable: 0 = transform, 1 = rotate, 2 = scale, 3 = shear
  var trans_mode = 0;
  var sin_one_degree = Math.sin(0.0174533);
  var cos_one_degree = Math.cos(0.0174533);
  var neg_sin_one_degree = Math.sin(-0.0174533);
  var neg_cos_one_degree = Math.cos(-0.0174533);
  var bottom_left_x = 0;
  var bottom_left_y = 0;
  var intermediate_coords = [0,0, 0,0, 0,0, 0,0, 0,0, 0,0];
  var x_prime = 0;
  var y_prime = 0;
  var current_edge = 0; // 0 = top, 1 = left, 2 = bottom, 3 = right
  window.onkeyup = function(e) {
      var key = e.keyCode ? e.keyCode : e.which;
      if (key == 37) { // left arrow
        if (trans_mode == 0) {
          for (let i = 0; i < 11; i+=2) {
            positions[i] -= 0.1;
          }
        }else if (trans_mode == 1) {
          // get bottom left corner coords
          bottom_left_x = positions[0];
          bottom_left_y = positions[1];
          // subtract bottom left corner to get intermediate coords
          for (let i = 0; i < 12; i+=1) {
            if (i % 2 == 0) { // even, x coord
              intermediate_coords[i] = positions[i] - bottom_left_x;
              // calculate x'
              x_prime = (intermediate_coords[i] * cos_one_degree) - (intermediate_coords[i+1] * sin_one_degree);
              // add bottom x coord to get final coord
              positions[i] = x_prime + bottom_left_x;
            } else { // odd, y coord
              intermediate_coords[i] = positions[i] - bottom_left_y;
              // calculate y'
              y_prime = (intermediate_coords[i] * cos_one_degree) + (intermediate_coords[i-1] * sin_one_degree);
              // add bottom y coord to get final coord
              positions[i] = y_prime + bottom_left_y;
            }
          }
        }else if (trans_mode == 2) {
          positions[0] += 0.1;
          positions[2] += 0.1;
          positions[8] += 0.1;
          positions[4] -= 0.1;
          positions[6] -= 0.1;
          positions[10] -= 0.1;
        }else if (trans_mode == 3) {
          if (current_edge == 0) {
            positions[2] -= 0.1;
            positions[8] -= 0.1;
            positions[10] -= 0.1;
          }else if (current_edge == 2) {
            positions[0] -= 0.1;
            positions[4] -= 0.1;
            positions[6] -= 0.1;
          }
        }
      }else if (key == 38) { // up arrow
        if (trans_mode == 0) {
          for (let i = 1; i < 12; i+=2) {
            positions[i] += 0.1;
          }
        }else if (trans_mode == 2) {
          positions[3] += 0.1;
          positions[9] += 0.1;
          positions[11] += 0.1;
          positions[1] -= 0.1;
          positions[5] -= 0.1;
          positions[7] -= 0.1;
        }else if (trans_mode == 3) {
          if (current_edge == 1) {
            positions[3] += 0.1;
            positions[9] += 0.1;
            positions[1] += 0.1;
          }else if (current_edge == 3) {
            positions[11] += 0.1;
            positions[7] += 0.1;
            positions[5] += 0.1;
          }
        }
      }else if (key == 39) { // right arrow
        if (trans_mode == 0) {
          for (let i = 0; i < 11; i+=2) {
            positions[i] += 0.1;
          }
        }else if (trans_mode == 1) {
          // get bottom left corner coords
          bottom_left_x = positions[0];
          bottom_left_y = positions[1];
          // subtract bottom left corner to get intermediate coords
          for (let i = 0; i < 12; i+=1) {
            if (i % 2 == 0) { // even, x coord
              intermediate_coords[i] = positions[i] - bottom_left_x;
              // calculate x'
              x_prime = (intermediate_coords[i] * neg_cos_one_degree) - (intermediate_coords[i+1] * neg_sin_one_degree);
              // add bottom x coord to get final coord
              positions[i] = x_prime + bottom_left_x;
            } else { // odd, y coord
              intermediate_coords[i] = positions[i] - bottom_left_y;
              // calculate y'
              y_prime = (intermediate_coords[i] * neg_cos_one_degree) + (intermediate_coords[i-1] * neg_sin_one_degree);
              // add bottom y coord to get final coord
              positions[i] = y_prime + bottom_left_y;
            }
          }
        }else if (trans_mode == 2) {
          positions[0] -= 0.1;
          positions[2] -= 0.1;
          positions[8] -= 0.1;
          positions[4] += 0.1;
          positions[6] += 0.1;
          positions[10] += 0.1;
        }else if (trans_mode == 3) {
          if (current_edge == 0) {
            positions[2] += 0.1;
            positions[8] += 0.1;
            positions[10] += 0.1;
          }else if (current_edge == 2) {
            positions[0] += 0.1;
            positions[4] += 0.1;
            positions[6] += 0.1;
          }
        }
      }else if (key == 40) { // down arrow
        if (trans_mode == 0) {
          for (let i = 1; i < 12; i+=2) {
            positions[i] -= 0.1;
          }
        }else if (trans_mode == 2) {
          positions[3] -= 0.1;
          positions[9] -= 0.1;
          positions[11] -= 0.1;
          positions[1] += 0.1;
          positions[5] += 0.1;
          positions[7] += 0.1;
        }else if (trans_mode == 3) {
          if (current_edge == 1) {
            positions[3] -= 0.1;
            positions[9] -= 0.1;
            positions[1] -= 0.1;
          }else if (current_edge == 3) {
            positions[11] -= 0.1;
            positions[7] -= 0.1;
            positions[5] -= 0.1;
          }
        }
      }else if (key == 69) {
        trans_mode = 0;
        alert("translation mode, use the arrow keys");
      }else if (key == 82) {
        trans_mode = 1;
        alert("rotation mode, use left and right arrow keys, rotates about the shape's original bottom left corner");
      }else if (key == 84) {
        trans_mode = 2;
        alert("scale mode, use the arrow keys");
      }else if (key == 89) {
        trans_mode = 3;
        alert("shear mode, select an edge with WASD, then use the arrow keys");
      }else if (key == 87) { // W
        if (trans_mode == 3) {
          current_edge = 0;
          alert("shear top edge");
        }
      }else if (key == 65) { // A
        if (trans_mode == 3) {
          current_edge = 1;
          alert("shear left edge");
        }
      }else if (key == 83) { // S
        if (trans_mode == 3) {
          current_edge = 2;
          alert("shear bottom edge");
        }
      }else if (key == 68) { // D
        if (trans_mode == 3) {
          current_edge = 3;
          alert("shear right edge");
        }
      }
      // rebind buffer after transformation
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }
}
// affine transformation functions
main();
