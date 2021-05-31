var LichessDgt = (function () {
    'use strict';

    function configPage () {
        const form = document.getElementById('dgt-config'), voiceSelector = document.getElementById('dgt-speech-voice');
        (function populateVoiceList() {
            if (typeof speechSynthesis === 'undefined')
                return;
            speechSynthesis.getVoices().forEach((voice, i) => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = voice.name + ' (' + voice.lang + ')';
                if (voice.default)
                    option.textContent += ' -- DEFAULT';
                voiceSelector.appendChild(option);
                if (voice.name == localStorage.getItem('dgt-speech-voice'))
                    voiceSelector.selectedIndex = i;
            });
            speechSynthesis.onvoiceschanged = populateVoiceList;
        })();
        const defaultSpeechKeywords = {
            K: 'King',
            Q: 'Queen',
            R: 'Rook',
            B: 'Bishop',
            N: 'Knight',
            P: 'Pawn',
            x: 'Takes',
            '+': 'Check',
            '#': 'Checkmate',
            '(=)': 'Game ends in draw',
            'O-O-O': 'Castles queenside',
            'O-O': 'Castles kingside',
            white: 'White',
            black: 'Black',
            'wins by': 'wins by',
            timeout: 'timeout',
            resignation: 'resignation',
            illegal: 'illegal',
            move: 'move',
        };
        function ensureDefaults() {
            [
                ['dgt-livechess-url', 'ws://localhost:1982/api/v1.0'],
                ['dgt-speech-keywords', JSON.stringify(defaultSpeechKeywords, undefined, 2)],
                ['dgt-speech-synthesis', 'true'],
                ['dgt-speech-announce-all-moves', 'true'],
                ['dgt-speech-announce-move-format', 'san'],
                ['dgt-verbose', 'false'],
            ].forEach(([k, v]) => {
                if (!localStorage.getItem(k))
                    localStorage.setItem(k, v);
            });
        }
        function populateForm() {
            ['dgt-livechess-url', 'dgt-speech-keywords'].forEach(k => {
                form[k].value = localStorage.getItem(k);
            });
            ['dgt-speech-synthesis', 'dgt-speech-announce-all-moves', 'dgt-verbose'].forEach(k => [true, false].forEach(v => {
                const input = document.getElementById(`${k}_${v}`);
                input.checked = localStorage.getItem(k) == '' + v;
            }));
            ['san', 'uci'].forEach(v => {
                const k = 'dgt-speech-announce-move-format';
                const input = document.getElementById(`${k}_${v}`);
                input.checked = localStorage.getItem(k) == '' + v;
            });
        }
        ensureDefaults();
        populateForm();
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Array.from(new FormData(form).entries()).forEach(([k, v]) => localStorage.setItem(k, v.toString()));
        });
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
    function roleToChar(role) {
        switch (role) {
            case 'pawn':
                return 'p';
            case 'knight':
                return 'n';
            case 'bishop':
                return 'b';
            case 'rook':
                return 'r';
            case 'queen':
                return 'q';
            case 'king':
                return 'k';
        }
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
    function parseUci(str) {
        if (str[1] === '@' && str.length === 4) {
            const role = charToRole(str[0]);
            const to = parseSquare(str.slice(2));
            if (role && defined(to))
                return { role, to };
        }
        else if (str.length === 4 || str.length === 5) {
            const from = parseSquare(str.slice(0, 2));
            const to = parseSquare(str.slice(2, 4));
            let promotion;
            if (str.length === 5) {
                promotion = charToRole(str[4]);
                if (!promotion)
                    return;
            }
            if (defined(from) && defined(to))
                return { from, to, promotion };
        }
        return;
    }
    /**
     * Converts a move to UCI notation, like `g1f3` for a normal move,
     * `a7a8q` for promotion to a queen, and `Q@f7` for a Crazyhouse drop.
     */
    function makeUci(move) {
        if (isDrop(move))
            return `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}`;
        return makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : '');
    }
    function kingCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
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
    function defaultSetup() {
        return {
            board: Board.default(),
            pockets: undefined,
            turn: 'white',
            unmovedRooks: SquareSet.corners(),
            epSquare: undefined,
            remainingChecks: undefined,
            halfmoves: 0,
            fullmoves: 1,
        };
    }

    const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const INITIAL_EPD = INITIAL_BOARD_FEN + ' w KQkq -';
    const INITIAL_FEN = INITIAL_EPD + ' 0 1';
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
    function makePiece(piece, opts) {
        let r = roleToChar(piece.role);
        if (piece.color === 'white')
            r = r.toUpperCase();
        if ((opts === null || opts === void 0 ? void 0 : opts.promoted) && piece.promoted)
            r += '~';
        return r;
    }
    function makeBoardFen(board, opts) {
        let fen = '';
        let empty = 0;
        for (let rank = 7; rank >= 0; rank--) {
            for (let file = 0; file < 8; file++) {
                const square = file + rank * 8;
                const piece = board.get(square);
                if (!piece)
                    empty++;
                else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += makePiece(piece, opts);
                }
                if (file === 7) {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    if (rank !== 0)
                        fen += '/';
                }
            }
        }
        return fen;
    }
    function makePocket(material) {
        return ROLES.map(role => roleToChar(role).repeat(material[role])).join('');
    }
    function makePockets(pocket) {
        return makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
    }
    function makeCastlingFen(board, unmovedRooks, opts) {
        const shredder = opts === null || opts === void 0 ? void 0 : opts.shredder;
        let fen = '';
        for (const color of COLORS) {
            const backrank = SquareSet.backrank(color);
            const king = board.kingOf(color);
            if (!defined(king) || !backrank.has(king))
                continue;
            const candidates = board.pieces(color, 'rook').intersect(backrank);
            for (const rook of unmovedRooks.intersect(candidates).reversed()) {
                if (!shredder && rook === candidates.first() && rook < king) {
                    fen += color === 'white' ? 'Q' : 'q';
                }
                else if (!shredder && rook === candidates.last() && king < rook) {
                    fen += color === 'white' ? 'K' : 'k';
                }
                else {
                    const file = FILE_NAMES[squareFile(rook)];
                    fen += color === 'white' ? file.toUpperCase() : file;
                }
            }
        }
        return fen || '-';
    }
    function makeRemainingChecks(checks) {
        return `${checks.white}+${checks.black}`;
    }
    function makeFen(setup, opts) {
        return [
            makeBoardFen(setup.board, opts) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ''),
            setup.turn[0],
            makeCastlingFen(setup.board, setup.unmovedRooks, opts),
            defined(setup.epSquare) ? makeSquare(setup.epSquare) : '-',
            ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
            ...((opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]),
        ].join(' ');
    }

    function makeSanWithoutSuffix(pos, move) {
        let san = '';
        if (isDrop(move)) {
            if (move.role !== 'pawn')
                san = roleToChar(move.role).toUpperCase();
            san += '@' + makeSquare(move.to);
        }
        else {
            const role = pos.board.getRole(move.from);
            if (!role)
                return '--';
            if (role === 'king' && (pos.board[pos.turn].has(move.to) || Math.abs(move.to - move.from) === 2)) {
                san = move.to > move.from ? 'O-O' : 'O-O-O';
            }
            else {
                const capture = pos.board.occupied.has(move.to) || (role === 'pawn' && squareFile(move.from) !== squareFile(move.to));
                if (role !== 'pawn') {
                    san = roleToChar(role).toUpperCase();
                    // Disambiguation
                    let others;
                    if (role === 'king')
                        others = kingAttacks(move.to).intersect(pos.board.king);
                    else if (role === 'queen')
                        others = queenAttacks(move.to, pos.board.occupied).intersect(pos.board.queen);
                    else if (role === 'rook')
                        others = rookAttacks(move.to, pos.board.occupied).intersect(pos.board.rook);
                    else if (role === 'bishop')
                        others = bishopAttacks(move.to, pos.board.occupied).intersect(pos.board.bishop);
                    else
                        others = knightAttacks(move.to).intersect(pos.board.knight);
                    others = others.intersect(pos.board[pos.turn]).without(move.from);
                    if (others.nonEmpty()) {
                        const ctx = pos.ctx();
                        for (const from of others) {
                            if (!pos.dests(from, ctx).has(move.to))
                                others = others.without(from);
                        }
                        if (others.nonEmpty()) {
                            let row = false;
                            let column = others.intersects(SquareSet.fromRank(squareRank(move.from)));
                            if (others.intersects(SquareSet.fromFile(squareFile(move.from))))
                                row = true;
                            else
                                column = true;
                            if (column)
                                san += FILE_NAMES[squareFile(move.from)];
                            if (row)
                                san += RANK_NAMES[squareRank(move.from)];
                        }
                    }
                }
                else if (capture)
                    san = FILE_NAMES[squareFile(move.from)];
                if (capture)
                    san += 'x';
                san += makeSquare(move.to);
                if (move.promotion)
                    san += '=' + roleToChar(move.promotion).toUpperCase();
            }
        }
        return san;
    }
    function makeSanAndPlay(pos, move) {
        var _a;
        const san = makeSanWithoutSuffix(pos, move);
        pos.play(move);
        if ((_a = pos.outcome()) === null || _a === void 0 ? void 0 : _a.winner)
            return san + '#';
        if (pos.isCheck())
            return san + '+';
        return san;
    }
    function makeSan(pos, move) {
        return makeSanAndPlay(pos.clone(), move);
    }
    function parseSan(pos, san) {
        const ctx = pos.ctx();
        // Castling
        let castlingSide;
        if (san === 'O-O' || san === 'O-O+' || san === 'O-O#')
            castlingSide = 'h';
        else if (san === 'O-O-O' || san === 'O-O-O+' || san === 'O-O-O#')
            castlingSide = 'a';
        if (castlingSide) {
            const rook = pos.castles.rook[pos.turn][castlingSide];
            if (!defined(ctx.king) || !defined(rook) || !pos.dests(ctx.king, ctx).has(rook))
                return;
            return {
                from: ctx.king,
                to: rook,
            };
        }
        // Normal move
        const match = san.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);
        if (!match) {
            // Drop
            const match = san.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);
            if (!match)
                return;
            const move = {
                role: charToRole(match[1]) || 'pawn',
                to: parseSquare(match[2]),
            };
            return pos.isLegal(move, ctx) ? move : undefined;
        }
        const role = charToRole(match[1]) || 'pawn';
        const to = parseSquare(match[4]);
        const promotion = charToRole(match[5]);
        if (!!promotion !== (role === 'pawn' && SquareSet.backranks().has(to)))
            return;
        if (promotion === 'king' && pos.rules !== 'antichess')
            return;
        let candidates = pos.board.pieces(pos.turn, role);
        if (match[2])
            candidates = candidates.intersect(SquareSet.fromFile(match[2].charCodeAt(0) - 'a'.charCodeAt(0)));
        if (match[3])
            candidates = candidates.intersect(SquareSet.fromRank(match[3].charCodeAt(0) - '1'.charCodeAt(0)));
        // Optimization: Reduce set of candidates
        const pawnAdvance = role === 'pawn' ? SquareSet.fromFile(squareFile(to)) : SquareSet.empty();
        candidates = candidates.intersect(pawnAdvance.union(attacks({ color: opposite(pos.turn), role }, to, pos.board.occupied)));
        // Check uniqueness and legality
        let from;
        for (const candidate of candidates) {
            if (pos.dests(candidate, ctx).has(to)) {
                if (defined(from))
                    return; // Ambiguous
                from = candidate;
            }
        }
        if (!defined(from))
            return; // Illegal
        return {
            from,
            to,
            promotion,
        };
    }

    function piece(piece) {
        return makePiece(piece);
    }
    function board(board) {
        const r = [];
        for (let y = 7; y >= 0; y--) {
            for (let x = 0; x < 8; x++) {
                const square = x + y * 8;
                const p = board.get(square);
                const col = p ? piece(p) : '.';
                r.push(col);
                r.push(x < 7 ? (col.length < 2 ? ' ' : '') : '\n');
            }
        }
        return r.join('');
    }

    function playPage (token) {
        const root = document.getElementById('dgt-play-zone');
        const consoleOutput = document.getElementById('dgt-play-zone-log');
        /**
         * CONFIGURATION VALUES
         */
        const liveChessURL = localStorage.getItem('dgt-livechess-url');
        const announceAllMoves = localStorage.getItem('dgt-speech-announce-all-moves') == 'true';
        const verbose = localStorage.getItem('dgt-verbose') == 'true';
        const announceMoveFormat = localStorage.getItem('dgt-speech-announce-move-format')
            ? localStorage.getItem('dgt-speech-announce-move-format')
            : 'san';
        const speechSynthesisOn = localStorage.getItem('dgt-speech-synthesis') == 'true';
        const voice = localStorage.getItem('dgt-speech-voice');
        let keywords = {
            K: 'King',
            Q: 'Queen',
            R: 'Rook',
            B: 'Bishop',
            N: 'Knight',
            P: 'Pawn',
            x: 'Takes',
            '+': 'Check',
            '#': 'Checkmate',
            '(=)': 'Game ends in draw',
            'O-O-O': 'Castles queenside',
            'O-O': 'Castles kingside',
            white: 'White',
            black: 'Black',
            'wins by': 'wins by',
            timeout: 'timeout',
            resignation: 'resignation',
            illegal: 'illegal',
            move: 'move',
        };
        try {
            if (JSON.parse(localStorage.getItem('dgt-speech-keywords')).K.length > 0) {
                keywords = JSON.parse(localStorage.getItem('dgt-speech-keywords'));
            }
            else {
                console.warn('JSON Object for Speech Keywords seems incomplete. Using English default.');
            }
        }
        catch (error) {
            console.error('Invalid JSON Object for Speech Keywords. Using English default. ' + Error(error).message);
        }
        //Lichess Integration with Board API
        /**
         * GLOBAL VARIABLES - Lichess Connectivity
         */
        const time = new Date(); //A Global time object
        let currentGameId = ''; //Track which is the current Game, in case there are several open games
        let currentGameColor = ''; //Track which color is being currently played by the player. 'white' or 'black'
        let me; //Track my information
        const gameInfoMap = new Map(); //A collection of key values to store game immutable information of all open games
        const gameStateMap = new Map(); //A collection of key values to store the changing state of all open games
        const gameConnectionMap = new Map(); //A collection of key values to store the network status of a game
        const gameChessBoardMap = new Map(); //A collection of chessops Boards representing the current board of the games
        let eventSteamStatus = { connected: false, lastEvent: time.getTime() }; //An object to store network status of the main eventStream
        const keywordsBase = [
            'white',
            'black',
            'K',
            'Q',
            'R',
            'B',
            'N',
            'P',
            'x',
            '+',
            '#',
            '(=)',
            'O-O-O',
            'O-O',
            'wins by',
            'timeout',
            'resignation',
            'illegal',
            'move',
        ];
        let lastSanMove; //Track last move in SAN format. This is because there is no easy way to keep history of san moves
        /**
         * Global Variables for DGT Board Connection (JACM)
         */
        let localBoard = startingPosition(); //Board with valid moves played on Lichess and DGT Board. May be half move behind Lichess or half move in advance
        let DGTgameId = ''; //Used to track if DGT board was setup already with the lichess currentGameId
        let boards = Array(); //An array to store all the board recognized by DGT LiveChess
        let liveChessConnection; //Connection Object to LiveChess through websocket
        let isLiveChessConnected = false; //Used to track if a board there is a connection to DGT Live Chess
        let currentSerialnr = '0'; //Public property to store the current serial number of the DGT Board in case there is more than one
        //subscription stores the information about the board being connected, most importantly the serialnr
        const subscription = { id: 2, call: 'subscribe', param: { feed: 'eboardevent', id: 1, param: { serialnr: '' } } };
        let lastLegalParam; //This can help prevent duplicate moves from LiveChess being detected as move from the other side, like a duplicate O-O
        let lastLiveChessBoard; //Store last Board received by LiveChess
        /***
         * Bind console output to HTML pre Element
         */
        rewireLoggingToElement(consoleOutput, root, true);
        function rewireLoggingToElement(eleLocator, eleOverflowLocator, autoScroll) {
            //Clear the console
            eleLocator.innerHTML = '';
            //Bind to all types of console messages
            fixLoggingFunc('log');
            fixLoggingFunc('debug');
            fixLoggingFunc('warn');
            fixLoggingFunc('error');
            fixLoggingFunc('info');
            fixLoggingFunc('table');
            function fixLoggingFunc(name) {
                console['old' + name] = console[name];
                //Rewire function
                console[name] = function () {
                    //Return a promise so execution is not delayed by string manipulation
                    return new Promise(resolve => {
                        let output = '';
                        for (let i = 0; i < arguments.length; i++) {
                            const arg = arguments[i];
                            if (arg == '*' || arg == ':') {
                                output += arg;
                            }
                            else {
                                output += '</br><span class="log-' + typeof arg + ' log-' + name + '">';
                                if (typeof arg === 'object') {
                                    output += JSON.stringify(arg);
                                }
                                else {
                                    output += arg;
                                }
                                output += '</span>&nbsp;';
                            }
                        }
                        //Added to keep on-screen log small
                        const maxLogBytes = verbose ? -1048576 : -8192;
                        let isScrolledToBottom = false;
                        if (autoScroll) {
                            isScrolledToBottom =
                                eleOverflowLocator.scrollHeight - eleOverflowLocator.clientHeight <= eleOverflowLocator.scrollTop + 1;
                        }
                        eleLocator.innerHTML = eleLocator.innerHTML.slice(maxLogBytes) + output;
                        if (isScrolledToBottom) {
                            eleOverflowLocator.scrollTop = eleOverflowLocator.scrollHeight - eleOverflowLocator.clientHeight;
                        }
                        //Call original function
                        try {
                            console['old' + name].apply(undefined, arguments);
                        }
                        catch (_a) {
                            console['olderror'].apply(undefined, ['Error when logging']);
                        }
                        resolve();
                    });
                };
            }
        }
        /**
         * Wait some time without blocking other code
         *
         * @param {number} ms - The number of milliseconds to sleep
         */
        function sleep(ms = 0) {
            return new Promise(r => setTimeout(r, ms));
        }
        /**
         * GET /api/account
         *
         * Get my profile
         *
         * Shows Public information about the logged in user.
         *
         * Example
         * {"id":"andrescavallin","username":"andrescavallin","online":true,"perfs":{"blitz":{"games":0,"rating":1500,"rd":350,"prog":0,"prov":true},"bullet":{"games":0,"rating":1500,"rd":350,"prog":0,"prov":true},"correspondence":{"games":0,"rating":1500,"rd":350,"prog":0,"prov":true},"classical":{"games":0,"rating":1500,"rd":350,"prog":0,"prov":true},"rapid":{"games":0,"rating":1500,"rd":350,"prog":0,"prov":true}},"createdAt":1599930231644,"seenAt":1599932744930,"playTime":{"total":0,"tv":0},"language":"en-US","url":"http://localhost:9663/@/andrescavallin","nbFollowing":0,"nbFollowers":0,"count":{"all":0,"rated":0,"ai":0,"draw":0,"drawH":0,"loss":0,"lossH":0,"win":0,"winH":0,"bookmark":0,"playing":0,"import":0,"me":0},"followable":true,"following":false,"blocking":false,"followsYou":false}
         * */
        function getProfile() {
            //Log intention
            if (verbose)
                console.log('getProfile - About to call /api/account');
            fetch('/api/account', {
                headers: { Authorization: 'Bearer ' + token },
            })
                .then(r => r.json())
                .then(data => {
                //Store my profile
                me = data;
                //Log raw data received
                if (verbose)
                    console.log('/api/account Response:' + JSON.stringify(data));
                //Display Title + UserName . Title may be undefined
                console.log('┌─────────────────────────────────────────────────────┐');
                console.log('│ ' + (typeof data.title == 'undefined' ? '' : data.title) + ' ' + data.username);
                //Display performance ratings
                console.table(data.perfs);
            })
                .catch(err => {
                console.error('getProfile - Error. ' + err.message);
            });
        }
        /**
          GET /api/stream/event
          Stream incoming events
      
          Stream the events reaching a lichess user in real time as ndjson.
      
          Each line is a JSON object containing a type field. Possible values are:
      
          challenge Incoming challenge
          gameStart Start of a game
          gameFinish to signal that game ended
          When the stream opens, all current challenges and games are sent.
      
          Examples:
          {"type":"gameStart","game":{"id":"kjKzl2MO"}}
          {"type":"challenge","challenge":{"id":"WTr3JNcm","status":"created","challenger":{"id":"andrescavallin","name":"andrescavallin","title":null,"rating":1362,"provisional":true,"online":true,"lag":3},"destUser":{"id":"godking666","name":"Godking666","title":null,"rating":1910,"online":true,"lag":3},"variant":{"key":"standard","name":"Standard","short":"Std"},"rated":false,"speed":"rapid","timeControl":{"type":"clock","limit":900,"increment":10,"show":"15+10"},"color":"white","perf":{"icon":"#","name":"Rapid"}}}
          {"type":"gameFinish","game":{"id":"MhG878ij"}}
       */
        async function connectToEventStream() {
            //Log intention
            if (verbose)
                console.log('connectToEventStream - About to call /api/stream/event');
            const response = await fetch('/api/stream/event', {
                headers: { Authorization: 'Bearer ' + token },
            });
            //Sadly TextDecoderStream is not supported on FireFox so a decoder is needed
            //const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                if (verbose && value.length > 1)
                    console.log('connectToEventStream - Chunk received', decoder.decode(value));
                //Update connection status
                eventSteamStatus = { connected: true, lastEvent: time.getTime() };
                //Response may contain several JSON objects on the same chunk separated by \n . This may create an empty element at the end.
                const jsonArray = value ? decoder.decode(value).split('\n') : [];
                for (let i = 0; i < jsonArray.length; i++) {
                    //Skip empty elements that may have happened with the .split('\n')
                    if (jsonArray[i].length > 2) {
                        try {
                            const data = JSON.parse(jsonArray[i]);
                            //JSON data found, let's check if this is a game that started. field type is mandatory except on http 4xx
                            if (data.type == 'gameStart') {
                                if (verbose)
                                    console.log('connectToEventStream - gameStart event arrived. GameId: ' + data.game.id);
                                try {
                                    //Connect to that game's stream
                                    connectToGameStream(data.game.id);
                                }
                                catch (error) {
                                    //This will trigger if connectToGameStream fails
                                    console.error('connectToEventStream - Failed to connect to game stream. ' + Error(error).message);
                                }
                            }
                            else if (data.type == 'challenge') {
                                //Challenge received
                                //TODO
                            }
                            else if (data.type == 'gameFinish') {
                                //Game Finished
                                //TODO Handle this event
                            }
                            else if (response.status >= 400) {
                                console.warn('connectToEventStream - ' + data.error);
                            }
                        }
                        catch (error) {
                            console.error('connectToEventStream - Unable to parse JSON or Unexpected error. ' + Error(error).message);
                        }
                    }
                    else {
                        //Signal that some empty message arrived. This is normal to keep the connection alive.
                        if (verbose)
                            console.log('*'); //process.stdout.write("*"); Replace to support browser
                    }
                }
            }
            console.warn('connectToEventStream - Event Stream ended by server');
            //Update connection status
            eventSteamStatus = { connected: false, lastEvent: time.getTime() };
        }
        /**
        Stream Board game state
         
        GET /api/board/game/stream/{gameId}
         
        Stream the state of a game being played with the Board API, as ndjson.
        Use this endpoint to get updates about the game in real-time, with a single request.
        Each line is a JSON object containing a type field. Possible values are:
         
        gameFull Full game data. All values are immutable, except for the state field.
        gameState Current state of the game. Immutable values not included. Sent when a move is played, a draw is offered, or when the game ends.
        chatLine Chat message sent by a user in the room "player" or "spectator".
        The first line is always of type gameFull.
         
        Examples:
         
        New Game
        {"id":"972RKuuq","variant":{"key":"standard","name":"Standard","short":"Std"},"clock":{"initial":900000,"increment":10000},"speed":"rapid","perf":{"name":"Rapid"},"rated":false,"createdAt":1586647003562,"white":{"id":"godking666","name":"Godking666","title":null,"rating":1761},"black":{"id":"andrescavallin","name":"andrescavallin","title":null,"rating":1362,"provisional":true},"initialFen":"startpos","type":"gameFull","state":{"type":"gameState","moves":"e2e4","wtime":900000,"btime":900000,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"started"}}
        First Move
        {"type":"gameState","moves":"e2e4","wtime":900000,"btime":900000,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"started"}
        Middle Game
        {"type":"gameState","moves":"e2e4 c7c6 g1f3 d7d5 e4e5 c8f5 d2d4 e7e6 h2h3 f5e4 b1d2 f8b4 c2c3 b4a5 d2e4 d5e4 f3d2 d8h4 g2g3 h4e7 d2e4 e7d7 e4d6 e8f8 d1f3 g8h6 c1h6 h8g8 h6g5 a5c7 e1c1 c7d6 e5d6 d7d6 g5f4 d6d5 f3d5 c6d5 f4d6 f8e8 d6b8 a8b8 f1b5 e8f8 h1e1 f8e7 d1d3 a7a6 b5a4 g8c8 a4b3 b7b5 b3d5 e7f8","wtime":903960,"btime":847860,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"started"}
        After reconnect
        {"id":"ZQDjy4sa","variant":{"key":"standard","name":"Standard","short":"Std"},"clock":{"initial":900000,"increment":10000},"speed":"rapid","perf":{"name":"Rapid"},"rated":true,"createdAt":1586643869056,"white":{"id":"gg60","name":"gg60","title":null,"rating":1509},"black":{"id":"andrescavallin","name":"andrescavallin","title":null,"rating":1433,"provisional":true},"initialFen":"startpos","type":"gameFull","state":{"type":"gameState","moves":"e2e4 c7c6 g1f3 d7d5 e4e5 c8f5 d2d4 e7e6 h2h3 f5e4 b1d2 f8b4 c2c3 b4a5 d2e4 d5e4 f3d2 d8h4 g2g3 h4e7 d2e4 e7d7 e4d6 e8f8 d1f3 g8h6 c1h6 h8g8 h6g5 a5c7 e1c1 c7d6 e5d6 d7d6 g5f4 d6d5 f3d5 c6d5 f4d6 f8e8 d6b8 a8b8 f1b5 e8f8 h1e1 f8e7 d1d3 a7a6 b5a4 g8c8 a4b3 b7b5 b3d5 e7f8 d5b3 a6a5 a2a3 a5a4 b3a2 f7f6 e1e6 f8f7 e6b6","wtime":912940,"btime":821720,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"resign","winner":"white"}}
        Draw Offered
        {"type":"gameState","moves":"e2e4 c7c6","wtime":880580,"btime":900000,"winc":10000,"binc":10000,"wdraw":false,"bdraw":true,"status":"started"}
        After draw accepted
        {"type":"gameState","moves":"e2e4 c7c6","wtime":865460,"btime":900000,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"draw"}
        Out of Time
        {"type":"gameState","moves":"e2e3 e7e5","wtime":0,"btime":900000,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"outoftime","winner":"black"}
        Mate
        {"type":"gameState","moves":"e2e4 e7e5 f1c4 d7d6 d1f3 b8c6 f3f7","wtime":900480,"btime":907720,"winc":10000,"binc":10000,"wdraw":false,"bdraw":false,"status":"mate"}
        Promotion
        {"type":"gameState","moves":"e2e4 b8c6 g1f3 c6d4 f1c4 e7e5 d2d3 d7d5 f3d4 f7f6 c4d5 f6f5 f2f3 g7g6 e1g1 c7c6 d5b3 d8d5 e4d5 a8b8 d4e6 f8b4 e6c7 e8e7 d5d6 e7f6 d6d7 b4f8 d7d8q","wtime":2147483647,"btime":2147483647,"winc":0,"binc":0,"wdraw":false,"bdraw":false,"status":"started"}
        @param {string} gameId - The alphanumeric identifier of the game to be tracked
         */
        async function connectToGameStream(gameId) {
            //Log intention
            if (verbose)
                console.log('connectToGameStream - About to call /api/board/game/stream/' + gameId);
            const response = await fetch('/api/board/game/stream/' + gameId, {
                headers: { Authorization: 'Bearer ' + token },
            });
            //Again, TextDecoderStream is not supported on FireFox
            //const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (reader) {
                //while (true)
                const { value, done } = await reader.read();
                if (done)
                    break;
                //Log raw data received
                if (verbose && value.length > 1)
                    console.log('connectToGameStream - board game stream received:', decoder.decode(value));
                //Update connection status
                gameConnectionMap.set(gameId, { connected: true, lastEvent: time.getTime() });
                //Response may contain several JSON objects on the same chunk separated by \n . This may create an empty element at the end.
                const jsonArray = decoder.decode(value).split('\n');
                for (let i = 0; i < jsonArray.length; i++) {
                    //Skip empty elements that may have happened with the .split('\n')
                    if (jsonArray[i].length > 2) {
                        try {
                            const data = JSON.parse(jsonArray[i]);
                            //The first line is always of type gameFull.
                            if (data.type == 'gameFull') {
                                if (!verbose)
                                    console.clear();
                                //Log game Summary
                                //logGameSummary(data);
                                //Store game inmutable information on the gameInfoMap dictionary collection
                                gameInfoMap.set(gameId, data);
                                //Store game state on the gameStateMap dictionary collection
                                gameStateMap.set(gameId, data.state);
                                //Update the ChessBoard to the ChessBoard Map
                                initializeChessBoard(gameId, data);
                                //Log the state. Note that we are doing this after storing the state and initializing the chessops board
                                logGameState(gameId);
                                //Call chooseCurrentGame to determine if this stream will be the new current game
                                chooseCurrentGame();
                            }
                            else if (data.type == 'gameState') {
                                if (!verbose)
                                    console.clear();
                                //Update the ChessBoard Map
                                updateChessBoard(gameId, gameStateMap.get(gameId), data);
                                //Update game state with most recent state
                                gameStateMap.set(gameId, data);
                                //Log the state. Note that we are doing this after storing the state and updating the chessops board
                                //Update for Multiple Game Support. Log only current game
                                if (gameId == currentGameId) {
                                    logGameState(gameId);
                                }
                                else {
                                    if (verbose)
                                        console.log('connectToGameStream - State received was not for current game.');
                                }
                            }
                            else if (data.type == 'chatLine') {
                                //Received chat line
                                //TODO
                            }
                            else if (response.status >= 400) {
                                console.log('connectToGameStream - ' + data.error);
                            }
                        }
                        catch (error) {
                            console.error('connectToGameStream - No valid game data or Unexpected error. ' + Error(error).message);
                        }
                    }
                    else {
                        //Signal that some empty message arrived
                        if (verbose)
                            console.log(':'); //process.stdout.write(":"); Changed to support browser
                    }
                }
            }
            //End Stream output.end();
            console.warn('connectToGameStream - Game ' + gameId + ' Stream ended.');
            //Update connection state
            gameConnectionMap.set(gameId, { connected: false, lastEvent: time.getTime() });
        }
        /**
         * Return a string representation of the remaining time on the clock
         *
         * @param {number} timer - Numeric representation of remaining time
         *
         * @returns {String} - String representation of numeric time
         */
        function formattedTimer(timer) {
            // Pad function to pad with 0 to 2 or 3 digits, default is 2
            const pad = (n, z = 2) => `00${n}`.slice(-z);
            return pad((timer / 3.6e6) | 0) + ':' + pad(((timer % 3.6e6) / 6e4) | 0) + ':' + pad(((timer % 6e4) / 1000) | 0); //+ '.' + pad(timer % 1000, 3);
        }
        /**
         * mainLoop() is a function that tries to keep the streams connected at all times, up to a maximum of 20 retries
         */
        async function lichessConnectionLoop() {
            //Program ends after 20 re-connection attempts
            for (let attempts = 0; attempts < 20; attempts++) {
                //Connect to main event stream
                connectToEventStream();
                //On the first time, if there are no games, it may take several seconds to receive data so lets wait a bit. Also give some time to connect to started games
                await sleep(5000);
                //Now enter a loop to monitor the connection
                do {
                    //sleep 5 seconds and just listen to events
                    await sleep(5000);
                    //Check if any started games are disconnected
                    for (const [gameId, networkState] of gameConnectionMap) {
                        if (!networkState.connected && gameStateMap.get(gameId).status == 'started') {
                            //Game is not connected and has not finished, reconnect
                            if (verbose)
                                console.log(`Started game is disconnected. Attempting reconnection for gameId: ${gameId}`);
                            connectToGameStream(gameId);
                        }
                    }
                } while (eventSteamStatus.connected);
                //This means event stream is not connected
                console.warn('No connection to event stream. Attempting re-connection. Attempt: ' + attempts);
            }
            console.error('No connection to event stream after maximum number of attempts 20. Reload page to start again.');
        }
        /**
         * This function will update the currentGameId with a valid active game
         * and then will attach this game to the DGT Board
         * It requires that all maps are up to date: gameInfoMap, gameStateMap, gameConnectionMap and gameChessBoardMap
         */
        async function chooseCurrentGame() {
            //Determine new value for currentGameId. First create an array with only the started games
            //So then there is none or more than one started game
            const playableGames = playableGamesArray();
            //If there is only one started game, then its easy
            /*
            if (playableGames.length == 1) {
              currentGameId = playableGames[0].gameId;
              attachCurrentGameIdToDGTBoard(); //Let the board know which color the player is actually playing and setup the position
              console.log('Active game updated. currentGameId: ' + currentGameId);
            }
            else
            */
            if (playableGames.length == 0) {
                console.log('No started playable games, challenges or games are disconnected. Please start a new game or fix connection.');
                //TODO What happens if the games reconnect and this move is not sent?
            }
            else {
                if (playableGames.length > 1) {
                    console.warn('Multiple active games detected. Current game will be selected based on board position.');
                    console.table(playableGames);
                }
                //Wait a few seconds until board position is received from LiveChess. Max 10 seconds.
                for (let w = 0; w < 10; w++) {
                    if (lastLiveChessBoard !== undefined)
                        break;
                    await sleep(1000);
                }
                if (verbose)
                    console.log(`LiveChess FEN:        ${lastLiveChessBoard}`);
                //Don't default to any game until position matches
                let index = -1;
                for (let i = 0; i < playableGames.length; i++) {
                    //makeBoardFen return only the board, ideal for comparison
                    const tmpFEN = makeBoardFen(gameChessBoardMap.get(playableGames[i].gameId).board);
                    if (verbose)
                        console.log(`GameId: ${playableGames[i].gameId} FEN: ${tmpFEN}`);
                    if (tmpFEN == lastLiveChessBoard) {
                        index = i;
                    }
                }
                if (index == -1) {
                    console.error('Position on board does not match any ongoing game.');
                    //No position match found
                    if (gameStateMap.has(currentGameId) &&
                        gameConnectionMap.get(currentGameId).connected &&
                        gameStateMap.get(currentGameId).status == 'started') {
                        //No match found but there is a valid currentGameId , so keep it
                        if (verbose)
                            console.log('chooseCurrentGame - Board will remain attached to current game. currentGameId: ' + currentGameId);
                    }
                    else {
                        //No match and No valid current game but there are active games
                        console.warn('Fix position and reload or start a new game. Automatically retrying in 5 seconds...');
                        await sleep(5000);
                        chooseCurrentGame();
                    }
                }
                else {
                    //Position match found
                    if (currentGameId != playableGames[Number(index)].gameId) {
                        //This is the happy path, board matches and game needs to be updated
                        if (verbose)
                            console.log('chooseCurrentGame - Position matched to gameId: ' + playableGames[Number(index)].gameId);
                        currentGameId = playableGames[Number(index)].gameId;
                        attachCurrentGameIdToDGTBoard(); //Let the board know which color the player is actually playing and setup the position
                        console.log('Active game updated. currentGameId: ' + currentGameId);
                    }
                    else {
                        //The board matches currentGameId . No need to do anything.
                        if (verbose)
                            console.log('chooseCurrentGame - Board will remain attached to current game. currentGameId: ' + currentGameId);
                    }
                }
            }
        }
        /**
         * Initialize a ChessBoard when connecting or re-connecting to a game
         *
         * @param {string} gameId - The gameId of the game to store on the board
         * @param {Object} data - The gameFull event from lichess.org
         */
        function initializeChessBoard(gameId, data) {
            try {
                let initialFen = INITIAL_FEN;
                if (data.initialFen != 'startpos')
                    initialFen = data.initialFen;
                const setup = parseFen(initialFen).unwrap();
                const chess = Chess.fromSetup(setup).unwrap();
                const moves = data.state.moves.split(' ');
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i] != '') {
                        //Make any move that may have been already played on the ChessBoard. Useful when reconnecting
                        const uciMove = parseUci(moves[i]);
                        const normalizedMove = chess.normalizeMove(uciMove); //This is because chessops uses UCI_960
                        if (normalizedMove && chess.isLegal(normalizedMove))
                            chess.play(normalizedMove);
                    }
                }
                //Store the ChessBoard on the ChessBoardMap
                gameChessBoardMap.set(gameId, chess);
                if (verbose)
                    console.log(`initializeChessBoard - New Board for gameId: ${gameId}`);
                if (verbose)
                    console.log(board(chess.board));
                if (verbose)
                    console.log(chess.turn + "'s turn");
            }
            catch (error) {
                console.error(`initializeChessBoard - Error: ${error.message}`);
            }
        }
        /**
         * Update the ChessBoard for the specified gameId with the new moves on newState since the last stored state
         *
         * @param {string} gameId - The gameId of the game to store on the board
         * @param {Object} currentState - The state stored on the gameStateMap
         * @param {Object} newState - The new state not yet stored
         */
        function updateChessBoard(gameId, currentState, newState) {
            try {
                const chess = gameChessBoardMap.get(gameId);
                if (chess) {
                    let pendingMoves;
                    if (!currentState.moves) {
                        //No prior moves. Use the new moves
                        pendingMoves = newState.moves;
                    }
                    else {
                        //Get all the moves on the newState that are not present on the currentState
                        pendingMoves = newState.moves.substring(currentState.moves.length, newState.moves.length);
                    }
                    const moves = pendingMoves.split(' ');
                    for (let i = 0; i < moves.length; i++) {
                        if (moves[i] != '') {
                            //Make the new move
                            const uciMove = parseUci(moves[i]);
                            const normalizedMove = chess.normalizeMove(uciMove); //This is because chessops uses UCI_960
                            if (normalizedMove && chess.isLegal(normalizedMove)) {
                                //This is a good chance to get the move in SAN format
                                if (chess.turn == 'black')
                                    lastSanMove = {
                                        player: 'black',
                                        move: makeSan(chess, normalizedMove),
                                        by: gameInfoMap.get(currentGameId).black.id,
                                    };
                                else
                                    lastSanMove = {
                                        player: 'white',
                                        move: makeSan(chess, normalizedMove),
                                        by: gameInfoMap.get(currentGameId).white.id,
                                    };
                                chess.play(normalizedMove);
                            }
                        }
                    }
                    //Store the ChessBoard on the ChessBoardMap
                    if (verbose)
                        console.log(`updateChessBoard - Updated Board for gameId: ${gameId}`);
                    if (verbose)
                        console.log(board(chess.board));
                    if (verbose)
                        console.log(chess.turn + "'s turn");
                }
            }
            catch (error) {
                console.error(`updateChessBoard - Error: ${error.message}`);
            }
        }
        /**
         * Utility function to update which color is being played with the board
         */
        function attachCurrentGameIdToDGTBoard() {
            //Every times a new game is connected clear the console except on verbose
            if (!verbose)
                consoleOutput.innerHTML = '';
            //
            if (me.id == gameInfoMap.get(currentGameId).white.id)
                currentGameColor = 'white';
            else
                currentGameColor = 'black';
            //Send the position to LiveChess for synchronization
            sendBoardToLiveChess(gameChessBoardMap.get(currentGameId));
        }
        /**
         * Iterate the gameConnectionMap dictionary and return an arrays containing only the games that can be played with the board
         * @returns {Array} - Array containing a summary of playable games
         */
        function playableGamesArray() {
            var _a, _b;
            const playableGames = [];
            const keys = Array.from(gameConnectionMap.keys());
            //The for each iterator is not used since we don't want to continue execution. We want a synchronous result
            //for (let [gameId, networkState] of gameConnectionMap) {
            //    if (gameConnectionMap.get(gameId).connected && gameStateMap.get(gameId).status == "started") {
            for (let i = 0; i < keys.length; i++) {
                if (((_a = gameConnectionMap.get(keys[i])) === null || _a === void 0 ? void 0 : _a.connected) && ((_b = gameStateMap.get(keys[i])) === null || _b === void 0 ? void 0 : _b.status) == 'started') {
                    //Game is good for commands
                    const gameInfo = gameInfoMap.get(keys[i]);
                    //var gameState = gameStateMap.get(keys[i]);
                    const lastMove = getLastUCIMove(keys[i]);
                    const versus = gameInfo.black.id == me.id
                        ? (gameInfo.white.title !== null ? gameInfo.white.title : '@') + ' ' + gameInfo.white.name
                        : (gameInfo.black.title !== null ? gameInfo.black.title : '@') + ' ' + gameInfo.black.name;
                    playableGames.push({
                        gameId: gameInfo.id,
                        versus: versus,
                        'vs rating': gameInfo.black.id == me.id ? gameInfo.white.rating : gameInfo.black.rating,
                        'game rating': gameInfo.variant.short + ' ' + (gameInfo.rated ? 'rated' : 'unrated'),
                        Timer: gameInfo.speed +
                            ' ' +
                            (gameInfo.clock !== null
                                ? String(gameInfo.clock.initial / 60000) + "'+" + String(gameInfo.clock.increment / 1000) + "''"
                                : '∞'),
                        'Last Move': lastMove.player + ' ' + lastMove.move + ' by ' + lastMove.by,
                    });
                }
            }
            return playableGames;
        }
        /**
         * Display the state as stored in the Dictionary collection
         *
         * @param {string} gameId - The alphanumeric identifier of the game for which state is going to be shown
         */
        function logGameState(gameId) {
            if (gameStateMap.has(gameId) && gameInfoMap.has(gameId)) {
                const gameInfo = gameInfoMap.get(gameId);
                const gameState = gameStateMap.get(gameId);
                const lastMove = getLastUCIMove(gameId);
                console.log(''); //process.stdout.write("\n"); Changed to support browser
                /* Log before migrating to browser
                if (verbose) console.table({
                  'Title': { white: ((gameInfo.white.title !== null) ? gameInfo.white.title : '@'), black: ((gameInfo.black.title !== null) ? gameInfo.black.title : '@'), game: 'Id: ' + gameInfo.id },
                  'Username': { white: gameInfo.white.name, black: gameInfo.black.name, game: 'Status: ' + gameState.status },
                  'Rating': { white: gameInfo.white.rating, black: gameInfo.black.rating, game: gameInfo.variant.short + ' ' + (gameInfo.rated ? 'rated' : 'unrated') },
                  'Timer': { white: formattedTimer(gameState.wtime), black: formattedTimer(gameState.btime), game: gameInfo.speed + ' ' + ((gameInfo.clock !== null) ? (String(gameInfo.clock.initial / 60000) + "'+" + String(gameInfo.clock.increment / 1000) + "''") : '∞') },
                  'Last Move': { white: (lastMove.player == 'white' ? lastMove.move : '?'), black: (lastMove.player == 'black' ? lastMove.move : '?'), game: lastMove.player },
                });
                */
                const innerTable = `<table class="dgt-table"><tr><th> - </th><th>Title</th><th>Username</th><th>Rating</th><th>Timer</th><th>Last Move</th><th>gameId: ${gameInfo.id}</th></tr>` +
                    `<tr><td>White</td><td>${gameInfo.white.title !== null ? gameInfo.white.title : '@'}</td><td>${gameInfo.white.name}</td><td>${gameInfo.white.rating}</td><td>${formattedTimer(gameState.wtime)}</td><td>${lastMove.player == 'white' ? lastMove.move : '?'}</td><td>${gameInfo.speed +
                    ' ' +
                    (gameInfo.clock !== null
                        ? String(gameInfo.clock.initial / 60000) + "'+" + String(gameInfo.clock.increment / 1000) + "''"
                        : '∞')}</td></tr>` +
                    `<tr><td>Black</td><td>${gameInfo.black.title !== null ? gameInfo.black.title : '@'}</td><td>${gameInfo.black.name}</td><td>${gameInfo.black.rating}</td><td>${formattedTimer(gameState.btime)}</td><td>${lastMove.player == 'black' ? lastMove.move : '?'}</td><td>Status: ${gameState.status}</td></tr>`;
                console.log(innerTable);
                switch (gameState.status) {
                    case 'started':
                        //Announce the last move
                        if (me.id !== lastMove.by || announceAllMoves) {
                            announcePlay(lastMove);
                        }
                        break;
                    case 'outoftime':
                        announceWinner(keywords[gameState.winner], 'flag', keywords[gameState.winner] + ' ' + keywords['wins by'] + ' ' + keywords['timeout']);
                        break;
                    case 'resign':
                        announceWinner(keywords[gameState.winner], 'resign', keywords[gameState.winner] + ' ' + keywords['wins by'] + ' ' + keywords['resignation']);
                        break;
                    case 'mate':
                        announceWinner(keywords[lastMove.player], 'mate', keywords[lastMove.player] + ' ' + keywords['wins by'] + ' ' + keywords['#']);
                        break;
                    case 'draw':
                        announceWinner('draw', 'draw', keywords['(=)']);
                        break;
                    default:
                        console.log(`Unknown status received: ${gameState.status}`);
                }
            }
        }
        /**
         * Peeks a game state and calculates who played the last move and what move it was
         *
         * @param {string} gameId - The alphanumeric identifier of the game where the last move is going to be calculated
         *
         * @return {Object} - The move in JSON
         */
        function getLastUCIMove(gameId) {
            if (gameStateMap.has(gameId) && gameInfoMap.has(gameId)) {
                const gameInfo = gameInfoMap.get(gameId);
                const gameState = gameStateMap.get(gameId);
                //This is the original code that does not used chessops objects and can be used to get the UCI move but not SAN.
                if (String(gameState.moves).length > 1) {
                    const moves = gameState.moves.split(' ');
                    if (verbose)
                        console.log(`getLastUCIMove - ${moves.length} moves detected. Last one: ${moves[moves.length - 1]}`);
                    if (moves.length % 2 == 0)
                        return { player: 'black', move: moves[moves.length - 1], by: gameInfo.black.id };
                    else
                        return { player: 'white', move: moves[moves.length - 1], by: gameInfo.white.id };
                }
            }
            if (verbose)
                console.log('getLastUCIMove - No moves.');
            return { player: 'none', move: 'none', by: 'none' };
        }
        /**
         * Feedback the user about the detected move
         *
         * @param lastMove JSON object with the move information
         * @param wtime Remaining time for white
         * @param btime Remaining time for black
         */
        function announcePlay(lastMove) {
            //ttsSay(lastMove.player);
            //Now play it using text to speech library
            let moveText;
            if (announceMoveFormat && announceMoveFormat.toLowerCase() == 'san' && lastSanMove) {
                moveText = lastSanMove.move;
                ttsSay(replaceKeywords(padBeforeNumbers(lastSanMove.move)));
            }
            else {
                moveText = lastMove.move;
                ttsSay(padBeforeNumbers(lastMove.move));
            }
            if (lastMove.player == 'white') {
                console.log('<span class="dgt-white-move">' + moveText + ' by White' + '</span>');
            }
            else {
                console.log('<span class="dgt-black-move">' + moveText + ' by Black' + '</span>');
            }
            //TODO
            //Give feedback on running out of time
        }
        function announceWinner(winner, status, message) {
            if (winner == 'white') {
                console.log('  ' + status + '  -  ' + message);
            }
            else {
                console.log('  ' + status + '  -  ' + message);
            }
            //Now play message using text to speech library
            ttsSay(replaceKeywords(message.toLowerCase()));
        }
        function announceInvalidMove() {
            if (currentGameColor == 'white') {
                console.warn('  [ X X ]  - Illegal move by white.');
            }
            else {
                console.warn('  [ X X ]  - Illegal move by black.');
            }
            //Now play it using text to speech library
            ttsSay(replaceKeywords('illegal move'));
        }
        async function connectToLiveChess() {
            let SANMove; //a move in san format returned by liveChess
            //Open the WebSocket
            liveChessConnection = new WebSocket(liveChessURL ? liveChessURL : 'ws://localhost:1982/api/v1.0');
            //Attach Events
            liveChessConnection.onopen = () => {
                isLiveChessConnected = true;
                if (verbose)
                    console.info('Websocket onopen: Connection to LiveChess was sucessful');
                liveChessConnection.send('{"id":1,"call":"eboards"}');
            };
            liveChessConnection.onerror = () => {
                console.error('Websocket ERROR: ');
            };
            liveChessConnection.onclose = () => {
                console.error('Websocket to LiveChess disconnected');
                //Clear the value of current serial number this serves as a disconnected status
                currentSerialnr = '0';
                //Set connection state to false
                isLiveChessConnected = false;
                DGTgameId = '';
            };
            liveChessConnection.onmessage = async (e) => {
                if (verbose)
                    console.info('Websocket onmessage with data:' + e.data);
                const message = JSON.parse(e.data);
                //Store last board if received
                if (message.response == 'feed' && !!message.param.board) {
                    lastLiveChessBoard = message.param.board;
                }
                if (message.response == 'call' && message.id == '1') {
                    //Get the list of available boards on LiveChess
                    boards = message.param;
                    console.table(boards);
                    if (verbose)
                        console.info(boards[0].serialnr);
                    //TODO
                    //we need to be able to handle more than one board
                    //for now using the first board found
                    //Update the base subscription message with the serial number
                    currentSerialnr = boards[0].serialnr;
                    subscription.param.param.serialnr = currentSerialnr;
                    if (verbose)
                        console.info('Websocket onmessage[call]: board serial number updated to: ' + currentSerialnr);
                    if (verbose)
                        console.info('Webscoket - about to send the following message \n' + JSON.stringify(subscription));
                    liveChessConnection.send(JSON.stringify(subscription));
                    //Check if the board is properly connected
                    if (boards[0].state != 'ACTIVE' && boards[0].state != 'INACTIVE')
                        // "NOTRESPONDING" || "DELAYED"
                        console.error(`Board with serial ${currentSerialnr} is not properly connected. Please fix`);
                    //Send setup with stating position
                    if (gameStateMap.has(currentGameId) &&
                        gameConnectionMap.get(currentGameId).connected &&
                        gameStateMap.get(currentGameId).status == 'started') {
                        //There is a game in progress, setup the board as per lichess board
                        if (currentGameId != DGTgameId) {
                            //We know we have not synchronized yet
                            if (verbose)
                                console.info('There is a game in progress, calling liveChessBoardSetUp...');
                            sendBoardToLiveChess(gameChessBoardMap.get(currentGameId));
                        }
                    }
                }
                else if (message.response == 'feed' && !!message.param.san) {
                    //Received move from board
                    if (verbose)
                        console.info('onmessage - san: ' + message.param.san);
                    //get last move known to lichess and avoid calling multiple times this function
                    const lastMove = getLastUCIMove(currentGameId);
                    if (message.param.san.length == 0) {
                        if (verbose)
                            console.info('onmessage - san is empty');
                    }
                    else if (lastLegalParam !== undefined &&
                        JSON.stringify(lastLegalParam.san) == JSON.stringify(message.param.san)) {
                        //Prevent duplicates since LiveChess may send the same move twice
                        //It looks like a duplicate, so just ignore it
                        if (verbose)
                            console.info('onmessage - Duplicate position and san move received and will be ignored');
                    }
                    else {
                        //A move was received
                        //Get all the moves on the param.san that are not present on lastLegalParam.san
                        //it is possible to receive two new moves on the message. Don't assume only the last move is pending.
                        let movesToProcess = 1;
                        if (lastLegalParam !== undefined)
                            movesToProcess = message.param.san.length - lastLegalParam.san.length;
                        //Check border case in which DGT Board LiveChess detects the wrong move while pieces are still on the air
                        if (movesToProcess > 1) {
                            if (verbose)
                                console.warn('onmessage - Multiple moves received on single message - movesToProcess: ' + movesToProcess);
                            if (localBoard.turn == currentGameColor) {
                                //If more than one move is received when its the DGT board player's turn this may be a invalid move
                                //Move will be quarantined by 2.5 seconds
                                const quarantinedlastLegalParam = lastLegalParam;
                                await sleep(2500);
                                //Check if a different move was received and processed during quarantine
                                if (JSON.stringify(lastLegalParam.san) != JSON.stringify(quarantinedlastLegalParam.san)) {
                                    //lastLegalParam was altered, this mean a new move was received from LiveChess during quarantine
                                    console.warn('onmessage - Invalid moved quarantined and not sent to lichess. Newer move interpretration received.');
                                    return;
                                }
                                //There is a chance that the same move came twice and quarantined twice before updating lastLegalParam
                                else if (lastLegalParam !== undefined &&
                                    JSON.stringify(lastLegalParam.san) == JSON.stringify(message.param.san)) {
                                    //It looks like a duplicate, so just ignore it
                                    if (verbose)
                                        console.info('onmessage - Duplicate position and san move received after quarantine and will be ignored');
                                    return;
                                }
                            }
                        }
                        //Update the lastLegalParam object to to help prevent duplicates and detect when more than one move is received
                        lastLegalParam = message.param;
                        for (let i = movesToProcess; i > 0; i--) {
                            //Get first move to process, usually the last since movesToProcess is usually 1
                            SANMove = String(message.param.san[message.param.san.length - i]).trim();
                            if (verbose)
                                console.info('onmessage - SANMove = ' + SANMove);
                            const moveObject = parseSan(localBoard, SANMove); //get move from DGT LiveChess
                            //if valid move on local chessops
                            if (moveObject && localBoard.isLegal(moveObject)) {
                                if (verbose)
                                    console.info('onmessage - Move is legal');
                                //if received move.color == this.currentGameColor
                                if (localBoard.turn == currentGameColor) {
                                    //This is a valid new move send it to lichess
                                    if (verbose)
                                        console.info('onmessage - Valid Move played: ' + SANMove);
                                    await validateAndSendBoardMove(moveObject);
                                    //Update the lastSanMove
                                    lastSanMove = { player: localBoard.turn, move: SANMove, by: me.id };
                                    //Play the move on local board to keep it in sync
                                    localBoard.play(moveObject);
                                }
                                else if (compareMoves(lastMove.move, moveObject)) {
                                    //This is a valid adjustment - Just making the move from Lichess
                                    if (verbose)
                                        console.info('onmessage - Valid Adjustment: ' + SANMove);
                                    //no need to send anything to Lichess moveObject required
                                    //lastSanMove will be updated once this move comes back from lichess
                                    //Play the move on local board to keep it in sync
                                    localBoard.play(moveObject);
                                }
                                else {
                                    //Invalid Adjustment. Move was legal but does not match last move received from Lichess
                                    console.error('onmessage - Invalid Adjustment was made');
                                    if (compareMoves(lastMove.move, moveObject)) {
                                        console.error('onmessage - Played move has not been received by Lichess.');
                                    }
                                    else {
                                        console.error('onmessage - Expected:' + lastMove.move + ' by ' + lastMove.player);
                                        console.error('onmessage - Detected:' + makeUci(moveObject) + ' by ' + localBoard.turn);
                                    }
                                    announceInvalidMove();
                                    await sleep(1000);
                                    //Repeat last game state announcement
                                    announcePlay(lastMove);
                                }
                            }
                            else {
                                //Move was valid on DGT Board but not legal on localBoard
                                if (verbose)
                                    console.info('onmessage - Move is NOT legal');
                                if (lastMove.move == SANMove) {
                                    //This is fine, the same last move was received again and seems illegal
                                    if (verbose)
                                        console.warn('onmessage - Move received is the same as the last move played: ' + SANMove);
                                }
                                else if (SANMove.startsWith('O-')) {
                                    //This is may be fine, sometimes castling triggers twice and second time is invalid
                                    if (verbose)
                                        console.warn('onmessage - Castling may be duplicated as the last move played: ' + SANMove);
                                }
                                else {
                                    //Receiving a legal move on DGT Board but invalid move on localBoard signals a de-synchronization
                                    if (verbose)
                                        console.error('onmessage - invalidMove - Position Mismatch between DGT Board and internal in-memory Board. SAN: ' +
                                            SANMove);
                                    announceInvalidMove();
                                    console.info(board(localBoard.board));
                                }
                            }
                        } //end for
                    } //end else - move was received
                }
                else if (message.response == 'feed') {
                    //feed received but not san
                    //No moves received, this may be an out of snc problem or just the starting position
                    if (verbose)
                        console.info('onmessage - No move received on feed event.');
                    //TODO THIS MAY REQUIRE RE-SYNCHRONIZATION BETWEEN LICHESS AND DGT BOARD
                }
            };
        }
        async function DGTliveChessConnectionLoop() {
            //Attempt connection right away
            connectToLiveChess();
            //Program ends after 20 re-connection attempts
            for (let attempts = 0; attempts < 20; attempts++) {
                do {
                    //Just sleep five seconds while there is a valid currentSerialnr
                    await sleep(5000);
                } while (currentSerialnr != '0' && isLiveChessConnected);
                //currentSerialnr is 0 so still no connection to board. Retry
                if (!isLiveChessConnected) {
                    console.warn('No connection to DGT Live Chess. Attempting re-connection. Attempt: ' + attempts);
                    connectToLiveChess();
                }
                else {
                    //Websocket is fine but still no board detected
                    console.warn('Connection to DGT Live Chess is Fine but no board is detected. Attempting re-connection. Attempt: ' +
                        attempts);
                    liveChessConnection.send('{"id":1,"call":"eboards"}');
                }
            }
            console.error('No connection to DGT Live Chess after maximum number of attempts (20). Reload page to start again.');
        }
        /**
         * Synchronizes the position on Lichess with the position on the board
         * If the position does not match, no moves will be received from LiveChess
         * @param chess - The chessops Chess object with the position on Lichess
         */
        async function sendBoardToLiveChess(chess) {
            const fen = makeFen(chess.toSetup());
            const setupMessage = {
                id: 3,
                call: 'call',
                param: {
                    id: 1,
                    method: 'setup',
                    param: {
                        fen: fen,
                    },
                },
            };
            if (verbose)
                console.log('setUp -: ' + JSON.stringify(setupMessage));
            if (isLiveChessConnected && currentSerialnr != '0') {
                liveChessConnection.send(JSON.stringify(setupMessage));
                //Store the gameId so we now we already synchronized
                DGTgameId = currentGameId;
                //Initialize localBoard too so it matched what was sent to LiveChess
                localBoard = chess.clone();
                //Reset other DGT Board tracking variables otherwise last move from DGT may be incorrect
                lastLegalParam = { board: '', san: [] };
                if (verbose)
                    console.log('setUp -: Sent.');
            }
            else {
                console.error('WebSocket is not open or is not ready to receive setup - cannot send setup command.');
                console.error(`isLiveChessConnected: ${isLiveChessConnected} - DGTgameId: ${DGTgameId} - currentSerialnr: ${currentSerialnr} - currentGameId: ${currentGameId}`);
            }
        }
        /**
         * This function handles sending the move to the right lichess game.
         * If more than one game is being played, it will ask which game to connect to,
         * waiting for user input. This block causes the method to become async
         *
         * @param {Object} boardMove - The move in chessops format or string if in lichess format
         */
        async function validateAndSendBoardMove(boardMove) {
            //While there is not an active game, keep trying to find one so the move is not lost
            while (!(gameStateMap.has(currentGameId) &&
                gameConnectionMap.get(currentGameId).connected &&
                gameStateMap.get(currentGameId).status == 'started')) {
                //Wait a few seconds to see if the games reconnects or starts and give some space to other code to run
                console.warn('validateAndSendBoardMove - Cannot send move while disconnected. Re-Trying in 2 seconds...');
                await sleep(2000);
                //Now attempt to select for which game is this command intended
                await chooseCurrentGame();
            }
            //Now send the move
            const command = makeUci(boardMove);
            sendMove(currentGameId, command);
        }
        /**
         * Make a Board move
         *
         * /api/board/game/{gameId}/move/{move}
         *
         * Make a move in a game being played with the Board API.
         * The move can also contain a draw offer/agreement.
         *
         * @param {string} gameId - The gameId for the active game
         * @param {string} uciMove - The move un UCI format
         */
        function sendMove(gameId, uciMove) {
            //prevent sending empty moves
            if (uciMove.length > 1) {
                //Log intention
                //Automatically decline draws when making a move
                const url = `/api/board/game/${gameId}/move/${uciMove}?offeringDraw=false`;
                if (verbose)
                    console.log('sendMove - About to call ' + url);
                fetch(url, {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + token },
                })
                    .then(response => {
                    try {
                        if (response.status == 200 || response.status == 201) {
                            //Move successfully sent
                            if (verbose)
                                console.log('sendMove - Move successfully sent.');
                        }
                        else {
                            response.json().then(errorJson => {
                                console.error('sendMove - Failed to send move. ' + errorJson.error);
                            });
                        }
                    }
                    catch (error) {
                        console.error('sendMove - Unexpected error. ' + error);
                    }
                })
                    .catch(err => {
                    console.error('sendMove - Error. ' + err.message);
                });
            }
        }
        /**
         * Replaces letters with full name of the pieces or move name
         * @param sanMove The move in san format
         *
         * @returns {String} - The San move with words instead of letters
         */
        function replaceKeywords(sanMove) {
            let extendedSanMove = sanMove;
            for (let i = 0; i < keywordsBase.length; i++) {
                try {
                    extendedSanMove = extendedSanMove.replace(keywordsBase[i], ' ' + keywords[keywordsBase[i]].toLowerCase() + ' ');
                }
                catch (error) {
                    console.error(`raplaceKeywords - Error replacing keyword. ${keywordsBase[i]} . ${Error(error).message}`);
                }
            }
            return extendedSanMove;
        }
        /**
         *
         * @param moveString The move in SAN or UCI
         *
         * @returns {String} - The move with spaces before the numbers for better TTS
         */
        function padBeforeNumbers(moveString) {
            let paddedMoveString = '';
            for (const c of moveString) {
                Number.isInteger(+c) ? (paddedMoveString += ` ${c} `) : (paddedMoveString += c);
            }
            return paddedMoveString;
        }
        /**
         * GLOBAL VARIABLES
         */
        async function ttsSay(text) {
            //Check if Voice is disabled
            if (verbose)
                console.log('TTS - for text: ' + text);
            if (!speechSynthesisOn)
                return;
            const utterThis = new SpeechSynthesisUtterance(text);
            const selectedOption = voice;
            const availableVoices = speechSynthesis.getVoices();
            for (let i = 0; i < availableVoices.length; i++) {
                if (availableVoices[i].name === selectedOption) {
                    utterThis.voice = availableVoices[i];
                    break;
                }
            }
            //utterThis.pitch = pitch.value;
            utterThis.rate = 0.6;
            speechSynthesis.speak(utterThis);
        }
        function startingPosition() {
            return Chess.fromSetup(defaultSetup()).unwrap();
        }
        /**
         * Compare moves in different formats.
         * Fixes issue in which chessops return UCI_960 for castling instead of plain UCI
         * @param lastMove - the move a string received from lichess
         * @param moveObject - the move in chessops format after applyng the SAN to localBoard
         * @returns {Boolean} - True if the moves are the same
         */
        function compareMoves(lastMove, moveObject) {
            try {
                const uciMove = makeUci(moveObject);
                if (verbose)
                    console.log(`Comparing ${lastMove} with ${uciMove}`);
                if (lastMove == uciMove) {
                    //it's the same move
                    return true;
                }
                if (verbose)
                    console.log('Moves look different. Check if this is a castling mismatch.');
                const castlingSide = localBoard.castlingSide(moveObject);
                if (lastMove.length > 2 && castlingSide) {
                    //It was a castling so it still may be the same move
                    if (lastMove.startsWith(uciMove.substring(0, 2))) {
                        //it was the same starting position for the king
                        if (lastMove.startsWith('e1g1') ||
                            lastMove.startsWith('e1c1') ||
                            lastMove.startsWith('e8c8') ||
                            lastMove.startsWith('e8g8')) {
                            //and the last move looks like a castling too
                            return true;
                        }
                    }
                }
            }
            catch (err) {
                console.warn('compareMoves - ' + Error(err).message);
            }
            return false;
        }
        /*
        function opponent(): { color: string, id: string, name: string } {
          //"white":{"id":"godking666","name":"Godking666","title":null,"rating":1761},"black":{"id":"andrescavallin","name":"andrescavallin","title":null
          if (gameInfoMap.get(currentGameId).white.id == me.id)
            return { color: 'black', id: gameInfoMap.get(currentGameId).black.id, name: gameInfoMap.get(currentGameId).black.name };
          else
            return { color: 'white', id: gameInfoMap.get(currentGameId).white.id, name: gameInfoMap.get(currentGameId).white.name };
        }
        */
        function start() {
            console.log('');
            console.log('      ,....,                      ▄████▄   ██░ ██ ▓█████   ██████   ██████     ');
            console.log('     ,::::::<                    ▒██▀ ▀█  ▓██░ ██▒▓█   ▀ ▒██    ▒ ▒██    ▒     ');
            console.log('    ,::/^\\"``.                   ▒▓█    ▄ ▒██▀▀██░▒███   ░ ▓██▄   ░ ▓██▄       ');
            console.log('   ,::/, `   e`.                 ▒▓▓▄ ▄██▒░▓█ ░██ ▒▓█  ▄   ▒   ██▒  ▒   ██▒    ');
            console.log("  ,::; |        '.               ▒ ▓███▀ ░░▓█▒░██▓░▒████▒▒██████▒▒▒██████▒▒    ");
            console.log('  ,::|  ___,-.  c)               ░ ░▒ ▒  ░ ▒ ░░▒░▒░░ ▒░ ░▒ ▒▓▒ ▒ ░▒ ▒▓▒ ▒ ░    ');
            console.log("  ;::|     \\   '-'               ░  ▒    ▒ ░▒░ ░ ░ ░  ░░ ░▒  ░ ░░ ░▒  ░ ░      ");
            console.log('  ;::|      \\                    ░         ░  ░░ ░   ░   ░  ░  ░  ░  ░  ░      ');
            console.log('  ;::|   _.=`\\                   ░ ░       ░  ░  ░   ░  ░      ░        ░      ');
            console.log('  `;:|.=` _.=`\\                  ░                                             ');
            console.log("    '|_.=`   __\\                                                               ");
            console.log('    `\\_..==`` /                 Lichess.org - DGT Electronic Board Connector   ');
            console.log("     .'.___.-'.                Developed by Andres Cavallin and Juan Cavallin  ");
            console.log('    /          \\                                  v1.0.7                       ');
            console.log("jgs('--......--')                                                             ");
            console.log("   /'--......--'\\                                                              ");
            console.log('   `"--......--"`                                                             ');
        }
        /**
         * Show the profile and then
         * Start the Main Loop
         */
        start();
        getProfile();
        lichessConnectionLoop();
        DGTliveChessConnectionLoop();
    }

    var main = {
        configPage,
        playPage,
    };

    return main;

}());
