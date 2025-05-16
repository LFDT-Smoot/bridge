/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
export default class FrameworkService {
    constructor(options) {
        this.serviceRegistry = {};
    }

    registerService(serviceName, serviceInstance) {
        this.serviceRegistry[serviceName] = serviceInstance;
    }

    getService(serviceName) {
        return this.serviceRegistry[serviceName];
    }
}