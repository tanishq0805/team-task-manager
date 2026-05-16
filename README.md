========================================================================
                      PROJECT: TEAM TASK MANAGER
========================================================================

Author: Tanishq Singh
Tech Stack: MERN (MongoDB, Express.js, React.js, Node.js), Tailwind CSS
Live Deployment URL: https://affectionate-recreation-production-4db2.up.railway.app
Backend Server URL: https://team-task-manager-production-58d4.up.railway.app

------------------------------------------------------------------------
1. PROJECT OVERVIEW
------------------------------------------------------------------------
A fully functional, role-based Team Task Management web application built using the MERN architecture. The system provides a dynamic Kanban board interface split into three distinct workflow tracks: "To Do", "In Progress", and "Done". It incorporates full database persistence, CORS preflight compatibility, and absolute cross-route environment safety.

------------------------------------------------------------------------
2. CORE FEATURES
------------------------------------------------------------------------
* User Authentication & Session Security: Integrated JWT token authentication mapped dynamically to the browser's localStorage lifecycle.
* Role-Based Access Control (RBAC): Strict rendering boundaries. Users registered under the "Admin" tier gain a split management control panel to initialize parent Project Containers and allocate individual Tasks, while standard "User" tiers consume and update status flows.
* Live MongoDB Atlas Integration: Connected directly via optimized Mongoose promise schemas using multi-shard connection streams.
* Dynamic State Redirection: Interactive client-side routing via React Router DOM. 
* Fluid Task Progression: Immediate database updates across standard workflow lanes via optimized RESTful endpoints.

------------------------------------------------------------------------
3. FRONTEND ARCHITECTURE & CONFIGURATION
------------------------------------------------------------------------
* App.jsx: Establishes global application routing, catch-all fallback redirections, and navigation structures.
* Navbar.jsx: Handles modular workspace routing hooks.
* Login.jsx & Register.jsx: Modular credential gateways wired directly to look for system environment variables via 'import.meta.env.VITE_API_URL'.
* Dashboard.jsx: The central Kanban core. Filters data into target layout tracking tables, maps state changes immediately, and isolates admin-only asset creation fields.

------------------------------------------------------------------------
4. BACKEND ARCHITECTURE & ENDPOINTS
------------------------------------------------------------------------
* server.js: Configures the core Express application layer, unified global CORS middleware rules, and JSON request parsers.
* auth.js: Exposes strict password encryption mechanics via bcryptjs hashing algorithms and signed JWT state profiles.
  - POST /api/auth/register : Registers credentials directly matching structural case requirements ('Admin' / 'User').
  - POST /api/auth/login : Safely executes credential comparison checks and fires back token payloads.
* Database Collections: Users, Projects, and Tasks collections organized under tight relational configurations.

------------------------------------------------------------------------
5. LOCAL ENVIRONMENT CONFIGURATION SETUP
------------------------------------------------------------------------
Backend .env File Config:
PORT=5000
MONGO_URI=[Your Atlas Shard Connection URI]
JWT_SECRET=super_secret_key_change_this_later

Frontend .env File Config:
VITE_API_URL=https://team-task-manager-production-58d4.up.railway.app
========================================================================
