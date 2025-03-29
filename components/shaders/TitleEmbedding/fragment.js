const fragment = /* glsl */ `
varying vec2 vUv;
varying vec2 vCoordinates;
uniform float time;
uniform sampler2D t1;


void main() {
    vec2 myUV = vec2(vCoordinates.x / 256.0, vCoordinates.y/256.);
    vec4 image = texture2D(t1, myUV);
    float g = ((1.0 * time) - (255.0 * floor(1.0*time / 255.0))) / 255.0;
    gl_FragColor = vec4(vCoordinates.x / 256.0, vCoordinates.y / 256.0, 0.0, 1.0);
    gl_FragColor = image;

}
`;

export default fragment;
