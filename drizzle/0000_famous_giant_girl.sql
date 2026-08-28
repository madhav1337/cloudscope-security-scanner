CREATE TABLE `scans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`target` text NOT NULL,
	`hostname` text NOT NULL,
	`score` integer NOT NULL,
	`grade` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`policy_version` integer DEFAULT 1 NOT NULL,
	`report_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scans_user_created_idx` ON `scans` (`user_email`,`created_at`);