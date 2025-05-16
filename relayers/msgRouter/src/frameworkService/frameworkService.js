/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';


class FrameworkService {
    constructor() {
        this.serviceRegistry = {};
    }

    registerService(serviceName, serviceInstance) {
        this.serviceRegistry[serviceName] = serviceInstance;
    }

    getService(serviceName) {
        return this.serviceRegistry[serviceName];
    }
}


let frameworkService = new FrameworkService();

module.exports = frameworkService;
