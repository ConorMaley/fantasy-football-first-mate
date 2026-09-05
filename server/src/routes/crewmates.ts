import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import * as crewmateService from "../services/crewmateService.js";
import * as crewmateTaggingService from "../services/crewmateTaggingService.js";

export const crewmatesRouter = Router();

crewmatesRouter.get(
  "/crewmates",
  asyncHandler(async (_req, res) => {
    const crewmates = await crewmateService.listCrewmates(getCurrentUserId());
    res.json(crewmates);
  }),
);

crewmatesRouter.post(
  "/crewmates",
  asyncHandler(async (req, res) => {
    const { displayName, userId } = req.body ?? {};
    const crewmate = await crewmateService.createCrewmate(getCurrentUserId(), { displayName, userId });
    res.status(201).json(crewmate);
  }),
);

crewmatesRouter.patch(
  "/crewmates/:id",
  asyncHandler(async (req, res) => {
    const { displayName, userId } = req.body ?? {};
    const crewmate = await crewmateService.updateCrewmate(getCurrentUserId(), req.params.id, {
      displayName,
      userId,
    });
    res.json(crewmate);
  }),
);

crewmatesRouter.delete(
  "/crewmates/:id",
  asyncHandler(async (req, res) => {
    await crewmateService.deleteCrewmate(getCurrentUserId(), req.params.id);
    res.status(204).send();
  }),
);

crewmatesRouter.post(
  "/crewmates/:id/league-members",
  asyncHandler(async (req, res) => {
    const { leagueMemberId } = req.body ?? {};
    const tag = await crewmateTaggingService.tagLeagueMember(getCurrentUserId(), req.params.id, leagueMemberId);
    res.status(201).json(tag);
  }),
);

crewmatesRouter.delete(
  "/crewmates/:id/league-members/:leagueMemberId",
  asyncHandler(async (req, res) => {
    await crewmateTaggingService.untagLeagueMember(getCurrentUserId(), req.params.id, req.params.leagueMemberId);
    res.status(204).send();
  }),
);
