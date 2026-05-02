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
        this._applyScroll();

        window.addEventListener("resize", () => {
            this._setupMargins();
            this._resize();
            this.render();
        });

        window.addEventListener("scroll", () => {
            if (this._scrollRAF) return;
            this._scrollRAF = requestAnimationFrame(() => {
                this._applyScroll();
                this._scrollRAF = null;
            });
        }, { passive: true });

        this._bodyObserver = new ResizeObserver(() => {
            if (this._resizeTimer) clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                this._resize();
                this.render();
            }, 100);
        });
        this._bodyObserver.observe(document.body);
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const vw = window.innerWidth;
        const dh = document.documentElement.scrollHeight;

        this.canvas.width = vw * dpr;
        this.canvas.height = dh * dpr;
        this.canvas.style.height = dh + "px";
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
            this._measure(style, el);

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

    _drawBorder(el, style) {
        this._measure(style, el);

        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY || 0;
        const scrollX = window.scrollX || 0;

        const top = rect.top + scrollY;
        const left = rect.left + scrollX;
        const bottom = rect.bottom + scrollY;
        const right = rect.right + scrollX;

        const pt = el._rtPaddingTop || 0;
        const pb = el._rtPaddingBottom || 0;
        const pl = el._rtPaddingLeft || 0;
        const pr = el._rtPaddingRight || 0;

        const topEdge = top + pt;
        const bottomEdge = bottom;
        const leftEdge = left + pl;
        const rightEdge = right - pr;

        const hCount = Math.max(1, Math.floor((rightEdge - leftEdge) / this._hW));
        const hStr = style.h.repeat(hCount);

        this.ctx.fillText(hStr, leftEdge, topEdge);
        this.ctx.fillText(hStr, leftEdge, bottomEdge);

        const vSpace = bottomEdge - topEdge - (2 * this._vTotalH);
        const vCount = Math.max(1, Math.round(vSpace / this._vTotalH));
        const vSpacing = vCount > 1 ? vSpace / (vCount - 1) : 0;

        for (let i = 0; i < vCount; i++) {
            const y = topEdge + this._vTotalH + i * vSpacing;
            this.ctx.fillText(style.v, leftEdge - this._hW, y);
            this.ctx.fillText(style.v, rightEdge, y);
        }

        this.ctx.fillText(style.tl, leftEdge - this._hW, topEdge);
        this.ctx.fillText(style.tr, rightEdge, topEdge);
        this.ctx.fillText(style.bl, leftEdge - this._hW, bottomEdge);
        this.ctx.fillText(style.br, rightEdge, bottomEdge);
    }

    render() {
        const vw = window.innerWidth;
        const dh = document.documentElement.scrollHeight;
        this.ctx.clearRect(0, 0, vw, dh);
        this.ctx.fillStyle = "#f0fff8";

        this.renderElements.forEach((el) => {
            const style = this._getStyle(el);

            this.ctx.shadowColor = "#80ffc0";
            this.ctx.shadowBlur = 3;
            this._drawBorder(el, style);

            this.ctx.shadowColor = "#00ff66";
            this.ctx.shadowBlur = 15;
            this._drawBorder(el, style);
        });

        this.ctx.shadowBlur = 0;
    }

    startLoop() { }
    stopLoop() { }
}

document.fonts.ready.then(() => {
    const engine = new RetroEngine("retro-engine");
    if (engine.init("retro-render")) {
        engine._setupMargins();
        requestAnimationFrame(() => {
            engine._resize();
            engine.render();
            engine.startLoop();
        });
    }
});
