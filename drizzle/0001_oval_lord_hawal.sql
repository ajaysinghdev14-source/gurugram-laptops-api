ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'USER';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(50) DEFAULT 'ACTIVE';