import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as masterController from "./master.controller.js";

export const masterRouter = Router();

masterRouter.get("/cities", asyncHandler(masterController.getCities));
masterRouter.get(
  "/cities/:cityId/localities",
  asyncHandler(masterController.getLocalities),
);
masterRouter.get("/roles", asyncHandler(masterController.getRoles));
masterRouter.get(
  "/roles/:roleId/skills",
  asyncHandler(masterController.getSkills),
);
