CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`case_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`committed_at` text NOT NULL,
	`completed_at` text,
	`original_responses` text NOT NULL,
	`revision_responses` text,
	`evaluation` text,
	`evaluator_mode` text
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_owner_committed` ON `attempts` (`owner_id`,`committed_at`);--> statement-breakpoint
CREATE INDEX `idx_attempts_owner_status` ON `attempts` (`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `decision_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'private' NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cards_attempt` ON `decision_cards` (`attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cards_slug` ON `decision_cards` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_cards_owner_created` ON `decision_cards` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `skill_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`dimension` text NOT NULL,
	`rating` text NOT NULL,
	`rationale` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_skill_attempt_dimension` ON `skill_observations` (`attempt_id`,`dimension`);--> statement-breakpoint
CREATE INDEX `idx_skill_owner_dimension` ON `skill_observations` (`owner_id`,`dimension`);--> statement-breakpoint
CREATE TABLE `source_ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`status` text NOT NULL,
	`item_count` integer NOT NULL,
	`candidates` text NOT NULL,
	`fetched_at` text NOT NULL,
	`error_class` text
);
--> statement-breakpoint
CREATE INDEX `idx_ingestion_owner_fetched` ON `source_ingestion_runs` (`owner_id`,`fetched_at`);