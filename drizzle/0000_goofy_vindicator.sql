CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"refresh_token" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"email_verification_token" varchar(255),
	"reset_password_token" varchar(255),
	"reset_password_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
