const vertex = /* glsl */ `

varying vec2 vUv;
varying vec2 vCoordinates;
attribute vec2 imgCoord;

void main() {
    vUv = uv;
    

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 5000. * (1. / - modelViewPosition.z );
    gl_Position = projectionMatrix * modelViewPosition;

    vCoordinates = imgCoord;

}
`;

export default vertex;
