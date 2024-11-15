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