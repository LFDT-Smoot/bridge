/*
 * Copyright (c) 2019 Wanchain. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import FrameworkService from "../frameworkService/FrameworkService";
import ConfigService from "../configService/configService";
import ActionHandleService from "../actionHandleService/actionHandleService";
import TaskHandleService from "../taskHandleService/taskHandleService";
import ChainInfoService from "../chainInfoService/chainInfoService";
import {PolygonService, StellarService, ApiService} from "../marketService";

export default class StartService {
  constructor() {
    this.frameworkService = new FrameworkService();
  }

  async init(network) {
    try {
      let frameworkService = this.frameworkService;

      let configService = new ConfigService();
      await configService.init(network);
      frameworkService.registerService("ConfigService", configService);

      let chainInfoService = new ChainInfoService();
      await chainInfoService.init(frameworkService);
      frameworkService.registerService("ChainInfoService", chainInfoService);

      let actionHandleService = new ActionHandleService();
      await actionHandleService.init(frameworkService);
      frameworkService.registerService("ActionHandleService", actionHandleService);

      let taskHandleService = new TaskHandleService();
      await taskHandleService.init(frameworkService);
      frameworkService.registerService("TaskHandleService", taskHandleService);

      let polygonService = new PolygonService();
      await polygonService.init(frameworkService);
      frameworkService.registerService("PolygonService", polygonService);

      let stellarService = new StellarService();
      await stellarService.init(frameworkService);
      frameworkService.registerService("StellarService", stellarService);

      let apiService = new ApiService();
      await apiService.init(frameworkService);
      frameworkService.registerService("ApiService", apiService);
    } catch (err) {
      console.error("StartService.init err:", err);
    }
  }

  async start() {
    try {
      // do nothing
    } catch (err) {
      console.error("startService start err:", err);
    }
  }

  getService(serviceName) {
    return this.frameworkService.getService(serviceName);
  }
};