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
        window.addEventListener("resize", () => this._resize());
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
        const fontSize = 30 / dpr;
        this.ctx.font = fontSize + "px Glass TTY VT220";

        const hM = this.ctx.measureText(style.h);
        const vM = this.ctx.measureText(style.v);
        const cM = this.ctx.measureText("H");

        this._charW  = hM.width;
        this._charVW = vM.width;
        this._lineH  = cM.actualBoundingBoxAscent + cM.actualBoundingBoxDescent;
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
            this._measure(style);

            const r = el.getBoundingClientRect();
            const pad = 1;

            const hInner = r.width - pad * 2 - this._charVW * 2;
            const dashCount = Math.max(1, Math.floor(hInner / this._charW));
            const topBottom = style.h.repeat(dashCount);

            const vInner = r.height - this._lineH * 2 - pad * 2;
            const lineCount = Math.max(0, Math.floor(vInner / this._lineH));

            const corners = [
                [r.left + pad, r.top + pad],
                [r.left + r.width - this._charVW - pad, r.top + pad],
                [r.left + pad, r.bottom - this._lineH - pad],
                [r.left + r.width - this._charVW - pad, r.bottom - this._lineH - pad],
            ];
            const cornerChars = [style.tl, style.tr, style.bl, style.br];

            // Inner glow pass
            this.ctx.shadowColor = innerColor;
            this.ctx.shadowBlur = blur;

            this.ctx.fillText(topBottom, r.left + pad + this._charVW, r.top + pad + this._lineH);
            this.ctx.fillText(topBottom, r.left + pad + this._charVW, r.bottom - this._lineH - pad);

            for (let i = 0; i <= lineCount; i++) {
                const y = r.top + pad + this._lineH + i * this._lineH;
                this.ctx.fillText(style.v, r.left + pad, y);
                this.ctx.fillText(style.v, r.left + r.width - this._charVW - pad, y);
            }

            corners.forEach((pos, idx) => {
                this.ctx.fillText(cornerChars[idx], pos[0], pos[1] + this._lineH);
            });

            // Outer glow pass
            this.ctx.shadowColor = outerColor;
            this.ctx.shadowBlur = outerBlur;

            this.ctx.fillText(topBottom, r.left + pad + this._charVW, r.top + pad + this._lineH);
            this.ctx.fillText(topBottom, r.left + pad + this._charVW, r.bottom - this._lineH - pad);

            for (let i = 0; i <= lineCount; i++) {
                const y = r.top + pad + this._lineH + i * this._lineH;
                this.ctx.fillText(style.v, r.left + pad, y);
                this.ctx.fillText(style.v, r.left + r.width - this._charVW - pad, y);
            }

            corners.forEach((pos, idx) => {
                this.ctx.fillText(cornerChars[idx], pos[0], pos[1] + this._lineH);
            });
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
        engine.render();
        engine.startLoop();
    }
});
