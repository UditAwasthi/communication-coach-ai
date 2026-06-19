"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

interface KnowledgeItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  belief?: string;
  scenario?: string;
  response?: string;
  steps?: string;
  category?: string;
  principle?: string;
  context?: string;
  video?: { title: string; youtubeId: string } | null;
}

export function KnowledgeExplorer() {
  const [activeTab, setActiveTab] = useState("principles");
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, [activeTab, page]);

  async function fetchKnowledge() {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge?type=${activeTab}&page=${page}&limit=20`);
      const data = await res.json();
      setItems(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400 mt-1">
            Explore extracted principles, frameworks, and examples
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat">
            <Button variant="outline" className="text-slate-300 border-slate-700">
              Chat
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-400">
              Home
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="principles" className="data-[state=active]:bg-purple-600">
            Principles
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="data-[state=active]:bg-purple-600">
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="beliefs" className="data-[state=active]:bg-purple-600">
            Beliefs
          </TabsTrigger>
          <TabsTrigger value="examples" className="data-[state=active]:bg-purple-600">
            Examples
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-purple-600">
            Videos
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <p className="text-slate-500 text-sm mb-4">{total} items total</p>

          {loading ? (
            <div className="text-slate-400 text-center py-12">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No items yet. Ingest a playlist to get started.</p>
              <Link href="/admin">
                <Button className="mt-4 bg-purple-600">Go to Admin</Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid gap-4">
                <TabsContent value="principles" className="mt-0 space-y-3">
                  {items.map((item) => (
                    <PrincipleCard key={item.id} item={item} />
                  ))}
                </TabsContent>
                <TabsContent value="frameworks" className="mt-0 space-y-3">
                  {items.map((item) => (
                    <FrameworkCard key={item.id} item={item} />
                  ))}
                </TabsContent>
                <TabsContent value="beliefs" className="mt-0 space-y-3">
                  {items.map((item) => (
                    <BeliefCard key={item.id} item={item} />
                  ))}
                </TabsContent>
                <TabsContent value="examples" className="mt-0 space-y-3">
                  {items.map((item) => (
                    <ExampleCard key={item.id} item={item} />
                  ))}
                </TabsContent>
                <TabsContent value="videos" className="mt-0 space-y-3">
                  {items.map((item) => (
                    <VideoCard key={item.id} item={item} />
                  ))}
                </TabsContent>
              </div>
            </ScrollArea>
          )}

          {total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-slate-300 border-slate-700"
              >
                Previous
              </Button>
              <span className="text-slate-400 text-sm py-2">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((p) => p + 1)}
                className="text-slate-300 border-slate-700"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function PrincipleCard({ item }: { item: KnowledgeItem }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base">{item.title}</CardTitle>
          {item.category && (
            <Badge variant="outline" className="text-purple-300 border-purple-300/30 text-xs">
              {item.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 text-sm">{item.description}</p>
        {item.video && (
          <p className="text-slate-500 text-xs mt-2">Source: {item.video.title}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FrameworkCard({ item }: { item: KnowledgeItem }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base">{item.name}</CardTitle>
          {item.category && (
            <Badge variant="outline" className="text-blue-300 border-blue-300/30 text-xs">
              {item.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 text-sm">{item.description}</p>
        {item.steps && (
          <p className="text-purple-300 text-sm mt-2 font-mono">{item.steps}</p>
        )}
        {item.video && (
          <p className="text-slate-500 text-xs mt-2">Source: {item.video.title}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BeliefCard({ item }: { item: KnowledgeItem }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-4">
        <p className="text-white text-sm italic">&ldquo;{item.belief}&rdquo;</p>
        {item.context && (
          <p className="text-slate-400 text-xs mt-2">{item.context}</p>
        )}
        {item.video && (
          <p className="text-slate-500 text-xs mt-2">Source: {item.video.title}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ExampleCard({ item }: { item: KnowledgeItem }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div>
            <span className="text-slate-500 text-xs uppercase">Scenario</span>
            <p className="text-slate-300 text-sm">{item.scenario}</p>
          </div>
          <div>
            <span className="text-slate-500 text-xs uppercase">Response</span>
            <p className="text-green-300 text-sm">{item.response}</p>
          </div>
          {item.principle && (
            <Badge variant="outline" className="text-purple-300 border-purple-300/30 text-xs">
              {item.principle}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VideoCard({ item }: { item: KnowledgeItem }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{item.title}</p>
          <Badge
            variant="outline"
            className={`text-xs mt-1 ${
              (item as unknown as { processed: boolean }).processed
                ? "text-green-300 border-green-300/30"
                : "text-yellow-300 border-yellow-300/30"
            }`}
          >
            {(item as unknown as { processed: boolean }).processed ? "Processed" : "Pending"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
