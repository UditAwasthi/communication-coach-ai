import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id },
    orderBy: { importanceScore: "desc" },
  });

  return Response.json({ memories });
}
