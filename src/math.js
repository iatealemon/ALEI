/** converts degrees to radians */
export const asRadians = (function() {
    // not sure if it's necessary to precompute this value. javascript engine may do constant folding. can't hurt tho
    const multiplier = Math.PI / 180;
    return function(degrees) {
        return degrees * multiplier;
    }
})();

/**
 * modulo operator. differs from the remainder operator (%) when using negative operands
 */
export function mod(n, d) {
    return ((n % d) + d) % d;
}

/**
 * ease out exponential interpolation function (steepest at x=0)
 * @param {number} x value in the interval [0, 1] to interpolate
 * @param {number} k steepness. lower values bring the value at x=1 further from 1. about 5 or higher is good
 */
export function easeOutExpo(x, k=5) {
    return x >= 1 ? 1 : 1 - Math.E**(-k*x);
}