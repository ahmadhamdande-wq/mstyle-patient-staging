CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`dob` text NOT NULL,
	`husband` text NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `patients_owner` ON `patients` (`owner`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`patient` text NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `revisions_patient_owner` ON `revisions` (`patient`,`owner`);