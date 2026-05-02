 class RetroEngine {
    PIXEL_RATIO = (function () {
        return window.devicePixelRatio;
    })();

    constructor(canvas_id) {
        this.canvas = document.getElementById(canvas_id);
        this.canvas.width = this.canvas.getBoundingClientRect().width;
        this.canvas.height = this.canvas.getBoundingClientRect().height;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    init(attribute) {
        this.renderElements = document.querySelectorAll('['+attribute+']');
        if (this.renderElements !== undefined) {
            return true;
        }
        return false;
    }
    render() {
        console.log(this.PIXEL_RATIO);
        this.ctx.font = "30px Glass TTY VT220";
        this.ctx.fillStyle = "white";
        console.log(this.renderElements);
        this.renderElements.forEach((currentValue, currentIndex, listObj) => {
            let elemRect =  currentValue.getBoundingClientRect();
            let top_bottom = "-".repeat(elemRect.width / 10);
            this.ctx.fillText(top_bottom, elemRect.left, elemRect.top);
            this.ctx.fillText(top_bottom, elemRect.left, elemRect.bottom);
            for (var i = 0; i < elemRect.height / 15; i++) {
                this.ctx.fillText("|", elemRect.left, elemRect.top+i*30);
                this.ctx.fillText("|", elemRect.right, elemRect.top+i*30);
            }
            //this.ctx.fillText(left_right, elemRect.left, elemRect.top);
            console.log(elemRect);
        });

    }
 }

 (function() {
    let rtrengn = new RetroEngine('retro-engine');
    if(rtrengn.init('retro-render')) {
        rtrengn.render();
    }

 })();