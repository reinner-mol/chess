(function () {
    'use strict';

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

    const keyRegex = /^[a-h][1-8]$/;
    const fileRegex = /^[a-h]$/;
    const crazyhouseRegex = /^\w?@[a-h][1-8]$/;
    const ambiguousPromotionCaptureRegex = /^([a-h]x?)?[a-h](1|8)$/;
    const promotionRegex = /^([a-h]x?)?[a-h](1|8)=?[nbrqNBRQ]$/;
    lichess.keyboardMove = function (opts) {
        if (opts.input.classList.contains('ready'))
            return;
        opts.input.classList.add('ready');
        let legalSans = null;
        const isKey = (v) => !!v.match(keyRegex);
        const submit = function (v, submitOpts) {
            if (!submitOpts.isTrusted)
                return;
            // consider 0's as O's for castling
            v = v.replace(/0/g, 'O');
            const foundUci = v.length >= 2 && legalSans && sanToUci(v, legalSans);
            if (v == 'resign') {
                opts.ctrl.resign(true, true);
                clear();
            }
            else if (legalSans && foundUci) {
                // ambiguous castle
                if (v.toLowerCase() === 'o-o' && legalSans['O-O-O'] && !submitOpts.force)
                    return;
                // ambiguous UCI
                if (isKey(v) && opts.ctrl.hasSelected())
                    opts.ctrl.select(v);
                // ambiguous promotion (also check legalSans[v] here because bc8 could mean Bc8)
                if (v.match(ambiguousPromotionCaptureRegex) && legalSans[v] && !submitOpts.force)
                    return;
                else
                    opts.ctrl.san(foundUci.slice(0, 2), foundUci.slice(2));
                clear();
            }
            else if (legalSans && isKey(v)) {
                opts.ctrl.select(v);
                clear();
            }
            else if (legalSans && v.match(fileRegex)) ;
            else if (legalSans && v.match(promotionRegex)) {
                const foundUci = sanToUci(v.replace('=', '').slice(0, -1), legalSans);
                if (!foundUci)
                    return;
                opts.ctrl.promote(foundUci.slice(0, 2), foundUci.slice(2), v.slice(-1).toUpperCase());
                clear();
            }
            else if (v.match(crazyhouseRegex)) {
                if (v.length === 3)
                    v = 'P' + v;
                opts.ctrl.drop(v.slice(2), v[0].toUpperCase());
                clear();
            }
            else if (v.length > 0 && 'clock'.startsWith(v.toLowerCase())) {
                if ('clock' === v.toLowerCase()) {
                    readClocks(opts.ctrl.clock());
                    clear();
                }
            }
            else if (submitOpts.yourMove && v.length > 1) {
                setTimeout(() => lichess.sound.play('error'), 500);
                opts.input.value = '';
            }
            else {
                const wrong = v.length && legalSans && !sanCandidates(v, legalSans).length;
                if (wrong && !opts.input.classList.contains('wrong'))
                    lichess.sound.play('error');
                opts.input.classList.toggle('wrong', !!wrong);
            }
        };
        const clear = () => {
            opts.input.value = '';
            opts.input.classList.remove('wrong');
        };
        makeBindings(opts, submit, clear);
        return (fen, dests, yourMove) => {
            legalSans = dests && dests.size > 0 ? sanWriter(fen, destsToUcis(dests)) : null;
            submit(opts.input.value, {
                isTrusted: true,
                yourMove: yourMove,
            });
        };
    };
    function makeBindings(opts, submit, clear) {
        window.Mousetrap.bind('enter', () => opts.input.focus());
        /* keypress doesn't cut it here;
         * at the time it fires, the last typed char
         * is not available yet. Reported by:
         * https://lichess.org/forum/lichess-feedback/keyboard-input-changed-today-maybe-a-bug
         */
        opts.input.addEventListener('keyup', (e) => {
            if (!e.isTrusted)
                return;
            const v = e.target.value;
            if (v.includes('/')) {
                focusChat();
                clear();
            }
            else if (v === '' && e.which == 13)
                opts.ctrl.confirmMove();
            else
                submit(v, {
                    force: e.which === 13,
                    isTrusted: e.isTrusted,
                });
        });
        opts.input.addEventListener('focus', () => opts.ctrl.setFocus(true));
        opts.input.addEventListener('blur', () => opts.ctrl.setFocus(false));
        // prevent default on arrow keys: they only replay moves
        opts.input.addEventListener('keydown', (e) => {
            if (e.which > 36 && e.which < 41) {
                if (e.which == 37)
                    opts.ctrl.jump(-1);
                else if (e.which == 38)
                    opts.ctrl.jump(-999);
                else if (e.which == 39)
                    opts.ctrl.jump(1);
                else
                    opts.ctrl.jump(999);
                e.preventDefault();
            }
        });
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
    function sanCandidates(san, legalSans) {
        // replace '=' in promotion moves (#7326)
        const lowered = san.replace('=', '').toLowerCase();
        return Object.keys(legalSans).filter(function (s) {
            return s.toLowerCase().startsWith(lowered);
        });
    }
    function destsToUcis(dests) {
        const ucis = [];
        for (const [orig, d] of dests) {
            d.forEach(function (dest) {
                ucis.push(orig + dest);
            });
        }
        return ucis;
    }
    function focusChat() {
        const chatInput = document.querySelector('.mchat .mchat__say');
        if (chatInput)
            chatInput.focus();
    }
    function readClocks(clockCtrl) {
        if (!clockCtrl)
            return;
        const msgs = ['white', 'black'].map(color => {
            const time = clockCtrl.millisOf(color);
            const date = new Date(time);
            const msg = (time >= 3600000 ? simplePlural(Math.floor(time / 3600000), 'hour') : '') +
                ' ' +
                simplePlural(date.getUTCMinutes(), 'minute') +
                ' ' +
                simplePlural(date.getUTCSeconds(), 'second');
            return `${color}: ${msg}`;
        });
        lichess.sound.say(msgs.join('. '));
    }
    function simplePlural(nb, word) {
        return `${nb} ${word}${nb != 1 ? 's' : ''}`;
    }

}());
