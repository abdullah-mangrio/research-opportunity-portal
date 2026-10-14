-- Research Opportunity Portal - database setup
-- Run with:  sudo mysql < database/schema.sql
CREATE DATABASE IF NOT EXISTS research_portal;
USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(255)  NOT NULL,
  description           TEXT          NOT NULL,
  research_area         VARCHAR(255)  NOT NULL,
  faculty_name          VARCHAR(255)  NOT NULL,
  department            VARCHAR(255)  NOT NULL,
  required_skills       VARCHAR(1000) NOT NULL,
  available_positions   INT           NOT NULL CHECK (available_positions >= 1),
  application_deadline  DATE          NOT NULL,
  status                ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
