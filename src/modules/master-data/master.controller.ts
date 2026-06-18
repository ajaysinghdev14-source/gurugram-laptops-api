import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as masterService from "./master.service.js";

export async function getCities(_req: Request, res: Response): Promise<void> {
  const data = await masterService.getAllCities();
  res.json(new ApiResponse(200, "Cities fetched", data));
}

export async function getLocalities(
  req: Request,
  res: Response,
): Promise<void> {
  const cityId = Number(req.params.cityId);
  const data = await masterService.getLocalitiesByCityId(cityId);
  res.json(new ApiResponse(200, "Localities fetched", data));
}

export async function getRoles(_req: Request, res: Response): Promise<void> {
  const data = await masterService.getAllRoles();
  res.json(new ApiResponse(200, "Roles fetched", data));
}

export async function getSkills(req: Request, res: Response): Promise<void> {
  const roleId = Number(req.params.roleId);
  const data = await masterService.getSkillsByRoleId(roleId);
  res.json(new ApiResponse(200, "Skills fetched", data));
}
