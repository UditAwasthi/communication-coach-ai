import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "principles";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  let data;
  let total;

  switch (type) {
    case "principles":
      [data, total] = await Promise.all([
        prisma.principle.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { video: { select: { title: true, youtubeId: true } } },
        }),
        prisma.principle.count(),
      ]);
      break;
    case "frameworks":
      [data, total] = await Promise.all([
        prisma.framework.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { video: { select: { title: true, youtubeId: true } } },
        }),
        prisma.framework.count(),
      ]);
      break;
    case "beliefs":
      [data, total] = await Promise.all([
        prisma.belief.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { video: { select: { title: true, youtubeId: true } } },
        }),
        prisma.belief.count(),
      ]);
      break;
    case "examples":
      [data, total] = await Promise.all([
        prisma.example.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { video: { select: { title: true, youtubeId: true } } },
        }),
        prisma.example.count(),
      ]);
      break;
    case "videos":
      [data, total] = await Promise.all([
        prisma.video.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            youtubeId: true,
            title: true,
            url: true,
            thumbnail: true,
            processed: true,
            createdAt: true,
          },
        }),
        prisma.video.count(),
      ]);
      break;
    default:
      return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  return Response.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
