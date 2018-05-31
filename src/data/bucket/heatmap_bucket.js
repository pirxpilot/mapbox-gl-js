// 

import CircleBucket from './circle_bucket';

import { register } from '../../util/web_worker_transfer';


class HeatmapBucket extends CircleBucket {
    // Needed for flow to accept omit: ['layers'] below, due to
    // https://github.com/facebook/flow/issues/4262
}

register('HeatmapBucket', HeatmapBucket, {omit: ['layers']});

export default HeatmapBucket;
