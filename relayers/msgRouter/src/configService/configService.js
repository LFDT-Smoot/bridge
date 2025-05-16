/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const _ = require('lodash');

module.exports = class ConfigService {
    constructor() {
    }

    init(configJson) {
        this.m_confgJson = configJson;
    }

    getConfig(serviceName, propertyPath) {
        let fullPropertyPath = serviceName;
        if (propertyPath && propertyPath !== '.') fullPropertyPath = fullPropertyPath + '.' + propertyPath;
        let ret = _.get(this.m_confgJson, fullPropertyPath);

        return ret;
    }

    getGlobalConfig(name) {
        return _.get(this.m_confgJson, name);
    }
}
