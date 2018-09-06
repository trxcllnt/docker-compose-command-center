const { Subject } = require('../linq');
const Box = require('blessed/lib/widgets/box');

const defaultProps = {
    label: 'console',
    border: 'line', dockBorders: true, padding: 0,
    key: true, mouse: true, scrollable: true, alwaysScroll: true,
    scrollbar: { ch: ' ', track: { bg: '#666' }, style: { inverse: true } }
};

class ConsoleBox extends Box {
    constructor({ idx, key, ...props } = {}) {
        super(Object.assign({}, defaultProps, props));
        this.set('idx', idx);
        this.set('key', key);
        this.set('autoScroll', true);
        this.on('scroll', () => this.set('autoScroll', this.getScrollPerc() >= 100));

        const renderTriggers = new Subject();
        this.set('renderTriggers', renderTriggers);
        this.set('renderSubscription', renderTriggers
            .groupBy(({ trigger }) => trigger)
            .flatMap((xs) => xs.auditTime(25))
            .subscribe(({ fn }) => fn(this)));
    }
    pushLine(...xs) {
        super.pushLine(...xs);
        if (this.get('autoScroll')) {
            this.get('renderTriggers').next({
                trigger: 'pushLine',
                fn: () => {
                    this.screen.render();
                    this.setScrollPerc(100);
                }
            });
        }
    }
}

module.exports = ConsoleBox;
