import { prisma } from "./prisma";
import { generateEmbedding } from "./gemini";

export async function searchSimilar(
  table: string,
  query: string,
  limit: number = 5,
  userId?: string
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;

  let whereClause = "";
  if (userId && (table === "memories" || table === "reflections")) {
    whereClause = `WHERE "userId" = '${userId}'`;
  }

  const contentField = getContentField(table);

  const results = await prisma.$queryRawUnsafe<
    Array<{ id: string; content: string; similarity: number }>
  >(
    `SELECT id, ${contentField} as content, 
     1 - (embedding <=> '${vectorStr}'::vector) as similarity
     FROM "${table}" 
     ${whereClause}
     ${whereClause ? "AND" : "WHERE"} embedding IS NOT NULL
     ORDER BY embedding <=> '${vectorStr}'::vector
     LIMIT ${limit}`
  );

  return results;
}

function getContentField(table: string): string {
  switch (table) {
    case "transcript_chunks":
      return '"content"';
    case "principles":
      return 'CONCAT("title", \': \', "description")';
    case "frameworks":
      return 'CONCAT("name", \': \', "description")';
    case "beliefs":
      return '"belief"';
    case "examples":
      return 'CONCAT("scenario", \' -> \', "response")';
    case "memories":
      return '"content"';
    default:
      return '"content"';
  }
}

export async function storeEmbedding(
  table: string,
  id: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text);
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET embedding = '${vectorStr}'::vector WHERE id = '${id}'`
  );
}
