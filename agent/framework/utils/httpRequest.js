/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
const fetch = require('node-fetch');
const {AbortController} = require('abort-controller');

function getLogger(){
    return global.monitorLogger ? global.monitorLogger : console;
}

async function fetchWithTimeout(url, options, timeout=15*1000) {

    const controller = new AbortController();
    const id = setTimeout(() => {
        getLogger().error("Timeout URL: ", url);
        controller.abort();
    }, timeout);

    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    return response;
}


async function doHttpGet(url) {
    let json = null

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'Authorization': global.apiHeader
            }
        });

        json = await response.json()
            .catch(e => {
                    getLogger().error("doHttpGet() json catch error: ", e);
                    throw e;
                }
            );
    }catch (e) {
        console.log("doHttpGet() catch fetch error: ", e);
        throw e;
    }

    return json
}

async function doHttpPost(url, paramsJson) {
    let json = null

    try{
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            body: JSON.stringify(paramsJson),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': global.apiHeader
            }
        });

        json = await response.json().catch(e => {
            getLogger().error("doHttpPost() json catch error: ", e);
            throw e;
            }
        );

    }catch (e) {
        getLogger().error("doHttpPost() catch fetch error: ", e);
        throw e;
    }

    return json
}


async function mainTest() {

    try{
        // Should return null, because URL incorrect.
        var result = await doHttpGet('https://api.githubX.com/users/github')
        console.log("result1: ", result);
    }catch (e) {

    }

    try{
        // Should return null, because fake-req return plain text, not json.
        result = await doHttpGet('https://webhook.site/2212b183-6e0b-446d-827e-2994adf83642')
        console.log("result2: ", result);
    }catch (e) {

    }

    try{
        // Should return real json data.
        var result = await doHttpGet('https://api.github.com/users/github')
        console.log("result3: ", result);
    }catch (e) {

    }


}

// mainTest()


module.exports = { doHttpGet, doHttpPost };
