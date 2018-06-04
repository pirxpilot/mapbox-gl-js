// 

import StyleLayer from '../style_layer';

import properties from './hillshade_style_layer_properties';
import { Transitionable, Transitioning, PossiblyEvaluated } from '../properties';


class HillshadeStyleLayer extends StyleLayer {

    constructor(layer) {
        super(layer, properties);
    }

    hasOffscreenPass() {
        return this.paint.get('hillshade-exaggeration') !== 0 && this.visibility !== 'none';
    }
}

export default HillshadeStyleLayer;
