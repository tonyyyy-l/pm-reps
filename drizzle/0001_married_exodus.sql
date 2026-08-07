CREATE TABLE `generated_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`source_item_id` text NOT NULL,
	`status` text NOT NULL,
	`public_case` text NOT NULL,
	`reveal` text NOT NULL,
	`review` text NOT NULL,
	`source_quotes` text NOT NULL,
	`generator_version` text NOT NULL,
	`reviewer_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_generated_owner_case` ON `generated_cases` (`owner_id`,`case_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_generated_owner_source` ON `generated_cases` (`owner_id`,`source_item_id`);--> statement-breakpoint
CREATE INDEX `idx_generated_owner_status_created` ON `generated_cases` (`owner_id`,`status`,`created_at`);