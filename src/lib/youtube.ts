import { YoutubeTranscript } from "youtube-transcript";

export interface VideoMetadata {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
}

export async function getPlaylistVideos(playlistUrl: string): Promise<VideoMetadata[]> {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) throw new Error("Invalid playlist URL");

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  const videos: VideoMetadata[] = [];
  let nextPageToken = "";

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API error: ${response.statusText}`);

    const data = await response.json();

    for (const item of data.items) {
      const snippet = item.snippet;
      videos.push({
        videoId: snippet.resourceId.videoId,
        title: snippet.title,
        url: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
        description: snippet.description || "",
      });
    }

    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return videos;
}

export async function getTranscript(videoId: string): Promise<string> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    return transcriptItems.map((item) => item.text).join(" ");
  } catch {
    return "";
  }
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}
