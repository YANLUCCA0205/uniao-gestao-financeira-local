CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`before` text,
	`after` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_record` ON `audit` (`record_id`);--> statement-breakpoint
CREATE TABLE `balances` (
	`record_id` text PRIMARY KEY NOT NULL,
	`remaining` integer NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`stores` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`store` text NOT NULL,
	`date` text NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_records_kind_date` ON `records` (`kind`,`date`);--> statement-breakpoint
CREATE INDEX `idx_records_store_date` ON `records` (`store`,`date`);--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`account` text NOT NULL,
	`note` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_settlements_record` ON `settlements` (`record_id`);