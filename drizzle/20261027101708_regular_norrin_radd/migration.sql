CREATE TABLE `email_threads` (
	`thread_id` text PRIMARY KEY,
	`run_id` text NOT NULL,
	`recipient` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_email_threads_run_id_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `job_post_classifications` (
	`run_id` text PRIMARY KEY,
	`classification` text NOT NULL,
	`confidence` integer NOT NULL,
	`recommendedResume` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_job_post_classifications_run_id_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_sessions` (
	`provider` text PRIMARY KEY,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`scope` text NOT NULL,
	`token_type` text NOT NULL,
	`refresh_token_expires_in` integer,
	`expiry_date` integer
);
--> statement-breakpoint
CREATE TABLE `outreach_handoffs` (
	`id` text PRIMARY KEY,
	`run_id` text,
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
CREATE TABLE `runs` (
	`id` text PRIMARY KEY,
	`post` text NOT NULL,
	`posted_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
