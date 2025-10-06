/**
 * Return a time block for message formatting.
 *
 * @export
 * @return {string}
 */
export function getTimeBlock(): string {
    const date = new Date(Date.now());
    const hour = date.getHours() <= 9 ? `0${date.getHours()}` : date.getHours();
    const minute = date.getMinutes() <= 9 ? `0${date.getMinutes()}` : date.getMinutes();
    const second = date.getSeconds() <= 9 ? `0${date.getSeconds()}` : date.getSeconds();
    return `[${hour}:${minute}:${second}]`;
}

/**
 * Log an info message.
 *
 * @export
 * @param {string} msg
 */
export function info(msg: string): void {
    console.log(`[i]${getTimeBlock()} ${msg}`);
}

/**
 * Log a warning message.
 *
 * @export
 * @param {string} msg
 */
export function warn(msg: string): void {
    console.warn(`[!]${getTimeBlock()} ${msg}`);
}

/**
 * Log an error message.
 *
 * @export
 * @param {string} msg
 */
export function error(msg: string): void {
    console.error(`[X]${getTimeBlock()} ${msg}`);
}

/**
 * Log a debug message.
 *
 * @export
 * @param {string} msg
 */
export function debug(msg: string): void {
    console.log(`[D]${getTimeBlock()} ${msg}`);
}
