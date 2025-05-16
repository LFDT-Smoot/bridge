/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import config from "../../config/actionType/config.js";

export default class ActionHandleService {
  constructor() {
    this.actionHandler = new Map();
  }

  async init(frameworkService) {
    this.frameworkService = frameworkService;
    config.forEach(v => this.actionHandler.set(v.name, v.handle));
  }

  async getProcessTasks(actionInfo) {
    let handleClass = this.actionHandler.get(actionInfo.action);
    let handler = new handleClass(this.frameworkService);
    let steps = await handler.process(actionInfo);
    return steps;
  }
};

