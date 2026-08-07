CREATE TABLE `candidate_pool_sync_state` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`last_synced_at` text NOT NULL,
	`etag_url` text,
	`etag` text
);
--> statement-breakpoint
CREATE TABLE `candidate_product_pool` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`source_item_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`source_name` text NOT NULL,
	`published_at` text,
	`discovered_at` text NOT NULL,
	`ai_hot_url` text NOT NULL,
	`original_url` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`fit_score` integer NOT NULL,
	`fit_dimensions` text NOT NULL,
	`fit_reason` text NOT NULL,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`selected_at` text,
	`completed_at` text,
	`failure_class` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_pool_owner_source` ON `candidate_product_pool` (`owner_id`,`source_item_id`);--> statement-breakpoint
CREATE INDEX `idx_pool_owner_status_fit` ON `candidate_product_pool` (`owner_id`,`status`,`fit_score`);--> statement-breakpoint
CREATE INDEX `idx_pool_owner_discovered` ON `candidate_product_pool` (`owner_id`,`discovered_at`);