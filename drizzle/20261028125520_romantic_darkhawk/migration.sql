CREATE TABLE `roles` (
	`slug` text PRIMARY KEY,
	`name` text NOT NULL,
	`email_template` text NOT NULL,
	`email_subject` text NOT NULL,
	`skills` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `job_post_classifications` ADD `recommendedRole` text NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_outreach_handoffs` (
	`id` text PRIMARY KEY,
	`run_id` text NOT NULL,
	`instructions` text NOT NULL,
	`acceptance_criteria` text NOT NULL,
	`status` text DEFAULT 'pending',
	`report_back` text,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_outreach_handoffs_run_id_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_outreach_handoffs_parent_id_outreach_handoffs_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `outreach_handoffs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_outreach_handoffs`(`id`, `run_id`, `instructions`, `acceptance_criteria`, `status`, `report_back`, `parent_id`, `created_at`, `updated_at`) SELECT `id`, `run_id`, `instructions`, `acceptance_criteria`, `status`, `report_back`, `parent_id`, `created_at`, `updated_at` FROM `outreach_handoffs`;--> statement-breakpoint
DROP TABLE `outreach_handoffs`;--> statement-breakpoint
ALTER TABLE `__new_outreach_handoffs` RENAME TO `outreach_handoffs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `job_post_classifications` DROP COLUMN `recommendedResume`;