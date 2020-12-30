! function (e) {
    function n(n) {
        for (var r, o, a = n[0], c = n[1], i = n[2], l = 0, s = []; l < a.length; l++) o = a[l], C[o] && s.push(C[o][0]), C[o] = 0;
        for (r in c) Object.prototype.hasOwnProperty.call(c, r) && (e[r] = c[r]);
        for (N && N(n); s.length;) s.shift()();
        return I.push.apply(I, i || []), t()
    }

    function t() {
        for (var e, n = 0; n < I.length; n++) {
            for (var t = I[n], r = !0, o = 1; o < t.length; o++) {
                var a = t[o];
                0 !== C[a] && (r = !1)
            }
            r && (I.splice(n--, 1), e = H(H.s = t[0]))
        }
        return e
    }
    var r = window.webpackHotUpdate;
    window.webpackHotUpdate = function (e, n) {
        ! function (e, n) {
            if (!O[e] || !w[e]) return;
            for (var t in w[e] = !1, n) Object.prototype.hasOwnProperty.call(n, t) && (v[t] = n[t]);
            0 == --b && 0 === g && j()
        }(e, n), r && r(e, n)
    };
    var o, a = !0,
        c = "<<<REDACTED>>>",
        i = 1e4,
        l = {},
        s = [],
        u = [];

    function f(e) {
        var n = {
            _acceptedDependencies: {},
            _declinedDependencies: {},
            _selfAccepted: !1,
            _selfDeclined: !1,
            _disposeHandlers: [],
            _main: o !== e,
            active: !0,
            accept: function (e, t) {
                if (void 0 === e) n._selfAccepted = !0;
                else if ("function" == typeof e) n._selfAccepted = e;
                else if ("object" == typeof e)
                    for (var r = 0; r < e.length; r++) n._acceptedDependencies[e[r]] = t || function () {};
                else n._acceptedDependencies[e] = t || function () {}
            },
            decline: function (e) {
                if (void 0 === e) n._selfDeclined = !0;
                else if ("object" == typeof e)
                    for (var t = 0; t < e.length; t++) n._declinedDependencies[e[t]] = !0;
                else n._declinedDependencies[e] = !0
            },
            dispose: function (e) {
                n._disposeHandlers.push(e)
            },
            addDisposeHandler: function (e) {
                n._disposeHandlers.push(e)
            },
            removeDisposeHandler: function (e) {
                var t = n._disposeHandlers.indexOf(e);
                t >= 0 && n._disposeHandlers.splice(t, 1)
            },
            check: _,
            apply: x,
            status: function (e) {
                if (!e) return p;
                d.push(e)
            },
            addStatusHandler: function (e) {
                d.push(e)
            },
            removeStatusHandler: function (e) {
                var n = d.indexOf(e);
                n >= 0 && d.splice(n, 1)
            },
            data: l[e]
        };
        return o = void 0, n
    }
    var d = [],
        p = "idle";

    function h(e) {
        p = e;
        for (var n = 0; n < d.length; n++) d[n].call(null, e)
    }
    var m, v, y, b = 0,
        g = 0,
        E = {},
        w = {},
        O = {};

    function S(e) {
        return +e + "" === e ? +e : e
    }

    function _(e) {
        if ("idle" !== p) throw new Error("check() is only allowed in idle status");
        return a = e, h("check"), (n = i, n = n || 1e4, new Promise(function (e, t) {
            if ("undefined" == typeof XMLHttpRequest) return t(new Error("No browser support"));
            try {
                var r = new XMLHttpRequest,
                    o = H.p + "" + c + ".hot-update.json";
                r.open("GET", o, !0), r.timeout = n, r.send(null)
            } catch (e) {
                return t(e)
            }
            r.onreadystatechange = function () {
                if (4 === r.readyState)
                    if (0 === r.status) t(new Error("Manifest request to " + o + " timed out."));
                    else if (404 === r.status) e();
                else if (200 !== r.status && 304 !== r.status) t(new Error("Manifest request to " + o + " failed."));
                else {
                    try {
                        var n = JSON.parse(r.responseText)
                    } catch (e) {
                        return void t(e)
                    }
                    e(n)
                }
            }
        })).then(function (e) {
            if (!e) return h("idle"), null;
            w = {}, E = {}, O = e.c, y = e.h, h("prepare");
            var n = new Promise(function (e, n) {
                m = {
                    resolve: e,
                    reject: n
                }
            });
            for (var t in v = {}, C) P(t);
            return "prepare" === p && 0 === g && 0 === b && j(), n
        });
        var n
    }

    function P(e) {
        O[e] ? (w[e] = !0, b++, function (e) {
            var n = document.createElement("script");
            n.charset = "utf-8", n.src = H.p + "" + e + "." + c + ".hot-update.js", document.head.appendChild(n)
        }(e)) : E[e] = !0
    }

    function j() {
        h("ready");
        var e = m;
        if (m = null, e)
            if (a) Promise.resolve().then(function () {
                return x(a)
            }).then(function (n) {
                e.resolve(n)
            }, function (n) {
                e.reject(n)
            });
            else {
                var n = [];
                for (var t in v) Object.prototype.hasOwnProperty.call(v, t) && n.push(S(t));
                e.resolve(n)
            }
    }

    function x(n) {
        if ("ready" !== p) throw new Error("apply() is only allowed in ready status");
        var t, r, o, a, i;

        function u(e) {
            for (var n = [e], t = {}, r = n.slice().map(function (e) {
                    return {
                        chain: [e],
                        id: e
                    }
                }); r.length > 0;) {
                var o = r.pop(),
                    c = o.id,
                    i = o.chain;
                if ((a = A[c]) && !a.hot._selfAccepted) {
                    if (a.hot._selfDeclined) return {
                        type: "self-declined",
                        chain: i,
                        moduleId: c
                    };
                    if (a.hot._main) return {
                        type: "unaccepted",
                        chain: i,
                        moduleId: c
                    };
                    for (var l = 0; l < a.parents.length; l++) {
                        var s = a.parents[l],
                            u = A[s];
                        if (u) {
                            if (u.hot._declinedDependencies[c]) return {
                                type: "declined",
                                chain: i.concat([s]),
                                moduleId: c,
                                parentId: s
                            }; - 1 === n.indexOf(s) && (u.hot._acceptedDependencies[c] ? (t[s] || (t[s] = []), f(t[s], [c])) : (delete t[s], n.push(s), r.push({
                                chain: i.concat([s]),
                                id: s
                            })))
                        }
                    }
                }
            }
            return {
                type: "accepted",
                moduleId: e,
                outdatedModules: n,
                outdatedDependencies: t
            }
        }

        function f(e, n) {
            for (var t = 0; t < n.length; t++) {
                var r = n[t]; - 1 === e.indexOf(r) && e.push(r)
            }
        }
        n = n || {};
        var d = {},
            m = [],
            b = {},
            g = function () {
                console.warn("[HMR] unexpected require(" + w.moduleId + ") to disposed module")
            };
        for (var E in v)
            if (Object.prototype.hasOwnProperty.call(v, E)) {
                var w;
                i = S(E);
                var _ = !1,
                    P = !1,
                    j = !1,
                    x = "";
                switch ((w = v[E] ? u(i) : {
                    type: "disposed",
                    moduleId: E
                }).chain && (x = "\nUpdate propagation: " + w.chain.join(" -> ")), w.type) {
                    case "self-declined":
                        n.onDeclined && n.onDeclined(w), n.ignoreDeclined || (_ = new Error("Aborted because of self decline: " + w.moduleId + x));
                        break;
                    case "declined":
                        n.onDeclined && n.onDeclined(w), n.ignoreDeclined || (_ = new Error("Aborted because of declined dependency: " + w.moduleId + " in " + w.parentId + x));
                        break;
                    case "unaccepted":
                        n.onUnaccepted && n.onUnaccepted(w), n.ignoreUnaccepted || (_ = new Error("Aborted because " + i + " is not accepted" + x));
                        break;
                    case "accepted":
                        n.onAccepted && n.onAccepted(w), P = !0;
                        break;
                    case "disposed":
                        n.onDisposed && n.onDisposed(w), j = !0;
                        break;
                    default:
                        throw new Error("Unexception type " + w.type)
                }
                if (_) return h("abort"), Promise.reject(_);
                if (P)
                    for (i in b[i] = v[i], f(m, w.outdatedModules), w.outdatedDependencies) Object.prototype.hasOwnProperty.call(w.outdatedDependencies, i) && (d[i] || (d[i] = []), f(d[i], w.outdatedDependencies[i]));
                j && (f(m, [w.moduleId]), b[i] = g)
            } var I, k = [];
        for (r = 0; r < m.length; r++) i = m[r], A[i] && A[i].hot._selfAccepted && k.push({
            module: i,
            errorHandler: A[i].hot._selfAccepted
        });
        h("dispose"), Object.keys(O).forEach(function (e) {
            !1 === O[e] && function (e) {
                delete C[e]
            }(e)
        });
        for (var D, R, N = m.slice(); N.length > 0;)
            if (i = N.pop(), a = A[i]) {
                var T = {},
                    M = a.hot._disposeHandlers;
                for (o = 0; o < M.length; o++)(t = M[o])(T);
                for (l[i] = T, a.hot.active = !1, delete A[i], delete d[i], o = 0; o < a.children.length; o++) {
                    var L = A[a.children[o]];
                    L && ((I = L.parents.indexOf(i)) >= 0 && L.parents.splice(I, 1))
                }
            } for (i in d)
            if (Object.prototype.hasOwnProperty.call(d, i) && (a = A[i]))
                for (R = d[i], o = 0; o < R.length; o++) D = R[o], (I = a.children.indexOf(D)) >= 0 && a.children.splice(I, 1);
        for (i in h("apply"), c = y, b) Object.prototype.hasOwnProperty.call(b, i) && (e[i] = b[i]);
        var q = null;
        for (i in d)
            if (Object.prototype.hasOwnProperty.call(d, i) && (a = A[i])) {
                R = d[i];
                var U = [];
                for (r = 0; r < R.length; r++)
                    if (D = R[r], t = a.hot._acceptedDependencies[D]) {
                        if (-1 !== U.indexOf(t)) continue;
                        U.push(t)
                    } for (r = 0; r < U.length; r++) {
                    t = U[r];
                    try {
                        t(R)
                    } catch (e) {
                        n.onErrored && n.onErrored({
                            type: "accept-errored",
                            moduleId: i,
                            dependencyId: R[r],
                            error: e
                        }), n.ignoreErrored || q || (q = e)
                    }
                }
            } for (r = 0; r < k.length; r++) {
            var V = k[r];
            i = V.module, s = [i];
            try {
                H(i)
            } catch (e) {
                if ("function" == typeof V.errorHandler) try {
                    V.errorHandler(e)
                } catch (t) {
                    n.onErrored && n.onErrored({
                        type: "self-accept-error-handler-errored",
                        moduleId: i,
                        error: t,
                        originalError: e
                    }), n.ignoreErrored || q || (q = t), q || (q = e)
                } else n.onErrored && n.onErrored({
                    type: "self-accept-errored",
                    moduleId: i,
                    error: e
                }), n.ignoreErrored || q || (q = e)
            }
        }
        return q ? (h("fail"), Promise.reject(q)) : (h("idle"), new Promise(function (e) {
            e(m)
        }))
    }
    var A = {},
        C = {
            1: 0
        },
        I = [];

    function H(n) {
        if (A[n]) return A[n].exports;
        var t = A[n] = {
            i: n,
            l: !1,
            exports: {},
            hot: f(n),
            parents: (u = s, s = [], u),
            children: []
        };
        return e[n].call(t.exports, t, t.exports, function (e) {
            var n = A[e];
            if (!n) return H;
            var t = function (t) {
                    return n.hot.active ? (A[t] ? -1 === A[t].parents.indexOf(e) && A[t].parents.push(e) : (s = [e], o = t), -1 === n.children.indexOf(t) && n.children.push(t)) : (console.warn("[HMR] unexpected require(" + t + ") from disposed module " + e), s = []), H(t)
                },
                r = function (e) {
                    return {
                        configurable: !0,
                        enumerable: !0,
                        get: function () {
                            return H[e]
                        },
                        set: function (n) {
                            H[e] = n
                        }
                    }
                };
            for (var a in H) Object.prototype.hasOwnProperty.call(H, a) && "e" !== a && "t" !== a && Object.defineProperty(t, a, r(a));
            return t.e = function (e) {
                return "ready" === p && h("prepare"), g++, H.e(e).then(n, function (e) {
                    throw n(), e
                });

                function n() {
                    g--, "prepare" === p && (E[e] || P(e), 0 === g && 0 === b && j())
                }
            }, t.t = function (e, n) {
                return 1 & n && (e = t(e)), H.t(e, -2 & n)
            }, t
        }(n)), t.l = !0, t.exports
    }
    H.m = e, H.c = A, H.d = function (e, n, t) {
        H.o(e, n) || Object.defineProperty(e, n, {
            enumerable: !0,
            get: t
        })
    }, H.r = function (e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, H.t = function (e, n) {
        if (1 & n && (e = H(e)), 8 & n) return e;
        if (4 & n && "object" == typeof e && e && e.__esModule) return e;
        var t = Object.create(null);
        if (H.r(t), Object.defineProperty(t, "default", {
                enumerable: !0,
                value: e
            }), 2 & n && "string" != typeof e)
            for (var r in e) H.d(t, r, function (n) {
                return e[n]
            }.bind(null, r));
        return t
    }, H.n = function (e) {
        var n = e && e.__esModule ? function () {
            return e.default
        } : function () {
            return e
        };
        return H.d(n, "a", n), n
    }, H.o = function (e, n) {
        return Object.prototype.hasOwnProperty.call(e, n)
    }, H.p = "/", H.h = function () {
        return c
    };
    var k = window.webpackJsonp = window.webpackJsonp || [],
        D = k.push.bind(k);
    k.push = n, k = k.slice();
    for (var R = 0; R < k.length; R++) n(k[R]);
    var N = D;
    I.push([237, 0, 2]), t()
}({
    184: function (e, n, t) {
        var r = t(64);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(64, function () {
            var n = t(64);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    185: function (e, n, t) {
        var r = t(65);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(65, function () {
            var n = t(65);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    2: function (e, n) {
        e.exports = {
            GAME_ID: "Controller",
            ESC_TRIVIA_LIVE: "esc-trivia-live:Controller",
            UC_PHASE_CHANGE: "UC_PhaseChange",
            CU_ANSWER: "Answer",
            PHASE_WELCOME: "welcome",
            PHASE_GET_READY: "play-get-ready",
            PHASE_QUESTION: "play-question",
            PHASE_ANSWER: "play-answer",
            PHASE_AD: "play-ad",
            PHASE_LEADERBOARD: "play-leaderboard"
        }
    },
    230: function (e, n, t) {
        var r = t(70);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(70, function () {
            var n = t(70);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    231: function (e, n, t) {
        var r = t(71);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(71, function () {
            var n = t(71);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    232: function (e, n, t) {
        var r = t(72);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(72, function () {
            var n = t(72);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    235: function (e, n, t) {
        var r = t(74);
        "string" == typeof r && (r = [
            [e.i, r, ""]
        ]);
        var o = {
                hmr: !0,
                transform: void 0,
                insertInto: void 0
            },
            a = t(12)(r, o);
        r.locals && (e.exports = r.locals), e.hot.accept(74, function () {
            var n = t(74);
            if ("string" == typeof n && (n = [
                    [e.i, n, ""]
                ]), ! function (e, n) {
                    var t, r = 0;
                    for (t in e) {
                        if (!n || e[t] !== n[t]) return !1;
                        r++
                    }
                    for (t in n) r--;
                    return 0 === r
                }(r.locals, n.locals)) throw new Error("Aborting CSS HMR due to changed css-modules locals.");
            a(n)
        }), e.hot.dispose(function () {
            a()
        })
    },
    237: function (e, n, t) {
        "use strict";
        t.r(n);
        var r = t(0),
            o = t.n(r),
            a = t(104),
            c = t.n(a),
            i = t(6),
            l = t(241),
            s = t(242),
            u = t(24),
            f = t(246),
            d = t(245),
            p = t(244),
            h = t(240),
            m = t(243);

        function v() {
            return (v = Object.assign || function (e) {
                for (var n = 1; n < arguments.length; n++) {
                    var t = arguments[n];
                    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r])
                }
                return e
            }).apply(this, arguments)
        }
        var y = o.a.createElement("path", {
                d: "M584.325 259.538c-3.662.804-7.63.21-11.037-1.972-6.813-4.36-8.8-13.42-4.44-20.234l22.336-34.894c8.076-12.609 16.878-6.587 20.235-4.44 6.814 4.363 8.802 13.422 4.44 20.234l-22.336 34.894a14.599 14.599 0 0 1-9.198 6.412",
                fill: "#00a8e2"
            }),
            b = o.a.createElement("path", {
                d: "M594.107 111.057c3.324-31.705-19.882-60.216-51.731-63.555L92.286.322C60.434-3.017 31.82 20.062 28.498 51.768L.318 320.612c-3.326 31.706 19.882 60.216 51.73 63.554l450.091 47.18c31.85 3.339 60.463-19.738 63.787-51.445l11.95-114.01-3.246-.34-1.096 10.455-17.02-18.255 3.38 106.523c-1.856 17.707-37.305 43.552-55.094 41.687l-449.006-18.59c-17.788-1.865-28.3-48.49-26.445-66.198L42.69 63.597c1.857-17.707 31.469-27.52 49.257-25.655l443.465 6.653c17.788 1.864 35.052 46.081 33.196 63.79l-6.958 49.465 18.329 5.416 14.128-52.209z",
                fill: "#00a8e2"
            }),
            g = o.a.createElement("path", {
                d: "M573.142 262.401a14.6 14.6 0 0 1-9.055-6.611c-4.211-6.907-2.025-15.92 4.882-20.133l35.375-21.566c6.909-4.21 15.92-2.024 20.132 4.882 4.211 6.908 2.025 15.922-4.882 20.132l-35.374 21.567a14.604 14.604 0 0 1-11.078 1.73",
                fill: "#f53440"
            }),
            E = o.a.createElement("path", {
                d: "M575.701 234.115l-5.842 14.197 2.052 90.306c1.299 17.317-21.851 49.303-39.17 50.602L94.37 403.643c-17.317 1.299-46.749-25.84-48.047-43.157l-5.434-248.82c-1.298-17.318 9.87-57.29 27.191-58.59l440.07-8.037c17.318-1.3 51.174 13.554 52.473 30.872l13.273 91.75-7.157-95.433c-2.326-31.007-29.443-54.342-60.451-52.017L68.08 53.076c-31.007 2.325-63.266 31.81-60.94 62.819l30.767 260.292c2.325 31.008 27.32 54.608 58.327 52.283l438.207-32.865c31.009-2.326 45.91-28.943 43.584-59.952",
                fill: "#f53440"
            }),
            w = o.a.createElement("path", {
                d: "M580.875 264.272c.015-.015.031-.027.046-.041l29.295-29.296c5.72-5.72 5.72-14.994 0-20.716-5.721-5.719-14.994-5.719-20.716 0l-29.295 29.296a14.57 14.57 0 0 0-4.158 8.496h-.068v.507c-.083.902 0 101.053 0 101.053 0 17.366-14.129 31.497-31.496 31.497H85.043c-17.364 0-31.495-14.13-31.495-31.497V89.908c0-17.367 14.13-31.495 31.495-31.495h439.44c17.367 0 31.496 14.128 31.496 31.495v83.83l-.017.016s-59.848 59.986-60.361 60.743a20.77 20.77 0 0 1-3.879 2.862c-2.477 1.43-5.438 2.141-8.88 2.141-2.437 0-4.746-.44-6.929-1.321a16.59 16.59 0 0 1-5.73-3.842c-1.64-1.68-2.941-3.674-3.905-5.985-.967-2.31-1.45-4.933-1.45-7.873 0-2.939.46-5.606 1.387-8 .92-2.393 2.203-4.428 3.84-6.11a16.61 16.61 0 0 1 5.732-3.841c2.183-.882 4.535-1.323 7.055-1.323 3.106 0 5.92.567 8.44 1.701a16.232 16.232 0 0 1 6.299 4.976l18.392-22.172c-4.117-3.778-9.239-6.78-15.37-9.007-6.13-2.224-12.64-3.338-19.524-3.338-6.72 0-13.04 1.114-18.96 3.338-5.92 2.227-11.064 5.398-15.43 9.512-4.369 4.115-7.81 9.07-10.33 14.864-2.52 5.795-3.78 12.263-3.78 19.4 0 7.055 1.26 13.46 3.78 19.21 2.52 5.754 5.961 10.709 10.33 14.866 4.366 4.157 9.51 7.37 15.43 9.636 5.92 2.268 12.24 3.401 18.96 3.401 7.474 0 14.15-1.196 20.03-3.59 5.261-2.143 9.779-4.947 13.563-8.403 1.218-.657 62.006-61.13 62.006-61.13 3.264-3.265 4.658-7.686 4.197-11.944V89.908c0-31.095-25.297-56.392-56.392-56.392H85.043c-31.092 0-56.392 25.297-56.392 56.392V353.57c0 31.096 25.3 56.392 56.392 56.392h439.44c31.095 0 56.392-25.296 56.392-56.392v-89.3z",
                className: "esc-trivia-logo_svg__lettering"
            }),
            O = o.a.createElement("path", {
                d: "M335.91 199.508v-24.943h-61.348v89.189h63.49V238.81H302.78v-8.315h31.115v-23.304H302.78v-7.684h33.13zm49.725-1.122c1.343-.63 3.106-.945 5.29-.945 2.35 0 4.997.651 7.937 1.952a19.518 19.518 0 0 1 7.432 5.732l18.644-19.022c-4.62-4.283-9.973-7.558-16.06-9.826-6.09-2.267-12.075-3.4-17.953-3.4-4.366 0-8.776.546-13.226 1.64-4.453 1.095-8.462 2.882-12.03 5.364-3.57 2.482-6.488 5.66-8.755 9.53-2.268 3.869-3.402 8.58-3.402 14.131 0 3.956.63 7.342 1.89 10.161 1.26 2.819 2.96 5.236 5.101 7.255 2.142 2.02 4.598 3.724 7.37 5.113a66.144 66.144 0 0 0 8.692 3.596c3.105 1.01 5.688 1.894 7.748 2.65 2.057.757 3.672 1.453 4.85 2.082 1.175.63 1.993 1.242 2.456 1.83.46.59.692 1.304.692 2.144 0 1.6-.692 2.693-2.078 3.281-1.386.592-2.92.884-4.598.884-3.696 0-7.287-.881-10.77-2.645-3.487-1.763-6.28-3.779-8.377-6.046l-18.267 19.846c2.268 2.005 4.829 3.822 7.685 5.453a62.905 62.905 0 0 0 9.132 4.26 57.774 57.774 0 0 0 10.078 2.758c3.484.623 7.033.94 10.645.94a46.5 46.5 0 0 0 13.353-1.953c4.366-1.302 8.292-3.276 11.779-5.92 3.484-2.646 6.298-5.963 8.44-9.953 2.14-3.988 3.212-8.671 3.212-14.047 0-4.617-.967-8.48-2.897-11.59a27.53 27.53 0 0 0-7.37-7.872 42.76 42.76 0 0 0-9.763-5.227 185.399 185.399 0 0 0-10.077-3.527c-3.108-1.009-5.355-1.847-6.74-2.52-1.385-.67-2.078-1.68-2.078-3.023 0-1.427.67-2.457 2.015-3.086",
                className: "esc-trivia-logo_svg__lettering"
            }),
            S = function (e) {
                return o.a.createElement("svg", v({
                    viewBox: "0 0 627 521"
                }, e), y, b, g, E, w, O)
            };
        t(184);

        function _(e, n) {
            if (null == e) return {};
            var t, r, o = function (e, n) {
                if (null == e) return {};
                var t, r, o = {},
                    a = Object.keys(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || (o[t] = e[t]);
                return o
            }(e, n);
            if (Object.getOwnPropertySymbols) {
                var a = Object.getOwnPropertySymbols(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || Object.prototype.propertyIsEnumerable.call(e, t) && (o[t] = e[t])
            }
            return o
        }
        var P = function (e) {
                var n = e.onClickStart;
                _(e, ["onClickStart"]);
                return o.a.createElement("div", {
                    className: "welcome-phase"
                }, o.a.createElement(h.a, null, o.a.createElement(l.a, {
                    className: "justify-content-center"
                }, o.a.createElement(s.a, {
                    xs: "3"
                }, o.a.createElement(S, null))), o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement("h1", null, "ESC Trivia Live"))), o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement(m.a, {
                    onClick: n,
                    color: "primary"
                }, "Play Now")))))
            },
            j = (t(185), function (e) {
                return o.a.createElement("div", {
                    className: "getready-phase"
                }, o.a.createElement(h.a, null, o.a.createElement("h1", null, "Get ready, the next round is about to begin...")))
            }),
            x = t(31),
            A = t.n(x),
            C = t(109),
            I = t.n(C),
            H = t(45),
            k = t(46);
        t(230);

        function D(e, n, t) {
            return n in e ? Object.defineProperty(e, n, {
                value: t,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[n] = t, e
        }

        function R(e, n) {
            if (null == e) return {};
            var t, r, o = function (e, n) {
                if (null == e) return {};
                var t, r, o = {},
                    a = Object.keys(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || (o[t] = e[t]);
                return o
            }(e, n);
            if (Object.getOwnPropertySymbols) {
                var a = Object.getOwnPropertySymbols(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || Object.prototype.propertyIsEnumerable.call(e, t) && (o[t] = e[t])
            }
            return o
        }

        function N() {
            return (N = Object.assign || function (e) {
                for (var n = 1; n < arguments.length; n++) {
                    var t = arguments[n];
                    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r])
                }
                return e
            }).apply(this, arguments)
        }
        var T = function (e) {
                e.text;
                var n = e.answers,
                    t = void 0 === n ? [] : n,
                    r = e.questionId,
                    a = e.header,
                    c = e.submitAnswer,
                    i = void 0 === c ? I.a : c,
                    u = e.answered,
                    f = void 0 !== u && u,
                    d = e.graded,
                    p = void 0 !== d && d;
                return o.a.createElement(l.a, {
                    className: "question-view justify-content-center"
                }, o.a.createElement(s.a, {
                    xs: "10",
                    className: "question-container"
                }, o.a.createElement(l.a, null, o.a.createElement(s.a, null, a)), t.map(function (e) {
                    var n = "secondary",
                        t = null;
                    return f && e.selected && !p ? (n = "light", t = o.a.createElement(H.a, {
                        icon: k.a
                    })) : f && p && e.correct ? (n = "success", t = o.a.createElement(H.a, {
                        icon: k.a
                    })) : f && e.selected && p && !e.correct && (n = "danger", t = o.a.createElement(H.a, {
                        icon: k.b
                    })), o.a.createElement(l.a, {
                        key: e.id
                    }, o.a.createElement(s.a, null, o.a.createElement(m.a, {
                        size: "lg",
                        block: !0,
                        onClick: function (n) {
                            n.preventDefault(), !p && i(r, e.id)
                        },
                        disabled: f,
                        color: n
                    }, t, e.text)))
                })))
            },
            M = function (e) {
                return o.a.createElement(T, N({}, e, {
                    header: o.a.createElement("h1", null, e.text)
                }))
            },
            L = function (e) {
                var n = e.answers,
                    t = e.round,
                    r = R(e, ["answers", "round"]);
                return o.a.createElement(o.a.Fragment, null, o.a.createElement(T, N({}, r, {
                    header: o.a.createElement("h1", null, r.text),
                    answers: n.map(function (e) {
                        return e.id === t.answerId ? function (e) {
                            for (var n = 1; n < arguments.length; n++) {
                                var t = null != arguments[n] ? arguments[n] : {},
                                    r = Object.keys(t);
                                "function" == typeof Object.getOwnPropertySymbols && (r = r.concat(Object.getOwnPropertySymbols(t).filter(function (e) {
                                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                                }))), r.forEach(function (n) {
                                    D(e, n, t[n])
                                })
                            }
                            return e
                        }({}, e, {
                            selected: !0
                        }) : e
                    }),
                    answered: !0
                })), o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement("h2", null, "Determining winners..."))))
            },
            q = function (e) {
                var n = e.round,
                    t = R(e, ["round"]),
                    r = A()(n, "answerId", !1);
                return o.a.createElement(h.a, {
                    className: "question-phase"
                }, o.a.createElement(l.a, {
                    className: "justify-content-center"
                }, o.a.createElement(s.a, {
                    xs: "10",
                    className: "clock-container"
                }, o.a.createElement("div", {
                    className: "clock-progress"
                }))), r ? o.a.createElement(L, N({}, t, {
                    round: n
                })) : o.a.createElement(M, t))
            };
        t(231);

        function U() {
            return (U = Object.assign || function (e) {
                for (var n = 1; n < arguments.length; n++) {
                    var t = arguments[n];
                    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r])
                }
                return e
            }).apply(this, arguments)
        }

        function V(e, n, t) {
            return n in e ? Object.defineProperty(e, n, {
                value: t,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[n] = t, e
        }

        function G(e, n) {
            if (null == e) return {};
            var t, r, o = function (e, n) {
                if (null == e) return {};
                var t, r, o = {},
                    a = Object.keys(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || (o[t] = e[t]);
                return o
            }(e, n);
            if (Object.getOwnPropertySymbols) {
                var a = Object.getOwnPropertySymbols(e);
                for (r = 0; r < a.length; r++) t = a[r], n.indexOf(t) >= 0 || Object.prototype.propertyIsEnumerable.call(e, t) && (o[t] = e[t])
            }
            return o
        }
        var W = function (e) {
                var n = e.round,
                    t = e.answers,
                    r = void 0 === t ? [] : t,
                    a = e.text,
                    c = G(e, ["round", "answers", "text"]);
                return o.a.createElement(h.a, {
                    className: "answer-phase"
                }, o.a.createElement(T, U({}, c, {
                    answers: r.map(function (e) {
                        return e.id === A()(n, "answerId", -1) ? function (e) {
                            for (var n = 1; n < arguments.length; n++) {
                                var t = null != arguments[n] ? arguments[n] : {},
                                    r = Object.keys(t);
                                "function" == typeof Object.getOwnPropertySymbols && (r = r.concat(Object.getOwnPropertySymbols(t).filter(function (e) {
                                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                                }))), r.forEach(function (n) {
                                    V(e, n, t[n])
                                })
                            }
                            return e
                        }({}, e, {
                            selected: !0
                        }) : e
                    }),
                    header: o.a.createElement(o.a.Fragment, null, o.a.createElement("h1", null, a), o.a.createElement("h2", null, "A: ", A()(r.find(function (e) {
                        return e.correct
                    }), "text", ""))),
                    graded: !0,
                    answered: !0
                })))
            },
            B = (t(232), function (e) {
                return o.a.createElement(h.a, {
                    className: "ad-phase"
                }, o.a.createElement(l.a, {
                    className: "justify-content-center"
                }, o.a.createElement(s.a, {
                    xs: "6"
                }, o.a.createElement("img", {
                    width: "100%",
                    alt: "Paris 16 [CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)], via Wikimedia Commons:Blue diamond symbol",
                    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Blue_diamond_symbol.svg/512px-Blue_diamond_symbol.svg.png"
                }))), o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement("h1", null, "Buy some ESC Diamonds!"), o.a.createElement("p", null, "Only $1.99 for 10"))))
            });

        function z(e) {
            return (z = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
                return typeof e
            } : function (e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
            })(e)
        }

        function Y(e, n) {
            for (var t = 0; t < n.length; t++) {
                var r = n[t];
                r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
            }
        }

        function F(e, n) {
            return !n || "object" !== z(n) && "function" != typeof n ? function (e) {
                if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                return e
            }(e) : n
        }

        function J(e) {
            return (J = Object.setPrototypeOf ? Object.getPrototypeOf : function (e) {
                return e.__proto__ || Object.getPrototypeOf(e)
            })(e)
        }

        function Q(e, n) {
            return (Q = Object.setPrototypeOf || function (e, n) {
                return e.__proto__ = n, e
            })(e, n)
        }
        var X = function (e) {
                function n() {
                    return function (e, n) {
                        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
                    }(this, n), F(this, J(n).apply(this, arguments))
                }
                var t, a, c;
                return function (e, n) {
                    if ("function" != typeof n && null !== n) throw new TypeError("Super expression must either be null or a function");
                    e.prototype = Object.create(n && n.prototype, {
                        constructor: {
                            value: e,
                            writable: !0,
                            configurable: !0
                        }
                    }), n && Q(e, n)
                }(n, r["PureComponent"]), t = n, (a = [{
                    key: "render",
                    value: function () {
                        return o.a.createElement("h1", null, "Leaderboard!")
                    }
                }]) && Y(t.prototype, a), c && Y(t, c), n
            }(),
            K = t(2),
            $ = K.ESC_TRIVIA_LIVE + ":PHASE_CHANGED",
            Z = K.ESC_TRIVIA_LIVE + ":ROUTE_TO_GET_READY",
            ee = K.ESC_TRIVIA_LIVE + ":RECORD_ANSWER";

        function ne(e) {
            for (var n = 1; n < arguments.length; n++) {
                var t = null != arguments[n] ? arguments[n] : {},
                    r = Object.keys(t);
                "function" == typeof Object.getOwnPropertySymbols && (r = r.concat(Object.getOwnPropertySymbols(t).filter(function (e) {
                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                }))), r.forEach(function (n) {
                    te(e, n, t[n])
                })
            }
            return e
        }

        function te(e, n, t) {
            return n in e ? Object.defineProperty(e, n, {
                value: t,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[n] = t, e
        }
        var re = function (e, n) {
            var t = n.value.phaseStats.phase,
                r = ne({}, e);
            return r.holdUntilNextRound && t === K.PHASE_GET_READY && (console.log("Resetting round"), r.holdUntilNextRound = !1), ne({}, r, n.value)
        };

        function oe(e) {
            for (var n = 1; n < arguments.length; n++) {
                var t = null != arguments[n] ? arguments[n] : {},
                    r = Object.keys(t);
                "function" == typeof Object.getOwnPropertySymbols && (r = r.concat(Object.getOwnPropertySymbols(t).filter(function (e) {
                    return Object.getOwnPropertyDescriptor(t, e).enumerable
                }))), r.forEach(function (n) {
                    ae(e, n, t[n])
                })
            }
            return e
        }

        function ae(e, n, t) {
            return n in e ? Object.defineProperty(e, n, {
                value: t,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[n] = t, e
        }
        var ce, ie = function (e, n) {
                return console.log("Generic Reducer", e, n.value, oe({}, e, n.value)), oe({}, e, n.value)
            },
            le = t(111),
            se = Object(le.a)({
                hashType: "slash"
            }),
            ue = function (e, n) {
                var t = {
                        pathname: "/" + e
                    },
                    r = n.isPlaying;
                if (! function (e) {
                        return n = "play", 0 === e.indexOf(n);
                        var n
                    }(e)) return console.log("New history", e, t), void se.push(t);
                r && (!n.holdUntilNextRound || n.holdUntilNextRound && (e === K.PHASE_GET_READY || e === K.PHASE_QUESTION)) && se.replace(t)
            },
            fe = t(80);
        t(234), t(235);

        function de(e) {
            return (de = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
                return typeof e
            } : function (e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
            })(e)
        }

        function pe() {
            return (pe = Object.assign || function (e) {
                for (var n = 1; n < arguments.length; n++) {
                    var t = arguments[n];
                    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r])
                }
                return e
            }).apply(this, arguments)
        }

        function he(e, n) {
            for (var t = 0; t < n.length; t++) {
                var r = n[t];
                r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
            }
        }

        function me(e, n) {
            return !n || "object" !== de(n) && "function" != typeof n ? function (e) {
                if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                return e
            }(e) : n
        }

        function ve(e) {
            return (ve = Object.setPrototypeOf ? Object.getPrototypeOf : function (e) {
                return e.__proto__ || Object.getPrototypeOf(e)
            })(e)
        }

        function ye(e, n) {
            return (ye = Object.setPrototypeOf || function (e, n) {
                return e.__proto__ = n, e
            })(e, n)
        }

        function be(e, n, t) {
            return n in e ? Object.defineProperty(e, n, {
                value: t,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[n] = t, e
        }
        fe.ScreenManager.registerEventHandler(fe.CONTROLLER_SCREEN_ORIENTATION, K.ESC_TRIVIA_LIVE, function (e) {
            var n = 0;
            switch (e.screenOrientation) {
                case "landscape-primary":
                    n = window.innerWidth;
                    break;
                case "portrait-primary":
                default:
                    n = window.innerHeight
            }! function () {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : window.innerHeight;
                window.requestAnimationFrame(function () {
                    var n = .01 * e;
                    document.documentElement.style.setProperty("--vh", "".concat(n, "px"))
                })
            }(n || window.innerHeight)
        });
        var ge = {
                isPlaying: !1,
                phaseStats: {
                    phase: K.PHASE_WELCOME
                }
            },
            Ee = new i.ReducerManager((be(ce = {}, $, re), be(ce, Z, ie), be(ce, ee, ie), ce), ge),
            we = new i.EventManager("Controller", Ee);
        i.ESCManager.networking.registerEventHandler(K.UC_PHASE_CHANGE, K.ESC_TRIVIA_LIVE, function (e) {
            ue(e.phaseStats.phase, u.store.getState()["Manager:Controller"]), console.log("message", e, u.store), we.dispatchUI($, e)
        });
        i.ESCManager.networking.registerEventHandler("offline-game-update", K.ESC_TRIVIA_LIVE, function (e) {
            e.data.next_url && (window.location.href === e.data.next_url ? window.location.reload() : window.location.href = e.data.next_url)
        });
        var Oe = function (e, n) {
                i.ESCManager.networking.sendCommand(K.CU_ANSWER, {
                    questionId: e,
                    answerId: n
                }), we.dispatchUI(ee, {
                    round: {
                        questionId: e,
                        answerId: n
                    }
                })
            },
            Se = function () {
                we.dispatchUI(Z, {
                    isPlaying: !0,
                    holdUntilNextRound: !0
                }), ue(K.PHASE_GET_READY, {
                    isPlaying: !0
                })
            };
        se.listen(function (e, n) {
            ~e.pathname.indexOf(K.PHASE_GET_READY) && we.dispatchUI(ee, {
                round: {}
            })
        });
        var _e = function (e) {
                function n() {
                    return function (e, n) {
                        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
                    }(this, n), me(this, ve(n).apply(this, arguments))
                }
                var t, a, c;
                return function (e, n) {
                    if ("function" != typeof n && null !== n) throw new TypeError("Super expression must either be null or a function");
                    e.prototype = Object.create(n && n.prototype, {
                        constructor: {
                            value: e,
                            writable: !0,
                            configurable: !0
                        }
                    }), n && ye(e, n)
                }(n, r["PureComponent"]), t = n, (a = [{
                    key: "componentDidMount",
                    value: function () {
                        ue(K.PHASE_WELCOME, {})
                    }
                }, {
                    key: "render",
                    value: function () {
                        var e = this.props.phaseStats,
                            n = e.phase;
                        console.log("###", n, e);
                        var t = this.props.round;
                        return o.a.createElement(o.a.Fragment, null, o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement("div", {
                            className: "esc-header"
                        }))), o.a.createElement(l.a, null, o.a.createElement(s.a, null, o.a.createElement(f.a, {
                            history: se
                        }, o.a.createElement(d.a, null, o.a.createElement(p.a, {
                            path: "/" + K.PHASE_WELCOME,
                            render: function () {
                                return o.a.createElement(P, {
                                    phaseStats: e,
                                    onClickStart: Se
                                })
                            }
                        }), o.a.createElement(p.a, {
                            path: "/" + K.PHASE_GET_READY,
                            render: function () {
                                return o.a.createElement(j, {
                                    phaseStats: e
                                })
                            }
                        }), o.a.createElement(p.a, {
                            path: "/" + K.PHASE_QUESTION,
                            render: function () {
                                return o.a.createElement(q, pe({
                                    submitAnswer: Oe
                                }, e, {
                                    round: t
                                }))
                            }
                        }), o.a.createElement(p.a, {
                            path: "/" + K.PHASE_ANSWER,
                            render: function () {
                                return o.a.createElement(W, pe({}, e, {
                                    round: t
                                }))
                            }
                        }), o.a.createElement(p.a, {
                            path: "/" + K.PHASE_AD,
                            render: function () {
                                return o.a.createElement(B, {
                                    phaseStats: e
                                })
                            }
                        }), o.a.createElement(p.a, {
                            path: "/" + K.PHASE_LEADERBOARD,
                            render: function () {
                                return o.a.createElement(X, {
                                    phaseStats: e
                                })
                            }
                        }), o.a.createElement(p.a, {
                            render: function (e, n) {
                                return console.log(e, n), o.a.createElement("div", null, "No match")
                            }
                        }))))))
                    }
                }]) && he(t.prototype, a), c && he(t, c), n
            }(),
            Pe = we.connect(_e, [$, Z, ee]);
        c.a.render(o.a.createElement(i.ESCGameController, {
            game: "ESCTriviaLive",
            includeESCLogo: !1,
            includeTattooDisplay: !1,
            includeTattooSelector: !1,
            desiredOrientation: "portrait",
            autoSizeEnabled: !0,
            appModeEnabled: !0,
            nosleep: !0
        }, o.a.createElement(Pe, null)), document.getElementById("root")), e.hot.accept()
    },
    64: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, ".welcome-phase svg .esc-trivia-logo_svg__lettering {\n\tfill: #fff;\n}\n\n.welcome-phase h1 {\n\ttext-align: center;\n}\n\n.welcome-phase button {\n\twidth: 100%;\n}", ""])
    },
    65: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, ".getready-phase h1 {\n\ttext-align: center;\n}\n\n", ""])
    },
    70: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, ".question-view .question-container {\n\tbackground: rgb(99,103,108);\n\tborder-radius: 5px;\n\tpadding: 2vmax;\n}\n\n.question-view .question-container h1 {\n\ttext-align: center;\n\tfont-weight: bold;\n\tpadding: 1.5rem;\n}\n\n.question-view .question-container button {\n\tmargin-bottom: 2vmax;\n\tposition: relative;\n}\n\n.question-view .question-container button.disabled {\n\topacity: 1;\n}\n\n.question-view .question-container button svg {\n\tposition: absolute;\n\tleft: 10px;\n\ttop: calc(50% - 10px);\n}\n\n.question-phase .question-view h2 {\n\tfont-size: 1.4rem;\n\ttext-align: center;\n\tcolor: #fff;\n\tpadding-top: 1rem;\n}\n\n.question-phase .clock-container {\n\tposition: relative;\n\toverflow: hidden;\n\theight: 5px;\n\tbackground: black;\n}\n\n.question-phase .clock-progress {\n\tposition: absolute;\n\tleft: 0;\n\twidth: 100%;\n\theight: 100%;\n\tbackground: #fff;\n\n\t-webkit-animation: move 8s linear forwards;\n\n\t        animation: move 8s linear forwards;\n}\n\n@-webkit-keyframes move {\n  0% {\n    left: 0;\n  }\n  100% {\n    left: -100%;\n  }\n}\n\n@keyframes move {\n  0% {\n    left: 0;\n  }\n  100% {\n    left: -100%;\n  }\n}", ""])
    },
    71: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, ".answer-phase h2 {\n\ttext-align: center;\n\tcolor: #fff;\n\tfont-weight: bold;\n\tmargin-bottom: 1rem;\n}", ""])
    },
    72: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, ".ad-phase img {\n\tmargin-bottom: 5vmax;\n}\n\n.ad-phase h1, .ad-phase p {\n\ttext-align: center;\n}", ""])
    },
    74: function (e, n, t) {
        (e.exports = t(11)(!1)).push([e.i, '/**\n * ESCTriviaLive CSS\n * Styles applied here should be global, or globally accessible utilities.\n * Phase specific styles should go into the phase stylesheet\n */\n\n.full-vh, .controller-ESCTriviaLive {\n  height: 100vh;\n  height: calc(var(--vh, 1vh) * 100);\n}\n\n/* Drop support for fullscreen div, as its blocks interaction behind it */\n#scrollableDiv, #gofullscreen {\n\tdisplay: none;\n}\n\n.controller-ESCTriviaLive {\n\tfont-size: 1.2rem;\n\tfont-family: sans-serif;\n\tbackground: rgb(60,63,67);\n    color: #fff;\n}\n\n/* ESC Header -- @todo move to ESC Controller SDK */\n\n.esc-header {\n\tbackground: rgb(206,212,217);\n\theight: 5vmax;\n\tmargin-bottom: 2vmax;\n}\n\n/* Theme Palette */\n\n[class*="-primary"] {\n    background: #fff; \n    color: rgb(60,63,67);\n    border-color: #fff;\n} \n[class*="-secondary"] {\n    background: transparent;\n    color: #fff;\n    border-color: #fff;\n} \n[class*="-success"] {\n    background: rgb(128,200,114);\n    color: rgb(60,63,67);\n    border-color: rgb(128,200,114);\n} \n[class*="-danger"] {\n    background: rgb(235,115,118);\n    color: rgb(60,63,67);\n    border-color: rgb(235,115,118);\n}\n[class*="-light"] {\n    background: #fff;\n    color: rgb(60,63,67);\n    border-color: #fff;\n}\n\n/* Typography */\n\nh1 {\n    font-size: 1.5rem;\n}\n', ""])
    }
});