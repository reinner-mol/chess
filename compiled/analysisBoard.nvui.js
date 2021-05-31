(function (exports) {
    'use strict';

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return typeof s === "string" || typeof s === "number";
    }

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const defined = (v) => typeof v !== 'undefined';
    // like mithril prop but with type safety
    const prop = (initialValue) => {
        let value = initialValue;
        const fun = function (v) {
            if (defined(v))
                value = v;
            return value;
        };
        return fun;
    };

    const defaultInit = {
        cache: 'no-cache',
        credentials: 'same-origin', // required for safari < 12
    };
    const xhrHeader = {
        'X-Requested-With': 'XMLHttpRequest', // so lila knows it's XHR
    };
    /* fetch a string */
    const text = (url, init = {}) => textRaw(url, init).then(res => {
        if (res.ok)
            return res.text();
        throw res.statusText;
    });
    const textRaw = (url, init = {}) => fetch(url, Object.assign(Object.assign(Object.assign({}, defaultInit), { headers: Object.assign({}, xhrHeader) }), init));

    const colors = ['white', 'black'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const invRanks = [...ranks].reverse();
    const allKeys = Array.prototype.concat(...files.map(c => ranks.map(r => c + r)));
    const pos2key = (pos) => allKeys[8 * pos[0] + pos[1]];
    const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
    const allPos = allKeys.map(key2pos);
    function memo(f) {
        let v;
        const ret = () => {
            if (v === undefined)
                v = f();
            return v;
        };
        ret.clear = () => {
            v = undefined;
        };
        return ret;
    }
    const timer = () => {
        let startAt;
        return {
            start() {
                startAt = performance.now();
            },
            cancel() {
                startAt = undefined;
            },
            stop() {
                if (!startAt)
                    return 0;
                const time = performance.now() - startAt;
                startAt = undefined;
                return time;
            },
        };
    };
    const opposite = (c) => (c === 'white' ? 'black' : 'white');
    const distanceSq = (pos1, pos2) => {
        const dx = pos1[0] - pos2[0], dy = pos1[1] - pos2[1];
        return dx * dx + dy * dy;
    };
    const samePiece = (p1, p2) => p1.role === p2.role && p1.color === p2.color;
    const posToTranslateBase = (pos, asWhite, xFactor, yFactor) => [
        (asWhite ? pos[0] : 7 - pos[0]) * xFactor,
        (asWhite ? 7 - pos[1] : pos[1]) * yFactor,
    ];
    const posToTranslateAbs = (bounds) => {
        const xFactor = bounds.width / 8, yFactor = bounds.height / 8;
        return (pos, asWhite) => posToTranslateBase(pos, asWhite, xFactor, yFactor);
    };
    const posToTranslateRel = (pos, asWhite) => posToTranslateBase(pos, asWhite, 100, 100);
    const translateAbs = (el, pos) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
    };
    const translateRel = (el, percents) => {
        el.style.transform = `translate(${percents[0]}%,${percents[1]}%)`;
    };
    const setVisible = (el, v) => {
        el.style.visibility = v ? 'visible' : 'hidden';
    };
    const eventPosition$1 = (e) => {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return; // touchend has no position!
    };
    const isRightButton = (e) => e.buttons === 2 || e.button === 2;
    const createEl = (tagName, className) => {
        const el = document.createElement(tagName);
        if (className)
            el.className = className;
        return el;
    };
    function computeSquareCenter(key, asWhite, bounds) {
        const pos = key2pos(key);
        if (!asWhite) {
            pos[0] = 7 - pos[0];
            pos[1] = 7 - pos[1];
        }
        return [
            bounds.left + (bounds.width * pos[0]) / 8 + bounds.width / 16,
            bounds.top + (bounds.height * (7 - pos[1])) / 8 + bounds.height / 16,
        ];
    }

    function diff(a, b) {
        return Math.abs(a - b);
    }
    function pawn(color) {
        return (x1, y1, x2, y2) => diff(x1, x2) < 2 &&
            (color === 'white'
                ? // allow 2 squares from first two ranks, for horde
                    y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
                : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));
    }
    const knight = (x1, y1, x2, y2) => {
        const xd = diff(x1, x2);
        const yd = diff(y1, y2);
        return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
    };
    const bishop = (x1, y1, x2, y2) => {
        return diff(x1, x2) === diff(y1, y2);
    };
    const rook = (x1, y1, x2, y2) => {
        return x1 === x2 || y1 === y2;
    };
    const queen = (x1, y1, x2, y2) => {
        return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
    };
    function king(color, rookFiles, canCastle) {
        return (x1, y1, x2, y2) => (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
            (canCastle &&
                y1 === y2 &&
                y1 === (color === 'white' ? 0 : 7) &&
                ((x1 === 4 && ((x2 === 2 && rookFiles.includes(0)) || (x2 === 6 && rookFiles.includes(7)))) ||
                    rookFiles.includes(x2)));
    }
    function rookFilesOf(pieces, color) {
        const backrank = color === 'white' ? '1' : '8';
        const files = [];
        for (const [key, piece] of pieces) {
            if (key[1] === backrank && piece.color === color && piece.role === 'rook') {
                files.push(key2pos(key)[0]);
            }
        }
        return files;
    }
    function premove(pieces, key, canCastle) {
        const piece = pieces.get(key);
        if (!piece)
            return [];
        const pos = key2pos(key), r = piece.role, mobility = r === 'pawn'
            ? pawn(piece.color)
            : r === 'knight'
                ? knight
                : r === 'bishop'
                    ? bishop
                    : r === 'rook'
                        ? rook
                        : r === 'queen'
                            ? queen
                            : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
        return allPos
            .filter(pos2 => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]))
            .map(pos2key);
    }

    function callUserFunction(f, ...args) {
        if (f)
            setTimeout(() => f(...args), 1);
    }
    function toggleOrientation(state) {
        state.orientation = opposite(state.orientation);
        state.animation.current = state.draggable.current = state.selected = undefined;
    }
    function setPieces(state, pieces) {
        for (const [key, piece] of pieces) {
            if (piece)
                state.pieces.set(key, piece);
            else
                state.pieces.delete(key);
        }
    }
    function setCheck(state, color) {
        state.check = undefined;
        if (color === true)
            color = state.turnColor;
        if (color)
            for (const [k, p] of state.pieces) {
                if (p.role === 'king' && p.color === color) {
                    state.check = k;
                }
            }
    }
    function setPremove(state, orig, dest, meta) {
        unsetPredrop(state);
        state.premovable.current = [orig, dest];
        callUserFunction(state.premovable.events.set, orig, dest, meta);
    }
    function unsetPremove(state) {
        if (state.premovable.current) {
            state.premovable.current = undefined;
            callUserFunction(state.premovable.events.unset);
        }
    }
    function setPredrop(state, role, key) {
        unsetPremove(state);
        state.predroppable.current = { role, key };
        callUserFunction(state.predroppable.events.set, role, key);
    }
    function unsetPredrop(state) {
        const pd = state.predroppable;
        if (pd.current) {
            pd.current = undefined;
            callUserFunction(pd.events.unset);
        }
    }
    function tryAutoCastle(state, orig, dest) {
        if (!state.autoCastle)
            return false;
        const king = state.pieces.get(orig);
        if (!king || king.role !== 'king')
            return false;
        const origPos = key2pos(orig);
        const destPos = key2pos(dest);
        if ((origPos[1] !== 0 && origPos[1] !== 7) || origPos[1] !== destPos[1])
            return false;
        if (origPos[0] === 4 && !state.pieces.has(dest)) {
            if (destPos[0] === 6)
                dest = pos2key([7, destPos[1]]);
            else if (destPos[0] === 2)
                dest = pos2key([0, destPos[1]]);
        }
        const rook = state.pieces.get(dest);
        if (!rook || rook.color !== king.color || rook.role !== 'rook')
            return false;
        state.pieces.delete(orig);
        state.pieces.delete(dest);
        if (origPos[0] < destPos[0]) {
            state.pieces.set(pos2key([6, destPos[1]]), king);
            state.pieces.set(pos2key([5, destPos[1]]), rook);
        }
        else {
            state.pieces.set(pos2key([2, destPos[1]]), king);
            state.pieces.set(pos2key([3, destPos[1]]), rook);
        }
        return true;
    }
    function baseMove(state, orig, dest) {
        const origPiece = state.pieces.get(orig), destPiece = state.pieces.get(dest);
        if (orig === dest || !origPiece)
            return false;
        const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : undefined;
        if (dest === state.selected)
            unselect(state);
        callUserFunction(state.events.move, orig, dest, captured);
        if (!tryAutoCastle(state, orig, dest)) {
            state.pieces.set(dest, origPiece);
            state.pieces.delete(orig);
        }
        state.lastMove = [orig, dest];
        state.check = undefined;
        callUserFunction(state.events.change);
        return captured || true;
    }
    function baseNewPiece(state, piece, key, force) {
        if (state.pieces.has(key)) {
            if (force)
                state.pieces.delete(key);
            else
                return false;
        }
        callUserFunction(state.events.dropNewPiece, piece, key);
        state.pieces.set(key, piece);
        state.lastMove = [key];
        state.check = undefined;
        callUserFunction(state.events.change);
        state.movable.dests = undefined;
        state.turnColor = opposite(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite(state.turnColor);
            state.animation.current = undefined;
        }
        return result;
    }
    function userMove(state, orig, dest) {
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const holdTime = state.hold.stop();
                unselect(state);
                const metadata = {
                    premove: false,
                    ctrlKey: state.stats.ctrlKey,
                    holdTime,
                };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                return true;
            }
        }
        else if (canPremove(state, orig, dest)) {
            setPremove(state, orig, dest, {
                ctrlKey: state.stats.ctrlKey,
            });
            unselect(state);
            return true;
        }
        unselect(state);
        return false;
    }
    function dropNewPiece(state, orig, dest, force) {
        const piece = state.pieces.get(orig);
        if (piece && (canDrop(state, orig, dest) || force)) {
            state.pieces.delete(orig);
            baseNewPiece(state, piece, dest, force);
            callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {
                premove: false,
                predrop: false,
            });
        }
        else if (piece && canPredrop(state, orig, dest)) {
            setPredrop(state, piece.role, dest);
        }
        else {
            unsetPremove(state);
            unsetPredrop(state);
        }
        state.pieces.delete(orig);
        unselect(state);
    }
    function selectSquare(state, key, force) {
        callUserFunction(state.events.select, key);
        if (state.selected) {
            if (state.selected === key && !state.draggable.enabled) {
                unselect(state);
                state.hold.cancel();
                return;
            }
            else if ((state.selectable.enabled || force) && state.selected !== key) {
                if (userMove(state, state.selected, key)) {
                    state.stats.dragged = false;
                    return;
                }
            }
        }
        if (isMovable(state, key) || isPremovable(state, key)) {
            setSelected(state, key);
            state.hold.start();
        }
    }
    function setSelected(state, key) {
        state.selected = key;
        if (isPremovable(state, key)) {
            state.premovable.dests = premove(state.pieces, key, state.premovable.castle);
        }
        else
            state.premovable.dests = undefined;
    }
    function unselect(state) {
        state.selected = undefined;
        state.premovable.dests = undefined;
        state.hold.cancel();
    }
    function isMovable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function canMove(state, orig, dest) {
        var _a, _b;
        return (orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest))));
    }
    function canDrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (orig === dest || !state.pieces.has(dest)) &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function isPremovable(state, orig) {
        const piece = state.pieces.get(orig);
        return !!piece && state.premovable.enabled && state.movable.color === piece.color && state.turnColor !== piece.color;
    }
    function canPremove(state, orig, dest) {
        return (orig !== dest && isPremovable(state, orig) && premove(state.pieces, orig, state.premovable.castle).includes(dest));
    }
    function canPredrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        const destPiece = state.pieces.get(dest);
        return (!!piece &&
            (!destPiece || destPiece.color !== state.movable.color) &&
            state.predroppable.enabled &&
            (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
            state.movable.color === piece.color &&
            state.turnColor !== piece.color);
    }
    function isDraggable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            state.draggable.enabled &&
            (state.movable.color === 'both' ||
                (state.movable.color === piece.color && (state.turnColor === piece.color || state.premovable.enabled))));
    }
    function playPremove(state) {
        const move = state.premovable.current;
        if (!move)
            return false;
        const orig = move[0], dest = move[1];
        let success = false;
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const metadata = { premove: true };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                success = true;
            }
        }
        unsetPremove(state);
        return success;
    }
    function playPredrop(state, validate) {
        const drop = state.predroppable.current;
        let success = false;
        if (!drop)
            return false;
        if (validate(drop)) {
            const piece = {
                role: drop.role,
                color: state.movable.color,
            };
            if (baseNewPiece(state, piece, drop.key)) {
                callUserFunction(state.movable.events.afterNewPiece, drop.role, drop.key, {
                    premove: false,
                    predrop: true,
                });
                success = true;
            }
        }
        unsetPredrop(state);
        return success;
    }
    function cancelMove(state) {
        unsetPremove(state);
        unsetPredrop(state);
        unselect(state);
    }
    function stop(state) {
        state.movable.color = state.movable.dests = state.animation.current = undefined;
        cancelMove(state);
    }
    function getKeyAtDomPos(pos, asWhite, bounds) {
        let file = Math.floor((8 * (pos[0] - bounds.left)) / bounds.width);
        if (!asWhite)
            file = 7 - file;
        let rank = 7 - Math.floor((8 * (pos[1] - bounds.top)) / bounds.height);
        if (!asWhite)
            rank = 7 - rank;
        return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? pos2key([file, rank]) : undefined;
    }
    function getSnappedKeyAtDomPos(orig, pos, asWhite, bounds) {
        const origPos = key2pos(orig);
        const validSnapPos = allPos.filter(pos2 => {
            return queen(origPos[0], origPos[1], pos2[0], pos2[1]) || knight(origPos[0], origPos[1], pos2[0], pos2[1]);
        });
        const validSnapCenters = validSnapPos.map(pos2 => computeSquareCenter(pos2key(pos2), asWhite, bounds));
        const validSnapDistances = validSnapCenters.map(pos2 => distanceSq(pos, pos2));
        const [, closestSnapIndex] = validSnapDistances.reduce((a, b, index) => (a[0] < b ? a : [b, index]), [
            validSnapDistances[0],
            0,
        ]);
        return pos2key(validSnapPos[closestSnapIndex]);
    }
    function whitePov(s) {
        return s.orientation === 'white';
    }

    const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles$1 = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
    };
    const letters$1 = {
        pawn: 'p',
        rook: 'r',
        knight: 'n',
        bishop: 'b',
        queen: 'q',
        king: 'k',
    };
    function read(fen) {
        if (fen === 'start')
            fen = initial;
        const pieces = new Map();
        let row = 7, col = 0;
        for (const c of fen) {
            switch (c) {
                case ' ':
                    return pieces;
                case '/':
                    --row;
                    if (row < 0)
                        return pieces;
                    col = 0;
                    break;
                case '~': {
                    const piece = pieces.get(pos2key([col, row]));
                    if (piece)
                        piece.promoted = true;
                    break;
                }
                default: {
                    const nb = c.charCodeAt(0);
                    if (nb < 57)
                        col += nb - 48;
                    else {
                        const role = c.toLowerCase();
                        pieces.set(pos2key([col, row]), {
                            role: roles$1[role],
                            color: c === role ? 'black' : 'white',
                        });
                        ++col;
                    }
                }
            }
        }
        return pieces;
    }
    function write(pieces) {
        return invRanks
            .map(y => files
            .map(x => {
            const piece = pieces.get((x + y));
            if (piece) {
                const letter = letters$1[piece.role];
                return piece.color === 'white' ? letter.toUpperCase() : letter;
            }
            else
                return '1';
        })
            .join(''))
            .join('/')
            .replace(/1{2,}/g, s => s.length.toString());
    }

    function configure(state, config) {
        var _a, _b;
        // don't merge destinations and autoShapes. Just override.
        if ((_a = config.movable) === null || _a === void 0 ? void 0 : _a.dests)
            state.movable.dests = undefined;
        if ((_b = config.drawable) === null || _b === void 0 ? void 0 : _b.autoShapes)
            state.drawable.autoShapes = [];
        merge(state, config);
        // if a fen was provided, replace the pieces
        if (config.fen) {
            state.pieces = read(config.fen);
            state.drawable.shapes = [];
        }
        // apply config values that could be undefined yet meaningful
        if ('check' in config)
            setCheck(state, config.check || false);
        if ('lastMove' in config && !config.lastMove)
            state.lastMove = undefined;
        // in case of ZH drop last move, there's a single square.
        // if the previous last move had two squares,
        // the merge algorithm will incorrectly keep the second square.
        else if (config.lastMove)
            state.lastMove = config.lastMove;
        // fix move/premove dests
        if (state.selected)
            setSelected(state, state.selected);
        // no need for such short animations
        if (!state.animation.duration || state.animation.duration < 100)
            state.animation.enabled = false;
        if (!state.movable.rookCastle && state.movable.dests) {
            const rank = state.movable.color === 'white' ? '1' : '8', kingStartPos = ('e' + rank), dests = state.movable.dests.get(kingStartPos), king = state.pieces.get(kingStartPos);
            if (!dests || !king || king.role !== 'king')
                return;
            state.movable.dests.set(kingStartPos, dests.filter(d => !(d === 'a' + rank && dests.includes(('c' + rank))) &&
                !(d === 'h' + rank && dests.includes(('g' + rank)))));
        }
    }
    function merge(base, extend) {
        for (const key in extend) {
            if (isObject(base[key]) && isObject(extend[key]))
                merge(base[key], extend[key]);
            else
                base[key] = extend[key];
        }
    }
    function isObject(o) {
        return typeof o === 'object';
    }

    function anim(mutation, state) {
        return state.animation.enabled ? animate(mutation, state) : render$1(mutation, state);
    }
    function render$1(mutation, state) {
        const result = mutation(state);
        state.dom.redraw();
        return result;
    }
    function makePiece(key, piece) {
        return {
            key: key,
            pos: key2pos(key),
            piece: piece,
        };
    }
    function closer(piece, pieces) {
        return pieces.sort((p1, p2) => {
            return distanceSq(piece.pos, p1.pos) - distanceSq(piece.pos, p2.pos);
        })[0];
    }
    function computePlan(prevPieces, current) {
        const anims = new Map(), animedOrigs = [], fadings = new Map(), missings = [], news = [], prePieces = new Map();
        let curP, preP, vector;
        for (const [k, p] of prevPieces) {
            prePieces.set(k, makePiece(k, p));
        }
        for (const key of allKeys) {
            curP = current.pieces.get(key);
            preP = prePieces.get(key);
            if (curP) {
                if (preP) {
                    if (!samePiece(curP, preP.piece)) {
                        missings.push(preP);
                        news.push(makePiece(key, curP));
                    }
                }
                else
                    news.push(makePiece(key, curP));
            }
            else if (preP)
                missings.push(preP);
        }
        for (const newP of news) {
            preP = closer(newP, missings.filter(p => samePiece(newP.piece, p.piece)));
            if (preP) {
                vector = [preP.pos[0] - newP.pos[0], preP.pos[1] - newP.pos[1]];
                anims.set(newP.key, vector.concat(vector));
                animedOrigs.push(preP.key);
            }
        }
        for (const p of missings) {
            if (!animedOrigs.includes(p.key))
                fadings.set(p.key, p.piece);
        }
        return {
            anims: anims,
            fadings: fadings,
        };
    }
    function step(state, now) {
        const cur = state.animation.current;
        if (cur === undefined) {
            // animation was canceled :(
            if (!state.dom.destroyed)
                state.dom.redrawNow();
            return;
        }
        const rest = 1 - (now - cur.start) * cur.frequency;
        if (rest <= 0) {
            state.animation.current = undefined;
            state.dom.redrawNow();
        }
        else {
            const ease = easing(rest);
            for (const cfg of cur.plan.anims.values()) {
                cfg[2] = cfg[0] * ease;
                cfg[3] = cfg[1] * ease;
            }
            state.dom.redrawNow(true); // optimisation: don't render SVG changes during animations
            requestAnimationFrame((now = performance.now()) => step(state, now));
        }
    }
    function animate(mutation, state) {
        // clone state before mutating it
        const prevPieces = new Map(state.pieces);
        const result = mutation(state);
        const plan = computePlan(prevPieces, state);
        if (plan.anims.size || plan.fadings.size) {
            const alreadyRunning = state.animation.current && state.animation.current.start;
            state.animation.current = {
                start: performance.now(),
                frequency: 1 / state.animation.duration,
                plan: plan,
            };
            if (!alreadyRunning)
                step(state, performance.now());
        }
        else {
            // don't animate, just render right away
            state.dom.redraw();
        }
        return result;
    }
    // https://gist.github.com/gre/1650294
    function easing(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    const brushes = ['green', 'red', 'blue', 'yellow'];
    function start$2(state, e) {
        // support one finger touch only
        if (e.touches && e.touches.length > 1)
            return;
        e.stopPropagation();
        e.preventDefault();
        e.ctrlKey ? unselect(state) : cancelMove(state);
        const pos = eventPosition$1(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
        if (!orig)
            return;
        state.drawable.current = {
            orig,
            pos,
            brush: eventBrush(e),
            snapToValidMove: state.drawable.defaultSnapToValidMove,
        };
        processDraw(state);
    }
    function processDraw(state) {
        requestAnimationFrame(() => {
            const cur = state.drawable.current;
            if (cur) {
                const keyAtDomPos = getKeyAtDomPos(cur.pos, whitePov(state), state.dom.bounds());
                if (!keyAtDomPos) {
                    cur.snapToValidMove = false;
                }
                const mouseSq = cur.snapToValidMove
                    ? getSnappedKeyAtDomPos(cur.orig, cur.pos, whitePov(state), state.dom.bounds())
                    : keyAtDomPos;
                if (mouseSq !== cur.mouseSq) {
                    cur.mouseSq = mouseSq;
                    cur.dest = mouseSq !== cur.orig ? mouseSq : undefined;
                    state.dom.redrawNow();
                }
                processDraw(state);
            }
        });
    }
    function move$1(state, e) {
        if (state.drawable.current)
            state.drawable.current.pos = eventPosition$1(e);
    }
    function end$1(state) {
        const cur = state.drawable.current;
        if (cur) {
            if (cur.mouseSq)
                addShape(state.drawable, cur);
            cancel$1(state);
        }
    }
    function cancel$1(state) {
        if (state.drawable.current) {
            state.drawable.current = undefined;
            state.dom.redraw();
        }
    }
    function clear(state) {
        if (state.drawable.shapes.length) {
            state.drawable.shapes = [];
            state.dom.redraw();
            onChange(state.drawable);
        }
    }
    function eventBrush(e) {
        var _a;
        const modA = (e.shiftKey || e.ctrlKey) && isRightButton(e);
        const modB = e.altKey || e.metaKey || ((_a = e.getModifierState) === null || _a === void 0 ? void 0 : _a.call(e, 'AltGraph'));
        return brushes[(modA ? 1 : 0) + (modB ? 2 : 0)];
    }
    function addShape(drawable, cur) {
        const sameShape = (s) => s.orig === cur.orig && s.dest === cur.dest;
        const similar = drawable.shapes.find(sameShape);
        if (similar)
            drawable.shapes = drawable.shapes.filter(s => !sameShape(s));
        if (!similar || similar.brush !== cur.brush)
            drawable.shapes.push(cur);
        onChange(drawable);
    }
    function onChange(drawable) {
        if (drawable.onChange)
            drawable.onChange(drawable.shapes);
    }

    function start$1(s, e) {
        if (!e.isTrusted || (e.button !== undefined && e.button !== 0))
            return; // only touch or left click
        if (e.touches && e.touches.length > 1)
            return; // support one finger touch only
        const bounds = s.dom.bounds(), position = eventPosition$1(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
        if (!orig)
            return;
        const piece = s.pieces.get(orig);
        const previouslySelected = s.selected;
        if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
            clear(s);
        // Prevent touch scroll and create no corresponding mouse event, if there
        // is an intent to interact with the board. If no color is movable
        // (and the board is not for viewing only), touches are likely intended to
        // select squares.
        if (e.cancelable !== false &&
            (!e.touches || !s.movable.color || piece || previouslySelected || pieceCloseTo(s, position)))
            e.preventDefault();
        const hadPremove = !!s.premovable.current;
        const hadPredrop = !!s.predroppable.current;
        s.stats.ctrlKey = e.ctrlKey;
        if (s.selected && canMove(s, s.selected, orig)) {
            anim(state => selectSquare(state, orig), s);
        }
        else {
            selectSquare(s, orig);
        }
        const stillSelected = s.selected === orig;
        const element = pieceElementByKey(s, orig);
        if (piece && element && stillSelected && isDraggable(s, orig)) {
            s.draggable.current = {
                orig,
                piece,
                origPos: position,
                pos: position,
                started: s.draggable.autoDistance && s.stats.dragged,
                element,
                previouslySelected,
                originTarget: e.target,
            };
            element.cgDragging = true;
            element.classList.add('dragging');
            // place ghost
            const ghost = s.dom.elements.ghost;
            if (ghost) {
                ghost.className = `ghost ${piece.color} ${piece.role}`;
                translateAbs(ghost, posToTranslateAbs(bounds)(key2pos(orig), whitePov(s)));
                setVisible(ghost, true);
            }
            processDrag(s);
        }
        else {
            if (hadPremove)
                unsetPremove(s);
            if (hadPredrop)
                unsetPredrop(s);
        }
        s.dom.redraw();
    }
    function pieceCloseTo(s, pos) {
        const asWhite = whitePov(s), bounds = s.dom.bounds(), radiusSq = Math.pow(bounds.width / 8, 2);
        for (const key in s.pieces) {
            const center = computeSquareCenter(key, asWhite, bounds);
            if (distanceSq(center, pos) <= radiusSq)
                return true;
        }
        return false;
    }
    function dragNewPiece(s, piece, e, force) {
        const key = 'a0';
        s.pieces.set(key, piece);
        s.dom.redraw();
        const position = eventPosition$1(e);
        s.draggable.current = {
            orig: key,
            piece,
            origPos: position,
            pos: position,
            started: true,
            element: () => pieceElementByKey(s, key),
            originTarget: e.target,
            newPiece: true,
            force: !!force,
        };
        processDrag(s);
    }
    function processDrag(s) {
        requestAnimationFrame(() => {
            var _a;
            const cur = s.draggable.current;
            if (!cur)
                return;
            // cancel animations while dragging
            if ((_a = s.animation.current) === null || _a === void 0 ? void 0 : _a.plan.anims.has(cur.orig))
                s.animation.current = undefined;
            // if moving piece is gone, cancel
            const origPiece = s.pieces.get(cur.orig);
            if (!origPiece || !samePiece(origPiece, cur.piece))
                cancel(s);
            else {
                if (!cur.started && distanceSq(cur.pos, cur.origPos) >= Math.pow(s.draggable.distance, 2))
                    cur.started = true;
                if (cur.started) {
                    // support lazy elements
                    if (typeof cur.element === 'function') {
                        const found = cur.element();
                        if (!found)
                            return;
                        found.cgDragging = true;
                        found.classList.add('dragging');
                        cur.element = found;
                    }
                    const bounds = s.dom.bounds();
                    translateAbs(cur.element, [
                        cur.pos[0] - bounds.left - bounds.width / 16,
                        cur.pos[1] - bounds.top - bounds.height / 16,
                    ]);
                }
            }
            processDrag(s);
        });
    }
    function move(s, e) {
        // support one finger touch only
        if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
            s.draggable.current.pos = eventPosition$1(e);
        }
    }
    function end(s, e) {
        const cur = s.draggable.current;
        if (!cur)
            return;
        // create no corresponding mouse event
        if (e.type === 'touchend' && e.cancelable !== false)
            e.preventDefault();
        // comparing with the origin target is an easy way to test that the end event
        // has the same touch origin
        if (e.type === 'touchend' && cur.originTarget !== e.target && !cur.newPiece) {
            s.draggable.current = undefined;
            return;
        }
        unsetPremove(s);
        unsetPredrop(s);
        // touchend has no position; so use the last touchmove position instead
        const eventPos = eventPosition$1(e) || cur.pos;
        const dest = getKeyAtDomPos(eventPos, whitePov(s), s.dom.bounds());
        if (dest && cur.started && cur.orig !== dest) {
            if (cur.newPiece)
                dropNewPiece(s, cur.orig, dest, cur.force);
            else {
                s.stats.ctrlKey = e.ctrlKey;
                if (userMove(s, cur.orig, dest))
                    s.stats.dragged = true;
            }
        }
        else if (cur.newPiece) {
            s.pieces.delete(cur.orig);
        }
        else if (s.draggable.deleteOnDropOff && !dest) {
            s.pieces.delete(cur.orig);
            callUserFunction(s.events.change);
        }
        if (cur.orig === cur.previouslySelected && (cur.orig === dest || !dest))
            unselect(s);
        else if (!s.selectable.enabled)
            unselect(s);
        removeDragElements(s);
        s.draggable.current = undefined;
        s.dom.redraw();
    }
    function cancel(s) {
        const cur = s.draggable.current;
        if (cur) {
            if (cur.newPiece)
                s.pieces.delete(cur.orig);
            s.draggable.current = undefined;
            unselect(s);
            removeDragElements(s);
            s.dom.redraw();
        }
    }
    function removeDragElements(s) {
        const e = s.dom.elements;
        if (e.ghost)
            setVisible(e.ghost, false);
    }
    function pieceElementByKey(s, key) {
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if (el.cgKey === key && el.tagName === 'PIECE')
                return el;
            el = el.nextSibling;
        }
        return;
    }

    function explosion(state, keys) {
        state.exploding = { stage: 1, keys };
        state.dom.redraw();
        setTimeout(() => {
            setStage(state, 2);
            setTimeout(() => setStage(state, undefined), 120);
        }, 120);
    }
    function setStage(state, stage) {
        if (state.exploding) {
            if (stage)
                state.exploding.stage = stage;
            else
                state.exploding = undefined;
            state.dom.redraw();
        }
    }

    // see API types and documentations in dts/api.d.ts
    function start(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                (config.fen ? anim : render$1)(state => configure(state, config), state);
            },
            state,
            getFen: () => write(state.pieces),
            toggleOrientation: toggleOrientation$1,
            setPieces(pieces) {
                anim(state => setPieces(state, pieces), state);
            },
            selectSquare(key, force) {
                if (key)
                    anim(state => selectSquare(state, key, force), state);
                else if (state.selected) {
                    unselect(state);
                    state.dom.redraw();
                }
            },
            move(orig, dest) {
                anim(state => baseMove(state, orig, dest), state);
            },
            newPiece(piece, key) {
                anim(state => baseNewPiece(state, piece, key), state);
            },
            playPremove() {
                if (state.premovable.current) {
                    if (anim(playPremove, state))
                        return true;
                    // if the premove couldn't be played, redraw to clear it up
                    state.dom.redraw();
                }
                return false;
            },
            playPredrop(validate) {
                if (state.predroppable.current) {
                    const result = playPredrop(state, validate);
                    state.dom.redraw();
                    return result;
                }
                return false;
            },
            cancelPremove() {
                render$1(unsetPremove, state);
            },
            cancelPredrop() {
                render$1(unsetPredrop, state);
            },
            cancelMove() {
                render$1(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$1(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$1(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$1(state => (state.drawable.shapes = shapes), state);
            },
            getKeyAtDomPos(pos) {
                return getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
            },
            redrawAll,
            dragNewPiece(piece, event, force) {
                dragNewPiece(state, piece, event, force);
            },
            destroy() {
                stop(state);
                state.dom.unbind && state.dom.unbind();
                state.dom.destroyed = true;
            },
        };
    }

    function defaults() {
        return {
            pieces: read(initial),
            orientation: 'white',
            turnColor: 'white',
            coordinates: true,
            autoCastle: true,
            viewOnly: false,
            disableContextMenu: false,
            resizable: true,
            addPieceZIndex: false,
            pieceKey: false,
            highlight: {
                lastMove: true,
                check: true,
            },
            animation: {
                enabled: true,
                duration: 200,
            },
            movable: {
                free: true,
                color: 'both',
                showDests: true,
                events: {},
                rookCastle: true,
            },
            premovable: {
                enabled: true,
                showDests: true,
                castle: true,
                events: {},
            },
            predroppable: {
                enabled: false,
                events: {},
            },
            draggable: {
                enabled: true,
                distance: 3,
                autoDistance: true,
                showGhost: true,
                deleteOnDropOff: false,
            },
            dropmode: {
                active: false,
            },
            selectable: {
                enabled: true,
            },
            stats: {
                // on touchscreen, default to "tap-tap" moves
                // instead of drag
                dragged: !('ontouchstart' in window),
            },
            events: {},
            drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: true,
                eraseOnClick: true,
                shapes: [],
                autoShapes: [],
                brushes: {
                    green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
                    red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
                    blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
                    yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
                    paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
                    paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
                    paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
                    paleGrey: {
                        key: 'pgr',
                        color: '#4a4a4a',
                        opacity: 0.35,
                        lineWidth: 15,
                    },
                },
                pieces: {
                    baseUrl: 'https://lichess1.org/assets/piece/cburnett/',
                },
                prevSvgHash: '',
            },
            hold: timer(),
        };
    }

    function createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
    function renderSvg(state, svg, customSvg) {
        const d = state.drawable, curD = d.current, cur = curD && curD.mouseSq ? curD : undefined, arrowDests = new Map(), bounds = state.dom.bounds();
        for (const s of d.shapes.concat(d.autoShapes).concat(cur ? [cur] : [])) {
            if (s.dest)
                arrowDests.set(s.dest, (arrowDests.get(s.dest) || 0) + 1);
        }
        const shapes = d.shapes.concat(d.autoShapes).map((s) => {
            return {
                shape: s,
                current: false,
                hash: shapeHash(s, arrowDests, false, bounds),
            };
        });
        if (cur)
            shapes.push({
                shape: cur,
                current: true,
                hash: shapeHash(cur, arrowDests, true, bounds),
            });
        const fullHash = shapes.map(sc => sc.hash).join(';');
        if (fullHash === state.drawable.prevSvgHash)
            return;
        state.drawable.prevSvgHash = fullHash;
        /*
          -- DOM hierarchy --
          <svg class="cg-shapes">      (<= svg)
            <defs>
              ...(for brushes)...
            </defs>
            <g>
              ...(for arrows, circles, and pieces)...
            </g>
          </svg>
          <svg class="cg-custom-svgs"> (<= customSvg)
            <g>
              ...(for custom svgs)...
            </g>
          </svg>
        */
        const defsEl = svg.querySelector('defs');
        const shapesEl = svg.querySelector('g');
        const customSvgsEl = customSvg.querySelector('g');
        syncDefs(d, shapes, defsEl);
        syncShapes(state, shapes.filter(s => !s.shape.customSvg), d.brushes, arrowDests, shapesEl);
        syncShapes(state, shapes.filter(s => s.shape.customSvg), d.brushes, arrowDests, customSvgsEl);
    }
    // append only. Don't try to update/remove.
    function syncDefs(d, shapes, defsEl) {
        const brushes = new Map();
        let brush;
        for (const s of shapes) {
            if (s.shape.dest) {
                brush = d.brushes[s.shape.brush];
                if (s.shape.modifiers)
                    brush = makeCustomBrush(brush, s.shape.modifiers);
                brushes.set(brush.key, brush);
            }
        }
        const keysInDom = new Set();
        let el = defsEl.firstChild;
        while (el) {
            keysInDom.add(el.getAttribute('cgKey'));
            el = el.nextSibling;
        }
        for (const [key, brush] of brushes.entries()) {
            if (!keysInDom.has(key))
                defsEl.appendChild(renderMarker(brush));
        }
    }
    // append and remove only. No updates.
    function syncShapes(state, shapes, brushes, arrowDests, root) {
        const bounds = state.dom.bounds(), hashesInDom = new Map(), // by hash
        toRemove = [];
        for (const sc of shapes)
            hashesInDom.set(sc.hash, false);
        let el = root.firstChild, elHash;
        while (el) {
            elHash = el.getAttribute('cgHash');
            // found a shape element that's here to stay
            if (hashesInDom.has(elHash))
                hashesInDom.set(elHash, true);
            // or remove it
            else
                toRemove.push(el);
            el = el.nextSibling;
        }
        // remove old shapes
        for (const el of toRemove)
            root.removeChild(el);
        // insert shapes that are not yet in dom
        for (const sc of shapes) {
            if (!hashesInDom.get(sc.hash))
                root.appendChild(renderShape(state, sc, brushes, arrowDests, bounds));
        }
    }
    function shapeHash({ orig, dest, brush, piece, modifiers, customSvg }, arrowDests, current, bounds) {
        return [
            bounds.width,
            bounds.height,
            current,
            orig,
            dest,
            brush,
            dest && (arrowDests.get(dest) || 0) > 1,
            piece && pieceHash(piece),
            modifiers && modifiersHash(modifiers),
            customSvg && customSvgHash(customSvg),
        ]
            .filter(x => x)
            .join(',');
    }
    function pieceHash(piece) {
        return [piece.color, piece.role, piece.scale].filter(x => x).join(',');
    }
    function modifiersHash(m) {
        return '' + (m.lineWidth || '');
    }
    function customSvgHash(s) {
        // Rolling hash with base 31 (cf. https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = (((h << 5) - h) + s.charCodeAt(i)) >>> 0;
        }
        return 'custom-' + h.toString();
    }
    function renderShape(state, { shape, current, hash }, brushes, arrowDests, bounds) {
        let el;
        if (shape.customSvg) {
            const orig = orient(key2pos(shape.orig), state.orientation);
            el = renderCustomSvg(shape.customSvg, orig, bounds);
        }
        else if (shape.piece)
            el = renderPiece(state.drawable.pieces.baseUrl, orient(key2pos(shape.orig), state.orientation), shape.piece, bounds);
        else {
            const orig = orient(key2pos(shape.orig), state.orientation);
            if (shape.dest) {
                let brush = brushes[shape.brush];
                if (shape.modifiers)
                    brush = makeCustomBrush(brush, shape.modifiers);
                el = renderArrow(brush, orig, orient(key2pos(shape.dest), state.orientation), current, (arrowDests.get(shape.dest) || 0) > 1, bounds);
            }
            else
                el = renderCircle(brushes[shape.brush], orig, current, bounds);
        }
        el.setAttribute('cgHash', hash);
        return el;
    }
    function renderCustomSvg(customSvg, pos, bounds) {
        const { width, height } = bounds;
        const w = width / 8;
        const h = height / 8;
        const x = pos[0] * w;
        const y = (7 - pos[1]) * h;
        // Translate to top-left of `orig` square
        const g = setAttributes(createElement('g'), { transform: `translate(${x},${y})` });
        // Give 100x100 coordinate system to the user for `orig` square
        const svg = setAttributes(createElement('svg'), { width: w, height: h, viewBox: '0 0 100 100' });
        g.appendChild(svg);
        svg.innerHTML = customSvg;
        return g;
    }
    function renderCircle(brush, pos, current, bounds) {
        const o = pos2px(pos, bounds), widths = circleWidth(bounds), radius = (bounds.width + bounds.height) / 32;
        return setAttributes(createElement('circle'), {
            stroke: brush.color,
            'stroke-width': widths[current ? 0 : 1],
            fill: 'none',
            opacity: opacity(brush, current),
            cx: o[0],
            cy: o[1],
            r: radius - widths[1] / 2,
        });
    }
    function renderArrow(brush, orig, dest, current, shorten, bounds) {
        const m = arrowMargin(bounds, shorten && !current), a = pos2px(orig, bounds), b = pos2px(dest, bounds), dx = b[0] - a[0], dy = b[1] - a[1], angle = Math.atan2(dy, dx), xo = Math.cos(angle) * m, yo = Math.sin(angle) * m;
        return setAttributes(createElement('line'), {
            stroke: brush.color,
            'stroke-width': lineWidth(brush, current, bounds),
            'stroke-linecap': 'round',
            'marker-end': 'url(#arrowhead-' + brush.key + ')',
            opacity: opacity(brush, current),
            x1: a[0],
            y1: a[1],
            x2: b[0] - xo,
            y2: b[1] - yo,
        });
    }
    function renderPiece(baseUrl, pos, piece, bounds) {
        const o = pos2px(pos, bounds), size = (bounds.width / 8) * (piece.scale || 1), name = piece.color[0] + (piece.role === 'knight' ? 'n' : piece.role[0]).toUpperCase();
        return setAttributes(createElement('image'), {
            className: `${piece.role} ${piece.color}`,
            x: o[0] - size / 2,
            y: o[1] - size / 2,
            width: size,
            height: size,
            href: baseUrl + name + '.svg',
        });
    }
    function renderMarker(brush) {
        const marker = setAttributes(createElement('marker'), {
            id: 'arrowhead-' + brush.key,
            orient: 'auto',
            markerWidth: 4,
            markerHeight: 8,
            refX: 2.05,
            refY: 2.01,
        });
        marker.appendChild(setAttributes(createElement('path'), {
            d: 'M0,0 V4 L3,2 Z',
            fill: brush.color,
        }));
        marker.setAttribute('cgKey', brush.key);
        return marker;
    }
    function setAttributes(el, attrs) {
        for (const key in attrs)
            el.setAttribute(key, attrs[key]);
        return el;
    }
    function orient(pos, color) {
        return color === 'white' ? pos : [7 - pos[0], 7 - pos[1]];
    }
    function makeCustomBrush(base, modifiers) {
        return {
            color: base.color,
            opacity: Math.round(base.opacity * 10) / 10,
            lineWidth: Math.round(modifiers.lineWidth || base.lineWidth),
            key: [base.key, modifiers.lineWidth].filter(x => x).join(''),
        };
    }
    function circleWidth(bounds) {
        const base = bounds.width / 512;
        return [3 * base, 4 * base];
    }
    function lineWidth(brush, current, bounds) {
        return (((brush.lineWidth || 10) * (current ? 0.85 : 1)) / 512) * bounds.width;
    }
    function opacity(brush, current) {
        return (brush.opacity || 1) * (current ? 0.9 : 1);
    }
    function arrowMargin(bounds, shorten) {
        return ((shorten ? 20 : 10) / 512) * bounds.width;
    }
    function pos2px(pos, bounds) {
        return [((pos[0] + 0.5) * bounds.width) / 8, ((7.5 - pos[1]) * bounds.height) / 8];
    }

    function renderWrap(element, s, relative) {
        // .cg-wrap (element passed to Chessground)
        //   cg-helper (12.5%, display: table)
        //     cg-container (800%)
        //       cg-board
        //       svg.cg-shapes
        //         defs
        //         g
        //       svg.cg-custom-svgs
        //         g
        //       coords.ranks
        //       coords.files
        //       piece.ghost
        element.innerHTML = '';
        // ensure the cg-wrap class is set
        // so bounds calculation can use the CSS width/height values
        // add that class yourself to the element before calling chessground
        // for a slight performance improvement! (avoids recomputing style)
        element.classList.add('cg-wrap');
        for (const c of colors)
            element.classList.toggle('orientation-' + c, s.orientation === c);
        element.classList.toggle('manipulable', !s.viewOnly);
        const helper = createEl('cg-helper');
        element.appendChild(helper);
        const container = createEl('cg-container');
        helper.appendChild(container);
        const board = createEl('cg-board');
        container.appendChild(board);
        let svg;
        let customSvg;
        if (s.drawable.visible && !relative) {
            svg = setAttributes(createElement('svg'), { class: 'cg-shapes' });
            svg.appendChild(createElement('defs'));
            svg.appendChild(createElement('g'));
            customSvg = setAttributes(createElement('svg'), { class: 'cg-custom-svgs' });
            customSvg.appendChild(createElement('g'));
            container.appendChild(svg);
            container.appendChild(customSvg);
        }
        if (s.coordinates) {
            const orientClass = s.orientation === 'black' ? ' black' : '';
            container.appendChild(renderCoords(ranks, 'ranks' + orientClass));
            container.appendChild(renderCoords(files, 'files' + orientClass));
        }
        let ghost;
        if (s.draggable.showGhost && !relative) {
            ghost = createEl('piece', 'ghost');
            setVisible(ghost, false);
            container.appendChild(ghost);
        }
        return {
            board,
            container,
            ghost,
            svg,
            customSvg,
        };
    }
    function renderCoords(elems, className) {
        const el = createEl('coords', className);
        let f;
        for (const elem of elems) {
            f = createEl('coord');
            f.textContent = elem;
            el.appendChild(f);
        }
        return el;
    }

    function drop(s, e) {
        if (!s.dropmode.active)
            return;
        unsetPremove(s);
        unsetPredrop(s);
        const piece = s.dropmode.piece;
        if (piece) {
            s.pieces.set('a0', piece);
            const position = eventPosition$1(e);
            const dest = position && getKeyAtDomPos(position, whitePov(s), s.dom.bounds());
            if (dest)
                dropNewPiece(s, 'a0', dest);
        }
        s.dom.redraw();
    }

    function bindBoard(s, boundsUpdated) {
        const boardEl = s.dom.elements.board;
        if (!s.dom.relative && s.resizable && 'ResizeObserver' in window) {
            const observer = new window['ResizeObserver'](boundsUpdated);
            observer.observe(boardEl);
        }
        if (s.viewOnly)
            return;
        // Cannot be passive, because we prevent touch scrolling and dragging of
        // selected elements.
        const onStart = startDragOrDraw(s);
        boardEl.addEventListener('touchstart', onStart, {
            passive: false,
        });
        boardEl.addEventListener('mousedown', onStart, {
            passive: false,
        });
        if (s.disableContextMenu || s.drawable.enabled) {
            boardEl.addEventListener('contextmenu', e => e.preventDefault());
        }
    }
    // returns the unbind function
    function bindDocument(s, boundsUpdated) {
        const unbinds = [];
        // Old versions of Edge and Safari do not support ResizeObserver. Send
        // chessground.resize if a user action has changed the bounds of the board.
        if (!s.dom.relative && s.resizable && !('ResizeObserver' in window)) {
            unbinds.push(unbindable(document.body, 'chessground.resize', boundsUpdated));
        }
        if (!s.viewOnly) {
            const onmove = dragOrDraw(s, move, move$1);
            const onend = dragOrDraw(s, end, end$1);
            for (const ev of ['touchmove', 'mousemove'])
                unbinds.push(unbindable(document, ev, onmove));
            for (const ev of ['touchend', 'mouseup'])
                unbinds.push(unbindable(document, ev, onend));
            const onScroll = () => s.dom.bounds.clear();
            unbinds.push(unbindable(document, 'scroll', onScroll, { capture: true, passive: true }));
            unbinds.push(unbindable(window, 'resize', onScroll, { passive: true }));
        }
        return () => unbinds.forEach(f => f());
    }
    function unbindable(el, eventName, callback, options) {
        el.addEventListener(eventName, callback, options);
        return () => el.removeEventListener(eventName, callback, options);
    }
    function startDragOrDraw(s) {
        return e => {
            if (s.draggable.current)
                cancel(s);
            else if (s.drawable.current)
                cancel$1(s);
            else if (e.shiftKey || isRightButton(e)) {
                if (s.drawable.enabled)
                    start$2(s, e);
            }
            else if (!s.viewOnly) {
                if (s.dropmode.active)
                    drop(s, e);
                else
                    start$1(s, e);
            }
        };
    }
    function dragOrDraw(s, withDrag, withDraw) {
        return e => {
            if (s.drawable.current) {
                if (s.drawable.enabled)
                    withDraw(s, e);
            }
            else if (!s.viewOnly)
                withDrag(s, e);
        };
    }

    // ported from https://github.com/veloce/lichobile/blob/master/src/js/chessground/view.js
    // in case of bugs, blame @veloce
    function render(s) {
        const asWhite = whitePov(s), posToTranslate = s.dom.relative ? posToTranslateRel : posToTranslateAbs(s.dom.bounds()), translate = s.dom.relative ? translateRel : translateAbs, boardEl = s.dom.elements.board, pieces = s.pieces, curAnim = s.animation.current, anims = curAnim ? curAnim.plan.anims : new Map(), fadings = curAnim ? curAnim.plan.fadings : new Map(), curDrag = s.draggable.current, squares = computeSquareClasses(s), samePieces = new Set(), sameSquares = new Set(), movedPieces = new Map(), movedSquares = new Map(); // by class name
        let k, el, pieceAtKey, elPieceName, anim, fading, pMvdset, pMvd, sMvdset, sMvd;
        // walk over all board dom elements, apply animations and flag moved pieces
        el = boardEl.firstChild;
        while (el) {
            k = el.cgKey;
            if (isPieceNode(el)) {
                pieceAtKey = pieces.get(k);
                anim = anims.get(k);
                fading = fadings.get(k);
                elPieceName = el.cgPiece;
                // if piece not being dragged anymore, remove dragging style
                if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
                    el.classList.remove('dragging');
                    translate(el, posToTranslate(key2pos(k), asWhite));
                    el.cgDragging = false;
                }
                // remove fading class if it still remains
                if (!fading && el.cgFading) {
                    el.cgFading = false;
                    el.classList.remove('fading');
                }
                // there is now a piece at this dom key
                if (pieceAtKey) {
                    // continue animation if already animating and same piece
                    // (otherwise it could animate a captured piece)
                    if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
                        const pos = key2pos(k);
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                        el.classList.add('anim');
                        translate(el, posToTranslate(pos, asWhite));
                    }
                    else if (el.cgAnimating) {
                        el.cgAnimating = false;
                        el.classList.remove('anim');
                        translate(el, posToTranslate(key2pos(k), asWhite));
                        if (s.addPieceZIndex)
                            el.style.zIndex = posZIndex(key2pos(k), asWhite);
                    }
                    // same piece: flag as same
                    if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
                        samePieces.add(k);
                    }
                    // different piece: flag as moved unless it is a fading piece
                    else {
                        if (fading && elPieceName === pieceNameOf(fading)) {
                            el.classList.add('fading');
                            el.cgFading = true;
                        }
                        else {
                            appendValue(movedPieces, elPieceName, el);
                        }
                    }
                }
                // no piece: flag as moved
                else {
                    appendValue(movedPieces, elPieceName, el);
                }
            }
            else if (isSquareNode(el)) {
                const cn = el.className;
                if (squares.get(k) === cn)
                    sameSquares.add(k);
                else
                    appendValue(movedSquares, cn, el);
            }
            el = el.nextSibling;
        }
        // walk over all squares in current set, apply dom changes to moved squares
        // or append new squares
        for (const [sk, className] of squares) {
            if (!sameSquares.has(sk)) {
                sMvdset = movedSquares.get(className);
                sMvd = sMvdset && sMvdset.pop();
                const translation = posToTranslate(key2pos(sk), asWhite);
                if (sMvd) {
                    sMvd.cgKey = sk;
                    translate(sMvd, translation);
                }
                else {
                    const squareNode = createEl('square', className);
                    squareNode.cgKey = sk;
                    translate(squareNode, translation);
                    boardEl.insertBefore(squareNode, boardEl.firstChild);
                }
            }
        }
        // walk over all pieces in current set, apply dom changes to moved pieces
        // or append new pieces
        for (const [k, p] of pieces) {
            anim = anims.get(k);
            if (!samePieces.has(k)) {
                pMvdset = movedPieces.get(pieceNameOf(p));
                pMvd = pMvdset && pMvdset.pop();
                // a same piece was moved
                if (pMvd) {
                    // apply dom changes
                    pMvd.cgKey = k;
                    if (pMvd.cgFading) {
                        pMvd.classList.remove('fading');
                        pMvd.cgFading = false;
                    }
                    const pos = key2pos(k);
                    if (s.addPieceZIndex)
                        pMvd.style.zIndex = posZIndex(pos, asWhite);
                    if (anim) {
                        pMvd.cgAnimating = true;
                        pMvd.classList.add('anim');
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pMvd, posToTranslate(pos, asWhite));
                }
                // no piece in moved obj: insert the new piece
                // assumes the new piece is not being dragged
                else {
                    const pieceName = pieceNameOf(p), pieceNode = createEl('piece', pieceName), pos = key2pos(k);
                    pieceNode.cgPiece = pieceName;
                    pieceNode.cgKey = k;
                    if (anim) {
                        pieceNode.cgAnimating = true;
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pieceNode, posToTranslate(pos, asWhite));
                    if (s.addPieceZIndex)
                        pieceNode.style.zIndex = posZIndex(pos, asWhite);
                    boardEl.appendChild(pieceNode);
                }
            }
        }
        // remove any element that remains in the moved sets
        for (const nodes of movedPieces.values())
            removeNodes(s, nodes);
        for (const nodes of movedSquares.values())
            removeNodes(s, nodes);
    }
    function updateBounds(s) {
        if (s.dom.relative)
            return;
        const asWhite = whitePov(s), posToTranslate = posToTranslateAbs(s.dom.bounds());
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
                translateAbs(el, posToTranslate(key2pos(el.cgKey), asWhite));
            }
            el = el.nextSibling;
        }
    }
    function isPieceNode(el) {
        return el.tagName === 'PIECE';
    }
    function isSquareNode(el) {
        return el.tagName === 'SQUARE';
    }
    function removeNodes(s, nodes) {
        for (const node of nodes)
            s.dom.elements.board.removeChild(node);
    }
    function posZIndex(pos, asWhite) {
        let z = 2 + pos[1] * 8 + (7 - pos[0]);
        if (asWhite)
            z = 67 - z;
        return z + '';
    }
    function pieceNameOf(piece) {
        return `${piece.color} ${piece.role}`;
    }
    function computeSquareClasses(s) {
        var _a;
        const squares = new Map();
        if (s.lastMove && s.highlight.lastMove)
            for (const k of s.lastMove) {
                addSquare(squares, k, 'last-move');
            }
        if (s.check && s.highlight.check)
            addSquare(squares, s.check, 'check');
        if (s.selected) {
            addSquare(squares, s.selected, 'selected');
            if (s.movable.showDests) {
                const dests = (_a = s.movable.dests) === null || _a === void 0 ? void 0 : _a.get(s.selected);
                if (dests)
                    for (const k of dests) {
                        addSquare(squares, k, 'move-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
                const pDests = s.premovable.dests;
                if (pDests)
                    for (const k of pDests) {
                        addSquare(squares, k, 'premove-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
            }
        }
        const premove = s.premovable.current;
        if (premove)
            for (const k of premove)
                addSquare(squares, k, 'current-premove');
        else if (s.predroppable.current)
            addSquare(squares, s.predroppable.current.key, 'current-premove');
        const o = s.exploding;
        if (o)
            for (const k of o.keys)
                addSquare(squares, k, 'exploding' + o.stage);
        return squares;
    }
    function addSquare(squares, key, klass) {
        const classes = squares.get(key);
        if (classes)
            squares.set(key, `${classes} ${klass}`);
        else
            squares.set(key, klass);
    }
    function appendValue(map, key, value) {
        const arr = map.get(key);
        if (arr)
            arr.push(value);
        else
            map.set(key, [value]);
    }

    function Chessground(element, config) {
        const maybeState = defaults();
        configure(maybeState, config || {});
        function redrawAll() {
            const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
            // compute bounds from existing board element if possible
            // this allows non-square boards from CSS to be handled (for 3D)
            const relative = maybeState.viewOnly && !maybeState.drawable.visible, elements = renderWrap(element, maybeState, relative), bounds = memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
                render(state);
                if (!skipSvg && elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            }, boundsUpdated = () => {
                bounds.clear();
                updateBounds(state);
                if (elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            };
            const state = maybeState;
            state.dom = {
                elements,
                bounds,
                redraw: debounceRedraw(redrawNow),
                redrawNow,
                unbind: prevUnbind,
                relative,
            };
            state.drawable.prevSvgHash = '';
            redrawNow(false);
            bindBoard(state, boundsUpdated);
            if (!prevUnbind)
                state.dom.unbind = bindDocument(state, boundsUpdated);
            state.events.insert && state.events.insert(elements);
            return state;
        }
        return start(redrawAll(), redrawAll);
    }
    function debounceRedraw(redrawNow) {
        let redrawing = false;
        return () => {
            if (redrawing)
                return;
            redrawing = true;
            requestAnimationFrame(() => {
                redrawNow();
                redrawing = false;
            });
        };
    }

    const changeColorHandle = () => {
        const dict = {
            blue: '#DEE3E6 #788a94',
            blue2: '#97b2c7 #546f82',
            blue3: '#d9e0e6 #315991',
            canvas: '#d7daeb #547388',
            wood: '#d8a45b #9b4d0f',
            wood2: '#a38b5d #6c5017',
            wood3: '#d0ceca #755839',
            wood4: '#caaf7d #7b5330',
            maple: '#e8ceab #bc7944',
            maple2: '#E2C89F #996633',
            leather: '#d1d1c9 #c28e16',
            green: '#FFFFDD #6d8753',
            brown: '#F0D9B5 #946f51',
            pink: '#E8E9B7 #ED7272',
            marble: '#93ab91 #4f644e',
            'blue-marble': '#EAE6DD #7C7F87',
            'green-plastic': '#f2f9bb #59935d',
            grey: '#b8b8b8 #7d7d7d',
            metal: '#c9c9c9 #727272',
            olive: '#b8b19f #6d6655',
            newspaper: '#fff #8d8d8d',
            purple: '#9f90b0 #7d4a8d',
            'purple-diag': '#E5DAF0 #957AB0',
            ic: '#ececec #c1c18e',
            horsey: '#F0D9B5 #946f51',
        };
        for (const theme of document.body.className.split(' ')) {
            if (theme in dict) {
                const style = document.documentElement.style, colors = dict[theme].split(' ');
                style.setProperty('--cg-coord-color-white', colors[0]);
                style.setProperty('--cg-coord-color-black', colors[1]);
                style.setProperty('--cg-coord-shadow', 'none');
            }
        }
    };

    function debounce(f, wait, immediate = false) {
        let timeout;
        let lastBounce = 0;
        return function (...args) {
            const self = this;
            if (timeout)
                clearTimeout(timeout);
            timeout = undefined;
            const elapsed = performance.now() - lastBounce;
            lastBounce = performance.now();
            if (immediate && elapsed > wait)
                f.apply(self, args);
            else
                timeout = setTimeout(() => {
                    timeout = undefined;
                    f.apply(self, args);
                }, wait);
        };
    }

    function resizeHandle(els, pref, ply, visible) {
        if (pref === 0 /* Never */)
            return;
        const el = document.createElement('cg-resize');
        els.container.appendChild(el);
        const startResize = (start) => {
            start.preventDefault();
            const mousemoveEvent = start.type === 'touchstart' ? 'touchmove' : 'mousemove', mouseupEvent = start.type === 'touchstart' ? 'touchend' : 'mouseup', startPos = eventPosition(start), initialZoom = parseInt(getComputedStyle(document.body).getPropertyValue('--zoom'));
            let zoom = initialZoom;
            const saveZoom = debounce(() => text(`/pref/zoom?v=${100 + zoom}`, { method: 'post' }), 700);
            const resize = (move) => {
                const pos = eventPosition(move), delta = pos[0] - startPos[0] + pos[1] - startPos[1];
                zoom = Math.round(Math.min(100, Math.max(0, initialZoom + delta / 10)));
                document.body.setAttribute('style', '--zoom:' + zoom);
                window.dispatchEvent(new Event('resize'));
                saveZoom();
            };
            document.body.classList.add('resizing');
            document.addEventListener(mousemoveEvent, resize);
            document.addEventListener(mouseupEvent, () => {
                document.removeEventListener(mousemoveEvent, resize);
                document.body.classList.remove('resizing');
            }, { once: true });
        };
        el.addEventListener('touchstart', startResize, { passive: false });
        el.addEventListener('mousedown', startResize, { passive: false });
        if (pref === 1 /* OnlyAtStart */) {
            const toggle = (ply) => el.classList.toggle('none', visible ? !visible(ply) : ply >= 2);
            toggle(ply);
            lichess.pubsub.on('ply', toggle);
        }
    }
    function eventPosition(e) {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return;
    }

    function makeConfig(ctrl) {
        const d = ctrl.data, pref = d.pref, opts = ctrl.makeCgOpts();
        const config = {
            turnColor: opts.turnColor,
            fen: opts.fen,
            check: opts.check,
            lastMove: opts.lastMove,
            orientation: ctrl.bottomColor(),
            coordinates: pref.coords !== 0 /* Hidden */ && !ctrl.embed,
            addPieceZIndex: pref.is3d,
            viewOnly: !!ctrl.embed,
            movable: {
                free: false,
                color: opts.movable.color,
                dests: opts.movable.dests,
                showDests: pref.destination,
                rookCastle: pref.rookCastle,
            },
            events: {
                move: ctrl.userMove,
                dropNewPiece: ctrl.userNewPiece,
                insert(elements) {
                    if (!ctrl.embed)
                        resizeHandle(elements, 2 /* Always */, ctrl.node.ply);
                    if (!ctrl.embed && ctrl.data.pref.coords == 1 /* Inside */)
                        changeColorHandle();
                },
            },
            premovable: {
                enabled: opts.premovable.enabled,
                showDests: pref.destination,
                events: {
                    set: ctrl.onPremoveSet,
                },
            },
            drawable: {
                enabled: !ctrl.embed,
                eraseOnClick: !ctrl.opts.study || !!ctrl.opts.practice,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            highlight: {
                lastMove: pref.highlight,
                check: pref.highlight,
            },
            animation: {
                duration: pref.animationDuration,
            },
            disableContextMenu: true,
        };
        ctrl.study && ctrl.study.mutateCgConfig(config);
        return config;
    }

    function makeSetting(opts) {
        return {
            choices: opts.choices,
            get: () => cast(opts.storage.get()) || opts.default,
            set(v) {
                opts.storage.set(cast(v));
                return v;
            },
        };
    }
    function renderSetting(setting, redraw) {
        const v = setting.get();
        return h('select', {
            hook: {
                insert(vnode) {
                    vnode.elm.addEventListener('change', e => {
                        setting.set(cast(e.target.value));
                        redraw();
                    });
                },
            },
        }, setting.choices.map(choice => {
            const [key, name] = choice;
            return h('option', {
                attrs: {
                    value: '' + key,
                    selected: key === v,
                },
            }, name);
        }));
    }
    function cast(v) {
        return v;
    }

    const nato = {
        a: 'alpha',
        b: 'bravo',
        c: 'charlie',
        d: 'delta',
        e: 'echo',
        f: 'foxtrot',
        g: 'golf',
        h: 'hotel',
    };
    const anna = {
        a: 'anna',
        b: 'bella',
        c: 'cesar',
        d: 'david',
        e: 'eva',
        f: 'felix',
        g: 'gustav',
        h: 'hector',
    };
    const roles = { P: 'pawn', R: 'rook', N: 'knight', B: 'bishop', Q: 'queen', K: 'king' };
    const letters = { pawn: 'p', rook: 'r', knight: 'n', bishop: 'b', queen: 'q', king: 'k' };
    const letterPiece = {
        p: 'p',
        r: 'r',
        n: 'n',
        b: 'b',
        q: 'q',
        k: 'k',
        P: 'p',
        R: 'r',
        N: 'n',
        B: 'b',
        Q: 'q',
        K: 'k',
    };
    const whiteUpperLetterPiece = {
        p: 'p',
        r: 'r',
        n: 'n',
        b: 'b',
        q: 'q',
        k: 'k',
        P: 'P',
        R: 'R',
        N: 'N',
        B: 'B',
        Q: 'Q',
        K: 'K',
    };
    const namePiece = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
        P: 'pawn',
        R: 'rook',
        N: 'knight',
        B: 'bishop',
        Q: 'queen',
        K: 'king',
    };
    const whiteUpperNamePiece = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
        P: 'Pawn',
        R: 'Rook',
        N: 'Knight',
        B: 'Bishop',
        Q: 'Queen',
        K: 'King',
    };
    const skipToFile = {
        '!': 'a',
        '@': 'b',
        '#': 'c',
        $: 'd',
        '%': 'e',
        '^': 'f',
        '&': 'g',
        '*': 'h',
    };
    function symbolToFile(char) {
        var _a;
        return (_a = skipToFile[char]) !== null && _a !== void 0 ? _a : '';
    }
    function boardSetting() {
        return makeSetting({
            choices: [
                ['plain', 'plain: layout with no semantic rows or columns'],
                ['table', 'table: layout using a table with rank and file columns and row headers'],
            ],
            default: 'plain',
            storage: lichess.storage.make('nvui.boardLayout'),
        });
    }
    function styleSetting() {
        return makeSetting({
            choices: [
                ['san', 'SAN: Nxf3'],
                ['uci', 'UCI: g1f3'],
                ['literate', 'Literate: knight takes f 3'],
                ['anna', 'Anna: knight takes felix 3'],
                ['nato', 'Nato: knight takes foxtrot 3'],
            ],
            default: 'anna',
            storage: lichess.storage.make('nvui.moveNotation'),
        });
    }
    function pieceSetting() {
        return makeSetting({
            choices: [
                ['letter', 'Letter: p, p'],
                ['white uppercase letter', 'White uppecase letter: P, p'],
                ['name', 'Name: pawn, pawn'],
                ['white uppercase name', 'White uppercase name: Pawn, pawn'],
            ],
            default: 'letter',
            storage: lichess.storage.make('nvui.pieceStyle'),
        });
    }
    function prefixSetting() {
        return makeSetting({
            choices: [
                ['letter', 'Letter: w/b'],
                ['name', 'Name: white/black'],
                ['none', 'None'],
            ],
            default: 'letter',
            storage: lichess.storage.make('nvui.prefixStyle'),
        });
    }
    function positionSetting() {
        return makeSetting({
            choices: [
                ['before', 'before: c2: wp'],
                ['after', 'after: wp: c2'],
                ['none', 'none'],
            ],
            default: 'before',
            storage: lichess.storage.make('nvui.positionStyle'),
        });
    }
    const renderPieceStyle = (piece, pieceStyle) => {
        switch (pieceStyle) {
            case 'letter':
                return letterPiece[piece];
            case 'white uppercase letter':
                return whiteUpperLetterPiece[piece];
            case 'name':
                return namePiece[piece];
            case 'white uppercase name':
                return whiteUpperNamePiece[piece];
        }
    };
    const renderPrefixStyle = (color, prefixStyle) => {
        switch (prefixStyle) {
            case 'letter':
                return color.charAt(0);
            case 'name':
                return color + ' ';
            case 'none':
                return '';
        }
    };
    function renderSan(san, uci, style) {
        if (!san)
            return '';
        let move;
        if (san.includes('O-O-O'))
            move = 'long castling';
        else if (san.includes('O-O'))
            move = 'short castling';
        else if (style === 'san')
            move = san.replace(/[\+#]/, '');
        else if (style === 'uci')
            move = uci || san;
        else {
            move = san
                .replace(/[\+#]/, '')
                .split('')
                .map(c => {
                if (c == 'x')
                    return 'takes';
                if (c == '+')
                    return 'check';
                if (c == '#')
                    return 'checkmate';
                if (c == '=')
                    return 'promotion';
                const code = c.charCodeAt(0);
                if (code > 48 && code < 58)
                    return c; // 1-8
                if (code > 96 && code < 105)
                    return renderFile(c, style); // a-g
                return roles[c] || c;
            })
                .join(' ');
        }
        if (san.includes('+'))
            move += ' check';
        if (san.includes('#'))
            move += ' checkmate';
        return move;
    }
    function renderPieces(pieces, style) {
        return h('div', ['white', 'black'].map(color => {
            const lists = [];
            ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].forEach(role => {
                const keys = [];
                for (const [key, piece] of pieces) {
                    if (piece.color === color && piece.role === role)
                        keys.push(key);
                }
                if (keys.length)
                    lists.push([`${role}${keys.length > 1 ? 's' : ''}`, ...keys]);
            });
            return h('div', [
                h('h3', `${color} pieces`),
                ...lists
                    .map((l) => `${l[0]}: ${l
                .slice(1)
                .map((k) => renderKey(k, style))
                .join(', ')}`)
                    .join(', '),
            ]);
        }));
    }
    function renderPieceKeys(pieces, p, style) {
        const name = `${p === p.toUpperCase() ? 'white' : 'black'} ${roles[p.toUpperCase()]}`;
        const res = [];
        for (const [k, piece] of pieces) {
            if (piece && `${piece.color} ${piece.role}` === name)
                res.push(k);
        }
        return `${name}: ${res.length ? res.map(k => renderKey(k, style)).join(', ') : 'none'}`;
    }
    function renderPiecesOn(pieces, rankOrFile, style) {
        const res = [];
        for (const k of allKeys) {
            if (k.includes(rankOrFile)) {
                const piece = pieces.get(k);
                if (piece)
                    res.push(`${renderKey(k, style)} ${piece.color} ${piece.role}`);
            }
        }
        return res.length ? res.join(', ') : 'blank';
    }
    function renderBoard(pieces, pov, pieceStyle, prefixStyle, positionStyle, boardStyle) {
        const doRankHeader = (rank) => {
            return h('th', { attrs: { scope: 'row' } }, rank);
        };
        const doFileHeaders = () => {
            const ths = files.map(file => h('th', { attrs: { scope: 'col' } }, file));
            if (pov === 'black')
                ths.reverse();
            return h('tr', [h('td'), ...ths, h('td')]);
        };
        const renderPositionStyle = (rank, file, orig) => {
            switch (positionStyle) {
                case 'before':
                    return file.toUpperCase() + rank + ' ' + orig;
                case 'after':
                    return orig + ' ' + file.toUpperCase() + rank;
                case 'none':
                    return orig;
            }
        };
        const doPieceButton = (rank, file, letter, color, text) => {
            return h('button', {
                attrs: { rank: rank, file: file, piece: letter.toLowerCase(), color: color },
            }, text);
        };
        const doPiece = (rank, file) => {
            const key = (file + rank);
            const piece = pieces.get(key);
            const pieceWrapper = boardStyle === 'table' ? 'td' : 'span';
            if (piece) {
                const role = letters[piece.role];
                const pieceText = renderPieceStyle(piece.color === 'white' ? role.toUpperCase() : role, pieceStyle);
                const prefix = renderPrefixStyle(piece.color, prefixStyle);
                const text = renderPositionStyle(rank, file, prefix + pieceText);
                return h(pieceWrapper, doPieceButton(rank, file, role, piece.color, text));
            }
            else {
                const letter = (key.charCodeAt(0) + key.charCodeAt(1)) % 2 ? '-' : '+';
                const text = renderPositionStyle(rank, file, letter);
                return h(pieceWrapper, doPieceButton(rank, file, letter, 'none', text));
            }
        };
        const doRank = (pov, rank) => {
            const rankElements = [];
            if (boardStyle === 'table')
                rankElements.push(doRankHeader(rank));
            rankElements.push(...files.map(file => doPiece(rank, file)));
            if (boardStyle === 'table')
                rankElements.push(doRankHeader(rank));
            if (pov === 'black')
                rankElements.reverse();
            return h(boardStyle === 'table' ? 'tr' : 'div', rankElements);
        };
        const ranks = [];
        if (boardStyle === 'table')
            ranks.push(doFileHeaders());
        ranks.push(...invRanks.map(rank => doRank(pov, rank)));
        if (boardStyle === 'table')
            ranks.push(doFileHeaders());
        if (pov === 'black')
            ranks.reverse();
        return h(boardStyle === 'table' ? 'table.board-wrapper' : 'div.board-wrapper', ranks);
    }
    function renderFile(f, style) {
        return style === 'nato' ? nato[f] : style === 'anna' ? anna[f] : f;
    }
    function renderKey(key, style) {
        return `${renderFile(key[0], style)} ${key[1]}`;
    }
    /* Listen to interactions on the chessboard */
    function positionJumpHandler() {
        return (ev) => {
            var _a, _b;
            const $btn = $(ev.target);
            const $file = (_a = $btn.attr('file')) !== null && _a !== void 0 ? _a : '';
            const $rank = (_b = $btn.attr('rank')) !== null && _b !== void 0 ? _b : '';
            let $newRank = '';
            let $newFile = '';
            if (ev.key.match(/^[1-8]$/)) {
                $newRank = ev.key;
                $newFile = $file;
            }
            else if (ev.key.match(/^[!@#$%^&*]$/)) {
                $newRank = $rank;
                $newFile = symbolToFile(ev.key);
                // if not a valid key for jumping
            }
            else {
                return true;
            }
            const newBtn = document.querySelector('.board-wrapper button[rank="' + $newRank + '"][file="' + $newFile + '"]');
            if (newBtn) {
                newBtn.focus();
                return false;
            }
            return true;
        };
    }
    function pieceJumpingHandler(wrapSound, errorSound) {
        return (ev) => {
            if (!ev.key.match(/^[kqrbnp]$/i))
                return true;
            const $currBtn = $(ev.target);
            // TODO: decouple from promotion attribute setting in selectionHandler
            if ($currBtn.attr('promotion') === 'true') {
                const $moveBox = $('input.move');
                const $boardLive = $('.boardstatus');
                const $promotionPiece = ev.key.toLowerCase();
                const $form = $moveBox.parent().parent();
                if (!$promotionPiece.match(/^[qnrb]$/)) {
                    $boardLive.text('Invalid promotion piece. q for queen, n for knight, r for rook, b for bisho');
                    return false;
                }
                $moveBox.val($moveBox.val() + $promotionPiece);
                $currBtn.removeAttr('promotion');
                const $sendForm = new Event('submit', {
                    cancelable: true,
                    bubbles: true,
                });
                $form.trigger($sendForm);
                return false;
            }
            const $myBtnAttrs = '.board-wrapper [rank="' + $currBtn.attr('rank') + '"][file="' + $currBtn.attr('file') + '"]';
            const $allPieces = $('.board-wrapper [piece="' + ev.key.toLowerCase() + '"], ' + $myBtnAttrs);
            const $myPieceIndex = $allPieces.index($myBtnAttrs);
            const $next = ev.key.toLowerCase() === ev.key;
            const $prevNextPieces = $next ? $allPieces.slice($myPieceIndex + 1) : $allPieces.slice(0, $myPieceIndex);
            const $piece = $next ? $prevNextPieces.get(0) : $prevNextPieces.get($prevNextPieces.length - 1);
            if ($piece) {
                $piece.focus();
                // if detected any matching piece; one is the pice being clicked on,
            }
            else if ($allPieces.length >= 2) {
                const $wrapPiece = $next ? $allPieces.get(0) : $allPieces.get($allPieces.length - 1);
                $wrapPiece === null || $wrapPiece === void 0 ? void 0 : $wrapPiece.focus();
                wrapSound();
            }
            else {
                errorSound();
            }
            return false;
        };
    }
    function arrowKeyHandler(pov, borderSound) {
        return (ev) => {
            var _a;
            const $currBtn = $(ev.target);
            const $isWhite = pov === 'white';
            let $file = (_a = $currBtn.attr('file')) !== null && _a !== void 0 ? _a : ' ';
            let $rank = Number($currBtn.attr('rank'));
            if (ev.key === 'ArrowUp') {
                $rank = $isWhite ? ($rank += 1) : ($rank -= 1);
            }
            else if (ev.key === 'ArrowDown') {
                $rank = $isWhite ? ($rank -= 1) : ($rank += 1);
            }
            else if (ev.key === 'ArrowLeft') {
                $file = String.fromCharCode($isWhite ? $file.charCodeAt(0) - 1 : $file.charCodeAt(0) + 1);
            }
            else if (ev.key === 'ArrowRight') {
                $file = String.fromCharCode($isWhite ? $file.charCodeAt(0) + 1 : $file.charCodeAt(0) - 1);
            }
            else {
                return true;
            }
            const $newSq = document.querySelector('.board-wrapper [file="' + $file + '"][rank="' + $rank + '"]');
            if ($newSq) {
                $newSq.focus();
            }
            else {
                borderSound();
            }
            ev.preventDefault();
            return false;
        };
    }
    function selectionHandler(opponentColor, selectSound) {
        return (ev) => {
            var _a, _b;
            // this depends on the current document structure. This may not be advisable in case the structure wil change.
            const $evBtn = $(ev.target);
            const $rank = $evBtn.attr('rank');
            const $pos = ((_a = $evBtn.attr('file')) !== null && _a !== void 0 ? _a : '') + $rank;
            const $boardLive = $('.boardstatus');
            const $promotionRank = opponentColor === 'black' ? '8' : '1';
            const $moveBox = $(document.querySelector('input.move'));
            if (!$moveBox)
                return false;
            // if no move in box yet
            if ($moveBox.val() === '') {
                // if user selects anothers' piece first
                if ($evBtn.attr('color') === opponentColor)
                    return false;
                // as long as the user is selecting a piece and not a blank tile
                if ($evBtn.text().match(/^[^\-+]+/g)) {
                    $moveBox.val($pos);
                    selectSound();
                }
            }
            else {
                // if user selects their own piece second
                if ($evBtn.attr('color') === (opponentColor === 'black' ? 'white' : 'black'))
                    return false;
                const $first = $moveBox.val();
                const $firstPiece = $('.board-wrapper [file="' + $first[0] + '"][rank="' + $first[1] + '"]');
                $moveBox.val($moveBox.val() + $pos);
                // this is coupled to pieceJumpingHandler() noticing that the attribute is set and acting differently. TODO: make cleaner
                // if pawn promotion
                if ($rank === $promotionRank && ((_b = $firstPiece.attr('piece')) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'p') {
                    $evBtn.attr('promotion', 'true');
                    $boardLive.text('Promote to? q for queen, n for knight, r for rook, b for bishop');
                    return false;
                }
                // this section depends on the form being the granparent of the input.move box.
                const $form = $moveBox.parent().parent();
                const $event = new Event('submit', {
                    cancelable: true,
                    bubbles: true,
                });
                $form.trigger($event);
            }
            return false;
        };
    }
    function boardCommandsHandler() {
        return (ev) => {
            var _a, _b;
            const $currBtn = $(ev.target);
            const $boardLive = $('.boardstatus');
            const $position = ((_a = $currBtn.attr('file')) !== null && _a !== void 0 ? _a : '') + ((_b = $currBtn.attr('rank')) !== null && _b !== void 0 ? _b : '');
            if (ev.key === 'o') {
                $boardLive.text();
                $boardLive.text($position);
                return false;
            }
            else if (ev.key === 'l') {
                const $lastMove = $('p.lastMove').text();
                $boardLive.text();
                $boardLive.text($lastMove);
                return false;
            }
            else if (ev.key === 't') {
                $boardLive.text();
                $boardLive.text($('.nvui .botc').text() + ', ' + $('.nvui .topc').text());
                return false;
            }
            return true;
        };
    }

    class Notify {
        constructor(redraw, timeout = 3000) {
            this.redraw = redraw;
            this.timeout = timeout;
            this.set = (msg) => {
                // make sure it's different from previous, so it gets read again
                if (this.notification && this.notification.text == msg)
                    msg += ' ';
                this.notification = { text: msg, date: new Date() };
                lichess.requestIdleCallback(this.redraw, 500);
            };
            this.currentText = () => this.notification && this.notification.date.getTime() > Date.now() - this.timeout ? this.notification.text : '';
            this.render = () => h('div.notify', {
                attrs: {
                    'aria-live': 'assertive',
                    'aria-atomic': 'true',
                },
            }, this.currentText());
        }
    }

    const commands = {
        piece: {
            help: 'p: Read locations of a piece type. Example: p N, p k.',
            apply(c, pieces, style) {
                return tryC(c, /^p ([p|n|b|r|q|k])$/i, p => renderPieceKeys(pieces, p, style));
            },
        },
        scan: {
            help: 's: Read pieces on a rank or file. Example: s a, s 1.',
            apply(c, pieces, style) {
                return tryC(c, /^s ([a-h1-8])$/i, p => renderPiecesOn(pieces, p, style));
            },
        },
    };
    function tryC(c, regex, f) {
        if (!c.match(regex))
            return undefined;
        return f(c.replace(regex, '$1'));
    }

    lichess.storage;

    // Ensures calls to the wrapped function are spaced by the given delay.
    // Any extra calls are dropped, except the last one.
    function throttle(delay, callback) {
        let timeout;
        let lastExec = 0;
        return function (...args) {
            const self = this;
            const elapsed = performance.now() - lastExec;
            function exec() {
                timeout = undefined;
                lastExec = performance.now();
                callback.apply(self, args);
            }
            if (timeout)
                clearTimeout(timeout);
            if (elapsed > delay)
                exec();
            else
                timeout = setTimeout(exec, delay - elapsed);
        };
    }

    [...Array(8).keys()].map(i => h(i === 3 ? 'tick.zero' : 'tick', { attrs: { style: `height: ${(i + 1) * 12.5}%` } }));

    // stop when another tab starts. Listen only once here,
    // as the ctrl can be instantiated several times.
    // gotta do the click on the toggle to have it visually change.
    lichess.storage.make('ceval.disable').listen(() => {
        const toggle = document.getElementById('analyse-toggle-ceval');
        if (toggle === null || toggle === void 0 ? void 0 : toggle.checked)
            toggle.click();
    });

    const plyToTurn = (ply) => Math.floor((ply - 1) / 2) + 1;

    function listenTo(el, eventName, f, redraw) {
        el.addEventListener(eventName, e => {
            const res = f(e);
            if (res === false)
                e.preventDefault();
            if (redraw)
                redraw();
            return res;
        });
    }
    function bind(eventName, f, redraw) {
        return onInsert(el => listenTo(el, eventName, f, redraw));
    }
    function onInsert(f) {
        return {
            insert: vnode => f(vnode.elm),
        };
    }

    const throttled = (sound) => throttle(100, () => lichess.sound.play(sound));
    const selectSound = throttled('select');
    const wrapSound = throttled('wrapAround');
    const borderSound = throttled('outOfBound');
    const errorSound = throttled('error');
    lichess.AnalyseNVUI = function (redraw) {
        const notify = new Notify(redraw), moveStyle = styleSetting(), pieceStyle = pieceSetting(), prefixStyle = prefixSetting(), positionStyle = positionSetting(), boardStyle = boardSetting(), analysisInProgress = prop(false);
        lichess.pubsub.on('analysis.server.progress', (data) => {
            if (data.analysis && !data.analysis.partial)
                notify.set('Server-side analysis complete');
        });
        return {
            render(ctrl) {
                const d = ctrl.data, style = moveStyle.get();
                if (!ctrl.chessground)
                    ctrl.chessground = Chessground(document.createElement('div'), Object.assign(Object.assign({}, makeConfig(ctrl)), { animation: { enabled: false }, drawable: { enabled: false }, coordinates: false }));
                return h('main.analyse', [
                    h('div.nvui', [
                        h('h1', 'Textual representation'),
                        h('h2', 'Game info'),
                        ...['white', 'black'].map((color) => h('p', [color + ' player: ', renderPlayer(ctrl, playerByColor(d, color))])),
                        h('p', `${d.game.rated ? 'Rated' : 'Casual'} ${d.game.perf}`),
                        d.clock ? h('p', `Clock: ${d.clock.initial / 60} + ${d.clock.increment}`) : null,
                        h('h2', 'Moves'),
                        h('p.moves', {
                            attrs: {
                                role: 'log',
                                'aria-live': 'off',
                            },
                        }, renderMainline(ctrl.mainline, ctrl.path, style)),
                        h('h2', 'Pieces'),
                        h('div.pieces', renderPieces(ctrl.chessground.state.pieces, style)),
                        h('h2', 'Current position'),
                        h('p.position', {
                            attrs: {
                                'aria-live': 'assertive',
                                'aria-atomic': 'true',
                            },
                        }, renderCurrentNode(ctrl.node, style)),
                        h('h2', 'Move form'),
                        h('form', {
                            hook: {
                                insert(vnode) {
                                    const $form = $(vnode.elm), $input = $form.find('.move').val('');
                                    $input[0].focus();
                                    $form.on('submit', onSubmit(ctrl, notify.set, moveStyle.get, $input));
                                },
                            },
                        }, [
                            h('label', [
                                'Command input',
                                h('input.move.mousetrap', {
                                    attrs: {
                                        name: 'move',
                                        type: 'text',
                                        autocomplete: 'off',
                                        autofocus: true,
                                    },
                                }),
                            ]),
                        ]),
                        notify.render(),
                        // h('h2', 'Actions'),
                        // h('div.actions', tableInner(ctrl)),
                        h('h2', 'Computer analysis'),
                        ...(renderAcpl(ctrl, style) || [requestAnalysisButton(ctrl, analysisInProgress, notify.set)]),
                        h('h2', 'Board'),
                        h('div.board', {
                            hook: {
                                insert: el => {
                                    const $board = $(el.elm);
                                    $board.on('keypress', boardCommandsHandler());
                                    const $buttons = $board.find('button');
                                    $buttons.on('click', selectionHandler(ctrl.data.opponent.color, selectSound));
                                    $buttons.on('keydown', arrowKeyHandler(ctrl.data.player.color, borderSound));
                                    $buttons.on('keypress', positionJumpHandler());
                                    $buttons.on('keypress', pieceJumpingHandler(wrapSound, errorSound));
                                },
                            },
                        }, renderBoard(ctrl.chessground.state.pieces, ctrl.data.player.color, pieceStyle.get(), prefixStyle.get(), positionStyle.get(), boardStyle.get())),
                        h('div.content', {
                            hook: {
                                insert: vnode => {
                                    const root = $(vnode.elm);
                                    root.append($('.blind-content').removeClass('none'));
                                    root.find('.copy-pgn').on('click', () => {
                                        root.find('.game-pgn').attr('type', 'text')[0].select();
                                        document.execCommand('copy');
                                        root.find('.game-pgn').attr('type', 'hidden');
                                        notify.set('PGN copied into clipboard.');
                                    });
                                },
                            },
                        }),
                        h('h2', 'Settings'),
                        h('label', ['Move notation', renderSetting(moveStyle, ctrl.redraw)]),
                        h('h3', 'Board Settings'),
                        h('label', ['Piece style', renderSetting(pieceStyle, ctrl.redraw)]),
                        h('label', ['Piece prefix style', renderSetting(prefixStyle, ctrl.redraw)]),
                        h('label', ['Show position', renderSetting(positionStyle, ctrl.redraw)]),
                        h('label', ['Board layout', renderSetting(boardStyle, ctrl.redraw)]),
                        h('h2', 'Keyboard shortcuts'),
                        h('p', ['Use arrow keys to navigate in the game.']),
                        h('h2', 'Board Mode commands'),
                        h('p', [
                            'Use these commands when focused on the board itself.',
                            h('br'),
                            'o: announce current position.',
                            h('br'),
                            "c: announce last move's captured piece.",
                            h('br'),
                            'l: display last move.',
                            h('br'),
                            't: display clocks.',
                            h('br'),
                            'arrow keys: move left, right, up or down.',
                            h('br'),
                            'kqrbnp/KQRBNP: move forward/backward to a piece.',
                            h('br'),
                            '1-8: move to rank 1-8.',
                            h('br'),
                            'Shift+1-8: move to file a-h.',
                            h('br'),
                            '',
                            h('br'),
                        ]),
                        h('h2', 'Commands'),
                        h('p', [
                            'Type these commands in the command input.',
                            h('br'),
                            commands.piece.help,
                            h('br'),
                            commands.scan.help,
                            h('br'),
                        ]),
                    ]),
                ]);
            },
        };
    };
    function onSubmit(ctrl, notify, style, $input) {
        return function () {
            let input = $input.val().trim();
            if (isShortCommand(input))
                input = '/' + input;
            if (input[0] === '/')
                onCommand(ctrl, notify, input.slice(1), style());
            else
                notify('Invalid command');
            $input.val('');
            return false;
        };
    }
    const shortCommands = ['p', 'scan'];
    function isShortCommand(input) {
        return shortCommands.includes(input.split(' ')[0]);
    }
    function onCommand(ctrl, notify, c, style) {
        const pieces = ctrl.chessground.state.pieces;
        notify(commands.piece.apply(c, pieces, style) || commands.scan.apply(c, pieces, style) || `Invalid command: ${c}`);
    }
    const analysisGlyphs = ['?!', '?', '??'];
    function renderAcpl(ctrl, style) {
        const anal = ctrl.data.analysis;
        if (!anal)
            return undefined;
        const analysisNodes = ctrl.mainline.filter(n => (n.glyphs || []).find(g => analysisGlyphs.includes(g.symbol)));
        const res = [];
        ['white', 'black'].forEach((color) => {
            const acpl = anal[color].acpl;
            res.push(h('h3', `${color} player: ${acpl} ACPL`));
            res.push(h('select', {
                hook: bind('change', e => {
                    ctrl.jumpToMain(parseInt(e.target.value));
                    ctrl.redraw();
                }),
            }, analysisNodes
                .filter(n => (n.ply % 2 === 1) === (color === 'white'))
                .map(node => h('option', {
                attrs: {
                    value: node.ply,
                    selected: node.ply === ctrl.node.ply,
                },
            }, [plyToTurn(node.ply), renderSan(node.san, node.uci, style), renderComments(node, style)].join(' ')))));
        });
        return res;
    }
    function requestAnalysisButton(ctrl, inProgress, notify) {
        if (inProgress())
            return h('p', 'Server-side analysis in progress');
        if (ctrl.ongoing || ctrl.synthetic)
            return undefined;
        return h('button', {
            hook: bind('click', _ => text(`/${ctrl.data.game.id}/request-analysis`, {
                method: 'post',
            })
                .then(() => {
                inProgress(true);
                notify('Server-side analysis in progress');
            }, _ => notify('Cannot run server-side analysis'))),
        }, 'Request a computer analysis');
    }
    function renderMainline(nodes, currentPath, style) {
        const res = [];
        let path = '';
        nodes.forEach(node => {
            if (!node.san || !node.uci)
                return;
            path += node.id;
            const content = [
                node.ply & 1 ? plyToTurn(node.ply) + ' ' : null,
                renderSan(node.san, node.uci, style),
            ];
            res.push(h('move', {
                attrs: { p: path },
                class: { active: path === currentPath },
            }, content));
            res.push(renderComments(node, style));
            res.push(', ');
            if (node.ply % 2 === 0)
                res.push(h('br'));
        });
        return res;
    }
    function renderCurrentNode(node, style) {
        if (!node.san || !node.uci)
            return 'Initial position';
        return [plyToTurn(node.ply), renderSan(node.san, node.uci, style), renderComments(node, style)].join(' ');
    }
    function renderComments(node, style) {
        if (!node.comments)
            return '';
        return (node.comments || []).map(c => renderComment(c, style)).join('. ');
    }
    function renderComment(comment, style) {
        return comment.by === 'lichess'
            ? comment.text.replace(/Best move was (.+)\./, (_, san) => 'Best move was ' + renderSan(san, undefined, style))
            : comment.text;
    }
    function renderPlayer(ctrl, player) {
        return player.ai ? ctrl.trans('aiNameLevelAiLevel', 'Stockfish', player.ai) : userHtml(ctrl, player);
    }
    function userHtml(ctrl, player) {
        const d = ctrl.data, user = player.user, perf = user ? user.perfs[d.game.perf] : null, rating = player.rating ? player.rating : perf && perf.rating, rd = player.ratingDiff, ratingDiff = rd ? (rd > 0 ? '+' + rd : rd < 0 ? '−' + -rd : '') : '';
        return user
            ? h('span', [
                h('a', {
                    attrs: { href: '/@/' + user.username },
                }, user.title ? `${user.title} ${user.username}` : user.username),
                rating ? ` ${rating}` : ``,
                ' ' + ratingDiff,
            ])
            : 'Anonymous';
    }
    function playerByColor(d, color) {
        return color === d.player.color ? d.player : d.opponent;
    }

    exports.throttled = throttled;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
