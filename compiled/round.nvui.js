(function () {
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

    function fixCrazySan(san) {
        return san[0] === 'P' ? san.slice(1) : san;
    }
    function decomposeUci(uci) {
        return [uci.slice(0, 2), uci.slice(2, 4), uci.slice(4, 5)];
    }
    function square(name) {
        return name.charCodeAt(0) - 97 + (name.charCodeAt(1) - 49) * 8;
    }
    function squareDist(a, b) {
        const x1 = a & 7, x2 = b & 7;
        const y1 = a >> 3, y2 = b >> 3;
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
    function isBlack(p) {
        return p === p.toLowerCase();
    }
    function readFen(fen) {
        const parts = fen.split(' '), board = {
            pieces: {},
            turn: parts[1] === 'w',
        };
        parts[0]
            .split('/')
            .slice(0, 8)
            .forEach((row, y) => {
            let x = 0;
            row.split('').forEach(v => {
                if (v == '~')
                    return;
                const nb = parseInt(v, 10);
                if (nb)
                    x += nb;
                else {
                    board.pieces[(7 - y) * 8 + x] = v;
                    x++;
                }
            });
        });
        return board;
    }
    function kingMovesTo(s) {
        return [s - 1, s - 9, s - 8, s - 7, s + 1, s + 9, s + 8, s + 7].filter(function (o) {
            return o >= 0 && o < 64 && squareDist(s, o) === 1;
        });
    }
    function knightMovesTo(s) {
        return [s + 17, s + 15, s + 10, s + 6, s - 6, s - 10, s - 15, s - 17].filter(function (o) {
            return o >= 0 && o < 64 && squareDist(s, o) <= 2;
        });
    }
    const ROOK_DELTAS = [8, 1, -8, -1];
    const BISHOP_DELTAS = [9, -9, 7, -7];
    const QUEEN_DELTAS = ROOK_DELTAS.concat(BISHOP_DELTAS);
    function slidingMovesTo(s, deltas, board) {
        const result = [];
        deltas.forEach(function (delta) {
            for (let square = s + delta; square >= 0 && square < 64 && squareDist(square, square - delta) === 1; square += delta) {
                result.push(square);
                if (board.pieces[square])
                    break;
            }
        });
        return result;
    }
    function sanOf(board, uci) {
        if (uci.includes('@'))
            return fixCrazySan(uci);
        const move = decomposeUci(uci);
        const from = square(move[0]);
        const to = square(move[1]);
        const p = board.pieces[from];
        const d = board.pieces[to];
        const pt = board.pieces[from].toLowerCase();
        // pawn moves
        if (pt === 'p') {
            let san;
            if (uci[0] === uci[2])
                san = move[1];
            else
                san = uci[0] + 'x' + move[1];
            if (move[2])
                san += '=' + move[2].toUpperCase();
            return san;
        }
        // castling
        if (pt == 'k' && ((d && isBlack(p) === isBlack(d)) || squareDist(from, to) > 1)) {
            if (to < from)
                return 'O-O-O';
            else
                return 'O-O';
        }
        let san = pt.toUpperCase();
        // disambiguate normal moves
        let candidates = [];
        if (pt == 'k')
            candidates = kingMovesTo(to);
        else if (pt == 'n')
            candidates = knightMovesTo(to);
        else if (pt == 'r')
            candidates = slidingMovesTo(to, ROOK_DELTAS, board);
        else if (pt == 'b')
            candidates = slidingMovesTo(to, BISHOP_DELTAS, board);
        else if (pt == 'q')
            candidates = slidingMovesTo(to, QUEEN_DELTAS, board);
        let rank = false, file = false;
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i] === from || board.pieces[candidates[i]] !== p)
                continue;
            if (from >> 3 === candidates[i] >> 3)
                file = true;
            if ((from & 7) === (candidates[i] & 7))
                rank = true;
            else
                file = true;
        }
        if (file)
            san += uci[0];
        if (rank)
            san += uci[1];
        // target
        if (d)
            san += 'x';
        san += move[1];
        return san;
    }
    function sanWriter(fen, ucis) {
        const board = readFen(fen);
        const sans = {};
        ucis.forEach(function (uci) {
            const san = sanOf(board, uci);
            sans[san] = uci;
            if (san.includes('x'))
                sans[san.replace('x', '')] = uci;
        });
        return sans;
    }

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
    const opposite$1 = (c) => (c === 'white' ? 'black' : 'white');
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

    const justIcon = (icon) => ({
        attrs: { 'data-icon': icon },
    });
    const uci2move = (uci) => {
        if (!uci)
            return undefined;
        if (uci[1] === '@')
            return [uci.slice(2, 4)];
        return [uci.slice(0, 2), uci.slice(2, 4)];
    };
    const onInsert = (f) => ({
        insert(vnode) {
            f(vnode.elm);
        },
    });
    const bind = (eventName, f, redraw, passive = true) => onInsert(el => {
        el.addEventListener(eventName, e => {
            f(e);
            redraw && redraw();
        }, { passive });
    });
    function parsePossibleMoves(dests) {
        const dec = new Map();
        if (!dests)
            return dec;
        if (typeof dests == 'string')
            for (const ds of dests.split(' ')) {
                dec.set(ds.slice(0, 2), ds.slice(2).match(/.{2}/g));
            }
        else
            for (const k in dests)
                dec.set(k, dests[k].match(/.{2}/g));
        return dec;
    }
    const spinner = () => h('div.spinner', {
        'aria-label': 'loading',
    }, [
        h('svg', { attrs: { viewBox: '0 0 40 40' } }, [
            h('circle', {
                attrs: { cx: 20, cy: 20, r: 18, fill: 'none' },
            }),
        ]),
    ]);

    // https://github.com/ornicar/scalachess/blob/master/src/main/scala/Status.scala
    const ids = {
        created: 10,
        started: 20,
        aborted: 25,
        mate: 30,
        resign: 31,
        stalemate: 32,
        timeout: 33,
        draw: 34,
        outoftime: 35,
        cheat: 36,
        noStart: 37,
        variantEnd: 60,
    };
    function finished(data) {
        return data.game.status.id >= ids.mate;
    }
    function aborted(data) {
        return data.game.status.id === ids.aborted;
    }

    const playable = (data) => data.game.status.id < ids.aborted && !imported(data);
    const isPlayerPlaying = (data) => playable(data) && !data.player.spectator;
    const mandatory = (data) => !!data.tournament || !!data.simul || !!data.swiss;
    const playedTurns = (data) => data.game.turns - (data.game.startedAtTurn || 0);
    const bothPlayersHavePlayed = (data) => playedTurns(data) > 1;
    const abortable = (data) => playable(data) && !bothPlayersHavePlayed(data) && !mandatory(data);
    const takebackable = (data) => playable(data) &&
        data.takebackable &&
        bothPlayersHavePlayed(data) &&
        !data.player.proposingTakeback &&
        !data.opponent.proposingTakeback;
    const resignable = (data) => playable(data) && !abortable(data);
    // can the current player go berserk?
    const berserkableBy = (data) => !!data.tournament && data.tournament.berserkable && isPlayerPlaying(data) && !bothPlayersHavePlayed(data);
    const moretimeable = (data) => isPlayerPlaying(data) &&
        data.moretimeable &&
        (!!data.clock ||
            (!!data.correspondence && data.correspondence[data.opponent.color] < data.correspondence.increment - 3600));
    const imported = (data) => data.game.source === 'import';
    const replayable = (data) => imported(data) || finished(data) || (aborted(data) && bothPlayersHavePlayed(data));
    const userAnalysable = (data) => finished(data) || (playable(data) && (!data.clock || !isPlayerPlaying(data)));

    function game(data, color, embed) {
        const id = data.game ? data.game.id : data;
        return (embed ? '/embed/' : '/') + id + (color ? '/' + color : '');
    }

    function analysisBoardOrientation(data) {
        return data.game.variant.key === 'racingKings' ? 'white' : data.player.color;
    }
    function poolUrl(clock, blocking) {
        return '/#pool/' + clock.initial / 60 + '+' + clock.increment + (blocking ? '/' + blocking.id : '');
    }
    function analysisButton$1(ctrl) {
        const d = ctrl.data, url = game(d, analysisBoardOrientation(d)) + '#' + ctrl.ply;
        return replayable(d)
            ? h('a.fbt', {
                attrs: { href: url },
                hook: bind('click', _ => {
                    // force page load in case the URL is the same
                    if (location.pathname === url.split('#')[0])
                        location.reload();
                }),
            }, ctrl.noarg('analysis'))
            : null;
    }
    function rematchButtons(ctrl) {
        const d = ctrl.data, me = !!d.player.offeringRematch, them = !!d.opponent.offeringRematch, noarg = ctrl.noarg;
        return [
            them
                ? h('button.rematch-decline', {
                    attrs: {
                        'data-icon': 'L',
                        title: noarg('decline'),
                    },
                    hook: bind('click', () => ctrl.socket.send('rematch-no')),
                }, ctrl.nvui ? noarg('decline') : '')
                : null,
            h('button.fbt.rematch.white', {
                class: {
                    me,
                    glowing: them,
                    disabled: !me && !(d.opponent.onGame || (!d.clock && d.player.user && d.opponent.user)),
                },
                attrs: {
                    title: them ? noarg('yourOpponentWantsToPlayANewGameWithYou') : me ? noarg('rematchOfferSent') : '',
                },
                hook: bind('click', e => {
                    const d = ctrl.data;
                    if (d.game.rematch)
                        location.href = game(d.game.rematch, d.opponent.color);
                    else if (d.player.offeringRematch) {
                        d.player.offeringRematch = false;
                        ctrl.socket.send('rematch-no');
                    }
                    else if (d.opponent.onGame) {
                        d.player.offeringRematch = true;
                        ctrl.socket.send('rematch-yes');
                    }
                    else if (!e.currentTarget.classList.contains('disabled'))
                        ctrl.challengeRematch();
                }, ctrl.redraw),
            }, [me ? spinner() : h('span', noarg('rematch'))]),
        ];
    }
    function standard(ctrl, condition, icon, hint, socketMsg, onclick) {
        // disabled if condition callback is provided and is falsy
        const enabled = () => !condition || condition(ctrl.data);
        return h('button.fbt.' + socketMsg, {
            attrs: {
                disabled: !enabled(),
                title: ctrl.noarg(hint),
            },
            hook: bind('click', _ => {
                if (enabled())
                    onclick ? onclick() : ctrl.socket.sendLoading(socketMsg);
            }),
        }, [h('span', hint == 'offerDraw' ? ['½'] : ctrl.nvui ? [ctrl.noarg(hint)] : justIcon(icon))]);
    }
    function opponentGone(ctrl) {
        const gone = ctrl.opponentGone();
        return gone === true
            ? h('div.suggestion', [
                h('p', { hook: onSuggestionHook }, ctrl.noarg('opponentLeftChoices')),
                h('button.button', {
                    hook: bind('click', () => ctrl.socket.sendLoading('resign-force')),
                }, ctrl.noarg('forceResignation')),
                h('button.button', {
                    hook: bind('click', () => ctrl.socket.sendLoading('draw-force')),
                }, ctrl.noarg('forceDraw')),
            ])
            : gone
                ? h('div.suggestion', [h('p', ctrl.trans.vdomPlural('opponentLeftCounter', gone, h('strong', '' + gone)))])
                : null;
    }
    const fbtCancel = (ctrl, f) => h('button.fbt.no', {
        attrs: { title: ctrl.noarg('cancel'), 'data-icon': 'L' },
        hook: bind('click', () => f(false)),
    });
    const resignConfirm = (ctrl) => h('div.act-confirm', [
        h('button.fbt.yes', {
            attrs: { title: ctrl.noarg('resign'), 'data-icon': 'b' },
            hook: bind('click', () => ctrl.resign(true)),
        }),
        fbtCancel(ctrl, ctrl.resign),
    ]);
    const drawConfirm = (ctrl) => h('div.act-confirm', [
        h('button.fbt.yes.draw-yes', {
            attrs: { title: ctrl.noarg('offerDraw') },
            hook: bind('click', () => ctrl.offerDraw(true)),
        }, h('span', '½')),
        fbtCancel(ctrl, ctrl.offerDraw),
    ]);
    function threefoldClaimDraw(ctrl) {
        return ctrl.data.game.threefold
            ? h('div.suggestion', [
                h('p', {
                    hook: onSuggestionHook,
                }, ctrl.noarg('threefoldRepetition')),
                h('button.button', {
                    hook: bind('click', () => ctrl.socket.sendLoading('draw-claim')),
                }, ctrl.noarg('claimADraw')),
            ])
            : null;
    }
    function cancelDrawOffer(ctrl) {
        return ctrl.data.player.offeringDraw ? h('div.pending', [h('p', ctrl.noarg('drawOfferSent'))]) : null;
    }
    function answerOpponentDrawOffer(ctrl) {
        return ctrl.data.opponent.offeringDraw
            ? h('div.negotiation.draw', [
                declineButton(ctrl, () => ctrl.socket.sendLoading('draw-no')),
                h('p', ctrl.noarg('yourOpponentOffersADraw')),
                acceptButton(ctrl, 'draw-yes', () => ctrl.socket.sendLoading('draw-yes')),
            ])
            : null;
    }
    function cancelTakebackProposition(ctrl) {
        return ctrl.data.player.proposingTakeback
            ? h('div.pending', [
                h('p', ctrl.noarg('takebackPropositionSent')),
                h('button.button', {
                    hook: bind('click', () => ctrl.socket.sendLoading('takeback-no')),
                }, ctrl.noarg('cancel')),
            ])
            : null;
    }
    function acceptButton(ctrl, klass, action, i18nKey = 'accept') {
        const text = ctrl.noarg(i18nKey);
        return ctrl.nvui
            ? h('button.' + klass, {
                hook: bind('click', action),
            }, text)
            : h('a.accept', {
                attrs: {
                    'data-icon': 'E',
                    title: text,
                },
                hook: bind('click', action),
            });
    }
    function declineButton(ctrl, action, i18nKey = 'decline') {
        const text = ctrl.noarg(i18nKey);
        return ctrl.nvui
            ? h('button', {
                hook: bind('click', action),
            }, text)
            : h('a.decline', {
                attrs: {
                    'data-icon': 'L',
                    title: text,
                },
                hook: bind('click', action),
            });
    }
    function answerOpponentTakebackProposition(ctrl) {
        return ctrl.data.opponent.proposingTakeback
            ? h('div.negotiation.takeback', [
                declineButton(ctrl, () => ctrl.socket.sendLoading('takeback-no')),
                h('p', ctrl.noarg('yourOpponentProposesATakeback')),
                acceptButton(ctrl, 'takeback-yes', ctrl.takebackYes),
            ])
            : null;
    }
    function submitMove(ctrl) {
        return ctrl.moveToSubmit || ctrl.dropToSubmit
            ? h('div.negotiation.move-confirm', [
                declineButton(ctrl, () => ctrl.submitMove(false), 'cancel'),
                h('p', ctrl.noarg('confirmMove')),
                acceptButton(ctrl, 'confirm-yes', () => ctrl.submitMove(true)),
            ])
            : undefined;
    }
    function backToTournament(ctrl) {
        var _a;
        const d = ctrl.data;
        return ((_a = d.tournament) === null || _a === void 0 ? void 0 : _a.running)
            ? h('div.follow-up', [
                h('a.text.fbt.strong.glowing', {
                    attrs: {
                        'data-icon': 'G',
                        href: '/tournament/' + d.tournament.id,
                    },
                    hook: bind('click', ctrl.setRedirecting),
                }, ctrl.noarg('backToTournament')),
                h('form', {
                    attrs: {
                        method: 'post',
                        action: '/tournament/' + d.tournament.id + '/withdraw',
                    },
                }, [h('button.text.fbt.weak', justIcon('Z'), 'Pause')]),
                analysisButton$1(ctrl),
            ])
            : undefined;
    }
    function backToSwiss(ctrl) {
        var _a;
        const d = ctrl.data;
        return ((_a = d.swiss) === null || _a === void 0 ? void 0 : _a.running)
            ? h('div.follow-up', [
                h('a.text.fbt.strong.glowing', {
                    attrs: {
                        'data-icon': 'G',
                        href: '/swiss/' + d.swiss.id,
                    },
                    hook: bind('click', ctrl.setRedirecting),
                }, ctrl.noarg('backToTournament')),
                analysisButton$1(ctrl),
            ])
            : undefined;
    }
    function moretime(ctrl) {
        return moretimeable(ctrl.data)
            ? h('a.moretime', {
                attrs: {
                    title: ctrl.data.clock ? ctrl.trans('giveNbSeconds', ctrl.data.clock.moretime) : ctrl.noarg('giveMoreTime'),
                    'data-icon': 'O',
                },
                hook: bind('click', ctrl.socket.moreTime),
            })
            : null;
    }
    function followUp(ctrl) {
        const d = ctrl.data, rematchable = !d.game.rematch &&
            (finished(d) || aborted(d)) &&
            !d.tournament &&
            !d.simul &&
            !d.swiss &&
            !d.game.boosted, newable = (finished(d) || aborted(d)) && (d.game.source === 'lobby' || d.game.source === 'pool'), rematchZone = ctrl.challengeRematched
            ? [
                h('div.suggestion.text', {
                    hook: onSuggestionHook,
                }, ctrl.noarg('rematchOfferSent')),
            ]
            : rematchable || d.game.rematch
                ? rematchButtons(ctrl)
                : [];
        return h('div.follow-up', [
            ...rematchZone,
            d.tournament
                ? h('a.fbt', {
                    attrs: { href: '/tournament/' + d.tournament.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            d.swiss
                ? h('a.fbt', {
                    attrs: { href: '/swiss/' + d.swiss.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            newable
                ? h('a.fbt', {
                    attrs: { href: d.game.source === 'pool' ? poolUrl(d.clock, d.opponent.user) : '/?hook_like=' + d.game.id },
                }, ctrl.noarg('newOpponent'))
                : null,
            analysisButton$1(ctrl),
        ]);
    }
    function watcherFollowUp(ctrl) {
        const d = ctrl.data, content = [
            d.game.rematch
                ? h('a.fbt.text', {
                    attrs: {
                        href: `/${d.game.rematch}/${d.opponent.color}`,
                    },
                }, ctrl.noarg('viewRematch'))
                : null,
            d.tournament
                ? h('a.fbt', {
                    attrs: { href: '/tournament/' + d.tournament.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            d.swiss
                ? h('a.fbt', {
                    attrs: { href: '/swiss/' + d.swiss.id },
                }, ctrl.noarg('viewTournament'))
                : null,
            analysisButton$1(ctrl),
        ];
        return content.find(x => !!x) ? h('div.follow-up', content) : null;
    }
    const onSuggestionHook = onInsert(el => lichess.pubsub.emit('round.suggestion', el.textContent));

    function renderClock(ctrl, player, position) {
        const clock = ctrl.clock, millis = clock.millisOf(player.color), isPlayer = ctrl.data.player.color === player.color, isRunning = player.color === clock.times.activeColor;
        const update = (el) => {
            const els = clock.elements[player.color], millis = clock.millisOf(player.color), isRunning = player.color === clock.times.activeColor;
            els.time = el;
            els.clock = el.parentElement;
            el.innerHTML = formatClockTime$1(millis, clock.showTenths(millis), isRunning, clock.opts.nvui);
        };
        const timeHook = {
            insert: vnode => update(vnode.elm),
            postpatch: (_, vnode) => update(vnode.elm),
        };
        return h('div.rclock.rclock-' + position, {
            class: {
                outoftime: millis <= 0,
                running: isRunning,
                emerg: millis < clock.emergMs,
            },
        }, clock.opts.nvui
            ? [
                h('div.time', {
                    attrs: { role: 'timer' },
                    hook: timeHook,
                }),
            ]
            : [
                clock.showBar && bothPlayersHavePlayed(ctrl.data) ? showBar(ctrl, player.color) : undefined,
                h('div.time', {
                    class: {
                        hour: millis > 3600 * 1000,
                    },
                    hook: timeHook,
                }),
                renderBerserk(ctrl, player.color, position),
                isPlayer ? goBerserk(ctrl) : moretime(ctrl),
                tourRank(ctrl, player.color, position),
            ]);
    }
    const pad2 = (num) => (num < 10 ? '0' : '') + num;
    const sepHigh = '<sep>:</sep>';
    const sepLow = '<sep class="low">:</sep>';
    function formatClockTime$1(time, showTenths, isRunning, nvui) {
        const date = new Date(time);
        if (nvui)
            return ((time >= 3600000 ? Math.floor(time / 3600000) + 'H:' : '') +
                date.getUTCMinutes() +
                'M:' +
                date.getUTCSeconds() +
                'S');
        const millis = date.getUTCMilliseconds(), sep = isRunning && millis < 500 ? sepLow : sepHigh, baseStr = pad2(date.getUTCMinutes()) + sep + pad2(date.getUTCSeconds());
        if (time >= 3600000) {
            const hours = pad2(Math.floor(time / 3600000));
            return hours + sepHigh + baseStr;
        }
        else if (showTenths) {
            let tenthsStr = Math.floor(millis / 100).toString();
            if (!isRunning && time < 1000) {
                tenthsStr += '<huns>' + (Math.floor(millis / 10) % 10) + '</huns>';
            }
            return baseStr + '<tenths><sep>.</sep>' + tenthsStr + '</tenths>';
        }
        else {
            return baseStr;
        }
    }
    function showBar(ctrl, color) {
        const clock = ctrl.clock;
        const update = (el) => {
            if (el.animate !== undefined) {
                let anim = clock.elements[color].barAnim;
                if (anim === undefined || !anim.effect || anim.effect.target !== el) {
                    anim = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(0, 1)' }], {
                        duration: clock.barTime,
                        fill: 'both',
                    });
                    clock.elements[color].barAnim = anim;
                }
                const remaining = clock.millisOf(color);
                anim.currentTime = clock.barTime - remaining;
                if (color === clock.times.activeColor) {
                    // Calling play after animations finishes restarts anim
                    if (remaining > 0)
                        anim.play();
                }
                else
                    anim.pause();
            }
            else {
                clock.elements[color].bar = el;
                el.style.transform = 'scale(' + clock.timeRatio(clock.millisOf(color)) + ',1)';
            }
        };
        return h('div.bar', {
            class: { berserk: !!ctrl.goneBerserk[color] },
            hook: {
                insert: vnode => update(vnode.elm),
                postpatch: (_, vnode) => update(vnode.elm),
            },
        });
    }
    function showBerserk(ctrl, color) {
        return !!ctrl.goneBerserk[color] && ctrl.data.game.turns <= 1 && playable(ctrl.data);
    }
    function renderBerserk(ctrl, color, position) {
        return showBerserk(ctrl, color) ? h('div.berserked.' + position, justIcon('`')) : null;
    }
    function goBerserk(ctrl) {
        if (!berserkableBy(ctrl.data))
            return;
        if (ctrl.goneBerserk[ctrl.data.player.color])
            return;
        return h('button.fbt.go-berserk', {
            attrs: {
                title: 'GO BERSERK! Half the time, no increment, bonus point',
                'data-icon': '`',
            },
            hook: bind('click', ctrl.goBerserk),
        });
    }
    function tourRank(ctrl, color, position) {
        var _a, _b;
        const d = ctrl.data, ranks = ((_a = d.tournament) === null || _a === void 0 ? void 0 : _a.ranks) || ((_b = d.swiss) === null || _b === void 0 ? void 0 : _b.ranks);
        return ranks && !showBerserk(ctrl, color)
            ? h('div.tour-rank.' + position, {
                attrs: { title: 'Current tournament rank' },
            }, '#' + ranks[color])
            : null;
    }

    const prefixInteger = (num, length) => (num / Math.pow(10, length)).toFixed(length).substr(2);
    const bold = (x) => `<b>${x}</b>`;
    function formatClockTime(trans, time) {
        const date = new Date(time), minutes = prefixInteger(date.getUTCMinutes(), 2), seconds = prefixInteger(date.getSeconds(), 2);
        let hours, str = '';
        if (time >= 86400 * 1000) {
            // days : hours
            const days = date.getUTCDate() - 1;
            hours = date.getUTCHours();
            str += (days === 1 ? trans('oneDay') : trans.plural('nbDays', days)) + ' ';
            if (hours !== 0)
                str += trans.plural('nbHours', hours);
        }
        else if (time >= 3600 * 1000) {
            // hours : minutes
            hours = date.getUTCHours();
            str += bold(prefixInteger(hours, 2)) + ':' + bold(minutes);
        }
        else {
            // minutes : seconds
            str += bold(minutes) + ':' + bold(seconds);
        }
        return str;
    }
    function renderCorresClock (ctrl, trans, color, position, runningColor) {
        const millis = ctrl.millisOf(color), update = (el) => {
            el.innerHTML = formatClockTime(trans, millis);
        }, isPlayer = ctrl.root.data.player.color === color;
        return h('div.rclock.rclock-correspondence.rclock-' + position, {
            class: {
                outoftime: millis <= 0,
                running: runningColor === color,
            },
        }, [
            ctrl.data.showBar
                ? h('div.bar', [
                    h('span', {
                        attrs: { style: `width: ${ctrl.timePercent(color)}%` },
                    }),
                ])
                : null,
            h('div.time', {
                hook: {
                    insert: vnode => update(vnode.elm),
                    postpatch: (_, vnode) => update(vnode.elm),
                },
            }),
            isPlayer ? null : moretime(ctrl.root),
        ]);
    }

    const firstPly = (d) => d.steps[0].ply;
    const lastPly = (d) => lastStep(d).ply;
    const lastStep = (d) => d.steps[d.steps.length - 1];
    const plyStep = (d, ply) => d.steps[ply - firstPly(d)];

    let cache = 'init';
    function isCol1 () {
        if (typeof cache == 'string') {
            if (cache == 'init') {
                // only once
                window.addEventListener('resize', () => {
                    cache = 'rec';
                }); // recompute on resize
                if (navigator.userAgent.indexOf('Edge/') > -1)
                    // edge gets false positive on page load, fix later
                    requestAnimationFrame(() => {
                        cache = 'rec';
                    });
            }
            cache = !!getComputedStyle(document.body).getPropertyValue('--col1');
        }
        return cache;
    }

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

    function status(ctrl) {
        const noarg = ctrl.trans.noarg, d = ctrl.data;
        switch (d.game.status.name) {
            case 'started':
                return noarg('playingRightNow');
            case 'aborted':
                return noarg('gameAborted');
            case 'mate':
                return noarg('checkmate');
            case 'resign':
                return noarg(d.game.winner == 'white' ? 'blackResigned' : 'whiteResigned');
            case 'stalemate':
                return noarg('stalemate');
            case 'timeout':
                switch (d.game.winner) {
                    case 'white':
                        return noarg('blackLeftTheGame');
                    case 'black':
                        return noarg('whiteLeftTheGame');
                }
                return noarg('draw');
            case 'draw':
                return noarg('draw');
            case 'outoftime':
                return `${d.game.turns % 2 === 0 ? noarg('whiteTimeOut') : noarg('blackTimeOut')}${d.game.winner ? '' : ` • ${noarg('draw')}`}`;
            case 'noStart':
                return (d.game.winner == 'white' ? 'Black' : 'White') + " didn't move";
            case 'cheat':
                return noarg('cheatDetected');
            case 'variantEnd':
                switch (d.game.variant.key) {
                    case 'kingOfTheHill':
                        return noarg('kingInTheCenter');
                    case 'threeCheck':
                        return noarg('threeChecks');
                }
                return noarg('variantEnding');
            case 'unknownFinish':
                return 'Finished';
            default:
                return d.game.status.name;
        }
    }

    const scrollMax = 99999, moveTag = 'u8t', indexTag = 'i5z', indexTagUC = indexTag.toUpperCase(), movesTag = 'l4x', rmovesTag = 'rm6';
    const autoScroll = throttle(100, (movesEl, ctrl) => window.requestAnimationFrame(() => {
        if (ctrl.data.steps.length < 7)
            return;
        let st;
        if (ctrl.ply < 3)
            st = 0;
        else if (ctrl.ply == lastPly(ctrl.data))
            st = scrollMax;
        else {
            const plyEl = movesEl.querySelector('.a1t');
            if (plyEl)
                st = isCol1()
                    ? plyEl.offsetLeft - movesEl.offsetWidth / 2 + plyEl.offsetWidth / 2
                    : plyEl.offsetTop - movesEl.offsetHeight / 2 + plyEl.offsetHeight / 2;
        }
        if (typeof st == 'number') {
            if (st == scrollMax)
                movesEl.scrollLeft = movesEl.scrollTop = st;
            else if (isCol1())
                movesEl.scrollLeft = st;
            else
                movesEl.scrollTop = st;
        }
    }));
    const renderDrawOffer = () => h('draw', {
        attrs: {
            title: 'Draw offer',
        },
    }, '½?');
    function renderMove(step, curPly, orEmpty, drawOffers) {
        return step
            ? h(moveTag, {
                class: {
                    a1t: step.ply === curPly,
                },
            }, [step.san[0] === 'P' ? step.san.slice(1) : step.san, drawOffers.has(step.ply) ? renderDrawOffer() : undefined])
            : orEmpty
                ? h(moveTag, '…')
                : undefined;
    }
    function renderResult(ctrl) {
        let result;
        if (finished(ctrl.data))
            switch (ctrl.data.game.winner) {
                case 'white':
                    result = '1-0';
                    break;
                case 'black':
                    result = '0-1';
                    break;
                default:
                    result = '½-½';
            }
        if (result || aborted(ctrl.data)) {
            const winner = ctrl.data.game.winner;
            return h('div.result-wrap', [
                h('p.result', result || ''),
                h('p.status', {
                    hook: onInsert(() => {
                        if (ctrl.autoScroll)
                            ctrl.autoScroll();
                        else
                            setTimeout(() => ctrl.autoScroll(), 200);
                    }),
                }, [status(ctrl), winner ? ' • ' + ctrl.noarg(winner + 'IsVictorious') : '']),
            ]);
        }
        return;
    }
    function renderMoves$1(ctrl) {
        const steps = ctrl.data.steps, firstPly$1 = firstPly(ctrl.data), lastPly$1 = lastPly(ctrl.data), drawPlies = new Set(ctrl.data.game.drawOffers || []);
        if (typeof lastPly$1 === 'undefined')
            return [];
        const pairs = [];
        let startAt = 1;
        if (firstPly$1 % 2 === 1) {
            pairs.push([null, steps[1]]);
            startAt = 2;
        }
        for (let i = startAt; i < steps.length; i += 2)
            pairs.push([steps[i], steps[i + 1]]);
        const els = [], curPly = ctrl.ply;
        for (let i = 0; i < pairs.length; i++) {
            els.push(h(indexTag, i + 1 + ''));
            els.push(renderMove(pairs[i][0], curPly, true, drawPlies));
            els.push(renderMove(pairs[i][1], curPly, false, drawPlies));
        }
        els.push(renderResult(ctrl));
        return els;
    }
    function analysisButton(ctrl) {
        const forecastCount = ctrl.data.forecastCount;
        return userAnalysable(ctrl.data)
            ? h('a.fbt.analysis', {
                class: {
                    text: !!forecastCount,
                },
                attrs: {
                    title: ctrl.noarg('analysis'),
                    href: game(ctrl.data, ctrl.data.player.color) + '/analysis#' + ctrl.ply,
                    'data-icon': 'A',
                },
            }, forecastCount ? ['' + forecastCount] : [])
            : undefined;
    }
    function renderButtons(ctrl) {
        const d = ctrl.data, firstPly$1 = firstPly(d), lastPly$1 = lastPly(d);
        return h('div.buttons', {
            hook: bind('mousedown', e => {
                const target = e.target;
                const ply = parseInt(target.getAttribute('data-ply') || '');
                if (!isNaN(ply))
                    ctrl.userJump(ply);
                else {
                    const action = target.getAttribute('data-act') || target.parentNode.getAttribute('data-act');
                    if (action === 'flip') {
                        if (d.tv)
                            location.href = '/tv/' + d.tv.channel + (d.tv.flip ? '' : '?flip=1');
                        else if (d.player.spectator)
                            location.href = game(d, d.opponent.color);
                        else
                            ctrl.flipNow();
                    }
                }
            }, ctrl.redraw),
        }, [
            h('button.fbt.flip', {
                class: { active: ctrl.flip },
                attrs: {
                    title: ctrl.noarg('flipBoard'),
                    'data-act': 'flip',
                    'data-icon': 'B',
                },
            }),
            ...[
                ['W', firstPly$1],
                ['Y', ctrl.ply - 1],
                ['X', ctrl.ply + 1],
                ['V', lastPly$1],
            ].map((b, i) => {
                const enabled = ctrl.ply !== b[1] && b[1] >= firstPly$1 && b[1] <= lastPly$1;
                return h('button.fbt', {
                    class: { glowing: i === 3 && ctrl.isLate() },
                    attrs: {
                        disabled: !enabled,
                        'data-icon': b[0],
                        'data-ply': enabled ? b[1] : '-',
                    },
                });
            }),
            analysisButton(ctrl) || h('div.noop'),
        ]);
    }
    function initMessage(d, trans) {
        return playable(d) && d.game.turns === 0 && !d.player.spectator
            ? h('div.message', justIcon(''), [
                h('div', [
                    trans(d.player.color === 'white' ? 'youPlayTheWhitePieces' : 'youPlayTheBlackPieces'),
                    ...(d.player.color === 'white' ? [h('br'), h('strong', trans('itsYourTurn'))] : []),
                ]),
            ])
            : null;
    }
    function col1Button(ctrl, dir, icon, disabled) {
        return disabled
            ? null
            : h('button.fbt', {
                attrs: {
                    disabled: disabled,
                    'data-icon': icon,
                    'data-ply': ctrl.ply + dir,
                },
                hook: bind('mousedown', e => {
                    e.preventDefault();
                    ctrl.userJump(ctrl.ply + dir);
                    ctrl.redraw();
                }),
            });
    }
    function render$2(ctrl) {
        const d = ctrl.data, moves = ctrl.replayEnabledByPref() &&
            h(movesTag, {
                hook: onInsert(el => {
                    el.addEventListener('mousedown', e => {
                        let node = e.target, offset = -2;
                        if (node.tagName !== moveTag.toUpperCase())
                            return;
                        while ((node = node.previousSibling)) {
                            offset++;
                            if (node.tagName === indexTagUC) {
                                ctrl.userJump(2 * parseInt(node.textContent || '') + offset);
                                ctrl.redraw();
                                break;
                            }
                        }
                    });
                    ctrl.autoScroll = () => autoScroll(el, ctrl);
                    ctrl.autoScroll();
                }),
            }, renderMoves$1(ctrl));
        return ctrl.nvui
            ? undefined
            : h(rmovesTag, [
                renderButtons(ctrl),
                initMessage(d, ctrl.trans.noarg) ||
                    (moves
                        ? isCol1()
                            ? h('div.col1-moves', [
                                col1Button(ctrl, -1, 'Y', ctrl.ply == firstPly(d)),
                                moves,
                                col1Button(ctrl, 1, 'X', ctrl.ply == lastPly(d)),
                            ])
                            : moves
                        : renderResult(ctrl)),
            ]);
    }

    const isLoading = (ctrl) => ctrl.loading || ctrl.redirecting;
    const loader = () => h('i.ddloader');
    const renderTableWith = (ctrl, buttons) => [
        render$2(ctrl),
        buttons.find(x => !!x) ? h('div.rcontrols', buttons) : null,
    ];
    const renderTableEnd = (ctrl) => renderTableWith(ctrl, [
        isLoading(ctrl) ? loader() : backToTournament(ctrl) || backToSwiss(ctrl) || followUp(ctrl),
    ]);
    const renderTableWatch = (ctrl) => renderTableWith(ctrl, [
        isLoading(ctrl) ? loader() : playable(ctrl.data) ? undefined : watcherFollowUp(ctrl),
    ]);
    const renderTablePlay = (ctrl) => {
        const d = ctrl.data, loading = isLoading(ctrl), submit = submitMove(ctrl), icons = loading || submit
            ? []
            : [
                abortable(d)
                    ? standard(ctrl, undefined, 'L', 'abortGame', 'abort')
                    : standard(ctrl, takebackable, 'i', 'proposeATakeback', 'takeback-yes', ctrl.takebackYes),
                ctrl.drawConfirm
                    ? drawConfirm(ctrl)
                    : standard(ctrl, ctrl.canOfferDraw, '2', 'offerDraw', 'draw-yes', () => ctrl.offerDraw(true)),
                ctrl.resignConfirm
                    ? resignConfirm(ctrl)
                    : standard(ctrl, resignable, 'b', 'resign', 'resign', () => ctrl.resign(true)),
                analysisButton(ctrl),
            ], buttons = loading
            ? [loader()]
            : submit
                ? [submit]
                : [
                    opponentGone(ctrl),
                    threefoldClaimDraw(ctrl),
                    cancelDrawOffer(ctrl),
                    answerOpponentDrawOffer(ctrl),
                    cancelTakebackProposition(ctrl),
                    answerOpponentTakebackProposition(ctrl),
                ];
        return [
            render$2(ctrl),
            h('div.rcontrols', [
                ...buttons,
                h('div.ricons', {
                    class: { confirm: !!(ctrl.drawConfirm || ctrl.resignConfirm) },
                }, icons),
            ]),
        ];
    };

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
        state.orientation = opposite$1(state.orientation);
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
        state.turnColor = opposite$1(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite$1(state.turnColor);
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
        const data = ctrl.data, hooks = ctrl.makeCgHooks(), step = plyStep(data, ctrl.ply), playing = ctrl.isPlaying();
        return {
            fen: step.fen,
            orientation: boardOrientation(data, ctrl.flip),
            turnColor: step.ply % 2 === 0 ? 'white' : 'black',
            lastMove: uci2move(step.uci),
            check: !!step.check,
            coordinates: data.pref.coords !== 0 /* Hidden */,
            addPieceZIndex: ctrl.data.pref.is3d,
            highlight: {
                lastMove: data.pref.highlight,
                check: data.pref.highlight,
            },
            events: {
                move: hooks.onMove,
                dropNewPiece: hooks.onNewPiece,
                insert(elements) {
                    resizeHandle(elements, ctrl.data.pref.resizeHandle, ctrl.ply);
                    if (data.pref.coords === 1 /* Inside */)
                        changeColorHandle();
                },
            },
            movable: {
                free: false,
                color: playing ? data.player.color : undefined,
                dests: playing ? parsePossibleMoves(data.possibleMoves) : new Map(),
                showDests: data.pref.destination,
                rookCastle: data.pref.rookCastle,
                events: {
                    after: hooks.onUserMove,
                    afterNewPiece: hooks.onUserNewPiece,
                },
            },
            animation: {
                enabled: true,
                duration: data.pref.animationDuration,
            },
            premovable: {
                enabled: data.pref.enablePremove,
                showDests: data.pref.destination,
                castle: data.game.variant.key !== 'antichess',
                events: {
                    set: hooks.onPremove,
                    unset: hooks.onCancelPremove,
                },
            },
            predroppable: {
                enabled: data.pref.enablePremove && data.game.variant.key === 'crazyhouse',
                events: {
                    set: hooks.onPredrop,
                    unset() {
                        hooks.onPredrop(undefined);
                    },
                },
            },
            draggable: {
                enabled: data.pref.moveEvent !== 0 /* Click */,
                showGhost: data.pref.highlight,
            },
            selectable: {
                enabled: data.pref.moveEvent !== 1 /* Drag */,
            },
            drawable: {
                enabled: true,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            disableContextMenu: true,
        };
    }
    function boardOrientation(data, flip) {
        if (data.game.variant.key === 'racingKings')
            return flip ? 'black' : 'white';
        else
            return flip ? data.opponent.color : data.player.color;
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

    function r(r,n){r.prototype=Object.create(n.prototype),r.prototype.constructor=r,r.__proto__=n;}var n,t=function(){function r(){}var t=r.prototype;return t.unwrap=function(r,t){var o=this._chain(function(t){return n.ok(r?r(t):t)},function(r){return t?n.ok(t(r)):n.err(r)});if(o.isErr)throw o.error;return o.value},t.map=function(r,t){return this._chain(function(t){return n.ok(r(t))},function(r){return n.err(t?t(r):r)})},t.chain=function(r,t){return this._chain(r,t||function(r){return n.err(r)})},r}(),o=function(n){function t(r){var t;return (t=n.call(this)||this).value=r,t.isOk=!0,t.isErr=!1,t}return r(t,n),t.prototype._chain=function(r,n){return r(this.value)},t}(t),e=function(n){function t(r){var t;return (t=n.call(this)||this).error=r,t.isOk=!1,t.isErr=!0,t}return r(t,n),t.prototype._chain=function(r,n){return n(this.error)},t}(t);!function(r){r.ok=function(r){return new o(r)},r.err=function(r){return new e(r||new Error)},r.all=function(n){if(Array.isArray(n)){for(var t=[],o=0;o<n.length;o++){var e=n[o];if(e.isErr)return e;t.push(e.value);}return r.ok(t)}for(var u={},i=Object.keys(n),c=0;c<i.length;c++){var a=n[i[c]];if(a.isErr)return a;u[i[c]]=a.value;}return r.ok(u)};}(n||(n={}));

    const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const COLORS = ['white', 'black'];
    const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const CASTLING_SIDES = ['a', 'h'];
    function isDrop(v) {
        return 'role' in v;
    }

    function popcnt32(n) {
        n = n - ((n >>> 1) & 1431655765);
        n = (n & 858993459) + ((n >>> 2) & 858993459);
        return Math.imul((n + (n >>> 4)) & 252645135, 16843009) >> 24;
    }
    function bswap32(n) {
        n = ((n >>> 8) & 16711935) | ((n & 16711935) << 8);
        return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
    }
    function rbit32(n) {
        n = ((n >>> 1) & 1431655765) | ((n & 1431655765) << 1);
        n = ((n >>> 2) & 858993459) | ((n & 858993459) << 2);
        n = ((n >>> 4) & 252645135) | ((n & 252645135) << 4);
        return bswap32(n);
    }
    class SquareSet {
        constructor(lo, hi) {
            this.lo = lo;
            this.hi = hi;
            this.lo = lo | 0;
            this.hi = hi | 0;
        }
        static fromSquare(square) {
            return square >= 32 ? new SquareSet(0, 1 << (square - 32)) : new SquareSet(1 << square, 0);
        }
        static fromRank(rank) {
            return new SquareSet(0xff, 0).shl64(8 * rank);
        }
        static fromFile(file) {
            return new SquareSet(16843009 << file, 16843009 << file);
        }
        static empty() {
            return new SquareSet(0, 0);
        }
        static full() {
            return new SquareSet(4294967295, 4294967295);
        }
        static corners() {
            return new SquareSet(0x81, 2164260864);
        }
        static center() {
            return new SquareSet(402653184, 0x18);
        }
        static backranks() {
            return new SquareSet(0xff, 4278190080);
        }
        static backrank(color) {
            return color === 'white' ? new SquareSet(0xff, 0) : new SquareSet(0, 4278190080);
        }
        static lightSquares() {
            return new SquareSet(1437226410, 1437226410);
        }
        static darkSquares() {
            return new SquareSet(2857740885, 2857740885);
        }
        complement() {
            return new SquareSet(~this.lo, ~this.hi);
        }
        xor(other) {
            return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
        }
        union(other) {
            return new SquareSet(this.lo | other.lo, this.hi | other.hi);
        }
        intersect(other) {
            return new SquareSet(this.lo & other.lo, this.hi & other.hi);
        }
        diff(other) {
            return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
        }
        intersects(other) {
            return this.intersect(other).nonEmpty();
        }
        isDisjoint(other) {
            return this.intersect(other).isEmpty();
        }
        supersetOf(other) {
            return other.diff(this).isEmpty();
        }
        subsetOf(other) {
            return this.diff(other).isEmpty();
        }
        shr64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(this.hi >>> (shift - 32), 0);
            if (shift > 0)
                return new SquareSet((this.lo >>> shift) ^ (this.hi << (32 - shift)), this.hi >>> shift);
            return this;
        }
        shl64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(0, this.lo << (shift - 32));
            if (shift > 0)
                return new SquareSet(this.lo << shift, (this.hi << shift) ^ (this.lo >>> (32 - shift)));
            return this;
        }
        bswap64() {
            return new SquareSet(bswap32(this.hi), bswap32(this.lo));
        }
        rbit64() {
            return new SquareSet(rbit32(this.hi), rbit32(this.lo));
        }
        minus64(other) {
            const lo = this.lo - other.lo;
            const c = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
            return new SquareSet(lo, this.hi - (other.hi + c));
        }
        equals(other) {
            return this.lo === other.lo && this.hi === other.hi;
        }
        size() {
            return popcnt32(this.lo) + popcnt32(this.hi);
        }
        isEmpty() {
            return this.lo === 0 && this.hi === 0;
        }
        nonEmpty() {
            return this.lo !== 0 || this.hi !== 0;
        }
        has(square) {
            return (square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square)) !== 0;
        }
        set(square, on) {
            return on ? this.with(square) : this.without(square);
        }
        with(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi | (1 << (square - 32)))
                : new SquareSet(this.lo | (1 << square), this.hi);
        }
        without(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi & ~(1 << (square - 32)))
                : new SquareSet(this.lo & ~(1 << square), this.hi);
        }
        toggle(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi ^ (1 << (square - 32)))
                : new SquareSet(this.lo ^ (1 << square), this.hi);
        }
        last() {
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi);
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo);
            return;
        }
        first() {
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo & -this.lo);
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi & -this.hi);
            return;
        }
        withoutFirst() {
            if (this.lo !== 0)
                return new SquareSet(this.lo & (this.lo - 1), this.hi);
            return new SquareSet(0, this.hi & (this.hi - 1));
        }
        moreThanOne() {
            return (this.hi !== 0 && this.lo !== 0) || (this.lo & (this.lo - 1)) !== 0 || (this.hi & (this.hi - 1)) !== 0;
        }
        singleSquare() {
            return this.moreThanOne() ? undefined : this.last();
        }
        isSingleSquare() {
            return this.nonEmpty() && !this.moreThanOne();
        }
        *[Symbol.iterator]() {
            let lo = this.lo;
            let hi = this.hi;
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo & -lo);
                lo ^= 1 << idx;
                yield idx;
            }
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi & -hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
        }
        *reversed() {
            let lo = this.lo;
            let hi = this.hi;
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo);
                lo ^= 1 << idx;
                yield idx;
            }
        }
    }

    /**
     * Piece positions on a board.
     *
     * Properties are sets of squares, like `board.occupied` for all occupied
     * squares, `board[color]` for all pieces of that color, and `board[role]`
     * for all pieces of that role. When modifying the properties directly, take
     * care to keep them consistent.
     */
    class Board {
        constructor() { }
        static default() {
            const board = new Board();
            board.reset();
            return board;
        }
        static racingKings() {
            const board = new Board();
            board.occupied = new SquareSet(0xffff, 0);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(0xf0f0, 0);
            board.black = new SquareSet(0x0f0f, 0);
            board.pawn = SquareSet.empty();
            board.knight = new SquareSet(0x1818, 0);
            board.bishop = new SquareSet(0x2424, 0);
            board.rook = new SquareSet(0x4242, 0);
            board.queen = new SquareSet(0x0081, 0);
            board.king = new SquareSet(0x8100, 0);
            return board;
        }
        static horde() {
            const board = new Board();
            board.occupied = new SquareSet(4294967295, 4294901862);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(4294967295, 102);
            board.black = new SquareSet(0, 4294901760);
            board.pawn = new SquareSet(4294967295, 16711782);
            board.knight = new SquareSet(0, 1107296256);
            board.bishop = new SquareSet(0, 603979776);
            board.rook = new SquareSet(0, 2164260864);
            board.queen = new SquareSet(0, 134217728);
            board.king = new SquareSet(0, 268435456);
            return board;
        }
        /**
         * Resets all pieces to the default starting position for standard chess.
         */
        reset() {
            this.occupied = new SquareSet(0xffff, 4294901760);
            this.promoted = SquareSet.empty();
            this.white = new SquareSet(0xffff, 0);
            this.black = new SquareSet(0, 4294901760);
            this.pawn = new SquareSet(0xff00, 16711680);
            this.knight = new SquareSet(0x42, 1107296256);
            this.bishop = new SquareSet(0x24, 603979776);
            this.rook = new SquareSet(0x81, 2164260864);
            this.queen = new SquareSet(0x8, 134217728);
            this.king = new SquareSet(0x10, 268435456);
        }
        static empty() {
            const board = new Board();
            board.clear();
            return board;
        }
        clear() {
            this.occupied = SquareSet.empty();
            this.promoted = SquareSet.empty();
            for (const color of COLORS)
                this[color] = SquareSet.empty();
            for (const role of ROLES)
                this[role] = SquareSet.empty();
        }
        clone() {
            const board = new Board();
            board.occupied = this.occupied;
            board.promoted = this.promoted;
            for (const color of COLORS)
                board[color] = this[color];
            for (const role of ROLES)
                board[role] = this[role];
            return board;
        }
        equalsIgnorePromoted(other) {
            if (!this.white.equals(other.white))
                return false;
            return ROLES.every(role => this[role].equals(other[role]));
        }
        equals(other) {
            return this.equalsIgnorePromoted(other) && this.promoted.equals(other.promoted);
        }
        getColor(square) {
            if (this.white.has(square))
                return 'white';
            if (this.black.has(square))
                return 'black';
            return;
        }
        getRole(square) {
            for (const role of ROLES) {
                if (this[role].has(square))
                    return role;
            }
            return;
        }
        get(square) {
            const color = this.getColor(square);
            if (!color)
                return;
            const role = this.getRole(square);
            const promoted = this.promoted.has(square);
            return { color, role, promoted };
        }
        /**
         * Removes and returns the piece from the given `square`, if any.
         */
        take(square) {
            const piece = this.get(square);
            if (piece) {
                this.occupied = this.occupied.without(square);
                this[piece.color] = this[piece.color].without(square);
                this[piece.role] = this[piece.role].without(square);
                if (piece.promoted)
                    this.promoted = this.promoted.without(square);
            }
            return piece;
        }
        /**
         * Put `piece` onto `square`, potentially replacing an existing piece.
         * Returns the existing piece, if any.
         */
        set(square, piece) {
            const old = this.take(square);
            this.occupied = this.occupied.with(square);
            this[piece.color] = this[piece.color].with(square);
            this[piece.role] = this[piece.role].with(square);
            if (piece.promoted)
                this.promoted = this.promoted.with(square);
            return old;
        }
        has(square) {
            return this.occupied.has(square);
        }
        *[Symbol.iterator]() {
            for (const square of this.occupied) {
                yield [square, this.get(square)];
            }
        }
        pieces(color, role) {
            return this[color].intersect(this[role]);
        }
        rooksAndQueens() {
            return this.rook.union(this.queen);
        }
        bishopsAndQueens() {
            return this.bishop.union(this.queen);
        }
        /**
         * Finds the unique unpromoted king of the given `color`, if any.
         */
        kingOf(color) {
            return this.king.intersect(this[color]).diff(this.promoted).singleSquare();
        }
    }

    class MaterialSide {
        constructor() { }
        static empty() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = 0;
            return m;
        }
        static fromBoard(board, color) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = board.pieces(color, role).size();
            return m;
        }
        clone() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role];
            return m;
        }
        equals(other) {
            return ROLES.every(role => this[role] === other[role]);
        }
        add(other) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role] + other[role];
            return m;
        }
        nonEmpty() {
            return ROLES.some(role => this[role] > 0);
        }
        isEmpty() {
            return !this.nonEmpty();
        }
        hasPawns() {
            return this.pawn > 0;
        }
        hasNonPawns() {
            return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
        }
        count() {
            return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
        }
    }
    class Material {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static empty() {
            return new Material(MaterialSide.empty(), MaterialSide.empty());
        }
        static fromBoard(board) {
            return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
        }
        clone() {
            return new Material(this.white.clone(), this.black.clone());
        }
        equals(other) {
            return this.white.equals(other.white) && this.black.equals(other.black);
        }
        add(other) {
            return new Material(this.white.add(other.white), this.black.add(other.black));
        }
        count() {
            return this.white.count() + this.black.count();
        }
        isEmpty() {
            return this.white.isEmpty() && this.black.isEmpty();
        }
        nonEmpty() {
            return !this.isEmpty();
        }
        hasPawns() {
            return this.white.hasPawns() || this.black.hasPawns();
        }
        hasNonPawns() {
            return this.white.hasNonPawns() || this.black.hasNonPawns();
        }
    }
    class RemainingChecks {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static default() {
            return new RemainingChecks(3, 3);
        }
        clone() {
            return new RemainingChecks(this.white, this.black);
        }
        equals(other) {
            return this.white === other.white && this.black === other.black;
        }
    }

    function defined(v) {
        return v !== undefined;
    }
    function opposite(color) {
        return color === 'white' ? 'black' : 'white';
    }
    function squareRank(square) {
        return square >> 3;
    }
    function squareFile(square) {
        return square & 0x7;
    }
    function charToRole(ch) {
        switch (ch) {
            case 'P':
            case 'p':
                return 'pawn';
            case 'N':
            case 'n':
                return 'knight';
            case 'B':
            case 'b':
                return 'bishop';
            case 'R':
            case 'r':
                return 'rook';
            case 'Q':
            case 'q':
                return 'queen';
            case 'K':
            case 'k':
                return 'king';
            default:
                return;
        }
    }
    function parseSquare(str) {
        if (str.length !== 2)
            return;
        const file = str.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = str.charCodeAt(1) - '1'.charCodeAt(0);
        if (file < 0 || file >= 8 || rank < 0 || rank >= 8)
            return;
        return file + 8 * rank;
    }
    function makeSquare(square) {
        return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]);
    }
    function kingCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
    }

    var InvalidFen;
    (function (InvalidFen) {
        InvalidFen["Fen"] = "ERR_FEN";
        InvalidFen["Board"] = "ERR_BOARD";
        InvalidFen["Pockets"] = "ERR_POCKETS";
        InvalidFen["Turn"] = "ERR_TURN";
        InvalidFen["Castling"] = "ERR_CASTLING";
        InvalidFen["EpSquare"] = "ERR_EP_SQUARE";
        InvalidFen["RemainingChecks"] = "ERR_REMAINING_CHECKS";
        InvalidFen["Halfmoves"] = "ERR_HALFMOVES";
        InvalidFen["Fullmoves"] = "ERR_FULLMOVES";
    })(InvalidFen || (InvalidFen = {}));
    class FenError extends Error {
    }
    function nthIndexOf(haystack, needle, n) {
        let index = haystack.indexOf(needle);
        while (n-- > 0) {
            if (index === -1)
                break;
            index = haystack.indexOf(needle, index + needle.length);
        }
        return index;
    }
    function parseSmallUint(str) {
        return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
    }
    function charToPiece(ch) {
        const role = charToRole(ch);
        return role && { role, color: ch.toLowerCase() === ch ? 'black' : 'white' };
    }
    function parseBoardFen(boardPart) {
        const board = Board.empty();
        let rank = 7;
        let file = 0;
        for (let i = 0; i < boardPart.length; i++) {
            const c = boardPart[i];
            if (c === '/' && file === 8) {
                file = 0;
                rank--;
            }
            else {
                const step = parseInt(c, 10);
                if (step > 0)
                    file += step;
                else {
                    if (file >= 8 || rank < 0)
                        return n.err(new FenError(InvalidFen.Board));
                    const square = file + rank * 8;
                    const piece = charToPiece(c);
                    if (!piece)
                        return n.err(new FenError(InvalidFen.Board));
                    if (boardPart[i + 1] === '~') {
                        piece.promoted = true;
                        i++;
                    }
                    board.set(square, piece);
                    file++;
                }
            }
        }
        if (rank !== 0 || file !== 8)
            return n.err(new FenError(InvalidFen.Board));
        return n.ok(board);
    }
    function parsePockets(pocketPart) {
        if (pocketPart.length > 64)
            return n.err(new FenError(InvalidFen.Pockets));
        const pockets = Material.empty();
        for (const c of pocketPart) {
            const piece = charToPiece(c);
            if (!piece)
                return n.err(new FenError(InvalidFen.Pockets));
            pockets[piece.color][piece.role]++;
        }
        return n.ok(pockets);
    }
    function parseCastlingFen(board, castlingPart) {
        let unmovedRooks = SquareSet.empty();
        if (castlingPart === '-')
            return n.ok(unmovedRooks);
        if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) {
            return n.err(new FenError(InvalidFen.Castling));
        }
        for (const c of castlingPart) {
            const lower = c.toLowerCase();
            const color = c === lower ? 'black' : 'white';
            const backrank = SquareSet.backrank(color).intersect(board[color]);
            let candidates;
            if (lower === 'q')
                candidates = backrank;
            else if (lower === 'k')
                candidates = backrank.reversed();
            else
                candidates = SquareSet.fromSquare(lower.charCodeAt(0) - 'a'.charCodeAt(0)).intersect(backrank);
            for (const square of candidates) {
                if (board.king.has(square) && !board.promoted.has(square))
                    break;
                if (board.rook.has(square)) {
                    unmovedRooks = unmovedRooks.with(square);
                    break;
                }
            }
        }
        return n.ok(unmovedRooks);
    }
    function parseRemainingChecks(part) {
        const parts = part.split('+');
        if (parts.length === 3 && parts[0] === '') {
            const white = parseSmallUint(parts[1]);
            const black = parseSmallUint(parts[2]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(3 - white, 3 - black));
        }
        else if (parts.length === 2) {
            const white = parseSmallUint(parts[0]);
            const black = parseSmallUint(parts[1]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(white, black));
        }
        else
            return n.err(new FenError(InvalidFen.RemainingChecks));
    }
    function parseFen(fen) {
        const parts = fen.split(' ');
        const boardPart = parts.shift();
        // Board and pockets
        let board, pockets = n.ok(undefined);
        if (boardPart.endsWith(']')) {
            const pocketStart = boardPart.indexOf('[');
            if (pocketStart === -1)
                return n.err(new FenError(InvalidFen.Fen));
            board = parseBoardFen(boardPart.substr(0, pocketStart));
            pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
        }
        else {
            const pocketStart = nthIndexOf(boardPart, '/', 7);
            if (pocketStart === -1)
                board = parseBoardFen(boardPart);
            else {
                board = parseBoardFen(boardPart.substr(0, pocketStart));
                pockets = parsePockets(boardPart.substr(pocketStart + 1));
            }
        }
        // Turn
        let turn;
        const turnPart = parts.shift();
        if (!defined(turnPart) || turnPart === 'w')
            turn = 'white';
        else if (turnPart === 'b')
            turn = 'black';
        else
            return n.err(new FenError(InvalidFen.Turn));
        return board.chain(board => {
            // Castling
            const castlingPart = parts.shift();
            const unmovedRooks = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : n.ok(SquareSet.empty());
            // En passant square
            const epPart = parts.shift();
            let epSquare;
            if (defined(epPart) && epPart !== '-') {
                epSquare = parseSquare(epPart);
                if (!defined(epSquare))
                    return n.err(new FenError(InvalidFen.EpSquare));
            }
            // Halfmoves or remaining checks
            let halfmovePart = parts.shift();
            let earlyRemainingChecks;
            if (defined(halfmovePart) && halfmovePart.includes('+')) {
                earlyRemainingChecks = parseRemainingChecks(halfmovePart);
                halfmovePart = parts.shift();
            }
            const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
            if (!defined(halfmoves))
                return n.err(new FenError(InvalidFen.Halfmoves));
            const fullmovesPart = parts.shift();
            const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
            if (!defined(fullmoves))
                return n.err(new FenError(InvalidFen.Fullmoves));
            const remainingChecksPart = parts.shift();
            let remainingChecks = n.ok(undefined);
            if (defined(remainingChecksPart)) {
                if (defined(earlyRemainingChecks))
                    return n.err(new FenError(InvalidFen.RemainingChecks));
                remainingChecks = parseRemainingChecks(remainingChecksPart);
            }
            else if (defined(earlyRemainingChecks)) {
                remainingChecks = earlyRemainingChecks;
            }
            if (parts.length > 0)
                return n.err(new FenError(InvalidFen.Fen));
            return pockets.chain(pockets => unmovedRooks.chain(unmovedRooks => remainingChecks.map(remainingChecks => {
                return {
                    board,
                    pockets,
                    turn,
                    unmovedRooks,
                    remainingChecks,
                    epSquare,
                    halfmoves,
                    fullmoves: Math.max(1, fullmoves),
                };
            })));
        });
    }

    /**
     * Compute attacks and rays.
     *
     * These are low-level functions that can be used to implement chess rules.
     *
     * Implementation notes: Sliding attacks are computed using
     * [hyperbola quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
     * Magic bitboards would deliver faster lookups, but also require
     * initializing considerably larger attack tables. On the web, initialization
     * time is important, so the chosen method may strike a better balance.
     *
     * @packageDocumentation
     */
    function computeRange(square, deltas) {
        let range = SquareSet.empty();
        for (const delta of deltas) {
            const sq = square + delta;
            if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
                range = range.with(sq);
            }
        }
        return range;
    }
    function tabulate(f) {
        const table = [];
        for (let square = 0; square < 64; square++)
            table[square] = f(square);
        return table;
    }
    const KING_ATTACKS = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
    const KNIGHT_ATTACKS = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
    const PAWN_ATTACKS = {
        white: tabulate(sq => computeRange(sq, [7, 9])),
        black: tabulate(sq => computeRange(sq, [-7, -9])),
    };
    /**
     * Gets squares attacked or defended by a king on `square`.
     */
    function kingAttacks(square) {
        return KING_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a knight on `square`.
     */
    function knightAttacks(square) {
        return KNIGHT_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a pawn of the given `color`
     * on `square`.
     */
    function pawnAttacks(color, square) {
        return PAWN_ATTACKS[color][square];
    }
    const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
    const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));
    const DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(134480385, 2151686160);
        const shift = 8 * (squareRank(sq) - squareFile(sq));
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    const ANTI_DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(270549120, 16909320);
        const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    function hyperbola(bit, range, occupied) {
        let forward = occupied.intersect(range);
        let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
        forward = forward.minus64(bit);
        reverse = reverse.minus64(bit.bswap64());
        return forward.xor(reverse.bswap64()).intersect(range);
    }
    function fileAttacks(square, occupied) {
        return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
    }
    function rankAttacks(square, occupied) {
        const range = RANK_RANGE[square];
        let forward = occupied.intersect(range);
        let reverse = forward.rbit64();
        forward = forward.minus64(SquareSet.fromSquare(square));
        reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
        return forward.xor(reverse.rbit64()).intersect(range);
    }
    /**
     * Gets squares attacked or defended by a bishop on `square`, given `occupied`
     * squares.
     */
    function bishopAttacks(square, occupied) {
        const bit = SquareSet.fromSquare(square);
        return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
    }
    /**
     * Gets squares attacked or defended by a rook on `square`, given `occupied`
     * squares.
     */
    function rookAttacks(square, occupied) {
        return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a queen on `square`, given `occupied`
     * squares.
     */
    function queenAttacks(square, occupied) {
        return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a `piece` on `square`, given
     * `occupied` squares.
     */
    function attacks(piece, square, occupied) {
        switch (piece.role) {
            case 'pawn':
                return pawnAttacks(piece.color, square);
            case 'knight':
                return knightAttacks(square);
            case 'bishop':
                return bishopAttacks(square, occupied);
            case 'rook':
                return rookAttacks(square, occupied);
            case 'queen':
                return queenAttacks(square, occupied);
            case 'king':
                return kingAttacks(square);
        }
    }
    /**
     * Gets all squares of the rank, file or diagonal with the two squares
     * `a` and `b`, or an empty set if they are not aligned.
     */
    function ray(a, b) {
        const other = SquareSet.fromSquare(b);
        if (RANK_RANGE[a].intersects(other))
            return RANK_RANGE[a].with(a);
        if (ANTI_DIAG_RANGE[a].intersects(other))
            return ANTI_DIAG_RANGE[a].with(a);
        if (DIAG_RANGE[a].intersects(other))
            return DIAG_RANGE[a].with(a);
        if (FILE_RANGE[a].intersects(other))
            return FILE_RANGE[a].with(a);
        return SquareSet.empty();
    }
    /**
     * Gets all squares between `a` and `b` (bounds not included), or an empty set
     * if they are not on the same rank, file or diagonal.
     */
    function between(a, b) {
        return ray(a, b)
            .intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b)))
            .withoutFirst();
    }

    var IllegalSetup;
    (function (IllegalSetup) {
        IllegalSetup["Empty"] = "ERR_EMPTY";
        IllegalSetup["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
        IllegalSetup["ImpossibleCheck"] = "ERR_IMPOSSIBLE_CHECK";
        IllegalSetup["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
        IllegalSetup["Kings"] = "ERR_KINGS";
        IllegalSetup["Variant"] = "ERR_VARIANT";
    })(IllegalSetup || (IllegalSetup = {}));
    class PositionError extends Error {
    }
    function attacksTo(square, attacker, board, occupied) {
        return board[attacker].intersect(rookAttacks(square, occupied)
            .intersect(board.rooksAndQueens())
            .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
            .union(knightAttacks(square).intersect(board.knight))
            .union(kingAttacks(square).intersect(board.king))
            .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
    }
    function rookCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 3 : 5) : side === 'a' ? 59 : 61;
    }
    class Castles {
        constructor() { }
        static default() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.corners();
            castles.rook = {
                white: { a: 0, h: 7 },
                black: { a: 56, h: 63 },
            };
            castles.path = {
                white: { a: new SquareSet(0xe, 0), h: new SquareSet(0x60, 0) },
                black: { a: new SquareSet(0, 0x0e000000), h: new SquareSet(0, 0x60000000) },
            };
            return castles;
        }
        static empty() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.empty();
            castles.rook = {
                white: { a: undefined, h: undefined },
                black: { a: undefined, h: undefined },
            };
            castles.path = {
                white: { a: SquareSet.empty(), h: SquareSet.empty() },
                black: { a: SquareSet.empty(), h: SquareSet.empty() },
            };
            return castles;
        }
        clone() {
            const castles = new Castles();
            castles.unmovedRooks = this.unmovedRooks;
            castles.rook = {
                white: { a: this.rook.white.a, h: this.rook.white.h },
                black: { a: this.rook.black.a, h: this.rook.black.h },
            };
            castles.path = {
                white: { a: this.path.white.a, h: this.path.white.h },
                black: { a: this.path.black.a, h: this.path.black.h },
            };
            return castles;
        }
        add(color, side, king, rook) {
            const kingTo = kingCastlesTo(color, side);
            const rookTo = rookCastlesTo(color, side);
            this.unmovedRooks = this.unmovedRooks.with(rook);
            this.rook[color][side] = rook;
            this.path[color][side] = between(rook, rookTo)
                .with(rookTo)
                .union(between(king, kingTo).with(kingTo))
                .without(king)
                .without(rook);
        }
        static fromSetup(setup) {
            const castles = Castles.empty();
            const rooks = setup.unmovedRooks.intersect(setup.board.rook);
            for (const color of COLORS) {
                const backrank = SquareSet.backrank(color);
                const king = setup.board.kingOf(color);
                if (!defined(king) || !backrank.has(king))
                    continue;
                const side = rooks.intersect(setup.board[color]).intersect(backrank);
                const aSide = side.first();
                if (defined(aSide) && aSide < king)
                    castles.add(color, 'a', king, aSide);
                const hSide = side.last();
                if (defined(hSide) && king < hSide)
                    castles.add(color, 'h', king, hSide);
            }
            return castles;
        }
        discardRook(square) {
            if (this.unmovedRooks.has(square)) {
                this.unmovedRooks = this.unmovedRooks.without(square);
                for (const color of COLORS) {
                    for (const side of CASTLING_SIDES) {
                        if (this.rook[color][side] === square)
                            this.rook[color][side] = undefined;
                    }
                }
            }
        }
        discardSide(color) {
            this.unmovedRooks = this.unmovedRooks.diff(SquareSet.backrank(color));
            this.rook[color].a = undefined;
            this.rook[color].h = undefined;
        }
    }
    class Position {
        constructor(rules) {
            this.rules = rules;
        }
        kingAttackers(square, attacker, occupied) {
            return attacksTo(square, attacker, this.board, occupied);
        }
        dropDests(_ctx) {
            return SquareSet.empty();
        }
        playCaptureAt(square, captured) {
            this.halfmoves = 0;
            if (captured.role === 'rook')
                this.castles.discardRook(square);
            if (this.pockets)
                this.pockets[opposite(captured.color)][captured.role]++;
        }
        ctx() {
            const variantEnd = this.isVariantEnd();
            const king = this.board.kingOf(this.turn);
            if (!defined(king))
                return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
            const snipers = rookAttacks(king, SquareSet.empty())
                .intersect(this.board.rooksAndQueens())
                .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
                .intersect(this.board[opposite(this.turn)]);
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
            return {
                king,
                blockers,
                checkers,
                variantEnd,
                mustCapture: false,
            };
        }
        // The following should be identical in all subclasses
        clone() {
            var _a, _b;
            const pos = new this.constructor();
            pos.board = this.board.clone();
            pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
            pos.turn = this.turn;
            pos.castles = this.castles.clone();
            pos.epSquare = this.epSquare;
            pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
            pos.halfmoves = this.halfmoves;
            pos.fullmoves = this.fullmoves;
            return pos;
        }
        equalsIgnoreMoves(other) {
            var _a, _b;
            return (this.rules === other.rules &&
                (this.pockets ? this.board.equals(other.board) : this.board.equalsIgnorePromoted(other.board)) &&
                ((other.pockets && ((_a = this.pockets) === null || _a === void 0 ? void 0 : _a.equals(other.pockets))) || (!this.pockets && !other.pockets)) &&
                this.turn === other.turn &&
                this.castles.unmovedRooks.equals(other.castles.unmovedRooks) &&
                this.legalEpSquare() === other.legalEpSquare() &&
                ((other.remainingChecks && ((_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.equals(other.remainingChecks))) ||
                    (!this.remainingChecks && !other.remainingChecks)));
        }
        toSetup() {
            var _a, _b;
            return {
                board: this.board.clone(),
                pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
                turn: this.turn,
                unmovedRooks: this.castles.unmovedRooks,
                epSquare: this.legalEpSquare(),
                remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
                halfmoves: Math.min(this.halfmoves, 150),
                fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
            };
        }
        isInsufficientMaterial() {
            return COLORS.every(color => this.hasInsufficientMaterial(color));
        }
        hasDests(ctx) {
            ctx = ctx || this.ctx();
            for (const square of this.board[this.turn]) {
                if (this.dests(square, ctx).nonEmpty())
                    return true;
            }
            return this.dropDests(ctx).nonEmpty();
        }
        isLegal(move, ctx) {
            if (isDrop(move)) {
                if (!this.pockets || this.pockets[this.turn][move.role] <= 0)
                    return false;
                if (move.role === 'pawn' && SquareSet.backranks().has(move.to))
                    return false;
                return this.dropDests(ctx).has(move.to);
            }
            else {
                if (move.promotion === 'pawn')
                    return false;
                if (move.promotion === 'king' && this.rules !== 'antichess')
                    return false;
                if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to)))
                    return false;
                const dests = this.dests(move.from, ctx);
                return dests.has(move.to) || dests.has(this.normalizeMove(move).to);
            }
        }
        isCheck() {
            const king = this.board.kingOf(this.turn);
            return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
        }
        isEnd(ctx) {
            if (ctx ? ctx.variantEnd : this.isVariantEnd())
                return true;
            return this.isInsufficientMaterial() || !this.hasDests(ctx);
        }
        isCheckmate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
        }
        isStalemate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
        }
        outcome(ctx) {
            const variantOutcome = this.variantOutcome(ctx);
            if (variantOutcome)
                return variantOutcome;
            ctx = ctx || this.ctx();
            if (this.isCheckmate(ctx))
                return { winner: opposite(this.turn) };
            else if (this.isInsufficientMaterial() || this.isStalemate(ctx))
                return { winner: undefined };
            else
                return;
        }
        allDests(ctx) {
            ctx = ctx || this.ctx();
            const d = new Map();
            if (ctx.variantEnd)
                return d;
            for (const square of this.board[this.turn]) {
                d.set(square, this.dests(square, ctx));
            }
            return d;
        }
        castlingSide(move) {
            if (isDrop(move))
                return;
            const delta = move.to - move.from;
            if (Math.abs(delta) !== 2 && !this.board[this.turn].has(move.to))
                return;
            if (!this.board.king.has(move.from))
                return;
            return delta > 0 ? 'h' : 'a';
        }
        normalizeMove(move) {
            const castlingSide = this.castlingSide(move);
            if (!castlingSide)
                return move;
            const rookFrom = this.castles.rook[this.turn][castlingSide];
            return {
                from: move.from,
                to: defined(rookFrom) ? rookFrom : move.to,
            };
        }
        play(move) {
            const turn = this.turn;
            const epSquare = this.epSquare;
            const castlingSide = this.castlingSide(move);
            this.epSquare = undefined;
            this.halfmoves += 1;
            if (turn === 'black')
                this.fullmoves += 1;
            this.turn = opposite(turn);
            if (isDrop(move)) {
                this.board.set(move.to, { role: move.role, color: turn });
                if (this.pockets)
                    this.pockets[turn][move.role]--;
                if (move.role === 'pawn')
                    this.halfmoves = 0;
            }
            else {
                const piece = this.board.take(move.from);
                if (!piece)
                    return;
                let epCapture;
                if (piece.role === 'pawn') {
                    this.halfmoves = 0;
                    if (move.to === epSquare) {
                        epCapture = this.board.take(move.to + (turn === 'white' ? -8 : 8));
                    }
                    const delta = move.from - move.to;
                    if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
                        this.epSquare = (move.from + move.to) >> 1;
                    }
                    if (move.promotion) {
                        piece.role = move.promotion;
                        piece.promoted = true;
                    }
                }
                else if (piece.role === 'rook') {
                    this.castles.discardRook(move.from);
                }
                else if (piece.role === 'king') {
                    if (castlingSide) {
                        const rookFrom = this.castles.rook[turn][castlingSide];
                        if (defined(rookFrom)) {
                            const rook = this.board.take(rookFrom);
                            this.board.set(kingCastlesTo(turn, castlingSide), piece);
                            if (rook)
                                this.board.set(rookCastlesTo(turn, castlingSide), rook);
                        }
                    }
                    this.castles.discardSide(turn);
                    if (castlingSide)
                        return;
                }
                const capture = this.board.set(move.to, piece) || epCapture;
                if (capture)
                    this.playCaptureAt(move.to, capture);
            }
        }
        legalEpSquare(ctx) {
            if (!defined(this.epSquare))
                return;
            ctx = ctx || this.ctx();
            const ourPawns = this.board.pieces(this.turn, 'pawn');
            const candidates = ourPawns.intersect(pawnAttacks(opposite(this.turn), this.epSquare));
            for (const candidate of candidates) {
                if (this.dests(candidate, ctx).has(this.epSquare))
                    return this.epSquare;
            }
            return;
        }
    }
    class Chess extends Position {
        constructor(rules) {
            super(rules || 'chess');
        }
        static default() {
            const pos = new this();
            pos.board = Board.default();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.default();
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            const pos = new this();
            pos.board = setup.board.clone();
            pos.pockets = undefined;
            pos.turn = setup.turn;
            pos.castles = Castles.fromSetup(setup);
            pos.epSquare = pos.validEpSquare(setup.epSquare);
            pos.remainingChecks = undefined;
            pos.halfmoves = setup.halfmoves;
            pos.fullmoves = setup.fullmoves;
            return pos.validate().map(_ => pos);
        }
        clone() {
            return super.clone();
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.king.size() !== 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            if (!defined(this.board.kingOf(this.turn)))
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite(this.turn));
            if (!defined(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return this.validateCheckers();
        }
        validateCheckers() {
            const ourKing = this.board.kingOf(this.turn);
            if (defined(ourKing)) {
                // Multiple sliding checkers aligned with king.
                const checkers = this.kingAttackers(ourKing, opposite(this.turn), this.board.occupied);
                if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing)))
                    return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                // En passant square aligned with checker and king.
                if (defined(this.epSquare)) {
                    for (const checker of checkers) {
                        if (ray(checker, this.epSquare).has(ourKing))
                            return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                    }
                }
            }
            return n.ok(undefined);
        }
        validEpSquare(square) {
            if (!defined(square))
                return;
            const epRank = this.turn === 'white' ? 5 : 2;
            const forward = this.turn === 'white' ? 8 : -8;
            if (squareRank(square) !== epRank)
                return;
            if (this.board.occupied.has(square + forward))
                return;
            const pawn = square - forward;
            if (!this.board.pawn.has(pawn) || !this.board[opposite(this.turn)].has(pawn))
                return;
            return square;
        }
        castlingDest(side, ctx) {
            if (!defined(ctx.king) || ctx.checkers.nonEmpty())
                return SquareSet.empty();
            const rook = this.castles.rook[this.turn][side];
            if (!defined(rook))
                return SquareSet.empty();
            if (this.castles.path[this.turn][side].intersects(this.board.occupied))
                return SquareSet.empty();
            const kingTo = kingCastlesTo(this.turn, side);
            const kingPath = between(ctx.king, kingTo);
            const occ = this.board.occupied.without(ctx.king);
            for (const sq of kingPath) {
                if (this.kingAttackers(sq, opposite(this.turn), occ).nonEmpty())
                    return SquareSet.empty();
            }
            const rookTo = rookCastlesTo(this.turn, side);
            const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
            if (this.kingAttackers(kingTo, opposite(this.turn), after).nonEmpty())
                return SquareSet.empty();
            return SquareSet.fromSquare(rook);
        }
        canCaptureEp(pawn, ctx) {
            if (!defined(this.epSquare))
                return false;
            if (!pawnAttacks(this.turn, pawn).has(this.epSquare))
                return false;
            if (!defined(ctx.king))
                return true;
            const captured = this.epSquare + (this.turn === 'white' ? -8 : 8);
            const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
            return !this.kingAttackers(ctx.king, opposite(this.turn), occupied).intersects(occupied);
        }
        pseudoDests(square, ctx) {
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied);
            if (piece.role === 'pawn') {
                let captureTargets = this.board[opposite(this.turn)];
                if (defined(this.epSquare))
                    captureTargets = captureTargets.with(this.epSquare);
                pseudo = pseudo.intersect(captureTargets);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                return pseudo;
            }
            else {
                pseudo = pseudo.diff(this.board[this.turn]);
            }
            if (square === ctx.king)
                return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
            else
                return pseudo;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo, legal;
            if (piece.role === 'pawn') {
                pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
                    const pawn = this.epSquare - delta;
                    if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() === pawn) {
                        legal = SquareSet.fromSquare(this.epSquare);
                    }
                }
            }
            else if (piece.role === 'bishop')
                pseudo = bishopAttacks(square, this.board.occupied);
            else if (piece.role === 'knight')
                pseudo = knightAttacks(square);
            else if (piece.role === 'rook')
                pseudo = rookAttacks(square, this.board.occupied);
            else if (piece.role === 'queen')
                pseudo = queenAttacks(square, this.board.occupied);
            else
                pseudo = kingAttacks(square);
            pseudo = pseudo.diff(this.board[this.turn]);
            if (defined(ctx.king)) {
                if (piece.role === 'king') {
                    const occ = this.board.occupied.without(square);
                    for (const to of pseudo) {
                        if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty())
                            pseudo = pseudo.without(to);
                    }
                    return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
                }
                if (ctx.checkers.nonEmpty()) {
                    const checker = ctx.checkers.singleSquare();
                    if (!defined(checker))
                        return SquareSet.empty();
                    pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
                }
                if (ctx.blockers.has(square))
                    pseudo = pseudo.intersect(ray(square, ctx.king));
            }
            if (legal)
                pseudo = pseudo.union(legal);
            return pseudo;
        }
        isVariantEnd() {
            return false;
        }
        variantOutcome(_ctx) {
            return;
        }
        hasInsufficientMaterial(color) {
            if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty())
                return false;
            if (this.board[color].intersects(this.board.knight)) {
                return (this.board[color].size() <= 2 &&
                    this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty());
            }
            if (this.board[color].intersects(this.board.bishop)) {
                const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) ||
                    !this.board.bishop.intersects(SquareSet.lightSquares());
                return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
            }
            return true;
        }
    }

    function chessgroundDests(pos, opts) {
        const result = new Map();
        const ctx = pos.ctx();
        for (const [from, squares] of pos.allDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = Array.from(squares, makeSquare);
                if (!(opts === null || opts === void 0 ? void 0 : opts.chess960) && from === ctx.king && squareFile(from) === 4) {
                    // Chessground needs both types of castling dests and filters based on
                    // a rookCastles setting.
                    if (squares.has(0))
                        d.push('c1');
                    else if (squares.has(56))
                        d.push('c8');
                    if (squares.has(7))
                        d.push('g1');
                    else if (squares.has(63))
                        d.push('g8');
                }
                result.set(makeSquare(from), d);
            }
        }
        return result;
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
    function supportedVariant(key) {
        return ['standard', 'chess960', 'kingOfTheHill', 'threeCheck', 'fromPosition'].includes(key);
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
    function lastCaptured(movesGenerator, pieceStyle, prefixStyle) {
        const moves = movesGenerator();
        const oldFen = moves[moves.length - 2];
        const newFen = moves[moves.length - 1];
        if (!oldFen || !newFen) {
            return 'none';
        }
        const oldSplitFen = oldFen.split(' ')[0];
        const newSplitFen = newFen.split(' ')[0];
        for (const p of 'kKqQrRbBnNpP') {
            const diff = oldSplitFen.split(p).length - 1 - (newSplitFen.split(p).length - 1);
            const pcolor = p.toUpperCase() === p ? 'white' : 'black';
            if (diff === 1) {
                const prefix = renderPrefixStyle(pcolor, prefixStyle);
                const piece = renderPieceStyle(p, pieceStyle);
                return prefix + piece;
            }
        }
        return 'none';
    }
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
    function castlingFlavours(input) {
        switch (input.toLowerCase().replace(/[-\s]+/g, '')) {
            case 'oo':
            case '00':
                return 'o-o';
            case 'ooo':
            case '000':
                return 'o-o-o';
        }
        return input;
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
    function lastCapturedCommandHandler(steps, pieceStyle, prefixStyle) {
        return (ev) => {
            const $boardLive = $('.boardstatus');
            if (ev.key === 'c') {
                $boardLive.text();
                $boardLive.text(lastCaptured(steps, pieceStyle, prefixStyle));
                return false;
            }
            return true;
        };
    }
    function possibleMovesHandler(color, fen, pieces) {
        return (ev) => {
            var _a, _b;
            if (ev.key !== 'm' && ev.key !== 'M')
                return true;
            const $boardLive = $('.boardstatus');
            const $pieces = pieces();
            const myTurnFen = color === 'white' ? 'w' : 'b';
            const opponentTurnFen = color === 'white' ? 'b' : 'w';
            const $btn = $(ev.target);
            const $pos = (((_a = $btn.attr('file')) !== null && _a !== void 0 ? _a : '') + $btn.attr('rank'));
            // possible ineffecient to reparse fen; but seems to work when it is AND when it is not the users' turn.
            const possibleMoves = (_b = chessgroundDests(Chess.fromSetup(parseFen(fen().replace(' ' + opponentTurnFen + ' ', ' ' + myTurnFen + ' ')).unwrap()).unwrap())
                .get($pos)) === null || _b === void 0 ? void 0 : _b.map(i => {
                const p = $pieces.get(i);
                return p ? i + ' captures ' + p.role : i;
            }).filter(i => ev.key === 'm' || i.includes('captures'));
            if (!possibleMoves) {
                $boardLive.text('None');
                // if filters out non-capturing moves
            }
            else if (possibleMoves.length === 0) {
                $boardLive.text('No captures');
            }
            else {
                $boardLive.text(possibleMoves.join(', '));
            }
            return false;
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

    const throttled = (sound) => throttle(100, () => lichess.sound.play(sound));

    const selectSound = throttled('select');
    const wrapSound = throttled('wrapAround');
    const borderSound = throttled('outOfBound');
    const errorSound = throttled('error');
    lichess.RoundNVUI = function (redraw) {
        const notify = new Notify(redraw), moveStyle = styleSetting(), prefixStyle = prefixSetting(), pieceStyle = pieceSetting(), positionStyle = positionSetting(), boardStyle = boardSetting();
        lichess.pubsub.on('socket.in.message', line => {
            if (line.u === 'lichess')
                notify.set(line.t);
        });
        lichess.pubsub.on('round.suggestion', notify.set);
        return {
            render(ctrl) {
                const d = ctrl.data, step = plyStep(d, ctrl.ply), style = moveStyle.get(), variantNope = !supportedVariant(d.game.variant.key) && 'Sorry, this variant is not supported in blind mode.';
                if (!ctrl.chessground) {
                    ctrl.setChessground(Chessground(document.createElement('div'), Object.assign(Object.assign({}, makeConfig(ctrl)), { animation: { enabled: false }, drawable: { enabled: false }, coordinates: false })));
                    if (variantNope)
                        setTimeout(() => notify.set(variantNope), 3000);
                }
                return h('div.nvui', {
                    hook: onInsert(_ => setTimeout(() => notify.set(gameText(ctrl)), 2000)),
                }, [
                    h('h1', gameText(ctrl)),
                    h('h2', 'Game info'),
                    ...['white', 'black'].map((color) => h('p', [color + ' player: ', playerHtml(ctrl, ctrl.playerByColor(color))])),
                    h('p', `${d.game.rated ? 'Rated' : 'Casual'} ${d.game.perf}`),
                    d.clock ? h('p', `Clock: ${d.clock.initial / 60} + ${d.clock.increment}`) : null,
                    h('h2', 'Moves'),
                    h('p.moves', {
                        attrs: {
                            role: 'log',
                            'aria-live': 'off',
                        },
                    }, renderMoves(d.steps.slice(1), style)),
                    h('h2', 'Pieces'),
                    h('div.pieces', renderPieces(ctrl.chessground.state.pieces, style)),
                    h('h2', 'Game status'),
                    h('div.status', {
                        attrs: {
                            role: 'status',
                            'aria-live': 'assertive',
                            'aria-atomic': 'true',
                        },
                    }, [ctrl.data.game.status.name === 'started' ? 'Playing' : renderResult(ctrl)]),
                    h('h2', 'Last move'),
                    h('p.lastMove', {
                        attrs: {
                            'aria-live': 'assertive',
                            'aria-atomic': 'true',
                        },
                    }, 
                    // make sure consecutive moves are different so that they get re-read
                    renderSan(step.san, step.uci, style) + (ctrl.ply % 2 === 0 ? '' : ' ')),
                    ...(ctrl.isPlaying()
                        ? [
                            h('h2', 'Move form'),
                            h('form', {
                                hook: onInsert(el => {
                                    const $form = $(el), $input = $form.find('.move').val('');
                                    $input[0].focus();
                                    $form.on('submit', onSubmit(ctrl, notify.set, moveStyle.get, $input));
                                }),
                            }, [
                                h('label', [
                                    d.player.color === d.game.player ? 'Your move' : 'Waiting',
                                    h('input.move.mousetrap', {
                                        attrs: {
                                            name: 'move',
                                            type: 'text',
                                            autocomplete: 'off',
                                            autofocus: true,
                                            disabled: !!variantNope,
                                            title: variantNope,
                                        },
                                    }),
                                ]),
                            ]),
                        ]
                        : []),
                    h('h2', 'Your clock'),
                    h('div.botc', anyClock(ctrl, 'bottom')),
                    h('h2', 'Opponent clock'),
                    h('div.topc', anyClock(ctrl, 'top')),
                    notify.render(),
                    h('h2', 'Actions'),
                    ...(ctrl.data.player.spectator
                        ? renderTableWatch(ctrl)
                        : playable(ctrl.data)
                            ? renderTablePlay(ctrl)
                            : renderTableEnd(ctrl)),
                    h('h2', 'Board'),
                    h('div.board', {
                        hook: onInsert(el => {
                            const $board = $(el);
                            $board.on('keypress', boardCommandsHandler());
                            $board.on('keypress', () => console.log(ctrl));
                            // NOTE: This is the only line different from analysis board listener setup
                            $board.on('keypress', lastCapturedCommandHandler(() => ctrl.data.steps.map(step => step.fen), pieceStyle.get(), prefixStyle.get()));
                            const $buttons = $board.find('button');
                            $buttons.on('click', selectionHandler(ctrl.data.opponent.color, selectSound));
                            $buttons.on('keydown', arrowKeyHandler(ctrl.data.player.color, borderSound));
                            $buttons.on('keypress', possibleMovesHandler(ctrl.data.player.color, ctrl.chessground.getFen, () => ctrl.chessground.state.pieces));
                            $buttons.on('keypress', positionJumpHandler());
                            $buttons.on('keypress', pieceJumpingHandler(wrapSound, errorSound));
                        }),
                    }, renderBoard(ctrl.chessground.state.pieces, ctrl.data.player.color, pieceStyle.get(), prefixStyle.get(), positionStyle.get(), boardStyle.get())),
                    h('div.boardstatus', {
                        attrs: {
                            'aria-live': 'polite',
                            'aria-atomic': 'true',
                        },
                    }, ''),
                    // h('p', takes(ctrl.data.steps.map(data => data.fen))),
                    h('h2', 'Settings'),
                    h('label', ['Move notation', renderSetting(moveStyle, ctrl.redraw)]),
                    h('h3', 'Board Settings'),
                    h('label', ['Piece style', renderSetting(pieceStyle, ctrl.redraw)]),
                    h('label', ['Piece prefix style', renderSetting(prefixStyle, ctrl.redraw)]),
                    h('label', ['Show position', renderSetting(positionStyle, ctrl.redraw)]),
                    h('label', ['Board layout', renderSetting(boardStyle, ctrl.redraw)]),
                    h('h2', 'Commands'),
                    h('p', [
                        'Type these commands in the move input.',
                        h('br'),
                        'c: Read clocks.',
                        h('br'),
                        'l: Read last move.',
                        h('br'),
                        'o: Read name and rating of the opponent.',
                        h('br'),
                        commands.piece.help,
                        h('br'),
                        commands.scan.help,
                        h('br'),
                        'abort: Abort game.',
                        h('br'),
                        'resign: Resign game.',
                        h('br'),
                        'draw: Offer or accept draw.',
                        h('br'),
                        'takeback: Offer or accept take back.',
                        h('br'),
                    ]),
                    h('h2', 'Board Mode commands'),
                    h('p', [
                        'Use these commands when focused on the board itself.',
                        h('br'),
                        'o: announce current position.',
                        h('br'),
                        "c: announce last move's captured piece.",
                        h('br'),
                        'l: announce last move.',
                        h('br'),
                        't: announce clocks.',
                        h('br'),
                        'm: announce possible moves for the selected piece.',
                        h('br'),
                        'shift+m: announce possible moves for the selected pieces which capture..',
                        h('br'),
                        'arrow keys: move left, right, up or down.',
                        h('br'),
                        'kqrbnp/KQRBNP: move forward/backward to a piece.',
                        h('br'),
                        '1-8: move to rank 1-8.',
                        h('br'),
                        'Shift+1-8: move to file a-h.',
                        h('br'),
                    ]),
                    h('h2', 'Promotion'),
                    h('p', [
                        'Standard PGN notation selects the piece to promote to. Example: a8=n promotes to a knight.',
                        h('br'),
                        'Omission results in promotion to queen',
                    ]),
                ]);
            },
        };
    };
    const promotionRegex = /^([a-h]x?)?[a-h](1|8)=\w$/;
    const uciPromotionRegex = /^([a-h][1-8])([a-h](1|8))[qrbn]$/;
    function onSubmit(ctrl, notify, style, $input) {
        return () => {
            let input = castlingFlavours($input.val().trim());
            if (isShortCommand(input))
                input = '/' + input;
            if (input[0] === '/')
                onCommand(ctrl, notify, input.slice(1), style());
            else {
                const d = ctrl.data, legalUcis = destsToUcis(ctrl.chessground.state.movable.dests), legalSans = sanWriter(plyStep(d, ctrl.ply).fen, legalUcis);
                let uci = sanToUci(input, legalSans) || input, promotion = '';
                if (input.match(promotionRegex)) {
                    uci = sanToUci(input.slice(0, -2), legalSans) || input;
                    promotion = input.slice(-1).toLowerCase();
                }
                else if (input.match(uciPromotionRegex)) {
                    uci = input.slice(0, -1);
                    promotion = input.slice(-1).toLowerCase();
                }
                console.log(uci);
                console.log(uci.slice(0, -1));
                console.log(promotion);
                console.log(legalSans);
                if (legalUcis.includes(uci.toLowerCase()))
                    ctrl.socket.send('move', {
                        u: uci + promotion,
                    }, { ackable: true });
                else
                    notify(d.player.color === d.game.player ? `Invalid move: ${input}` : 'Not your turn');
            }
            $input.val('');
            return false;
        };
    }
    const shortCommands = ['c', 'clock', 'l', 'last', 'abort', 'resign', 'draw', 'takeback', 'p', 's', 'o', 'opponent'];
    function isShortCommand(input) {
        return shortCommands.includes(input.split(' ')[0].toLowerCase());
    }
    function onCommand(ctrl, notify, c, style) {
        const lowered = c.toLowerCase();
        if (lowered == 'c' || lowered == 'clock')
            notify($('.nvui .botc').text() + ', ' + $('.nvui .topc').text());
        else if (lowered == 'l' || lowered == 'last')
            notify($('.lastMove').text());
        else if (lowered == 'abort')
            $('.nvui button.abort').trigger('click');
        else if (lowered == 'resign')
            $('.nvui button.resign-confirm').trigger('click');
        else if (lowered == 'draw')
            $('.nvui button.draw-yes').trigger('click');
        else if (lowered == 'takeback')
            $('.nvui button.takeback-yes').trigger('click');
        else if (lowered == 'o' || lowered == 'opponent')
            notify(playerText(ctrl, ctrl.data.opponent));
        else {
            const pieces = ctrl.chessground.state.pieces;
            notify(commands.piece.apply(c, pieces, style) || commands.scan.apply(c, pieces, style) || `Invalid command: ${c}`);
        }
    }
    function anyClock(ctrl, position) {
        const d = ctrl.data, player = ctrl.playerAt(position);
        return ((ctrl.clock && renderClock(ctrl, player, position)) ||
            (d.correspondence && renderCorresClock(ctrl.corresClock, ctrl.trans, player.color, position, d.game.player)) ||
            undefined);
    }
    function destsToUcis(dests) {
        const ucis = [];
        for (const [orig, d] of dests) {
            if (d)
                d.forEach(function (dest) {
                    ucis.push(orig + dest);
                });
        }
        return ucis;
    }
    function sanToUci(san, legalSans) {
        if (san in legalSans)
            return legalSans[san];
        const lowered = san.toLowerCase();
        for (const i in legalSans)
            if (i.toLowerCase() === lowered)
                return legalSans[i];
        return;
    }
    function renderMoves(steps, style) {
        const res = [];
        steps.forEach(s => {
            if (s.ply & 1)
                res.push(Math.ceil(s.ply / 2) + ' ');
            res.push(renderSan(s.san, s.uci, style) + ', ');
            if (s.ply % 2 === 0)
                res.push(h('br'));
        });
        return res;
    }
    function renderAi(ctrl, level) {
        return ctrl.trans('aiNameLevelAiLevel', 'Stockfish', level);
    }
    function playerHtml(ctrl, player) {
        if (player.ai)
            return renderAi(ctrl, player.ai);
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
    function playerText(ctrl, player) {
        if (player.ai)
            return renderAi(ctrl, player.ai);
        const d = ctrl.data, user = player.user, perf = user ? user.perfs[d.game.perf] : null, rating = player.rating ? player.rating : perf && perf.rating;
        if (!user)
            return 'Anonymous';
        return `${user.title || ''} ${user.username} rated ${rating || 'unknown'}`;
    }
    function gameText(ctrl) {
        const d = ctrl.data;
        return [
            d.game.status.name == 'started'
                ? ctrl.isPlaying()
                    ? 'You play the ' + ctrl.data.player.color + ' pieces.'
                    : 'Spectating.'
                : 'Game over.',
            d.game.rated ? 'Rated' : 'Casual',
            d.clock ? `${d.clock.initial / 60} + ${d.clock.increment}` : '',
            d.game.perf,
            'game versus',
            playerText(ctrl, ctrl.data.opponent),
        ].join(' ');
    }

}());
