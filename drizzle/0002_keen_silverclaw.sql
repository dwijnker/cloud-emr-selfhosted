CREATE TABLE `intakeChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicalIntakeId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('question','response','symptom_collected','history_collected') DEFAULT 'response',
	`extractedData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intakeChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intakeSymptoms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicalIntakeId` int NOT NULL,
	`symptom` varchar(255) NOT NULL,
	`severity` enum('mild','moderate','severe') DEFAULT 'moderate',
	`duration` varchar(255),
	`onset` varchar(255),
	`associatedFactors` text,
	`relievingFactors` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intakeSymptoms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalIntakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`intakeDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('in_progress','completed','reviewed') DEFAULT 'in_progress',
	`chiefComplaint` text,
	`presentingProblem` text,
	`symptomOnset` varchar(255),
	`symptomSeverity` enum('mild','moderate','severe'),
	`associatedSymptoms` json,
	`medicalHistory` text,
	`surgicalHistory` text,
	`familyHistory` text,
	`socialHistory` text,
	`allergies` text,
	`currentMedications` json,
	`reviewedBy` varchar(255),
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalIntakes_id` PRIMARY KEY(`id`)
);
