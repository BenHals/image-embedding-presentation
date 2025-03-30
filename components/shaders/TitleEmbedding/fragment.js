const fragment = /* glsl */ `
varying vec2 vUv;
varying vec2 vCoordinates;
uniform float time;
uniform sampler2D t1;
uniform sampler2D t2;

void main() {
    vec2 myUV = vec2(vCoordinates.x / 512.0, vCoordinates.y/512.);
    vec4 maskTexture = texture2D(t1, gl_PointCoord);
    vec4 image = texture2D(t2, myUV);
    float g = ((1.0 * time) - (255.0 * floor(1.0*time / 255.0))) / 255.0;
    gl_FragColor = vec4(vCoordinates.x / 512.0, vCoordinates.y / 512.0, gl_PointCoord.x, 1.0);
    gl_FragColor = vec4(image.rgb, maskTexture.r);

}
`;

export default fragment;
