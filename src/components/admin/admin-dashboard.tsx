"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface IngestionJob {
  id: string;
  playlistId: string;
  status: string;
  totalVideos: number;
  processed: number;
  errors: string | null;
  createdAt: string;
}

export function AdminDashboard() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      // silently fail
    }
  }

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setIsIngesting(true);
    setMessage("");

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Ingestion started! Processing ${data.totalVideos} videos.`);
        setPlaylistUrl("");
        fetchJobs();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Failed to start ingestion.");
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage playlist ingestion and knowledge extraction</p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat">
            <Button variant="outline" className="text-slate-300 border-slate-700">Chat</Button>
          </Link>
          <Link href="/knowledge">
            <Button variant="outline" className="text-slate-300 border-slate-700">Knowledge</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-400">Home</Button>
          </Link>
        </div>
      </div>

      {/* Ingest Form */}
      <Card className="bg-slate-800/50 border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Ingest YouTube Playlist</CardTitle>
          <CardDescription className="text-slate-400">
            Provide a YouTube playlist URL to extract transcripts and distill knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIngest} className="flex gap-3">
            <Input
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Button
              type="submit"
              disabled={isIngesting || !playlistUrl.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isIngesting ? "Starting..." : "Ingest"}
            </Button>
          </form>
          {message && (
            <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Ingestion Jobs</h2>
        {jobs.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center">
              <p className="text-slate-500">No ingestion jobs yet</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium truncate max-w-md">
                      {job.playlistId}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">
                      {job.processed}/{job.totalVideos}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        job.status === "completed"
                          ? "text-green-300 border-green-300/30"
                          : job.status === "processing"
                          ? "text-yellow-300 border-yellow-300/30"
                          : job.status === "failed"
                          ? "text-red-300 border-red-300/30"
                          : "text-slate-300 border-slate-300/30"
                      }`}
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
                {job.status === "processing" && (
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${job.totalVideos > 0 ? (job.processed / job.totalVideos) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
