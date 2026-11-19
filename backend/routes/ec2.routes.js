
import { Router } from "express";

import {
  listInstances,
  checkInstanceHealth,
  launchInstance,
  startInstance,
  stopInstance,
  rebootInstance,
  modifyInstanceType,
  terminateInstance
} from "../controllers/ec2.controller.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get("/instances", asyncHandler(listInstances));

router.get(
  "/instances/:instanceId/health",
  asyncHandler(checkInstanceHealth)
);

router.post("/instances", asyncHandler(launchInstance));

router.post(
  "/instances/:instanceId/start",
  asyncHandler(startInstance)
);

router.post(
  "/instances/:instanceId/stop",
  asyncHandler(stopInstance)
);

router.post(
  "/instances/:instanceId/reboot",
  asyncHandler(rebootInstance)
);

router.patch(
  "/instances/:instanceId/type",
  asyncHandler(modifyInstanceType)
);

router.delete(
  "/instances/:instanceId",
  asyncHandler(terminateInstance)
);

export default router;
