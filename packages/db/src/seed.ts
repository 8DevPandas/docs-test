import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, isNull, and } from "drizzle-orm";

import * as schema from "./schema";

const { project, chat, document } = schema;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const db = drizzle(databaseUrl, { schema });

  console.log("Seeding database...");

  // 1. Create default "tandem" project if it doesn't exist
  const [existing] = await db
    .select()
    .from(project)
    .where(eq(project.slug, "tandem"));

  let tandemProject = existing;

  if (!tandemProject) {
    const [created] = await db
      .insert(project)
      .values({ slug: "tandem", name: "Tandem Docs" })
      .returning();
    tandemProject = created!;
    console.log(`Created project: ${tandemProject.name} (${tandemProject.id})`);
  } else {
    console.log(`Project already exists: ${tandemProject.name} (${tandemProject.id})`);
  }

  // 2. Backfill existing chats that have no projectId
  const result = await db
    .update(chat)
    .set({ projectId: tandemProject.id })
    .where(isNull(chat.projectId))
    .returning({ id: chat.id });

  if (result.length > 0) {
    console.log(`Backfilled ${result.length} chats with projectId`);
  } else {
    console.log("No chats need backfilling");
  }

  // 3. Seed docs from DOCS/ directory into document table
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const docsDir = path.join(__dirname, "../../../DOCS");
  try {
    const files = await fs.readdir(docsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    let seededCount = 0;
    for (let i = 0; i < mdFiles.length; i++) {
      const file = mdFiles[i]!;
      const slug = file.replace(/\.md$/, "");
      const content = await fs.readFile(path.join(docsDir, file), "utf-8");

      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1]!.trim() : slug;

      // Extract description from first paragraph after title
      const lines = content.split("\n");
      let description = "";
      let foundTitle = false;
      for (const line of lines) {
        if (!foundTitle && line.startsWith("# ")) {
          foundTitle = true;
          continue;
        }
        if (foundTitle && line.trim() && !line.startsWith("#")) {
          description = line.trim();
          break;
        }
      }

      // Upsert: update if exists, insert if not
      const [existingDoc] = await db
        .select()
        .from(document)
        .where(and(eq(document.projectId, tandemProject.id), eq(document.slug, slug)));

      if (existingDoc) {
        await db
          .update(document)
          .set({ title, content, description, sortOrder: i })
          .where(eq(document.id, existingDoc.id));
      } else {
        await db.insert(document).values({
          projectId: tandemProject.id,
          slug,
          title,
          content,
          description,
          sortOrder: i,
        });
      }
      seededCount++;
    }

    console.log(`Seeded ${seededCount} documents from DOCS/`);
  } catch (e) {
    console.log("No DOCS/ directory found, skipping document seeding");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
