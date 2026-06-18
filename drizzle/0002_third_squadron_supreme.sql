CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"ram" varchar(50),
	"storage" varchar(50),
	"price" integer DEFAULT 0 NOT NULL,
	"original_price" integer DEFAULT 0 NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100) NOT NULL,
	"is_refurbished" boolean DEFAULT false NOT NULL,
	"image" varchar(1000) NOT NULL,
	"base_price" integer DEFAULT 0 NOT NULL,
	"original_base_price" integer DEFAULT 0 NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"attributes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enable_variants" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;