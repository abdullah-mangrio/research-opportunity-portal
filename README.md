# University Research Opportunity Portal

Web app for faculty to post and manage research opportunities (CRUD).
**Stack:** Node.js + Express (REST API), MySQL, plain HTML/CSS/JavaScript frontend (served by the same Express server).

**GitHub Repository:** https://github.com/abdullah-mangrio/research-opportunity-portal

## Project structure
```
backend/    Express API (server.js, db.js, routes/opportunities.js, .env.example)
frontend/   index.html, style.css, app.js
database/   schema.sql
postman/    Research_Portal.postman_collection.json
```

## Setup & run (Ubuntu / Linux)
1. Install Node.js (LTS) and MySQL: `sudo apt install mysql-server`
2. Create the database and table: `sudo mysql < database/schema.sql`
3. Create a DB user (choose your own password):
   ```
   sudo mysql -e "CREATE USER 'portal'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD'; GRANT ALL ON research_portal.* TO 'portal'@'localhost'; FLUSH PRIVILEGES;"
   ```
4. Configure environment:
   ```
   cd backend
   cp .env.example .env      # then edit .env and set DB_PASSWORD
   ```
5. Install and start:
   ```
   npm install
   npm start
   ```
6. Open **http://localhost:3000** (frontend). API base: `http://localhost:3000/api/opportunities`

Windows: install Node.js and MySQL, run `database/schema.sql` in MySQL Workbench/CLI, create the user the same way, then steps 4-6 (use `copy .env.example .env`).

## API
| Method | Endpoint | Description | Success |
|---|---|---|---|
| POST | /api/opportunities | Create | 201 |
| GET | /api/opportunities | List all | 200 |
| GET | /api/opportunities/:id | Get one | 200 |
| PUT | /api/opportunities/:id | Update (send only fields to change, e.g. `{"status":"Closed"}`) | 200 |
| DELETE | /api/opportunities/:id | Delete | 200 |

Errors: `400` invalid/missing data or bad ID, `404` not found, `500` server error.

Fields: `title, description, research_area, faculty_name, department, required_skills, available_positions (1-1000), application_deadline (YYYY-MM-DD), status (Open|Closed, default Open)`.

## Testing with Postman
Import `postman/Research_Portal.postman_collection.json` and run the requests in order (1-10). Variable `baseUrl` defaults to `http://localhost:3000`.

## Security
No credentials are committed. `.env` is git-ignored; use `.env.example` as a template.
