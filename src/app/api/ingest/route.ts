import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlaylistVideos, getTranscript } from "@/lib/youtube";
import { distillVideo } from "@/lib/distillation";

export async function POST(request: NextRequest) {
  try {
    const { playlistUrl } = await request.json();

    if (!playlistUrl) {
      return Response.json({ error: "Playlist URL is required" }, { status: 400 });
    }

    const videos = await getPlaylistVideos(playlistUrl);

    const job = await prisma.ingestionJob.create({
      data: {
        playlistId: playlistUrl,
        status: "processing",
        totalVideos: videos.length,
      },
    });

    // Process in background - return job ID immediately
    processPlaylist(job.id, videos).catch(console.error);

    return Response.json({
      jobId: job.id,
      totalVideos: videos.length,
      message: "Ingestion started",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function processPlaylist(
  jobId: string,
  videos: Array<{ videoId: string; title: string; url: string; thumbnail: string; description: string }>
) {
  let processed = 0;
  const errors: string[] = [];

  for (const videoMeta of videos) {
    try {
      let video = await prisma.video.findUnique({
        where: { youtubeId: videoMeta.videoId },
      });

      if (!video) {
        const transcript = await getTranscript(videoMeta.videoId);

        video = await prisma.video.create({
          data: {
            youtubeId: videoMeta.videoId,
            title: videoMeta.title,
            url: videoMeta.url,
            description: videoMeta.description,
            thumbnail: videoMeta.thumbnail,
            transcript: transcript || null,
          },
        });
      }

      if (video.transcript && !video.processed) {
        await distillVideo(video.id);
      }

      processed++;
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: { processed },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${videoMeta.title}: ${msg}`);
    }
  }

  await prisma.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: errors.length > 0 ? "completed" : "completed",
      processed,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  });
}

export async function GET() {
  const jobs = await prisma.ingestionJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return Response.json({ jobs });
}
