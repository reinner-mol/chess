var LichessNotify = (function () {
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

    const defined = (v) => typeof v !== 'undefined';

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
    /* constructs a url with escaped parameters */
    const url = (path, params) => {
        const searchParams = new URLSearchParams();
        for (const k of Object.keys(params))
            if (defined(params[k]))
                searchParams.append(k, params[k]);
        const query = searchParams.toString();
        return query ? `${path}?${query}` : path;
    };

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

    // function generic(n: Notification, url: string | undefined, icon: string, content: VNode[]): VNode {
    function makeRenderers(trans) {
        return {
            genericLink: {
                html: n => generic(n, n.content.url, n.content.icon, [
                    h('span', [h('strong', n.content.title), drawTime(n)]),
                    h('span', n.content.text),
                ]),
                text: n => n.content.title || n.content.text,
            },
            mention: {
                html: n => generic(n, '/forum/redirect/post/' + n.content.postId, 'd', [
                    h('span', [h('strong', userFullName(n.content.mentionedBy)), drawTime(n)]),
                    h('span', trans('mentionedYouInX', n.content.topic)),
                ]),
                text: n => trans('xMentionedYouInY', userFullName(n.content.mentionedBy), n.content.topic),
            },
            invitedStudy: {
                html: n => generic(n, '/study/' + n.content.studyId, '4', [
                    h('span', [h('strong', userFullName(n.content.invitedBy)), drawTime(n)]),
                    h('span', trans('invitedYouToX', n.content.studyName)),
                ]),
                text: n => trans('xInvitedYouToY', userFullName(n.content.invitedBy), n.content.studyName),
            },
            privateMessage: {
                html: n => generic(n, '/inbox/' + n.content.user.name, 'c', [
                    h('span', [h('strong', userFullName(n.content.user)), drawTime(n)]),
                    h('span', n.content.text),
                ]),
                text: n => userFullName(n.content.sender) + ': ' + n.content.text,
            },
            teamJoined: {
                html: n => generic(n, '/team/' + n.content.id, 'f', [
                    h('span', [h('strong', n.content.name), drawTime(n)]),
                    h('span', trans.noarg('youAreNowPartOfTeam')),
                ]),
                text: n => trans('youHaveJoinedTeamX', n.content.name),
            },
            titledTourney: {
                html: n => generic(n, '/tournament/' + n.content.id, 'g', [
                    h('span', [h('strong', 'Lichess Titled Arena'), drawTime(n)]),
                    h('span', n.content.text),
                ]),
                text: _ => 'Lichess Titled Arena',
            },
            reportedBanned: {
                html: n => generic(n, undefined, '', [
                    h('span', [h('strong', trans.noarg('someoneYouReportedWasBanned'))]),
                    h('span', trans.noarg('thankYou')),
                ]),
                text: _ => trans.noarg('someoneYouReportedWasBanned'),
            },
            gameEnd: {
                html: n => {
                    let result;
                    switch (n.content.win) {
                        case true:
                            result = trans.noarg('congratsYouWon');
                            break;
                        case false:
                            result = trans.noarg('defeat');
                            break;
                        default:
                            result = trans.noarg('draw');
                    }
                    return generic(n, '/' + n.content.id, ';', [
                        h('span', [h('strong', trans('gameVsX', userFullName(n.content.opponent))), drawTime(n)]),
                        h('span', result),
                    ]);
                },
                text: n => {
                    let result;
                    switch (n.content.win) {
                        case true:
                            result = trans.noarg('victory');
                            break;
                        case false:
                            result = trans.noarg('defeat');
                            break;
                        default:
                            result = trans.noarg('draw');
                    }
                    return trans('resVsX', result, userFullName(n.content.opponent));
                },
            },
            planStart: {
                html: n => generic(n, '/patron', '', [
                    h('span', [h('strong', trans.noarg('thankYou')), drawTime(n)]),
                    h('span', trans.noarg('youJustBecamePatron')),
                ]),
                text: _ => trans.noarg('youJustBecamePatron'),
            },
            planExpire: {
                html: n => generic(n, '/patron', '', [
                    h('span', [h('strong', trans.noarg('patronAccountExpired')), drawTime(n)]),
                    h('span', trans.noarg('pleaseReconsiderRenewIt')),
                ]),
                text: _ => trans.noarg('patronAccountExpired'),
            },
            coachReview: {
                html: n => generic(n, '/coach/edit', ':', [
                    h('span', [h('strong', 'New pending review'), drawTime(n)]),
                    h('span', trans.noarg('someoneReviewedYourCoachProfile')),
                ]),
                text: _ => trans.noarg('newPendingReview'),
            },
            ratingRefund: {
                html: n => generic(n, '/player/myself', '', [
                    h('span', [h('strong', trans.noarg('lostAgainstTOSViolator')), drawTime(n)]),
                    h('span', trans('refundXpointsTimeControlY', n.content.points, n.content.perf)),
                ]),
                text: n => trans('refundXpointsTimeControlY', n.content.points, n.content.perf),
            },
            corresAlarm: {
                html: n => generic(n, '/' + n.content.id, ';', [
                    h('span', [h('strong', trans.noarg('timeAlmostUp')), drawTime(n)]),
                    // not a `LightUser`, could be a game against Stockfish
                    h('span', trans('gameVsX', n.content.op)),
                ]),
                text: _ => trans.noarg('timeAlmostUp'),
            },
            irwinDone: {
                html: n => generic(n, '/@/' + n.content.user.name + '?mod', '', [
                    h('span', [h('strong', userFullName(n.content.user)), drawTime(n)]),
                    h('span', 'Irwin job complete!'),
                ]),
                text: n => n.content.user.name + ': Irwin job complete!',
            },
        };
    }
    function generic(n, url, icon, content) {
        return h(url ? 'a' : 'span', {
            class: {
                site_notification: true,
                [n.type]: true,
                new: !n.read,
            },
            attrs: url ? { href: url } : undefined,
        }, [
            h('i', {
                attrs: { 'data-icon': icon },
            }),
            h('span.content', content),
        ]);
    }
    function drawTime(n) {
        const date = new Date(n.date);
        return h('time.timeago', {
            attrs: {
                title: date.toLocaleString(),
                datetime: n.date,
            },
        }, lichess.timeago(date));
    }
    function userFullName(u) {
        if (!u)
            return 'Anonymous';
        return u.title ? u.title + ' ' + u.name : u.name;
    }

    function view(ctrl) {
        const d = ctrl.data();
        return h('div#notify-app.links.dropdown', d && !ctrl.initiating() ? renderContent(ctrl, d) : [h('div.initiating', spinner())]);
    }
    function renderContent(ctrl, d) {
        const pager = d.pager;
        const nb = pager.currentPageResults.length;
        const nodes = [];
        if (pager.previousPage)
            nodes.push(h('div.pager.prev', {
                attrs: { 'data-icon': 'S' },
                hook: clickHook(ctrl.previousPage),
            }));
        else if (pager.nextPage)
            nodes.push(h('div.pager.prev.disabled', {
                attrs: { 'data-icon': 'S' },
            }));
        nodes.push(nb ? recentNotifications(d, ctrl.scrolling()) : empty());
        if (pager.nextPage)
            nodes.push(h('div.pager.next', {
                attrs: { 'data-icon': 'R' },
                hook: clickHook(ctrl.nextPage),
            }));
        if (!('Notification' in window))
            nodes.push(h('div.browser-notification', 'Browser does not support notification popups'));
        else if (Notification.permission == 'denied')
            nodes.push(notificationDenied());
        return nodes;
    }
    function asText(n, trans) {
        const renderers = makeRenderers(trans);
        return renderers[n.type] ? renderers[n.type].text(n) : undefined;
    }
    function notificationDenied() {
        return h('a.browser-notification.denied', {
            attrs: {
                href: '/faq#browser-notifications',
                target: '_blank',
            },
        }, 'Notification popups disabled by browser setting');
    }
    function asHtml(n, trans) {
        const renderers = makeRenderers(trans);
        return renderers[n.type] ? renderers[n.type].html(n) : undefined;
    }
    function clickHook(f) {
        return {
            insert: (vnode) => {
                vnode.elm.addEventListener('click', f);
            },
        };
    }
    const contentLoaded = (vnode) => lichess.contentLoaded(vnode.elm);
    function recentNotifications(d, scrolling) {
        const trans = lichess.trans(d.i18n);
        return h('div', {
            class: {
                notifications: true,
                scrolling,
            },
            hook: {
                insert: contentLoaded,
                postpatch: contentLoaded,
            },
        }, d.pager.currentPageResults.map(n => asHtml(n, trans)));
    }
    function empty() {
        return h('div.empty.text', { attrs: { 'data-icon': '' } }, 'No notifications.');
    }
    function spinner() {
        return h('div.spinner', [
            h('svg', { attrs: { viewBox: '0 0 40 40' } }, [h('circle', { attrs: { cx: 20, cy: 20, r: 18, fill: 'none' } })]),
        ]);
    }

    function makeCtrl(opts, redraw) {
        let data, initiating = true, scrolling = false;
        const readAllStorage = lichess.storage.make('notify-read-all');
        readAllStorage.listen(_ => {
            if (data) {
                data.unread = 0;
                opts.setCount(0);
                redraw();
            }
        });
        function update(d, incoming) {
            data = d;
            if (data.pager.currentPage === 1 && data.unread && opts.isVisible()) {
                opts.setNotified();
                data.unread = 0;
                readAllStorage.fire();
            }
            initiating = false;
            scrolling = false;
            opts.setCount(data.unread);
            if (incoming)
                notifyNew();
            redraw();
        }
        function notifyNew() {
            if (!data || data.pager.currentPage !== 1)
                return;
            const notif = data.pager.currentPageResults.find(n => !n.read);
            if (!notif)
                return;
            opts.pulse();
            if (!lichess.quietMode || notif.content.user.id == 'lichess')
                lichess.sound.play('newPM');
            const text = asText(notif, lichess.trans(data.i18n));
            const pushSubsribed = parseInt(lichess.storage.get('push-subscribed') || '0', 10) + 86400000 >= Date.now(); // 24h
            if (!pushSubsribed && text)
                notify$1(text);
        }
        const loadPage = (page) => json(url('/notify', { page: page || 1 })).then(d => update(d, false), _ => lichess.announce({ msg: 'Failed to load notifications' }));
        function nextPage() {
            if (!data || !data.pager.nextPage)
                return;
            scrolling = true;
            loadPage(data.pager.nextPage);
            redraw();
        }
        function previousPage() {
            if (!data || !data.pager.previousPage)
                return;
            scrolling = true;
            loadPage(data.pager.previousPage);
            redraw();
        }
        function setVisible() {
            if (!data || data.pager.currentPage === 1)
                loadPage(1);
        }
        function setMsgRead(user) {
            if (data)
                data.pager.currentPageResults.forEach(n => {
                    if (n.type == 'privateMessage' && n.content.user.id == user && !n.read) {
                        n.read = true;
                        data.unread = Math.max(0, data.unread - 1);
                        opts.setCount(data.unread);
                    }
                });
        }
        return {
            data: () => data,
            initiating: () => initiating,
            scrolling: () => scrolling,
            update,
            nextPage,
            previousPage,
            loadPage,
            setVisible,
            setMsgRead,
        };
    }

    const patch = init([classModule, attributesModule]);
    function LichessNotify(element, opts) {
        const ctrl = makeCtrl(opts, redraw);
        let vnode = patch(element, view(ctrl));
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        if (opts.data)
            ctrl.update(opts.data, opts.incoming);
        else
            ctrl.loadPage(1);
        return {
            update: ctrl.update,
            setVisible: ctrl.setVisible,
            setMsgRead: ctrl.setMsgRead,
            redraw,
        };
    }

    return LichessNotify;

}());
