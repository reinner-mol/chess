var LichessMsg = (function () {
    'use strict';

    function createElement(tagName, options) {
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
        createElement,
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

    function userIcon(user, cls) {
        return h('div.user-link.' + cls, {
            class: {
                online: user.online,
                offline: !user.online,
            },
        }, [h('i.line' + (user.patron ? '.patron' : ''))]);
    }
    const userName = (user) => user.title
        ? [h('span.utitle', user.title == 'BOT' ? { attrs: { 'data-bot': true } } : {}, user.title), ' ', user.name]
        : [user.name];
    function bind(eventName, f) {
        return {
            insert(vnode) {
                vnode.elm.addEventListener(eventName, e => {
                    e.stopPropagation();
                    f(e);
                    return false;
                });
            },
        };
    }
    function bindMobileMousedown(f) {
        return bind('ontouchstart' in window ? 'click' : 'mousedown', f);
    }
    function spinner() {
        return h('div.spinner', [
            h('svg', { attrs: { viewBox: '0 0 40 40' } }, [
                h('circle', {
                    attrs: { cx: 20, cy: 20, r: 18, fill: 'none' },
                }),
            ]),
        ]);
    }

    function renderActions(ctrl, convo) {
        if (convo.user.id == 'lichess')
            return [];
        const nodes = [];
        const cls = 'msg-app__convo__action.button.button-empty';
        nodes.push(h(`a.${cls}.play`, {
            key: 'play',
            attrs: {
                'data-icon': 'U',
                href: `/?user=${convo.user.name}#friend`,
                title: ctrl.trans.noarg('challengeToPlay'),
            },
        }));
        nodes.push(h('div.msg-app__convo__action__sep', '|'));
        if (convo.relations.out === false)
            nodes.push(h(`button.${cls}.text.hover-text`, {
                key: 'unblock',
                attrs: {
                    'data-icon': 'k',
                    title: ctrl.trans.noarg('blocked'),
                    'data-hover-text': ctrl.trans.noarg('unblock'),
                },
                hook: bind('click', ctrl.unblock),
            }));
        else
            nodes.push(h(`button.${cls}.bad`, {
                key: 'block',
                attrs: {
                    'data-icon': 'k',
                    title: ctrl.trans.noarg('block'),
                },
                hook: bind('click', withConfirm(ctrl.block)),
            }));
        nodes.push(h(`button.${cls}.bad`, {
            key: 'delete',
            attrs: {
                'data-icon': 'q',
                title: ctrl.trans.noarg('delete'),
            },
            hook: bind('click', withConfirm(ctrl.delete)),
        }));
        if (convo.msgs[0])
            nodes.push(h(`button.${cls}.bad`, {
                key: 'report',
                attrs: {
                    'data-icon': '!',
                    title: ctrl.trans('reportXToModerators', convo.user.name),
                },
                hook: bind('click', withConfirm(ctrl.report)),
            }));
        return nodes;
    }
    const withConfirm = (f) => (e) => {
        if (confirm(`${e.target.getAttribute('title') || 'Confirm'}?`))
            f();
    };

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

    function renderInteract(ctrl, user) {
        const connected = ctrl.connected();
        return h('form.msg-app__convo__post', {
            hook: bind('submit', e => {
                e.preventDefault();
                const area = e.target.querySelector('textarea');
                if (area) {
                    area.dispatchEvent(new Event('send'));
                    area.focus();
                }
            }),
        }, [
            renderTextarea(ctrl, user),
            h('button.msg-app__convo__post__submit.button', {
                class: { connected },
                attrs: {
                    type: 'submit',
                    'data-icon': 'G',
                    disabled: !connected,
                },
            }),
        ]);
    }
    function renderTextarea(ctrl, user) {
        return h('textarea.msg-app__convo__post__text', {
            attrs: {
                rows: 1,
            },
            hook: {
                insert(vnode) {
                    setupTextarea(vnode.elm, user.id, ctrl);
                },
            },
        });
    }
    function setupTextarea(area, contact, ctrl) {
        const storage = ctrl.textStore;
        let prev = 0;
        function send() {
            const now = Date.now();
            if (prev > now - 1000 || !ctrl.connected())
                return;
            prev = now;
            const txt = area.value.trim();
            if (txt.length > 8000)
                return alert('The message is too long.');
            if (txt)
                ctrl.post(txt);
            area.value = '';
            area.dispatchEvent(new Event('input')); // resize the textarea
            storage.remove();
        }
        // hack to automatically resize the textarea based on content
        area.value = '';
        const baseScrollHeight = area.scrollHeight;
        area.addEventListener('input', throttle(500, () => {
            const text = area.value.trim();
            area.rows = 1;
            // the resize magic
            if (text)
                area.rows = Math.min(10, 1 + Math.ceil((area.scrollHeight - baseScrollHeight) / 19));
            // and save content
            storage.set(text);
            ctrl.sendTyping(contact);
        }));
        // restore previously saved content
        area.value = storage.get() || '';
        if (area.value)
            area.dispatchEvent(new Event('input'));
        // send the content on <enter.
        area.addEventListener('keypress', (e) => {
            if ((e.which == 10 || e.which == 13) && !e.shiftKey) {
                e.preventDefault();
                setTimeout(send);
            }
        });
        area.addEventListener('send', send);
        if (!('ontouchstart' in window))
            area.focus();
    }

    class Scroller {
        constructor() {
            this.enabled = false;
            this.init = (e) => {
                this.enabled = true;
                this.element = e;
                this.element.addEventListener('scroll', throttle(500, _ => {
                    const el = this.element;
                    this.enable(!!el && el.offsetHeight + el.scrollTop > el.scrollHeight - 20);
                }), { passive: true });
                window.el = this.element;
            };
            this.auto = () => {
                if (this.element && this.enabled)
                    requestAnimationFrame(() => (this.element.scrollTop = 9999999));
            };
            this.enable = (v) => {
                this.enabled = v;
            };
            this.setMarker = () => {
                this.marker = this.element && this.element.querySelector('mine,their');
            };
            this.toMarker = () => {
                if (this.marker && this.to(this.marker)) {
                    this.marker = undefined;
                    return true;
                }
                return false;
            };
            this.to = (target) => {
                if (this.element) {
                    const top = target.offsetTop - this.element.offsetHeight / 2 + target.offsetHeight / 2;
                    if (top > 0)
                        this.element.scrollTop = top;
                    return top > 0;
                }
                return false;
            };
        }
    }
    const scroller = new Scroller();

    // from https://github.com/bryanwoods/autolink-js/blob/master/autolink.js
    const linkRegex = /(^|[\s\n]|<[A-Za-z]*\/?>)((?:(?:https?|ftp):\/\/|lichess\.org)[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;
    const newLineRegex = /\n/g;
    const userPattern = /(^|[^\w@#/])@([a-z0-9][a-z0-9_-]{0,28}[a-z0-9])/gi;
    // looks like it has a @mention or #gameid or a url.tld
    function isMoreThanText(str) {
        return /(\n|(@|#|\.)\w{2,})/.test(str);
    }
    function linkReplace(href, body, cls) {
        if (href.includes('&quot;'))
            return href;
        return `<a target="_blank" rel="noopener nofollow noreferrer" href="${href.startsWith('/') || href.includes('://') ? href : '//' + href}"${cls ? ` class="${cls}"` : ''}>${body ? body : href}</a>`;
    }
    function userLinkReplace(_, prefix, user) {
        return prefix + linkReplace('/@/' + user, '@' + user);
    }

    const imgurRegex = /https?:\/\/(?:i\.)?imgur\.com\/(\w+)(?:\.jpe?g|\.png|\.gif)?/;
    const giphyRegex = /https:\/\/(?:media\.giphy\.com\/media\/|giphy\.com\/gifs\/(?:\w+-)*)(\w+)(?:\/giphy\.gif)?/;
    const img = (src) => `<img src="${src}"/>`;
    const aImg = (src) => linkReplace(src, img(src));
    const expandImgur = (url) => imgurRegex.test(url) ? url.replace(imgurRegex, (_, id) => aImg(`https://i.imgur.com/${id}.jpg`)) : undefined;
    const expandGiphy = (url) => giphyRegex.test(url)
        ? url.replace(giphyRegex, (_, id) => aImg(`https://media.giphy.com/media/${id}/giphy.gif`))
        : undefined;
    const expandImage = (url) => (/\.(jpg|jpeg|png|gif)$/.test(url) ? aImg(url) : undefined);
    const expandLink = (url) => linkReplace(url, url.replace(/^https?:\/\//, ''));
    const expandUrl = (url) => expandImgur(url) || expandGiphy(url) || expandImage(url) || expandLink(url);
    const expandUrls = (html) => html.replace(linkRegex, (_, space, url) => `${space}${expandUrl(url)}`);
    const expandMentions = (html) => html.replace(userPattern, userLinkReplace);
    const expandGameIds = (html) => html.replace(/\s#([\w]{8})($|[^\w-])/g, (_, id, suffix) => ' ' + linkReplace('/' + id, '#' + id, 'text') + suffix);
    const enhance = (str) => expandGameIds(expandMentions(expandUrls(lichess.escapeHtml(str)))).replace(newLineRegex, '<br>');
    const domain = window.location.host;
    const gameRegex = new RegExp(`(?:https?://)${domain}/(?:embed/)?(\\w{8})(?:(?:/(white|black))|\\w{4}|)(#\\d+)?$`);
    const notGames = ['training', 'analysis', 'insights', 'practice', 'features', 'password', 'streamer', 'timeline'];
    function expandIFrames(el) {
        const expandables = [];
        el.querySelectorAll('a:not(.text)').forEach((a) => {
            const link = parseLink(a);
            if (link)
                expandables.push({
                    element: a,
                    link: link,
                });
        });
        expandGames(expandables.filter(e => e.link.type == 'game'));
    }
    function expandGames(games) {
        if (games.length < 3)
            games.forEach(expand);
        else
            games.forEach(game => {
                game.element.title = 'Click to expand';
                game.element.classList.add('text');
                game.element.setAttribute('data-icon', '=');
                game.element.addEventListener('click', e => {
                    if (e.button === 0) {
                        e.preventDefault();
                        expand(game);
                    }
                });
            });
    }
    function expand(exp) {
        const $iframe = $('<iframe>').attr('src', exp.link.src);
        $(exp.element).parent().parent().addClass('has-embed');
        $(exp.element).replaceWith($('<div class="embed">').prepend($iframe));
        return $iframe
            .on('load', function () {
            var _a;
            if ((_a = this.contentDocument) === null || _a === void 0 ? void 0 : _a.title.startsWith('404'))
                this.parentNode.classList.add('not-found');
            scroller.auto();
        })
            .on('mouseenter', function () {
            this.focus();
        });
    }
    function parseLink(a) {
        const [id, pov, ply] = Array.from(a.href.match(gameRegex) || []).slice(1);
        if (id && !notGames.includes(id))
            return {
                type: 'game',
                src: configureSrc(`/embed/${id}${pov ? `/${pov}` : ''}${ply || ''}`),
            };
        return undefined;
    }
    const themes = [
        'blue',
        'blue2',
        'blue3',
        'blue-marble',
        'canvas',
        'wood',
        'wood2',
        'wood3',
        'wood4',
        'maple',
        'maple2',
        'brown',
        'leather',
        'green',
        'marble',
        'green-plastic',
        'grey',
        'metal',
        'olive',
        'newspaper',
        'purple',
        'purple-diag',
        'pink',
        'ic',
        'horsey',
    ];
    function configureSrc(url) {
        if (url.includes('://'))
            return url;
        const parsed = new URL(url, window.location.href);
        parsed.searchParams.append('theme', themes.find(theme => document.body.classList.contains(theme)));
        parsed.searchParams.append('bg', document.body.getAttribute('data-theme'));
        return parsed.href;
    }

    function renderMsgs(ctrl, convo) {
        return h('div.msg-app__convo__msgs', {
            hook: {
                insert: setupMsgs(true),
                postpatch: setupMsgs(false),
            },
        }, [
            h('div.msg-app__convo__msgs__init'),
            h('div.msg-app__convo__msgs__content', [
                ctrl.canGetMoreSince
                    ? h('button.msg-app__convo__msgs__more.button.button-empty', {
                        key: 'more',
                        hook: bind('click', _ => {
                            scroller.setMarker();
                            ctrl.getMore();
                        }),
                    }, 'Load more')
                    : null,
                ...contentMsgs(ctrl, convo.msgs),
                ctrl.typing ? h('div.msg-app__convo__msgs__typing', `${convo.user.name} is typing...`) : null,
            ]),
        ]);
    }
    function contentMsgs(ctrl, msgs) {
        const dailies = groupMsgs(msgs);
        const nodes = [];
        dailies.forEach(daily => nodes.push(...renderDaily(ctrl, daily)));
        return nodes;
    }
    function renderDaily(ctrl, daily) {
        return [
            h('day', renderDate$1(daily.date, ctrl.trans)),
            ...daily.msgs.map(group => h('group', group.map(msg => renderMsg(ctrl, msg)))),
        ];
    }
    function renderMsg(ctrl, msg) {
        const tag = msg.user == ctrl.data.me.id ? 'mine' : 'their';
        return h(tag, [renderText(msg), h('em', `${pad2(msg.date.getHours())}:${pad2(msg.date.getMinutes())}`)]);
    }
    const pad2 = (num) => (num < 10 ? '0' : '') + num;
    function groupMsgs(msgs) {
        let prev = msgs[0];
        if (!prev)
            return [{ date: new Date(), msgs: [] }];
        const dailies = [
            {
                date: prev.date,
                msgs: [[prev]],
            },
        ];
        msgs.slice(1).forEach(msg => {
            if (sameDay(msg.date, prev.date)) {
                if (msg.user == prev.user)
                    dailies[0].msgs[0].unshift(msg);
                else
                    dailies[0].msgs.unshift([msg]);
            }
            else
                dailies.unshift({
                    date: msg.date,
                    msgs: [[msg]],
                });
            prev = msg;
        });
        return dailies;
    }
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    function renderDate$1(date, trans) {
        if (sameDay(date, today))
            return trans.noarg('today').toUpperCase();
        if (sameDay(date, yesterday))
            return trans.noarg('yesterday').toUpperCase();
        return renderFullDate(date);
    }
    const renderFullDate = (date) => `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const sameDay = (d, e) => d.getDate() == e.getDate() && d.getMonth() == e.getMonth() && d.getFullYear() == e.getFullYear();
    const renderText = (msg) => isMoreThanText(msg.text)
        ? h('t', {
            hook: {
                create(_, vnode) {
                    const el = vnode.elm;
                    el.innerHTML = enhance(msg.text);
                    el.querySelectorAll('img').forEach(c => c.addEventListener('load', scroller.auto, { once: true }));
                },
            },
        })
        : h('t', msg.text);
    const setupMsgs = (insert) => (vnode) => {
        const el = vnode.elm;
        if (insert)
            scroller.init(el);
        expandIFrames(el);
        scroller.toMarker() || scroller.auto();
    };

    function renderConvo(ctrl, convo) {
        const user = convo.user;
        return h('div.msg-app__convo', {
            key: user.id,
        }, [
            h('div.msg-app__convo__head', [
                h('div.msg-app__convo__head__left', [
                    h('span.msg-app__convo__head__back', {
                        attrs: { 'data-icon': 'I' },
                        hook: bindMobileMousedown(ctrl.showSide),
                    }),
                    h('a.user-link.ulpt', {
                        attrs: { href: `/@/${user.name}` },
                        class: {
                            online: user.online,
                            offline: !user.online,
                        },
                    }, [h('i.line' + (user.id == 'lichess' ? '.moderator' : user.patron ? '.patron' : '')), ...userName(user)]),
                ]),
                h('div.msg-app__convo__head__actions', renderActions(ctrl, convo)),
            ]),
            renderMsgs(ctrl, convo),
            h('div.msg-app__convo__reply', [
                convo.relations.out === false || convo.relations.in === false
                    ? h('div.msg-app__convo__reply__block.text', {
                        attrs: { 'data-icon': 'k' },
                    }, 'This conversation is blocked.')
                    : convo.postable
                        ? renderInteract(ctrl, user)
                        : h('div.msg-app__convo__reply__block.text', {
                            attrs: { 'data-icon': 'k' },
                        }, `${user.name} doesn't accept new messages.`),
            ]),
        ]);
    }

    function renderContact(ctrl, contact, active) {
        const user = contact.user, msg = contact.lastMsg, isNew = !msg.read && msg.user != ctrl.data.me.id;
        return h('div.msg-app__side__contact', {
            key: user.id,
            class: { active: active == user.id },
            hook: bindMobileMousedown(_ => ctrl.openConvo(user.id)),
        }, [
            userIcon(user, 'msg-app__side__contact__icon'),
            h('div.msg-app__side__contact__user', [
                h('div.msg-app__side__contact__head', [
                    h('div.msg-app__side__contact__name', userName(user)),
                    h('div.msg-app__side__contact__date', renderDate(msg)),
                ]),
                h('div.msg-app__side__contact__body', [
                    h('div.msg-app__side__contact__msg', {
                        class: { 'msg-app__side__contact__msg--new': isNew },
                    }, msg.text),
                    isNew
                        ? h('i.msg-app__side__contact__new', {
                            attrs: { 'data-icon': '' },
                        })
                        : null,
                ]),
            ]),
        ]);
    }
    function renderDate(msg) {
        return h('time.timeago', {
            key: msg.date.getTime(),
            attrs: {
                title: msg.date.toLocaleString(),
                datetime: msg.date.getTime(),
            },
        }, lichess.timeago(msg.date));
    }

    function renderInput(ctrl) {
        return h('div.msg-app__side__search', [
            h('input', {
                attrs: {
                    value: '',
                    placeholder: ctrl.trans.noarg('searchOrStartNewDiscussion'),
                },
                hook: {
                    insert(vnode) {
                        const input = vnode.elm;
                        input.addEventListener('input', throttle(500, () => ctrl.searchInput(input.value.trim())));
                        input.addEventListener('blur', () => setTimeout(() => {
                            input.value = '';
                            ctrl.searchInput('');
                        }, 500));
                    },
                },
            }),
        ]);
    }
    function renderResults(ctrl, res) {
        return h('div.msg-app__search.msg-app__side__content', [
            res.contacts[0] &&
                h('section', [
                    h('h2', ctrl.trans.noarg('discussions')),
                    h('div.msg-app__search__contacts', res.contacts.map(t => renderContact(ctrl, t))),
                ]),
            res.friends[0] &&
                h('section', [
                    h('h2', ctrl.trans.noarg('friends')),
                    h('div.msg-app__search__users', res.friends.map(u => renderUser(ctrl, u))),
                ]),
            res.users[0] &&
                h('section', [
                    h('h2', ctrl.trans.noarg('players')),
                    h('div.msg-app__search__users', res.users.map(u => renderUser(ctrl, u))),
                ]),
        ]);
    }
    function renderUser(ctrl, user) {
        return h('div.msg-app__side__contact', {
            key: user.id,
            hook: bindMobileMousedown(_ => ctrl.openConvo(user.id)),
        }, [
            userIcon(user, 'msg-app__side__contact__icon'),
            h('div.msg-app__side__contact__user', [
                h('div.msg-app__side__contact__head', [h('div.msg-app__side__contact__name', userName(user))]),
            ]),
        ]);
    }

    function view (ctrl) {
        var _a;
        const activeId = (_a = ctrl.data.convo) === null || _a === void 0 ? void 0 : _a.user.id;
        return h('main.box.msg-app', {
            class: {
                [`pane-${ctrl.pane}`]: true,
            },
        }, [
            h('div.msg-app__side', [
                renderInput(ctrl),
                ctrl.search.result
                    ? renderResults(ctrl, ctrl.search.result)
                    : h('div.msg-app__contacts.msg-app__side__content', ctrl.data.contacts.map(t => renderContact(ctrl, t, activeId))),
            ]),
            ctrl.data.convo
                ? renderConvo(ctrl, ctrl.data.convo)
                : ctrl.loading
                    ? h('div.msg-app__convo', { key: ':' }, [h('div.msg-app__convo__head'), spinner()])
                    : '',
        ]);
    }

    const jsonHeader = {
        Accept: 'application/vnd.lichess.v5+json',
    };
    const defaultInit = {
        cache: 'no-cache',
        credentials: 'same-origin', // required for safari < 12
    };
    const xhrHeader = {
        'X-Requested-With': 'XMLHttpRequest', // so lila knows it's XHR
    };
    /* fetch a JSON value */
    const json = (url, init = {}) => fetch(url, Object.assign(Object.assign(Object.assign({}, defaultInit), { headers: Object.assign(Object.assign({}, jsonHeader), xhrHeader) }), init)).then(res => {
        if (res.ok)
            return res.json();
        throw res.statusText;
    });
    /* produce HTTP form data from a JS object */
    const form = (data) => {
        const formData = new FormData();
        for (const k of Object.keys(data))
            formData.append(k, data[k]);
        return formData;
    };

    function loadConvo(userId) {
        return json(`/inbox/${userId}`).then(upgradeData);
    }
    function getMore(userId, before) {
        return json(`/inbox/${userId}?before=${before.getTime()}`).then(upgradeData);
    }
    function loadContacts() {
        return json(`/inbox`).then(upgradeData);
    }
    function search(q) {
        return json(`/inbox/search?q=${q}`).then(res => (Object.assign(Object.assign({}, res), { contacts: res.contacts.map(upgradeContact) })));
    }
    function block(u) {
        return json(`/rel/block/${u}`, { method: 'post' });
    }
    function unblock(u) {
        return json(`/rel/unblock/${u}`, { method: 'post' });
    }
    function del(u) {
        return json(`/inbox/${u}`, { method: 'delete' }).then(upgradeData);
    }
    function report(name, text) {
        return json('/report/flag', {
            method: 'post',
            body: form({
                username: name,
                text: text,
                resource: 'msg',
            }),
        });
    }
    function post(dest, text) {
        lichess.pubsub.emit('socket.send', 'msgSend', { dest, text });
    }
    function setRead(dest) {
        lichess.pubsub.emit('socket.send', 'msgRead', dest);
    }
    function typing(dest) {
        lichess.pubsub.emit('socket.send', 'msgType', dest);
    }
    function websocketHandler(ctrl) {
        const listen = lichess.pubsub.on;
        listen('socket.in.msgNew', msg => {
            ctrl.receive(Object.assign(Object.assign({}, upgradeMsg(msg)), { read: false }));
        });
        listen('socket.in.msgType', ctrl.receiveTyping);
        listen('socket.in.blockedBy', ctrl.changeBlockBy);
        listen('socket.in.unblockedBy', ctrl.changeBlockBy);
        let connected = true;
        listen('socket.close', () => {
            connected = false;
            ctrl.redraw();
        });
        listen('socket.open', () => {
            if (!connected) {
                connected = true;
                ctrl.onReconnect();
            }
        });
        return () => connected;
    }
    // the upgrade functions convert incoming timestamps into JS dates
    function upgradeData(d) {
        return Object.assign(Object.assign({}, d), { convo: d.convo && upgradeConvo(d.convo), contacts: d.contacts.map(upgradeContact) });
    }
    function upgradeMsg(m) {
        return Object.assign(Object.assign({}, m), { date: new Date(m.date) });
    }
    function upgradeUser(u) {
        return Object.assign(Object.assign({}, u), { id: u.name.toLowerCase() });
    }
    function upgradeContact(c) {
        return Object.assign(Object.assign({}, c), { user: upgradeUser(c.user), lastMsg: upgradeMsg(c.lastMsg) });
    }
    function upgradeConvo(c) {
        return Object.assign(Object.assign({}, c), { user: upgradeUser(c.user), msgs: c.msgs.map(upgradeMsg) });
    }

    let notifications = [];
    let listening = false;
    function listenToFocus() {
        if (!listening) {
            listening = true;
            window.addEventListener('focus', () => {
                notifications.forEach(n => n.close());
                notifications = [];
            });
        }
    }
    function notify(msg) {
        const storage = lichess.storage.make('just-notified');
        if (document.hasFocus() || Date.now() - parseInt(storage.get(), 10) < 1000)
            return;
        storage.set('' + Date.now());
        if ($.isFunction(msg))
            msg = msg();
        const notification = new Notification('lichess.org', {
            icon: lichess.assetUrl('logo/lichess-favicon-256.png', { noVersion: true }),
            body: msg,
        });
        notification.onclick = () => window.focus();
        notifications.push(notification);
        listenToFocus();
    }
    function notify$1 (msg) {
        if (document.hasFocus() || !('Notification' in window))
            return;
        if (Notification.permission === 'granted') {
            // increase chances that the first tab can put a local storage lock
            setTimeout(notify, 10 + Math.random() * 500, msg);
        }
    }

    class MsgCtrl {
        constructor(data, trans, redraw) {
            this.trans = trans;
            this.redraw = redraw;
            this.search = {
                input: '',
            };
            this.loading = false;
            this.connected = () => true;
            this.msgsPerPage = 100;
            this.openConvo = (userId) => {
                var _a;
                if (((_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id) != userId) {
                    this.data.convo = undefined;
                    this.loading = true;
                }
                loadConvo(userId).then(data => {
                    this.data = data;
                    this.search.result = undefined;
                    this.loading = false;
                    if (data.convo) {
                        history.replaceState({ contact: userId }, '', `/inbox/${data.convo.user.name}`);
                        this.onLoadConvo(data.convo);
                        this.redraw();
                    }
                    else
                        this.showSide();
                });
                this.pane = 'convo';
                this.redraw();
            };
            this.showSide = () => {
                this.pane = 'side';
                this.redraw();
            };
            this.getMore = () => {
                if (this.data.convo && this.canGetMoreSince)
                    getMore(this.data.convo.user.id, this.canGetMoreSince).then(data => {
                        if (!this.data.convo || !data.convo || data.convo.user.id != this.data.convo.user.id || !data.convo.msgs[0])
                            return;
                        if (data.convo.msgs[0].date >= this.data.convo.msgs[this.data.convo.msgs.length - 1].date)
                            return;
                        this.data.convo.msgs = this.data.convo.msgs.concat(data.convo.msgs);
                        this.onLoadMsgs(data.convo.msgs);
                        this.redraw();
                    });
                this.canGetMoreSince = undefined;
                this.redraw();
            };
            this.onLoadConvo = (convo) => {
                this.textStore = lichess.storage.make(`msg:area:${convo.user.id}`);
                this.onLoadMsgs(convo.msgs);
                if (this.typing) {
                    clearTimeout(this.typing.timeout);
                    this.typing = undefined;
                }
                setTimeout(this.setRead, 500);
            };
            this.onLoadMsgs = (msgs) => {
                const oldFirstMsg = msgs[this.msgsPerPage - 1];
                this.canGetMoreSince = oldFirstMsg === null || oldFirstMsg === void 0 ? void 0 : oldFirstMsg.date;
            };
            this.post = (text) => {
                if (this.data.convo) {
                    post(this.data.convo.user.id, text);
                    const msg = {
                        text,
                        user: this.data.me.id,
                        date: new Date(),
                        read: true,
                    };
                    this.data.convo.msgs.unshift(msg);
                    const contact = this.currentContact();
                    if (contact)
                        this.addMsg(msg, contact);
                    else
                        setTimeout(() => loadContacts().then(data => {
                            this.data.contacts = data.contacts;
                            this.redraw();
                        }), 1000);
                    scroller.enable(true);
                    this.redraw();
                }
            };
            this.receive = (msg) => {
                var _a;
                const contact = this.findContact(msg.user);
                this.addMsg(msg, contact);
                if (contact) {
                    let redrawn = false;
                    if (msg.user == ((_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id)) {
                        this.data.convo.msgs.unshift(msg);
                        if (document.hasFocus())
                            redrawn = this.setRead();
                        else
                            this.notify(contact, msg);
                        this.receiveTyping(msg.user, true);
                    }
                    if (!redrawn)
                        this.redraw();
                }
                else
                    loadContacts().then(data => {
                        this.data.contacts = data.contacts;
                        this.notify(this.findContact(msg.user), msg);
                        this.redraw();
                    });
            };
            this.addMsg = (msg, contact) => {
                if (contact) {
                    contact.lastMsg = msg;
                    this.data.contacts = [contact].concat(this.data.contacts.filter(c => c.user.id != contact.user.id));
                }
            };
            this.findContact = (userId) => this.data.contacts.find(c => c.user.id == userId);
            this.currentContact = () => this.data.convo && this.findContact(this.data.convo.user.id);
            this.notify = (contact, msg) => {
                notify$1(() => `${contact.user.name}: ${msg.text}`);
            };
            this.searchInput = (q) => {
                this.search.input = q;
                if (q[1])
                    search(q).then((res) => {
                        this.search.result = this.search.input[1] ? res : undefined;
                        this.redraw();
                    });
                else {
                    this.search.result = undefined;
                    this.redraw();
                }
            };
            this.setRead = () => {
                var _a;
                const msg = (_a = this.currentContact()) === null || _a === void 0 ? void 0 : _a.lastMsg;
                if (msg && msg.user != this.data.me.id) {
                    lichess.pubsub.emit('notify-app.set-read', msg.user);
                    if (msg.read)
                        return false;
                    msg.read = true;
                    setRead(msg.user);
                    this.redraw();
                    return true;
                }
                return false;
            };
            this.delete = () => {
                var _a;
                const userId = (_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id;
                if (userId)
                    del(userId).then(data => {
                        this.data = data;
                        this.redraw();
                        history.replaceState({}, '', '/inbox');
                    });
            };
            this.report = () => {
                var _a, _b, _c;
                const user = (_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user;
                if (user) {
                    const text = (_c = (_b = this.data.convo) === null || _b === void 0 ? void 0 : _b.msgs.find(m => m.user != this.data.me.id)) === null || _c === void 0 ? void 0 : _c.text.slice(0, 140);
                    if (text)
                        report(user.name, text).then(_ => alert('Your report has been sent.'));
                }
            };
            this.block = () => {
                var _a;
                const userId = (_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id;
                if (userId)
                    block(userId).then(() => this.openConvo(userId));
            };
            this.unblock = () => {
                var _a;
                const userId = (_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id;
                if (userId)
                    unblock(userId).then(() => this.openConvo(userId));
            };
            this.changeBlockBy = (userId) => {
                var _a;
                if (userId == ((_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id))
                    this.openConvo(userId);
            };
            this.sendTyping = throttle(3000, (user) => {
                var _a;
                if ((_a = this.textStore) === null || _a === void 0 ? void 0 : _a.get())
                    typing(user);
            });
            this.receiveTyping = (userId, cancel) => {
                var _a;
                if (this.typing) {
                    clearTimeout(this.typing.timeout);
                    this.typing = undefined;
                }
                if (cancel !== true && ((_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id) == userId) {
                    this.typing = {
                        user: userId,
                        timeout: setTimeout(() => {
                            var _a;
                            if (((_a = this.data.convo) === null || _a === void 0 ? void 0 : _a.user.id) == userId)
                                this.typing = undefined;
                            this.redraw();
                        }, 3000),
                    };
                }
                this.redraw();
            };
            this.onReconnect = () => {
                this.data.convo && this.openConvo(this.data.convo.user.id);
                this.redraw();
            };
            this.data = data;
            this.pane = data.convo ? 'convo' : 'side';
            this.connected = websocketHandler(this);
            if (this.data.convo)
                this.onLoadConvo(this.data.convo);
            window.addEventListener('focus', this.setRead);
        }
    }

    function LichessMsg(opts) {
        const element = document.querySelector('.msg-app'), patch = init([classModule, attributesModule]), appHeight = () => document.body.style.setProperty('--app-height', `${window.innerHeight}px`);
        window.addEventListener('resize', appHeight);
        appHeight();
        const ctrl = new MsgCtrl(upgradeData(opts.data), lichess.trans(opts.i18n), redraw);
        const blueprint = view(ctrl);
        element.innerHTML = '';
        let vnode = patch(element, blueprint);
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        redraw();
    }

    return LichessMsg;

}());
