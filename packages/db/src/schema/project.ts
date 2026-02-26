import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const project = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  repoName: text("repo_name"),
  repoUrl: text("repo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
