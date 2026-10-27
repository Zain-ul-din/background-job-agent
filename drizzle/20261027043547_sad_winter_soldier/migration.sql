CREATE TABLE `oauth_sessions` (
	`provider` text PRIMARY KEY,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`scope` text NOT NULL,
	`token_type` text NOT NULL,
	`refresh_token_expires_in` integer,
	`expiry_date` integer
);
