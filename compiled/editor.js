var LichessEditor = (function () {
    'use strict';

    function createElement$1(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    const htmlDomApi = {
        createElement: createElement$1,
        createElementNS,
        createTextNode,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement,
        isText,
        isComment,
    };

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return typeof s === "string" || typeof s === "number";
    }

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        return isSameSel && isSameKey && isSameIs;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi) {
        let i;
        let j;
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                const hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            const c = elm.className ? "." + elm.className.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
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

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function updateClass(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldClass = oldVnode.data.class;
        let klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) {
                // was `true` and now not provided
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? "add" : "remove"](name);
            }
        }
    }
    const classModule = { create: updateClass, update: updateClass };

    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call multiple handlers
            for (let i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
    function handleEvent(event, vnode) {
        const name = event.type;
        const on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        const oldOn = oldVnode.data.on;
        const oldListener = oldVnode.listener;
        const oldElm = oldVnode.elm;
        const on = vnode && vnode.data.on;
        const elm = (vnode && vnode.elm);
        let name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            const listener = (vnode.listener =
                oldVnode.listener || createListener());
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    const eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };

    function updateProps(oldVnode, vnode) {
        let key;
        let cur;
        let old;
        const elm = vnode.elm;
        let oldProps = oldVnode.data.props;
        let props = vnode.data.props;
        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};
        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== "value" || elm[key] !== cur)) {
                elm[key] = cur;
            }
        }
    }
    const propsModule = { create: updateProps, update: updateProps };

    const CASTLING_TOGGLES = ['K', 'Q', 'k', 'q'];

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

    function r(r,n){r.prototype=Object.create(n.prototype),r.prototype.constructor=r,r.__proto__=n;}var n,t=function(){function r(){}var t=r.prototype;return t.unwrap=function(r,t){var o=this._chain(function(t){return n.ok(r?r(t):t)},function(r){return t?n.ok(t(r)):n.err(r)});if(o.isErr)throw o.error;return o.value},t.map=function(r,t){return this._chain(function(t){return n.ok(r(t))},function(r){return n.err(t?t(r):r)})},t.chain=function(r,t){return this._chain(r,t||function(r){return n.err(r)})},r}(),o=function(n){function t(r){var t;return (t=n.call(this)||this).value=r,t.isOk=!0,t.isErr=!1,t}return r(t,n),t.prototype._chain=function(r,n){return r(this.value)},t}(t),e=function(n){function t(r){var t;return (t=n.call(this)||this).error=r,t.isOk=!1,t.isErr=!0,t}return r(t,n),t.prototype._chain=function(r,n){return n(this.error)},t}(t);!function(r){r.ok=function(r){return new o(r)},r.err=function(r){return new e(r||new Error)},r.all=function(n){if(Array.isArray(n)){for(var t=[],o=0;o<n.length;o++){var e=n[o];if(e.isErr)return e;t.push(e.value);}return r.ok(t)}for(var u={},i=Object.keys(n),c=0;c<i.length;c++){var a=n[i[c]];if(a.isErr)return a;u[i[c]]=a.value;}return r.ok(u)};}(n||(n={}));

    function defined$1(v) {
        return v !== undefined;
    }
    function opposite$1(color) {
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
            .union(pawnAttacks(opposite$1(attacker), square).intersect(board.pawn)));
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
                if (!defined$1(king) || !backrank.has(king))
                    continue;
                const side = rooks.intersect(setup.board[color]).intersect(backrank);
                const aSide = side.first();
                if (defined$1(aSide) && aSide < king)
                    castles.add(color, 'a', king, aSide);
                const hSide = side.last();
                if (defined$1(hSide) && king < hSide)
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
                this.pockets[opposite$1(captured.color)][captured.role]++;
        }
        ctx() {
            const variantEnd = this.isVariantEnd();
            const king = this.board.kingOf(this.turn);
            if (!defined$1(king))
                return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
            const snipers = rookAttacks(king, SquareSet.empty())
                .intersect(this.board.rooksAndQueens())
                .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
                .intersect(this.board[opposite$1(this.turn)]);
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.kingAttackers(king, opposite$1(this.turn), this.board.occupied);
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
            return defined$1(king) && this.kingAttackers(king, opposite$1(this.turn), this.board.occupied).nonEmpty();
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
                return { winner: opposite$1(this.turn) };
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
                to: defined$1(rookFrom) ? rookFrom : move.to,
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
            this.turn = opposite$1(turn);
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
                        if (defined$1(rookFrom)) {
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
            if (!defined$1(this.epSquare))
                return;
            ctx = ctx || this.ctx();
            const ourPawns = this.board.pieces(this.turn, 'pawn');
            const candidates = ourPawns.intersect(pawnAttacks(opposite$1(this.turn), this.epSquare));
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
            if (!defined$1(this.board.kingOf(this.turn)))
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite$1(this.turn));
            if (!defined$1(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return this.validateCheckers();
        }
        validateCheckers() {
            const ourKing = this.board.kingOf(this.turn);
            if (defined$1(ourKing)) {
                // Multiple sliding checkers aligned with king.
                const checkers = this.kingAttackers(ourKing, opposite$1(this.turn), this.board.occupied);
                if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing)))
                    return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                // En passant square aligned with checker and king.
                if (defined$1(this.epSquare)) {
                    for (const checker of checkers) {
                        if (ray(checker, this.epSquare).has(ourKing))
                            return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                    }
                }
            }
            return n.ok(undefined);
        }
        validEpSquare(square) {
            if (!defined$1(square))
                return;
            const epRank = this.turn === 'white' ? 5 : 2;
            const forward = this.turn === 'white' ? 8 : -8;
            if (squareRank(square) !== epRank)
                return;
            if (this.board.occupied.has(square + forward))
                return;
            const pawn = square - forward;
            if (!this.board.pawn.has(pawn) || !this.board[opposite$1(this.turn)].has(pawn))
                return;
            return square;
        }
        castlingDest(side, ctx) {
            if (!defined$1(ctx.king) || ctx.checkers.nonEmpty())
                return SquareSet.empty();
            const rook = this.castles.rook[this.turn][side];
            if (!defined$1(rook))
                return SquareSet.empty();
            if (this.castles.path[this.turn][side].intersects(this.board.occupied))
                return SquareSet.empty();
            const kingTo = kingCastlesTo(this.turn, side);
            const kingPath = between(ctx.king, kingTo);
            const occ = this.board.occupied.without(ctx.king);
            for (const sq of kingPath) {
                if (this.kingAttackers(sq, opposite$1(this.turn), occ).nonEmpty())
                    return SquareSet.empty();
            }
            const rookTo = rookCastlesTo(this.turn, side);
            const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
            if (this.kingAttackers(kingTo, opposite$1(this.turn), after).nonEmpty())
                return SquareSet.empty();
            return SquareSet.fromSquare(rook);
        }
        canCaptureEp(pawn, ctx) {
            if (!defined$1(this.epSquare))
                return false;
            if (!pawnAttacks(this.turn, pawn).has(this.epSquare))
                return false;
            if (!defined$1(ctx.king))
                return true;
            const captured = this.epSquare + (this.turn === 'white' ? -8 : 8);
            const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
            return !this.kingAttackers(ctx.king, opposite$1(this.turn), occupied).intersects(occupied);
        }
        pseudoDests(square, ctx) {
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied);
            if (piece.role === 'pawn') {
                let captureTargets = this.board[opposite$1(this.turn)];
                if (defined$1(this.epSquare))
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
                pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite$1(this.turn)]);
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
                if (defined$1(this.epSquare) && this.canCaptureEp(square, ctx)) {
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
            if (defined$1(ctx.king)) {
                if (piece.role === 'king') {
                    const occ = this.board.occupied.without(square);
                    for (const to of pseudo) {
                        if (this.kingAttackers(to, opposite$1(this.turn), occ).nonEmpty())
                            pseudo = pseudo.without(to);
                    }
                    return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
                }
                if (ctx.checkers.nonEmpty()) {
                    const checker = ctx.checkers.singleSquare();
                    if (!defined$1(checker))
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
                    this.board[opposite$1(color)].diff(this.board.king).diff(this.board.queen).isEmpty());
            }
            if (this.board[color].intersects(this.board.bishop)) {
                const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) ||
                    !this.board.bishop.intersects(SquareSet.lightSquares());
                return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
            }
            return true;
        }
    }

    class Crazyhouse extends Chess {
        constructor() {
            super('crazyhouse');
        }
        static default() {
            const pos = super.default();
            pos.pockets = Material.empty();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
                return pos;
            });
        }
        validate() {
            return super.validate().chain(_ => {
                if (this.pockets && (this.pockets.white.king > 0 || this.pockets.black.king > 0)) {
                    return n.err(new PositionError(IllegalSetup.Kings));
                }
                if ((this.pockets ? this.pockets.count() : 0) + this.board.occupied.size() > 64) {
                    return n.err(new PositionError(IllegalSetup.Variant));
                }
                return n.ok(undefined);
            });
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(color) {
            // No material can leave the game, but we can easily check this for
            // custom positions.
            if (!this.pockets)
                return super.hasInsufficientMaterial(color);
            return (this.board.occupied.size() + this.pockets.count() <= 3 &&
                this.board.pawn.isEmpty() &&
                this.board.promoted.isEmpty() &&
                this.board.rooksAndQueens().isEmpty() &&
                this.pockets.white.pawn <= 0 &&
                this.pockets.black.pawn <= 0 &&
                this.pockets.white.rook <= 0 &&
                this.pockets.black.rook <= 0 &&
                this.pockets.white.queen <= 0 &&
                this.pockets.black.queen <= 0);
        }
        dropDests(ctx) {
            var _a, _b;
            const mask = this.board.occupied
                .complement()
                .intersect(((_a = this.pockets) === null || _a === void 0 ? void 0 : _a[this.turn].hasNonPawns())
                ? SquareSet.full()
                : ((_b = this.pockets) === null || _b === void 0 ? void 0 : _b[this.turn].hasPawns())
                    ? SquareSet.backranks().complement()
                    : SquareSet.empty());
            ctx = ctx || this.ctx();
            if (defined$1(ctx.king) && ctx.checkers.nonEmpty()) {
                const checker = ctx.checkers.singleSquare();
                if (!defined$1(checker))
                    return SquareSet.empty();
                return mask.intersect(between(checker, ctx.king));
            }
            else
                return mask;
        }
    }
    class Atomic extends Chess {
        constructor() {
            super('atomic');
        }
        static default() {
            return super.default();
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        clone() {
            return super.clone();
        }
        validate() {
            // Like chess, but allow our king to be missing and any number of checkers.
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.king.size() > 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite$1(this.turn));
            if (!defined$1(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            }
            if (SquareSet.backranks().intersects(this.board.pawn)) {
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            }
            return n.ok(undefined);
        }
        kingAttackers(square, attacker, occupied) {
            if (kingAttacks(square).intersects(this.board.pieces(attacker, 'king'))) {
                return SquareSet.empty();
            }
            return super.kingAttackers(square, attacker, occupied);
        }
        playCaptureAt(square, captured) {
            super.playCaptureAt(square, captured);
            this.board.take(square);
            for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board.pawn)) {
                const piece = this.board.take(explode);
                if (piece && piece.role === 'rook')
                    this.castles.discardRook(explode);
                if (piece && piece.role === 'king')
                    this.castles.discardSide(piece.color);
            }
        }
        hasInsufficientMaterial(color) {
            // Remaining material does not matter if the enemy king is already
            // exploded.
            if (this.board.pieces(opposite$1(color), 'king').isEmpty())
                return false;
            // Bare king cannot mate.
            if (this.board[color].diff(this.board.king).isEmpty())
                return true;
            // As long as the enemy king is not alone, there is always a chance their
            // own pieces explode next to it.
            if (this.board[opposite$1(color)].diff(this.board.king).nonEmpty()) {
                // Unless there are only bishops that cannot explode each other.
                if (this.board.occupied.equals(this.board.bishop.union(this.board.king))) {
                    if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.darkSquares())) {
                        return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.lightSquares());
                    }
                    if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.lightSquares())) {
                        return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.darkSquares());
                    }
                }
                return false;
            }
            // Queen or pawn (future queen) can give mate against bare king.
            if (this.board.queen.nonEmpty() || this.board.pawn.nonEmpty())
                return false;
            // Single knight, bishop or rook cannot mate against bare king.
            if (this.board.knight.union(this.board.bishop).union(this.board.rook).isSingleSquare())
                return true;
            // If only knights, more than two are required to mate bare king.
            if (this.board.occupied.equals(this.board.knight.union(this.board.king))) {
                return this.board.knight.size() <= 2;
            }
            return false;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            let dests = SquareSet.empty();
            for (const to of this.pseudoDests(square, ctx)) {
                const after = this.clone();
                after.play({ from: square, to });
                const ourKing = after.board.kingOf(this.turn);
                if (defined$1(ourKing) &&
                    (!defined$1(after.board.kingOf(after.turn)) ||
                        after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())) {
                    dests = dests.with(to);
                }
            }
            return dests;
        }
        isVariantEnd() {
            return !!this.variantOutcome();
        }
        variantOutcome(_ctx) {
            for (const color of COLORS) {
                if (this.board.pieces(color, 'king').isEmpty())
                    return { winner: opposite$1(color) };
            }
            return;
        }
    }
    class Antichess extends Chess {
        constructor() {
            super('antichess');
        }
        static default() {
            const pos = super.default();
            pos.castles = Castles.empty();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.castles = Castles.empty();
                return pos;
            });
        }
        clone() {
            return super.clone();
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return n.ok(undefined);
        }
        kingAttackers(_square, _attacker, _occupied) {
            return SquareSet.empty();
        }
        ctx() {
            const ctx = super.ctx();
            const enemy = this.board[opposite$1(this.turn)];
            for (const from of this.board[this.turn]) {
                if (this.pseudoDests(from, ctx).intersects(enemy)) {
                    ctx.mustCapture = true;
                    break;
                }
            }
            return ctx;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            const dests = this.pseudoDests(square, ctx);
            if (!ctx.mustCapture)
                return dests;
            return dests.intersect(this.board[opposite$1(this.turn)]);
        }
        hasInsufficientMaterial(color) {
            if (this.board.occupied.equals(this.board.bishop)) {
                const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
                const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
                const theyAllOnDark = this.board[opposite$1(color)].isDisjoint(SquareSet.lightSquares());
                const theyAllOnLight = this.board[opposite$1(color)].isDisjoint(SquareSet.darkSquares());
                return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
            }
            return false;
        }
        isVariantEnd() {
            return this.board[this.turn].isEmpty();
        }
        variantOutcome(ctx) {
            ctx = ctx || this.ctx();
            if (ctx.variantEnd || this.isStalemate(ctx)) {
                return { winner: this.turn };
            }
            return;
        }
    }
    class KingOfTheHill extends Chess {
        constructor() {
            super('kingofthehill');
        }
        static default() {
            return super.default();
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(_color) {
            return false;
        }
        isVariantEnd() {
            return this.board.king.intersects(SquareSet.center());
        }
        variantOutcome(_ctx) {
            for (const color of COLORS) {
                if (this.board.pieces(color, 'king').intersects(SquareSet.center()))
                    return { winner: color };
            }
            return;
        }
    }
    class ThreeCheck extends Chess {
        constructor() {
            super('3check');
        }
        static default() {
            const pos = super.default();
            pos.remainingChecks = RemainingChecks.default();
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.default();
                return pos;
            });
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(color) {
            return this.board.pieces(color, 'king').equals(this.board[color]);
        }
        isVariantEnd() {
            return !!this.remainingChecks && (this.remainingChecks.white <= 0 || this.remainingChecks.black <= 0);
        }
        variantOutcome(_ctx) {
            if (this.remainingChecks) {
                for (const color of COLORS) {
                    if (this.remainingChecks[color] <= 0)
                        return { winner: color };
                }
            }
            return;
        }
    }
    class RacingKings extends Chess {
        constructor() {
            super('racingkings');
        }
        static default() {
            const pos = new this();
            pos.board = Board.racingKings();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.empty();
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup).map(pos => {
                pos.castles = Castles.empty();
                return pos;
            });
        }
        validate() {
            if (this.isCheck())
                return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
            if (this.board.pawn.nonEmpty())
                return n.err(new PositionError(IllegalSetup.Variant));
            return super.validate();
        }
        clone() {
            return super.clone();
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            // Kings cannot give check.
            if (square === ctx.king)
                return super.dests(square, ctx);
            // TODO: This could be optimized considerably.
            let dests = SquareSet.empty();
            for (const to of super.dests(square, ctx)) {
                // Valid, because there are no promotions (or even pawns).
                const move = { from: square, to };
                const after = this.clone();
                after.play(move);
                if (!after.isCheck())
                    dests = dests.with(to);
            }
            return dests;
        }
        hasInsufficientMaterial(_color) {
            return false;
        }
        isVariantEnd() {
            const goal = SquareSet.fromRank(7);
            const inGoal = this.board.king.intersect(goal);
            if (inGoal.isEmpty())
                return false;
            if (this.turn === 'white' || inGoal.intersects(this.board.black))
                return true;
            // White has reached the backrank. Check if black can catch up.
            const blackKing = this.board.kingOf('black');
            if (defined$1(blackKing)) {
                const occ = this.board.occupied.without(blackKing);
                for (const target of kingAttacks(blackKing).intersect(goal).diff(this.board.black)) {
                    if (this.kingAttackers(target, 'white', occ).isEmpty())
                        return false;
                }
            }
            return true;
        }
        variantOutcome(ctx) {
            if (ctx ? !ctx.variantEnd : !this.isVariantEnd())
                return;
            const goal = SquareSet.fromRank(7);
            const blackInGoal = this.board.pieces('black', 'king').intersects(goal);
            const whiteInGoal = this.board.pieces('white', 'king').intersects(goal);
            if (blackInGoal && !whiteInGoal)
                return { winner: 'black' };
            if (whiteInGoal && !blackInGoal)
                return { winner: 'white' };
            return { winner: undefined };
        }
    }
    class Horde extends Chess {
        constructor() {
            super('horde');
        }
        static default() {
            const pos = new this();
            pos.board = Board.horde();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.default();
            pos.castles.discardSide('white');
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup) {
            return super.fromSetup(setup);
        }
        validate() {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (!this.board.king.isSingleSquare())
                return n.err(new PositionError(IllegalSetup.Kings));
            if (!this.board.king.diff(this.board.promoted).isSingleSquare())
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite$1(this.turn));
            if (defined$1(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            for (const color of COLORS) {
                if (this.board.pieces(color, 'pawn').intersects(SquareSet.backrank(opposite$1(color)))) {
                    return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
                }
            }
            return this.validateCheckers();
        }
        clone() {
            return super.clone();
        }
        hasInsufficientMaterial(_color) {
            // TODO: Could detect cases where the horde cannot mate.
            return false;
        }
        isVariantEnd() {
            return this.board.white.isEmpty() || this.board.black.isEmpty();
        }
        variantOutcome(_ctx) {
            if (this.board.white.isEmpty())
                return { winner: 'black' };
            if (this.board.black.isEmpty())
                return { winner: 'white' };
            return;
        }
    }
    function setupPosition(rules, setup) {
        switch (rules) {
            case 'chess':
                return Chess.fromSetup(setup);
            case 'antichess':
                return Antichess.fromSetup(setup);
            case 'atomic':
                return Atomic.fromSetup(setup);
            case 'horde':
                return Horde.fromSetup(setup);
            case 'racingkings':
                return RacingKings.fromSetup(setup);
            case 'kingofthehill':
                return KingOfTheHill.fromSetup(setup);
            case '3check':
                return ThreeCheck.fromSetup(setup);
            case 'crazyhouse':
                return Crazyhouse.fromSetup(setup);
        }
    }

    const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const INITIAL_EPD = INITIAL_BOARD_FEN + ' w KQkq -';
    const INITIAL_FEN = INITIAL_EPD + ' 0 1';
    const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
    const EMPTY_EPD = EMPTY_BOARD_FEN + ' w - -';
    const EMPTY_FEN = EMPTY_EPD + ' 0 1';
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
            if (!defined$1(white) || white > 3 || !defined$1(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(3 - white, 3 - black));
        }
        else if (parts.length === 2) {
            const white = parseSmallUint(parts[0]);
            const black = parseSmallUint(parts[1]);
            if (!defined$1(white) || white > 3 || !defined$1(black) || black > 3)
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
        if (!defined$1(turnPart) || turnPart === 'w')
            turn = 'white';
        else if (turnPart === 'b')
            turn = 'black';
        else
            return n.err(new FenError(InvalidFen.Turn));
        return board.chain(board => {
            // Castling
            const castlingPart = parts.shift();
            const unmovedRooks = defined$1(castlingPart) ? parseCastlingFen(board, castlingPart) : n.ok(SquareSet.empty());
            // En passant square
            const epPart = parts.shift();
            let epSquare;
            if (defined$1(epPart) && epPart !== '-') {
                epSquare = parseSquare(epPart);
                if (!defined$1(epSquare))
                    return n.err(new FenError(InvalidFen.EpSquare));
            }
            // Halfmoves or remaining checks
            let halfmovePart = parts.shift();
            let earlyRemainingChecks;
            if (defined$1(halfmovePart) && halfmovePart.includes('+')) {
                earlyRemainingChecks = parseRemainingChecks(halfmovePart);
                halfmovePart = parts.shift();
            }
            const halfmoves = defined$1(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
            if (!defined$1(halfmoves))
                return n.err(new FenError(InvalidFen.Halfmoves));
            const fullmovesPart = parts.shift();
            const fullmoves = defined$1(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
            if (!defined$1(fullmoves))
                return n.err(new FenError(InvalidFen.Fullmoves));
            const remainingChecksPart = parts.shift();
            let remainingChecks = n.ok(undefined);
            if (defined$1(remainingChecksPart)) {
                if (defined$1(earlyRemainingChecks))
                    return n.err(new FenError(InvalidFen.RemainingChecks));
                remainingChecks = parseRemainingChecks(remainingChecksPart);
            }
            else if (defined$1(earlyRemainingChecks)) {
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
    function makePiece$1(piece, opts) {
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
                    fen += makePiece$1(piece, opts);
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
            if (!defined$1(king) || !backrank.has(king))
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
            defined$1(setup.epSquare) ? makeSquare(setup.epSquare) : '-',
            ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
            ...((opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]),
        ].join(' ');
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

    class EditorCtrl {
        constructor(cfg, redraw) {
            this.cfg = cfg;
            this.options = cfg.options || {};
            this.trans = lichess.trans(this.cfg.i18n);
            this.selected = prop('pointer');
            this.extraPositions = [
                {
                    fen: INITIAL_FEN,
                    epd: INITIAL_EPD,
                    name: this.trans('startPosition'),
                },
                {
                    fen: 'prompt',
                    name: this.trans('loadPosition'),
                },
            ];
            if (cfg.positions) {
                cfg.positions.forEach(p => (p.epd = p.fen.split(' ').splice(0, 4).join(' ')));
            }
            window.Mousetrap.bind('f', () => {
                if (this.chessground)
                    this.chessground.toggleOrientation();
                redraw();
            });
            this.castlingToggles = { K: false, Q: false, k: false, q: false };
            this.rules =
                !this.cfg.embed && window.history.state && window.history.state.rules ? window.history.state.rules : 'chess';
            this.redraw = () => { };
            this.setFen(cfg.fen);
            this.redraw = redraw;
        }
        onChange() {
            const fen = this.getFen();
            if (!this.cfg.embed) {
                const state = { rules: this.rules };
                if (fen == INITIAL_FEN)
                    window.history.replaceState(state, '', '/editor');
                else
                    window.history.replaceState(state, '', this.makeUrl('/editor/', fen));
            }
            this.options.onChange && this.options.onChange(fen);
            this.redraw();
        }
        castlingToggleFen() {
            let fen = '';
            for (const toggle of CASTLING_TOGGLES) {
                if (this.castlingToggles[toggle])
                    fen += toggle;
            }
            return fen;
        }
        getSetup() {
            const boardFen = this.chessground ? this.chessground.getFen() : this.cfg.fen;
            const board = parseFen(boardFen).unwrap(setup => setup.board, _ => Board.empty());
            return {
                board,
                pockets: this.pockets,
                turn: this.turn,
                unmovedRooks: this.unmovedRooks || parseCastlingFen(board, this.castlingToggleFen()).unwrap(),
                epSquare: this.epSquare,
                remainingChecks: this.remainingChecks,
                halfmoves: this.halfmoves,
                fullmoves: this.fullmoves,
            };
        }
        getFen() {
            return makeFen(this.getSetup(), { promoted: this.rules == 'crazyhouse' });
        }
        getLegalFen() {
            return setupPosition(this.rules, this.getSetup()).unwrap(pos => {
                return makeFen(pos.toSetup(), { promoted: pos.rules == 'crazyhouse' });
            }, _ => undefined);
        }
        isPlayable() {
            return setupPosition(this.rules, this.getSetup()).unwrap(pos => !pos.isEnd(), _ => false);
        }
        getState() {
            return {
                fen: this.getFen(),
                legalFen: this.getLegalFen(),
                playable: this.rules == 'chess' && this.isPlayable(),
            };
        }
        makeAnalysisUrl(legalFen) {
            switch (this.rules) {
                case 'chess':
                    return this.makeUrl('/analysis/', legalFen);
                case '3check':
                    return this.makeUrl('/analysis/threeCheck/', legalFen);
                case 'kingofthehill':
                    return this.makeUrl('/analysis/kingOfTheHill/', legalFen);
                case 'racingkings':
                    return this.makeUrl('/analysis/racingKings/', legalFen);
                case 'antichess':
                case 'atomic':
                case 'horde':
                case 'crazyhouse':
                    return this.makeUrl(`/analysis/${this.rules}/`, legalFen);
            }
        }
        makeUrl(baseUrl, fen) {
            return baseUrl + encodeURIComponent(fen).replace(/%20/g, '_').replace(/%2F/g, '/');
        }
        bottomColor() {
            return this.chessground ? this.chessground.state.orientation : this.options.orientation || 'white';
        }
        setCastlingToggle(id, value) {
            if (this.castlingToggles[id] != value)
                this.unmovedRooks = undefined;
            this.castlingToggles[id] = value;
            this.onChange();
        }
        setTurn(turn) {
            this.turn = turn;
            this.onChange();
        }
        startPosition() {
            this.setFen(INITIAL_FEN);
        }
        clearBoard() {
            this.setFen(EMPTY_FEN);
        }
        loadNewFen(fen) {
            if (fen === 'prompt') {
                fen = (prompt('Paste FEN position') || '').trim();
                if (!fen)
                    return;
            }
            this.setFen(fen);
        }
        setFen(fen) {
            return parseFen(fen).unwrap(setup => {
                if (this.chessground)
                    this.chessground.set({ fen });
                this.pockets = setup.pockets;
                this.turn = setup.turn;
                this.unmovedRooks = setup.unmovedRooks;
                this.epSquare = setup.epSquare;
                this.remainingChecks = setup.remainingChecks;
                this.halfmoves = setup.halfmoves;
                this.fullmoves = setup.fullmoves;
                const castles = Castles.fromSetup(setup);
                this.castlingToggles['K'] = defined(castles.rook.white.h);
                this.castlingToggles['Q'] = defined(castles.rook.white.a);
                this.castlingToggles['k'] = defined(castles.rook.black.h);
                this.castlingToggles['q'] = defined(castles.rook.black.a);
                this.onChange();
                return true;
            }, _ => false);
        }
        setRules(rules) {
            this.rules = rules;
            if (rules != 'crazyhouse')
                this.pockets = undefined;
            else if (!this.pockets)
                this.pockets = Material.empty();
            if (rules != '3check')
                this.remainingChecks = undefined;
            else if (!this.remainingChecks)
                this.remainingChecks = RemainingChecks.default();
            this.onChange();
        }
        setOrientation(o) {
            this.options.orientation = o;
            if (this.chessground.state.orientation !== o)
                this.chessground.toggleOrientation();
            this.redraw();
        }
    }

    /* Based on: */
    /*!
     * hoverIntent v1.10.0 // 2019.02.25 // jQuery v1.7.0+
     * http://briancherne.github.io/jquery-hoverIntent/
     *
     * You may use hoverIntent under the terms of the MIT license. Basically that
     * means you are free to use hoverIntent as long as this header is left intact.
     * Copyright 2007-2019 Brian Cherne
     */
    function menuHover () {
        if ('ontouchstart' in window)
            return;
        const interval = 200, sensitivity = 8;
        // current X and Y position of mouse, updated during mousemove tracking (shared across instances)
        let cX, cY;
        // saves the current pointer position coordinates based on the given mousemove event
        const track = (ev) => {
            cX = ev.pageX;
            cY = ev.pageY;
        };
        // state properties:
        // timeoutId = timeout ID, reused for tracking mouse position and delaying "out" handler
        // isActive = plugin state, true after `over` is called just until `out` is called
        // pX, pY = previously-measured pointer coordinates, updated at each polling interval
        // event = string representing the namespaced event used for mouse tracking
        let state = {};
        $('#topnav.hover').each(function () {
            const $el = $(this).removeClass('hover'), handler = () => $el.toggleClass('hover');
            // compares current and previous mouse positions
            const compare = () => {
                // compare mouse positions to see if pointer has slowed enough to trigger `over` function
                if (Math.sqrt((state.pX - cX) * (state.pX - cX) + (state.pY - cY) * (state.pY - cY)) < sensitivity) {
                    $el.off(state.event, track);
                    delete state.timeoutId;
                    // set hoverIntent state as active for this element (permits `out` handler to trigger)
                    state.isActive = true;
                    handler();
                }
                else {
                    // set previous coordinates for next comparison
                    state.pX = cX;
                    state.pY = cY;
                    // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
                    state.timeoutId = setTimeout(compare, interval);
                }
            };
            // A private function for handling mouse 'hovering'
            const handleHover = function (ev) {
                // clear any existing timeout
                if (state.timeoutId)
                    state.timeoutId = clearTimeout(state.timeoutId);
                // namespaced event used to register and unregister mousemove tracking
                const mousemove = (state.event = 'mousemove');
                // handle the event, based on its type
                if (ev.type == 'mouseover') {
                    // do nothing if already active or a button is pressed (dragging a piece)
                    if (state.isActive || ev.buttons)
                        return;
                    // set "previous" X and Y position based on initial entry point
                    state.pX = ev.pageX;
                    state.pY = ev.pageY;
                    // update "current" X and Y position based on mousemove
                    $el.off(mousemove, track).on(mousemove, track);
                    // start polling interval (self-calling timeout) to compare mouse coordinates over time
                    state.timeoutId = setTimeout(compare, interval);
                }
                else {
                    // "mouseleave"
                    // do nothing if not already active
                    if (!state.isActive)
                        return;
                    // unbind expensive mousemove event
                    $el.off(mousemove, track);
                    // if hoverIntent state is true, then call the mouseOut function after the specified delay
                    state = {};
                    handler();
                }
            };
            $el.on('mouseover', handleHover).on('mouseleave', handleHover);
        });
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
    const eventPosition = (e) => {
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

    const brushes = ['green', 'red', 'blue', 'yellow'];
    function start$2(state, e) {
        // support one finger touch only
        if (e.touches && e.touches.length > 1)
            return;
        e.stopPropagation();
        e.preventDefault();
        e.ctrlKey ? unselect(state) : cancelMove(state);
        const pos = eventPosition(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
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
            state.drawable.current.pos = eventPosition(e);
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

    function start$1(s, e) {
        if (!e.isTrusted || (e.button !== undefined && e.button !== 0))
            return; // only touch or left click
        if (e.touches && e.touches.length > 1)
            return; // support one finger touch only
        const bounds = s.dom.bounds(), position = eventPosition(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
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
        const position = eventPosition(e);
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
            s.draggable.current.pos = eventPosition(e);
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
        const eventPos = eventPosition(e) || cur.pos;
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

    function modal(content, cls, onClose) {
        modal.close();
        const $wrap = $('<div id="modal-wrap"><span class="close" data-icon="L"></span></div>');
        const $overlay = $(`<div id="modal-overlay" class="${cls}">`).on('click', modal.close);
        $wrap.appendTo($overlay);
        content.clone().removeClass('none').appendTo($wrap);
        modal.onClose = onClose;
        $wrap.find('.close').on('click', modal.close);
        $wrap.on('click', (e) => e.stopPropagation());
        $('body').addClass('overlayed').prepend($overlay);
        return $wrap;
    }
    modal.close = () => {
        $('body').removeClass('overlayed');
        $('#modal-overlay').each(function () {
            if (modal.onClose)
                modal.onClose();
            $(this).remove();
        });
        delete modal.onClose;
    };
    modal.onClose = undefined;

    const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
    };
    const letters = {
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
                            role: roles[role],
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
                const letter = letters[piece.role];
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
            const position = eventPosition(e);
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

    function chessground (ctrl) {
        return h('div.cg-wrap', {
            hook: {
                insert: vnode => {
                    const el = vnode.elm;
                    ctrl.chessground = Chessground(el, makeConfig(ctrl));
                    bindEvents(el, ctrl);
                },
                destroy: _ => ctrl.chessground.destroy(),
            },
        });
    }
    function bindEvents(el, ctrl) {
        const handler = onMouseEvent(ctrl);
        ['touchstart', 'touchmove', 'mousedown', 'mousemove', 'contextmenu'].forEach(function (ev) {
            el.addEventListener(ev, handler);
        });
    }
    function isLeftButton(e) {
        return e.buttons === 1 || e.button === 1;
    }
    function isLeftClick(e) {
        return isLeftButton(e) && !e.ctrlKey;
    }
    function isRightClick(e) {
        return isRightButton(e) || (!!e.ctrlKey && isLeftButton(e));
    }
    let downKey;
    let lastKey;
    let placeDelete;
    function onMouseEvent(ctrl) {
        return function (e) {
            const sel = ctrl.selected();
            // do not generate corresponding mouse event
            // (https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent)
            if (sel !== 'pointer' && e.cancelable !== false && (e.type === 'touchstart' || e.type === 'touchmove'))
                e.preventDefault();
            if (isLeftClick(e) || e.type === 'touchstart' || e.type === 'touchmove') {
                if (sel === 'pointer' ||
                    (ctrl.chessground &&
                        ctrl.chessground.state.draggable.current &&
                        ctrl.chessground.state.draggable.current.newPiece))
                    return;
                const pos = eventPosition(e);
                if (!pos)
                    return;
                const key = ctrl.chessground.getKeyAtDomPos(pos);
                if (!key)
                    return;
                if (e.type === 'mousedown' || e.type === 'touchstart')
                    downKey = key;
                if (sel === 'trash')
                    deleteOrHidePiece(ctrl, key, e);
                else {
                    const existingPiece = ctrl.chessground.state.pieces.get(key);
                    const piece = {
                        color: sel[0],
                        role: sel[1],
                    };
                    const samePiece = existingPiece && piece.color == existingPiece.color && piece.role == existingPiece.role;
                    if ((e.type === 'mousedown' || e.type === 'touchstart') && samePiece) {
                        deleteOrHidePiece(ctrl, key, e);
                        placeDelete = true;
                        const endEvents = { mousedown: 'mouseup', touchstart: 'touchend' };
                        document.addEventListener(endEvents[e.type], () => (placeDelete = false), { once: true });
                    }
                    else if (!placeDelete && (e.type === 'mousedown' || e.type === 'touchstart' || key !== lastKey)) {
                        ctrl.chessground.setPieces(new Map([[key, piece]]));
                        ctrl.onChange();
                        ctrl.chessground.cancelMove();
                    }
                }
                lastKey = key;
            }
            else if (isRightClick(e)) {
                if (sel !== 'pointer') {
                    ctrl.chessground.state.drawable.current = undefined;
                    ctrl.chessground.state.drawable.shapes = [];
                    if (e.type === 'contextmenu' && sel != 'trash') {
                        ctrl.chessground.cancelMove();
                        sel[0] = opposite(sel[0]);
                        ctrl.redraw();
                    }
                }
            }
        };
    }
    function deleteOrHidePiece(ctrl, key, e) {
        if (e.type === 'touchstart') {
            if (ctrl.chessground.state.pieces.has(key)) {
                ctrl.chessground.state.draggable.current.element.style.display = 'none';
                ctrl.chessground.cancelMove();
            }
            document.addEventListener('touchend', () => deletePiece(ctrl, key), { once: true });
        }
        else if (e.type === 'mousedown' || key !== downKey) {
            deletePiece(ctrl, key);
        }
    }
    function deletePiece(ctrl, key) {
        ctrl.chessground.setPieces(new Map([[key, undefined]]));
        ctrl.onChange();
    }
    function makeConfig(ctrl) {
        return {
            fen: ctrl.cfg.fen,
            orientation: ctrl.options.orientation || 'white',
            coordinates: !ctrl.cfg.embed,
            autoCastle: false,
            addPieceZIndex: ctrl.cfg.is3d,
            movable: {
                free: true,
                color: 'both',
            },
            animation: {
                duration: ctrl.cfg.animation.duration,
            },
            premovable: {
                enabled: false,
            },
            drawable: {
                enabled: true,
                defaultSnapToValidMove: (lichess.storage.get('arrow.snap') || 1) != '0',
            },
            draggable: {
                showGhost: true,
                deleteOnDropOff: true,
            },
            selectable: {
                enabled: false,
            },
            highlight: {
                lastMove: false,
            },
            events: {
                change: ctrl.onChange.bind(ctrl),
                insert: changeColorHandle,
            },
        };
    }

    function castleCheckBox(ctrl, id, label, reversed) {
        const input = h('input', {
            attrs: {
                type: 'checkbox',
                checked: ctrl.castlingToggles[id],
            },
            on: {
                change(e) {
                    ctrl.setCastlingToggle(id, e.target.checked);
                },
            },
        });
        return h('label', reversed ? [input, label] : [label, input]);
    }
    function optgroup(name, opts) {
        return h('optgroup', { attrs: { label: name } }, opts);
    }
    function studyButton(ctrl, state) {
        return h('form', {
            attrs: {
                method: 'post',
                action: '/study/as',
            },
        }, [
            h('input', { attrs: { type: 'hidden', name: 'orientation', value: ctrl.bottomColor() } }),
            h('input', { attrs: { type: 'hidden', name: 'variant', value: ctrl.rules } }),
            h('input', { attrs: { type: 'hidden', name: 'fen', value: state.legalFen || '' } }),
            h('button', {
                attrs: {
                    type: 'submit',
                    'data-icon': '4',
                    disabled: !state.legalFen,
                },
                class: {
                    button: true,
                    'button-empty': true,
                    text: true,
                    disabled: !state.legalFen,
                },
            }, ctrl.trans.noarg('toStudy')),
        ]);
    }
    function variant2option(key, name, ctrl) {
        return h('option', {
            attrs: {
                value: key,
                selected: key == ctrl.rules,
            },
        }, `${ctrl.trans.noarg('variant')} | ${name}`);
    }
    const allVariants = [
        ['chess', 'Standard'],
        ['antichess', 'Antichess'],
        ['atomic', 'Atomic'],
        ['crazyhouse', 'Crazyhouse'],
        ['horde', 'Horde'],
        ['kingofthehill', 'King of the Hill'],
        ['racingkings', 'Racing Kings'],
        ['3check', 'Three-check'],
    ];
    function controls(ctrl, state) {
        const position2option = function (pos) {
            return h('option', {
                attrs: {
                    value: pos.epd || pos.fen,
                    'data-fen': pos.fen,
                },
            }, pos.eco ? `${pos.eco} ${pos.name}` : pos.name);
        };
        return h('div.board-editor__tools', [
            ...(ctrl.cfg.embed || !ctrl.cfg.positions
                ? []
                : [
                    h('div', [
                        h('select.positions', {
                            props: {
                                value: state.fen.split(' ').slice(0, 4).join(' '),
                            },
                            on: {
                                change(e) {
                                    const el = e.target;
                                    let value = el.selectedOptions[0].getAttribute('data-fen');
                                    if (value == 'prompt')
                                        value = (prompt('Paste FEN') || '').trim();
                                    if (!value || !ctrl.setFen(value))
                                        el.value = '';
                                },
                            },
                        }, [
                            optgroup(ctrl.trans.noarg('setTheBoard'), [
                                h('option', {
                                    attrs: {
                                        selected: true,
                                    },
                                }, `- ${ctrl.trans.noarg('boardEditor')}  -`),
                                ...ctrl.extraPositions.map(position2option),
                            ]),
                            optgroup(ctrl.trans.noarg('popularOpenings'), ctrl.cfg.positions.map(position2option)),
                        ]),
                    ]),
                ]),
            h('div.metadata', [
                h('div.color', h('select', {
                    on: {
                        change(e) {
                            ctrl.setTurn(e.target.value);
                        },
                    },
                }, ['whitePlays', 'blackPlays'].map(function (key) {
                    return h('option', {
                        attrs: {
                            value: key[0] == 'w' ? 'white' : 'black',
                            selected: ctrl.turn[0] === key[0],
                        },
                    }, ctrl.trans(key));
                }))),
                h('div.castling', [
                    h('strong', ctrl.trans.noarg('castling')),
                    h('div', [
                        castleCheckBox(ctrl, 'K', ctrl.trans.noarg('whiteCastlingKingside'), !!ctrl.options.inlineCastling),
                        castleCheckBox(ctrl, 'Q', 'O-O-O', true),
                    ]),
                    h('div', [
                        castleCheckBox(ctrl, 'k', ctrl.trans.noarg('blackCastlingKingside'), !!ctrl.options.inlineCastling),
                        castleCheckBox(ctrl, 'q', 'O-O-O', true),
                    ]),
                ]),
            ]),
            ...(ctrl.cfg.embed
                ? [
                    h('div.actions', [
                        h('a.button.button-empty', {
                            on: {
                                click() {
                                    ctrl.startPosition();
                                },
                            },
                        }, ctrl.trans.noarg('startPosition')),
                        h('a.button.button-empty', {
                            on: {
                                click() {
                                    ctrl.clearBoard();
                                },
                            },
                        }, ctrl.trans.noarg('clearBoard')),
                    ]),
                ]
                : [
                    h('div', [
                        h('select', {
                            attrs: { id: 'variants' },
                            on: {
                                change(e) {
                                    ctrl.setRules(e.target.value);
                                },
                            },
                        }, allVariants.map(x => variant2option(x[0], x[1], ctrl))),
                    ]),
                    h('div.actions', [
                        h('a.button.button-empty.text', {
                            attrs: { 'data-icon': 'q' },
                            on: {
                                click() {
                                    ctrl.setFen(EMPTY_FEN);
                                },
                            },
                        }, ctrl.trans.noarg('clearBoard')),
                        h('a.button.button-empty.text', {
                            attrs: { 'data-icon': 'B' },
                            on: {
                                click() {
                                    ctrl.chessground.toggleOrientation();
                                    ctrl.redraw();
                                },
                            },
                        }, ctrl.trans.noarg('flipBoard')),
                        h('a', {
                            attrs: Object.assign({ 'data-icon': 'A', rel: 'nofollow' }, (state.legalFen ? { href: ctrl.makeAnalysisUrl(state.legalFen) } : {})),
                            class: {
                                button: true,
                                'button-empty': true,
                                text: true,
                                disabled: !state.legalFen,
                            },
                        }, ctrl.trans.noarg('analysis')),
                        h('a', {
                            class: {
                                button: true,
                                'button-empty': true,
                                disabled: !state.playable,
                            },
                            on: {
                                click: () => {
                                    if (state.playable)
                                        modal($('.continue-with'));
                                },
                            },
                        }, [h('span.text', { attrs: { 'data-icon': 'U' } }, ctrl.trans.noarg('continueFromHere'))]),
                        studyButton(ctrl, state),
                    ]),
                    h('div.continue-with.none', [
                        h('a.button', {
                            attrs: {
                                href: '/?fen=' + state.legalFen + '#ai',
                                rel: 'nofollow',
                            },
                        }, ctrl.trans.noarg('playWithTheMachine')),
                        h('a.button', {
                            attrs: {
                                href: '/?fen=' + state.legalFen + '#friend',
                                rel: 'nofollow',
                            },
                        }, ctrl.trans.noarg('playWithAFriend')),
                    ]),
                ]),
        ]);
    }
    function inputs(ctrl, fen) {
        if (ctrl.cfg.embed)
            return;
        return h('div.copyables', [
            h('p', [
                h('strong', 'FEN'),
                h('input.copyable', {
                    attrs: {
                        spellcheck: false,
                    },
                    props: {
                        value: fen,
                    },
                    on: {
                        change(e) {
                            const el = e.target;
                            ctrl.setFen(el.value.trim());
                            el.reportValidity();
                        },
                        input(e) {
                            const el = e.target;
                            const valid = parseFen(el.value.trim()).isOk;
                            el.setCustomValidity(valid ? '' : 'Invalid FEN');
                        },
                        blur(e) {
                            const el = e.target;
                            el.value = ctrl.getFen();
                            el.setCustomValidity('');
                        },
                    },
                }),
            ]),
            h('p', [
                h('strong.name', 'URL'),
                h('input.copyable.autoselect', {
                    attrs: {
                        readonly: true,
                        spellcheck: false,
                        value: ctrl.makeUrl(ctrl.cfg.baseUrl, fen),
                    },
                }),
            ]),
        ]);
    }
    // can be 'pointer', 'trash', or [color, role]
    function selectedToClass(s) {
        return s === 'pointer' || s === 'trash' ? s : s.join(' ');
    }
    let lastTouchMovePos;
    function sparePieces(ctrl, color, _orientation, position) {
        const selectedClass = selectedToClass(ctrl.selected());
        const pieces = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].map(function (role) {
            return [color, role];
        });
        return h('div', {
            attrs: {
                class: ['spare', 'spare-' + position, 'spare-' + color].join(' '),
            },
        }, ['pointer', ...pieces, 'trash'].map((s) => {
            const className = selectedToClass(s);
            const attrs = Object.assign({ class: className }, (s !== 'pointer' && s !== 'trash'
                ? {
                    'data-color': s[0],
                    'data-role': s[1],
                }
                : {}));
            const selectedSquare = selectedClass === className &&
                (!ctrl.chessground ||
                    !ctrl.chessground.state.draggable.current ||
                    !ctrl.chessground.state.draggable.current.newPiece);
            return h('div', {
                class: {
                    'no-square': true,
                    pointer: s === 'pointer',
                    trash: s === 'trash',
                    'selected-square': selectedSquare,
                },
                on: {
                    mousedown: onSelectSparePiece(ctrl, s, 'mouseup'),
                    touchstart: onSelectSparePiece(ctrl, s, 'touchend'),
                    touchmove: e => {
                        lastTouchMovePos = eventPosition(e);
                    },
                },
            }, [h('div', [h('piece', { attrs })])]);
        }));
    }
    function onSelectSparePiece(ctrl, s, upEvent) {
        return function (e) {
            e.preventDefault();
            if (s === 'pointer' || s === 'trash') {
                ctrl.selected(s);
                ctrl.redraw();
            }
            else {
                ctrl.selected('pointer');
                dragNewPiece(ctrl.chessground.state, {
                    color: s[0],
                    role: s[1],
                }, e, true);
                document.addEventListener(upEvent, (e) => {
                    const eventPos = eventPosition(e) || lastTouchMovePos;
                    if (eventPos && ctrl.chessground.getKeyAtDomPos(eventPos))
                        ctrl.selected('pointer');
                    else
                        ctrl.selected(s);
                    ctrl.redraw();
                }, { once: true });
            }
        };
    }
    function makeCursor(selected) {
        if (selected === 'pointer')
            return 'pointer';
        const name = selected === 'trash' ? 'trash' : selected.join('-');
        const url = lichess.assetUrl('cursors/' + name + '.cur');
        return `url('${url}'), default !important`;
    }
    function view (ctrl) {
        const state = ctrl.getState();
        const color = ctrl.bottomColor();
        return h('div.board-editor', {
            attrs: {
                style: `cursor: ${makeCursor(ctrl.selected())}`,
            },
        }, [
            sparePieces(ctrl, opposite(color), color, 'top'),
            h('div.main-board', [chessground(ctrl)]),
            sparePieces(ctrl, color, color, 'bottom'),
            controls(ctrl, state),
            inputs(ctrl, state.fen),
        ]);
    }

    const patch = init([classModule, attributesModule, propsModule, eventListenersModule]);
    function LichessEditor(element, config) {
        const ctrl = new EditorCtrl(config, redraw);
        element.innerHTML = '';
        const inner = document.createElement('div');
        element.appendChild(inner);
        let vnode = patch(inner, view(ctrl));
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        menuHover();
        return {
            getFen: ctrl.getFen.bind(ctrl),
            setOrientation: ctrl.setOrientation.bind(ctrl),
        };
    }
    // that's for the rest of lichess to access chessground
    // without having to include it a second time
    window.Chessground = Chessground;

    return LichessEditor;

}());
