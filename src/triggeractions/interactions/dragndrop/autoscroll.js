const autoScrollDistance = 100;
const autoScrollMaxSpeed = 10;

let scrollAnimationFrame = null;

let scrollElement = null;
let scrollSpeed = 0;

export function checkAutoScroll(mouseY) {
    const rparams = document.getElementById("rparams");
    if (rparams !== null) {
        const rect = rparams.getBoundingClientRect();

        // top
        if (mouseY < rect.top + autoScrollDistance) {
            const proportion = (autoScrollDistance - (mouseY - rect.top)) / autoScrollDistance;
            startAutoScroll(rparams, proportion * autoScrollMaxSpeed * -1);
        }
        // bottom
        // rect.bottom has -1 because mousemove doesn't fire at exactly rect.bottom. so we just move the area up by 1 so that the range of proportion is correct
        else if (mouseY > rect.bottom-1 - autoScrollDistance) {
            const proportion = (autoScrollDistance - (rect.bottom-1 - mouseY)) / autoScrollDistance;
            startAutoScroll(rparams, proportion * autoScrollMaxSpeed);
        }
        else {
            stopAutoScroll();
        }
    }
}

export function startAutoScroll(element, speed) {
    scrollElement = element;
    scrollSpeed = speed;
    if (scrollAnimationFrame === null) scrollStep();
}

export function stopAutoScroll() {
    if (scrollAnimationFrame !== null) {
        cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = null;
    }
}

function scrollStep() {
    const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;

    scrollElement.scrollTop += scrollSpeed;

    // stop scrolling if either end of the element was reached
    if (
        (scrollSpeed > 0 && scrollElement.scrollTop >= maxScroll) || // reached bottom
        (scrollSpeed < 0 && scrollElement.scrollTop <= 0)            // reached top
    ) {
        return; // stop scrolling
    }
    
    scrollAnimationFrame = requestAnimationFrame(scrollStep);
}