const es = require('event-stream');
const { Subject } = require('rxjs');
const { Observable } = require('rxjs');
const { AsyncIterable } = require('ix');

require('rxjs/add/observable/from');
require('rxjs/add/observable/merge');

require('rxjs/add/operator/do');
require('rxjs/add/operator/map');
require('rxjs/add/operator/scan');
require('rxjs/add/operator/skip');
require('rxjs/add/operator/filter');
require('rxjs/add/operator/groupBy');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/auditTime');
require('rxjs/add/operator/switchMap');
require('rxjs/add/operator/multicast');
require('rxjs/add/operator/startWith');
require('rxjs/add/operator/combineLatest');

const splitAsAsyncIterable = (({ Readable }) =>
    (source, ...xs) => AsyncIterable.from(new Readable({
        objectMode: true, highWaterMark: 1
    }).wrap(source.pipe(es.split(...xs))))
)(require('stream'));

const asyncIteratorToObservable = ((sym, fn) => (x) => {
    const itObs = AsyncIterable.from(x).toObservable();
    return Observable.from((itObs[sym] = fn) && itObs);
})(require('rxjs').observable, function() { return this; });

module.exports = {
    splitAsAsyncIterable,
    asyncIteratorToObservable,
    Subject, Observable, AsyncIterable,
};
