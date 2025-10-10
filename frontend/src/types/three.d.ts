import * as THREE from 'three';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ambientLight: any;
            directionalLight: any;
            pointLight: any;
            meshStandardMaterial: any;
        }
    }
}
