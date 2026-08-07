CREATE TABLE `evaluation_disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`dimension` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dispute_attempt_dimension` ON `evaluation_disputes` (`attempt_id`,`dimension`);--> statement-breakpoint
CREATE INDEX `idx_dispute_owner_status` ON `evaluation_disputes` (`owner_id`,`status`);--> statement-breakpoint
DROP INDEX `idx_skill_attempt_dimension`;--> statement-breakpoint
ALTER TABLE `skill_observations` ADD `signal_type` text DEFAULT 'first_pass' NOT NULL;--> statement-breakpoint
ALTER TABLE `skill_observations` ADD `confidence` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `skill_observations` ADD `difficulty` text DEFAULT 'structured' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_skill_attempt_dimension_signal` ON `skill_observations` (`attempt_id`,`dimension`,`signal_type`);--> statement-breakpoint
ALTER TABLE `attempts` ADD `revision_evaluation` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `revision_evaluator_mode` text;--> statement-breakpoint
ALTER TABLE `candidate_product_pool` ADD `source_preflight_at` text;