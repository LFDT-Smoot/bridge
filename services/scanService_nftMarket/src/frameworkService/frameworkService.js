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
