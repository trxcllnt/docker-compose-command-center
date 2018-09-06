#!/usr/bin/env node

const ttys = require('ttys');
const blessed = require('blessed');
const { ConsoleBox } = require('./components');
const { Subject, Observable } = require('./linq');
const { splitAsAsyncIterable } = require('./linq');
const { asyncIteratorToObservable } = require('./linq')

start(splitAsAsyncIterable(process.stdin)[Symbol.asyncIterator]())
    .then(() => {}, exit);

const stdinSymbol = '__stdin__';

const keyFromLine = firstCaptureGroup(/(\[.*?\|)/i);
const labelFromLine = firstCaptureGroup(/(\[.*?)\s*\|/i);
const contentFromLine = firstCaptureGroup(/\|(\[.*)/i);

async function start(lines) {

    const firstLine = await lines.next();
    if (firstLine.done) return exit(0);

    // parse out the container names from the first line.
    // unused for now, but might be useful use for the groupBy keys
    const names = getContainerNamesFromFirstLine(firstLine.value || '');

    const screen = blessedScreen();
    const grid = containerGrid({ parent: screen, top: '10%', left: '0%', width: '100%', height: '90%' });
    const stdin = new ConsoleBox({ parent: screen, top: '90%', left: '0%', width: '100%', height: '10%', idx: -1, key: stdinSymbol });
    const { menu, addMenuItem, selections } = containerMenu({ parent: screen, top: '0%', left: '0%', width: '100%', height: '10%' });

    // Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c'], () => exit());

    const mapLines = (lines) => lines.key === stdinSymbol ? lines : lines.map(contentFromLine);
    const aggregateBoxes = ({ boxes }, group, idx) => ({
        boxes, lines: mapLines(group),
        box: group.key === stdinSymbol ? stdin : boxes.set(group.key,
            addMenuItem(group.key) || new ConsoleBox({
                parent: grid,
                idx, key: group.key,
                width: `50%`, height: '50%',
                label: labelFromLine(group.key),
            })
        ).get(group.key)
    });
    
    const updates = asyncIteratorToObservable(lines)
        .groupBy((line) => keyFromLine(line) || stdinSymbol)
        .scan(aggregateBoxes, { boxes: new Map() })
        .multicast(() => new Subject(), (shared) => Observable.merge(

            shared.flatMap(({ box, lines }) => lines.do((line) => box.pushLine(line))),

            shared.switchMap(({ boxes }) => selections
                .startWith([...boxes.keys()].slice(0, 4))
                .scan((xs, x) => [x, ...xs.filter(y => x !== y)].slice(0, 4))
                .do((keys) => {
                    grid.children.sort((a, b) => {
                        if (a === b) return 0;
                        let a2 = keys.indexOf(a.get('key'));
                        let b2 = keys.indexOf(b.get('key'));
                        if (~a2) return ~b2 ? a2 - b2 : -1;
                        if (~b2) return ~a2 ? a2 - b2 :  1;
                        return a.get('idx') - b.get('idx');
                    }).forEach((x) => x.hide());

                    keys.map((k) => boxes.get(k)).forEach((x) => x && x.show());
                }))
        ));

    updates.startWith(null).subscribe(() => screen.render());
}

const blessedScreen = (props = {}) => blessed.screen({
    debug: true,
    key: true, mouse: true, sendFocus: true,
    scrollable: false, smartCSR: true, fullUnicode: true,
    dockBorders: true, autoPadding: true, ignoreDockContrast: true,
    input: ttys.stdin, output: ttys.stdout, cursor: { shape: 'line', color: 'white' },
    ...props,
});

const containerGrid = (props = {}) => blessed.layout({
    layout: 'grid', padding: 0,
    top: '5%', left: '0%', width: '100%', height: `90%`,
    key: true, mouse: true, scrollable: false, alwaysScroll: false,
    ...props
});

const containerMenu = (props = {}) => {

    let selections = new Subject();
    let menu = blessed.listbar({
        border: 'line', padding: 0, dockBorders: true,
        key: true, mouse: true, autoCommandKeys: true,
        ...props,
    });

    let addMenuItem = (key) => menu.add({
        key,
        text: labelFromLine(key),
        callback: () => selections.next(key)
    });

    return { menu, addMenuItem, selections };
}

// Parses the initial "Attaching to (dir_label_inst, ...)" line to get the container names
function getContainerNamesFromFirstLine(line = '') {
    return line
        .substring(line.indexOf('Attaching to ') + 1).split(', ')
        // skip past the `dir_` prefix
        .map((name) => name.substring(name.indexOf('_') + 1)).filter(Boolean);
}

function exit(err) { (err && console.error(err)) || process.exit(err ? 1 : 0); }
function firstCaptureGroup(exp) { let cap; return (line) => (cap = exp.exec(line)) && cap[1] || ''; };
