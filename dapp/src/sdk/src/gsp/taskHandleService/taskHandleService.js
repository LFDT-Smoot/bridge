/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import config from "../../config/taskType/config.js";

export default class TaskHandleService {
  constructor() {
    this.taskHandler = new Map(); // taskType => Handler
  }

  async init(frameworkService) {
    this.frameworkService = frameworkService;
    config.forEach(v => this.taskHandler.set(v.name, v.handle));
  }

  async processTask(stepData, wallet) {
    try {
      let taskType = stepData.params.taskType;
      let handlerClass = this.taskHandler.get(taskType);
      let handler = new handlerClass(this.frameworkService);
      let result = await handler.process(stepData, wallet);
      return result;
    } catch (err) {
      console.error("TaskHandleService processTask %s error: %O", stepData.params.taskType, err);
      throw err;
    }
  }
};



