/* Programming 13
 * CSCI 4611, Fall 2026, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

// @ts-ignore
import unlitVertexShader from './shaders/myunlit.vert'
// @ts-ignore
import unlitFragmentShader from './shaders/myunlit.frag'

import * as gfx from 'gophergfx'

export class MyUnlitMaterial extends gfx.Material3
{
    public texture: gfx.Texture | null;
    public color: gfx.Color;

    public static shader = new gfx.ShaderProgram(unlitVertexShader, unlitFragmentShader);
    
    private colorUniform: WebGLUniformLocation | null;
    private textureUniform: WebGLUniformLocation | null;
    private useTextureUniform: WebGLUniformLocation | null;

    private modelViewUniform: WebGLUniformLocation | null;
    private projectionUniform: WebGLUniformLocation | null;

    private positionAttribute: number;
    private colorAttribute: number;
    private texCoordAttribute: number;

    constructor()
    {
        super();

        this.texture = null;
        this.color = new gfx.Color(1, 1, 1);

        MyUnlitMaterial.shader.initialize(this.gl);

        this.colorUniform = MyUnlitMaterial.shader.getUniform(this.gl, 'materialColor');
        this.textureUniform = MyUnlitMaterial.shader.getUniform(this.gl, 'textureImage');
        this.useTextureUniform = MyUnlitMaterial.shader.getUniform(this.gl, 'useTexture');

        this.modelViewUniform = MyUnlitMaterial.shader.getUniform(this.gl, 'modelViewMatrix');
        this.projectionUniform = MyUnlitMaterial.shader.getUniform(this.gl, 'projectionMatrix');

        this.positionAttribute = MyUnlitMaterial.shader.getAttribute(this.gl, 'position');
        this.colorAttribute = MyUnlitMaterial.shader.getAttribute(this.gl, 'color');
        this.texCoordAttribute = MyUnlitMaterial.shader.getAttribute(this.gl, 'texCoord');   
    }

    draw(mesh: gfx.Mesh3, camera: gfx.Camera, lightManager: gfx.LightManager): void
    {
        if(!this.visible || mesh.triangleCount == 0)
            return;

        this.initialize();

        // Switch to this shader
        this.gl.useProgram(MyUnlitMaterial.shader.getProgram());

        // Set the camera uniforms
        this.gl.uniformMatrix4fv(this.modelViewUniform, false, gfx.Matrix4.multiply(camera.viewMatrix, mesh.localToWorldMatrix).mat);
        this.gl.uniformMatrix4fv(this.projectionUniform, false, camera.projectionMatrix.mat);

        // Set the material property uniforms
        this.gl.uniform4f(this.colorUniform, this.color.r, this.color.g, this.color.b, this.color.a);

        // Set the vertex colors
        if(mesh.hasVertexColors)
        {
            this.gl.enableVertexAttribArray(this.colorAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.colorBuffer);
            this.gl.vertexAttribPointer(this.colorAttribute, 4, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            this.gl.disableVertexAttribArray(this.colorAttribute);
            this.gl.vertexAttrib4f(this.colorAttribute, 1, 1, 1, 1);
        }

        // Set the vertex positions
        this.gl.enableVertexAttribArray(this.positionAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        if(this.texture)
        {
            // Activate the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 1);

            // Set the texture
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture.texture);
            this.gl.uniform1i(this.textureUniform, 0);

            // Set the texture coordinates
            this.gl.enableVertexAttribArray(this.texCoordAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texCoordBuffer);
            this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            // Disable the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 0);
            this.gl.disableVertexAttribArray(this.texCoordAttribute);
        }

        // Draw the triangles
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, mesh.triangleCount*3, this.gl.UNSIGNED_SHORT, 0);
    }

    setColor(color: gfx.Color): void
    {
        this.color.copy(color);
    }

    getColor(): gfx.Color
    {
        return this.color;
    }
}