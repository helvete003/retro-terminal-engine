class RetroEngine {
    BORDER_STYLES = {
        single:  { h: "-", v: "|", tl: "+", tr: "+", bl: "+", br: "+" },
        double:  { h: "=", v: "||", tl: "+", tr: "+", bl: "+", br: "+" },
        heavy:   { h: "█", v: "█", tl: "█", tr: "█", bl: "█", br: "█" },
        box:     { h: "─", v: "│", tl: "┌", tr: "┐", bl: "└", br: "┘" },
        dbox:    { h: "═", v: "║", tl: "╔", tr: "╗", bl: "╚", br: "╝" },
        round:   { h: "─", v: "│", tl: "╭", tr: "╮", bl: "╰", br: "╯" },
        diamond: { h: "◆", v: "◆", tl: "◆", tr: "◆", bl: "◆", br: "◆" },
        slant:   { h: "/", v: "\\", tl: "/", tr: "\\", bl: "/", br: "\\" },
        dot:     { h: "·", v: "·", tl: "·", tr: "·", bl: "·", br: "·" },
        hash:    { h: "#", v: "#", tl: "#", tr: "#", bl: "#", br: "#" },
        chain:   { h: "─", v: "│", tl: "╭", tr: "╮", bl: "╰", br: "╯" },
        arrow:   { h: "►", v: "▲", tl: "◄", tr: "▲", bl: "▼", br: "►" },
    };

    constructor(canvas_id) {
        this.canvas = document.getElementById(canvas_id);
        this.ctx = this.canvas.getContext("2d");
        this.renderElements = [];
        this._scrollRAF = null;
        this._resizeTimer = null;
        this._mode = "full";
        this._glyphCache = new Map();

        window.addEventListener("resize", () => {
            this._setupMargins();
            this._resize();
            this._cachePositions();
            if (this._mode === "full") this._applyScroll();
            this.render();
        });

        window.addEventListener("scroll", () => {
            if (this._mode === "full") {
                if (this._scrollRAF) return;
                this._scrollRAF = requestAnimationFrame(() => {
                    this._applyScroll();
                    this._scrollRAF = null;
                });
            } else {
                if (this._scrollRAF) return;
                this._scrollRAF = requestAnimationFrame(() => {
                    this.render();
                    this._scrollRAF = null;
                });
            }
        }, { passive: true });

        this._bodyObserver = new ResizeObserver(() => {
            if (this._resizeTimer) clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                this._resize();
                this._cachePositions();
                if (this._mode === "full") this._applyScroll();
                this.render();
            }, 100);
        });
        this._bodyObserver.observe(document.body);
    }

    _resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const dh = document.documentElement.scrollHeight;
        const maxPx = 4096;

        const fullW = vw * dpr;
        const fullH = dh * dpr;

        if (fullW <= maxPx && fullH <= maxPx) {
            this._mode = "full";
            this.canvas.width = fullW;
            this.canvas.height = fullH;
            this.canvas.style.height = dh + "px";
            this.canvas.style.transform = "";
        } else {
            this._mode = "viewport";
            this.canvas.width = vw * dpr;
            this.canvas.height = vh * dpr;
            this.canvas.style.height = vh + "px";
            this.canvas.style.transform = "";
        }
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _applyScroll() {
        const y = -(window.scrollY || 0);
        const x = -(window.scrollX || 0);
        this.canvas.style.transform = "translate(" + x + "px," + y + "px)";
    }

    init(attribute) {
        this.renderElements = document.querySelectorAll("[" + attribute + "]");
        return this.renderElements.length > 0;
    }

    _getStyle(el) {
        const name = el.getAttribute("retro-border");
        if (name && this.BORDER_STYLES[name]) return this.BORDER_STYLES[name];
        return {
            h:  el.getAttribute("retro-h")  || "-",
            v:  el.getAttribute("retro-v")  || "|",
            tl: el.getAttribute("retro-tl") || "+",
            tr: el.getAttribute("retro-tr") || "+",
            bl: el.getAttribute("retro-bl") || "+",
            br: el.getAttribute("retro-br") || "+",
        };
    }

   _getGlyph(char, fontSize) {
        const key = char + "|" + fontSize;
        if (this._glyphCache.has(key)) return this._glyphCache.get(key);

        const off = document.createElement("canvas");
        const c = off.getContext("2d");
        c.font = fontSize + "px Glass TTY VT220";

        const m = c.measureText(char);
        const isMobile = "ontouchstart" in window;
        const blurOuter = isMobile ? 8 : 15;
        const pad = isMobile ? 6 : 10;
        off.width = Math.ceil(m.width) + pad * 2;
        off.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;

        c.font = fontSize + "px Glass TTY VT220";
        c.fillStyle = "#f0fff8";

        c.shadowColor = "#80ffc0";
        c.shadowBlur = 3;
        c.fillText(char, pad, pad + m.actualBoundingBoxAscent);

        c.shadowColor = "#00ff66";
        c.shadowBlur = blurOuter;
        c.fillText(char, pad, pad + m.actualBoundingBoxAscent);

        c.shadowBlur = 0;

        const entry = {
            canvas: off,
            width: off.width,
            height: off.height,
            offsetX: pad,
            offsetY: pad + m.actualBoundingBoxAscent
        };
        this._glyphCache.set(key, entry);
        return entry;
    }

    _measure(style, el) {
        const computed = getComputedStyle(el || document.body);
        const fontSize = parseFloat(computed.fontSize);
        this.ctx.font = fontSize + "px Glass TTY VT220";

        const hM = this.ctx.measureText(style.h);
        const vM = this.ctx.measureText(style.v);
        const cM = this.ctx.measureText("Hg#");

        this._hW = hM.width;
        this._hTotalH = cM.actualBoundingBoxAscent + cM.actualBoundingBoxDescent;
        this._vW = vM.width;
        this._vTotalH = cM.actualBoundingBoxAscent + cM.actualBoundingBoxDescent;
    }

    _setupMargins() {
        this.renderElements.forEach((el) => {
            const style = this._getStyle(el);
            el._rtStyle = style;
            this._measure(style, el);

            el._rtHW = this._hW;
            el._rtHTotalH = this._hTotalH;
            el._rtVW = this._vW;
            el._rtVTotalH = this._vTotalH;

            const tB = Math.ceil(this._hTotalH);
            const lR = Math.ceil(this._vW);
            const marginT = Math.ceil(this._hTotalH / 2);
            const marginR = Math.ceil(this._vW / 2);

            el.style.margin = marginT + "px " + marginR + "px";
            el.style.padding = tB + "px " + lR + "px";
            el.style.boxSizing = "border-box";

            el._rtPaddingTop = tB;
            el._rtPaddingBottom = tB;
            el._rtPaddingLeft = lR;
            el._rtPaddingRight = lR;
        });
    }

    _cachePositions() {
        const scrollY = window.scrollY || 0;
        const scrollX = window.scrollX || 0;

        this.renderElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const fontSize = parseFloat(getComputedStyle(el).fontSize);

            el._rtDocTop = rect.top + scrollY;
            el._rtDocLeft = rect.left + scrollX;
            el._rtDocBottom = rect.bottom + scrollY;
            el._rtDocRight = rect.right + scrollX;
            el._rtFontSize = fontSize;
        });
    }

    _drawGlyph(char, fontSize, x, y) {
        const g = this._getGlyph(char, fontSize);
        this.ctx.drawImage(g.canvas, x - g.offsetX, y - g.offsetY);
    }

    _drawBorder(el, style) {
        const fontSize = el._rtFontSize;
        const hW = el._rtHW;
        const hTotalH = el._rtHTotalH;
        const vW = el._rtVW;
        const vTotalH = el._rtVTotalH;

        const scrollY = (window.scrollY || 0);
        const scrollX = (window.scrollX || 0);

        const top = (this._mode === "viewport" ? el._rtDocTop - scrollY : el._rtDocTop);
        const bottom = (this._mode === "viewport" ? el._rtDocBottom - scrollY : el._rtDocBottom);
        const left = (this._mode === "viewport" ? el._rtDocLeft - scrollX : el._rtDocLeft);
        const right = (this._mode === "viewport" ? el._rtDocRight - scrollX : el._rtDocRight);

        const leftEdge = left + (el._rtPaddingLeft || 0);
        const rightEdge = right - (el._rtPaddingRight || 0);
        const topEdge = top + (el._rtPaddingTop || 0);
        const bottomEdge = bottom;

        // Horizontal borders — dynamic spacing to fill exactly
        const hSpace = rightEdge - leftEdge;
        let hCount = Math.max(1, Math.floor(hSpace / hW));
        if (hCount > 1) {
            const hSpacing = (hSpace - hW) / (hCount - 1);
            if (hSpacing > hW * 1.3) hCount++;
        }
        const hSpacing = hCount > 1 ? (hSpace - hW) / (hCount - 1) : 0;
        for (let i = 0; i < hCount; i++) {
            const x = leftEdge + i * hSpacing;
            this._drawGlyph(style.h, fontSize, x, topEdge);
            this._drawGlyph(style.h, fontSize, x, bottomEdge);
        }

        // Vertical borders — dynamic spacing to fill exactly
        const vSpace = bottomEdge - topEdge - (2 * vTotalH);
        let vCount = Math.max(1, Math.round(vSpace / vTotalH));
        if (vCount > 1) {
            const vSpacing = vSpace / (vCount - 1);
            if (vSpacing > vTotalH * 1.3) vCount++;
        }
        const vSpacing = vCount > 1 ? vSpace / (vCount - 1) : 0;
        for (let i = 0; i < vCount; i++) {
            const y = topEdge + vTotalH + i * vSpacing;
            this._drawGlyph(style.v, fontSize, leftEdge - hW, y);
            this._drawGlyph(style.v, fontSize, rightEdge, y);
        }

        // Corners
        this._drawGlyph(style.tl, fontSize, leftEdge - hW, topEdge);
        this._drawGlyph(style.tr, fontSize, rightEdge, topEdge);
        this._drawGlyph(style.bl, fontSize, leftEdge - hW, bottomEdge);
        this._drawGlyph(style.br, fontSize, rightEdge, bottomEdge);
    }

    render() {
        if (this._mode === "full") {
            const vw = window.innerWidth;
            const dh = document.documentElement.scrollHeight;
            this.ctx.clearRect(0, 0, vw, dh);
        } else {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            this.ctx.clearRect(0, 0, vw, vh);
        }
        this.ctx.fillStyle = "#f0fff8";

        this.renderElements.forEach((el) => {
            this._drawBorder(el, el._rtStyle);
        });
    }

    startLoop() { }

    stopLoop() {
        if (this._bodyObserver) this._bodyObserver.disconnect();
        if (this._resizeTimer) clearTimeout(this._resizeTimer);
    }
}

document.fonts.ready.then(() => {
    const engine = new RetroEngine("retro-engine");
    if (engine.init("retro-render")) {
        engine._setupMargins();
        requestAnimationFrame(() => {
            engine._resize();
            engine._cachePositions();
            if (engine._mode === "full") {
                engine._applyScroll();
            }
            engine.render();
            engine.startLoop();
        });
    }
});
