import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_created_at").on(table.createdAt),
    pgPolicy("Users can view own profile", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`auth.uid()::text = id`,
    }),
    pgPolicy("Users can update own profile", {
      as: "permissive",
      for: "update",
      to: authenticatedRole,
      using: sql`auth.uid()::text = id`,
      withCheck: sql`auth.uid()::text = id`,
    }),
  ]
);

// Zod Schemas
export const selectUserSchema = createSelectSchema(users, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = selectUserSchema
  .omit({ createdAt: true })
  .partial()
  .required({ id: true });

// Types
export type SelectUser = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
