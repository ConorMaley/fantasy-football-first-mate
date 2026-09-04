import { Router } from "express";

import { getCurrentUserId } from "../currentUser.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

usersRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    if (!search) {
      res.json([]);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: getCurrentUserId() },
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true, email: true },
      take: 10,
    });

    res.json(users);
  }),
);
