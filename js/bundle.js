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
        this.animFrame = null;
        this._resize();
        window.addEventListener("resize", () => {
            this._resize();
            this._setupMargins();
        });
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    init(attribute) {
        this.renderElements = document.querySelectorAll("[" + attribute + "]");
        return this.renderElements.length > 0;
    }

    _getStyle(el) {
        const name = el.getAttribute("retro-border");
        if (name && this.BORDER_STYLES[name]) return this.BORDER_STYLES[name];
        // Custom override: any retro-h, retro-v, retro-tl, retro-tr, retro-bl, retro-br
        return {
            h:  el.getAttribute("retro-h")  || "-",
            v:  el.getAttribute("retro-v")  || "|",
            tl: el.getAttribute("retro-tl") || "+",
            tr: el.getAttribute("retro-tr") || "+",
            bl: el.getAttribute("retro-bl") || "+",
            br: el.getAttribute("retro-br") || "+",
        };
    }

    _measure(style) {
        const dpr = window.devicePixelRatio || 1;
        const fontSize = 25.6 / dpr;
        this.ctx.font = fontSize + "px Glass TTY VT220";

        const hM = this.ctx.measureText(style.h);
        const vM = this.ctx.measureText(style.v);
        const cM = this.ctx.measureText("Hg#");

        this._hW = hM.width;
        this._hTotalH = cM.actualBoundingBoxAscent + cM.actualBoundingBoxDescent;

        this._vW = vM.width;
        this._vTotalH = cM.actualBoundingBoxAscent + cM.actualBoundingBoxDescent;

        this._vCenterY = this._vTotalH / 2;
    }

    _measureCharHeight(symbol) {
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.padding = '0';
        span.style.margin = '0';
        span.textContent = symbol; // Captures ascender + descender
        document.body.appendChild(span);
        
        const totalH = span.getBoundingClientRect().height;
        document.body.removeChild(span);
        return totalH;
    }

    _setupMargins() {
        this.renderElements.forEach((el) => {
            const style = this._getStyle(el);
            this._measure(style);

            const gap = 0;
            const tB = Math.ceil(this._hTotalH + gap);
            const lR = Math.ceil(this._vW + gap);
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
        const r = el.getBoundingClientRect();
        this._measure(style);

        const pt = el._rtPaddingTop || 0;
        const pb = el._rtPaddingBottom || 0;
        const pl = el._rtPaddingLeft || 0;
        const pr = el._rtPaddingRight || 0;

        const topEdge = r.top + pt;
        const bottomEdge = r.bottom;
        const leftEdge = r.left + pl;
        const rightEdge = r.right - pr;

        // Horizontal borders — baseline so char draws downward from edge
        const hCount = Math.max(1, Math.floor((rightEdge - leftEdge) / this._hW));
        const hStr = style.h.repeat(hCount);

        this.ctx.fillText(hStr, leftEdge, topEdge);
        this.ctx.fillText(hStr, leftEdge, bottomEdge);

        // Vertical borders — evenly distributed, baseline below center
        const vSpace = bottomEdge - topEdge - (2 * this._vTotalH);
        const vCount = Math.max(1, Math.round(vSpace / this._vTotalH));
        const vSpacing = vCount > 1 ? vSpace / (vCount - 1) : 0;

        for (let i = 0; i < vCount; i++) {
            const y = topEdge + this._vTotalH + i * vSpacing;
            this.ctx.fillText(style.v, leftEdge - this._hW, y);
            this.ctx.fillText(style.v, rightEdge, y);
        }

        // Corners
        this.ctx.fillText(style.tl, leftEdge - this._hW, topEdge);
        this.ctx.fillText(style.tr, rightEdge, topEdge);
        this.ctx.fillText(style.bl, leftEdge - this._hW, bottomEdge);
        this.ctx.fillText(style.br, rightEdge, bottomEdge);
    }

    render(time) {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;

        this.ctx.clearRect(0, 0, w, h);

        const flicker = Math.sin(time * Math.PI * 10) * 0.5 + 0.5;
        const blurBase = 2;
        const blurRange = 2;
        const blur = blurBase + flicker * blurRange;
        const outerBlur = 9 + flicker * 11;
        const innerColor = flicker > 0.5 ? "#80ffc0" : "#72fab6";
        const outerColor = "#00ff66";

        this.ctx.fillStyle = "#f0fff8";

        this.renderElements.forEach((el) => {
            const style = this._getStyle(el);

            this.ctx.shadowColor = innerColor;
            this.ctx.shadowBlur = blur;
            this._drawBorder(el, style);

            this.ctx.shadowColor = outerColor;
            this.ctx.shadowBlur = outerBlur;
            this._drawBorder(el, style);
        });

        this.ctx.shadowBlur = 0;
    }

    startLoop() {
        const loop = (time) => {
            this.render(time / 1000);
            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    }
}

document.fonts.ready.then(() => {
    const engine = new RetroEngine("retro-engine");
    if (engine.init("retro-render")) {
        engine._setupMargins();
        engine.render();
        engine.startLoop();
    }
});
