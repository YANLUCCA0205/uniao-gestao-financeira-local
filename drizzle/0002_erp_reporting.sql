CREATE TABLE `erp_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`store` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`source_filename` text NOT NULL,
	`state` text DEFAULT 'Importando' NOT NULL,
	`active` integer DEFAULT 0 NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL,
	`amount_total` integer DEFAULT 0 NOT NULL,
	`settled_total` integer DEFAULT 0 NOT NULL,
	`imported_by` text NOT NULL,
	`imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_erp_imports_scope` ON `erp_imports` (`kind`,`store`,`period_start`,`period_end`,`active`);
--> statement-breakpoint
CREATE INDEX `idx_erp_imports_date` ON `erp_imports` (`period_start`,`period_end`);
--> statement-breakpoint
CREATE TABLE `erp_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL REFERENCES `erp_imports`(`id`),
	`external_id` text NOT NULL,
	`due_date` text NOT NULL,
	`paid_date` text,
	`name` text NOT NULL,
	`document` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`amount` integer NOT NULL,
	`settled` integer DEFAULT 0 NOT NULL,
	`remaining` integer NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_erp_rows_unique` ON `erp_rows` (`import_id`,`external_id`);
--> statement-breakpoint
CREATE INDEX `idx_erp_rows_due` ON `erp_rows` (`import_id`,`due_date`);
--> statement-breakpoint
CREATE INDEX `idx_erp_rows_paid` ON `erp_rows` (`import_id`,`paid_date`);
--> statement-breakpoint
CREATE TABLE `erp_closings` (
	`id` text PRIMARY KEY NOT NULL,
	`store` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`title` text NOT NULL,
	`note` text NOT NULL,
	`payload` text NOT NULL,
	`source_imports` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_erp_closings_period` ON `erp_closings` (`store`,`period_start`,`period_end`,`created_at`);
