/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict"

function isPromise(p) {
    return p && Object.prototype.toString.call(p) === "[object Promise]";
}

module.exports = class TimeoutPromise extends Promise {
    /**
     * Creates a Promise that resolves or rejects when the provided promise/callback resolves/rejects,
     * or rejects with a timeout error if it takes too long.
     *
     * @param {Promise | Function} cbOrPromise - A Promise instance or an executor function (resolve, reject) => { ... }.
     * @param {number} [ms=30000] - The timeout duration in milliseconds.
     * @param {string} [hint='PTIMEOUT'] - The error message for the timeout.
     * @param {object} [exitCondition] - An optional object whose `exist` property will be set to true on timeout.
     */
    constructor(cbOrPromise, ms = 30 * 1000, hint = 'PTIMEOUT', exitCondition) {
        let timeoutId; // Store the ID for clearTimeout

        super((resolve, reject) => {
            const actualPromise = isPromise(cbOrPromise)
              ? cbOrPromise
              : new Promise(cbOrPromise);

            const timeoutPromise = new Promise((timeoutResolve, timeoutReject) => {
                timeoutId = setTimeout(() => {
                    if (exitCondition) {
                        exitCondition.exist = true;
                    }
                    timeoutReject(new Error(hint));
                }, ms);
            });

            Promise.race([actualPromise, timeoutPromise])
              .then(data => resolve(data))
              .catch(error => reject(error))
              .finally(() => {
                  clearTimeout(timeoutId);
              });
        });
    }
}