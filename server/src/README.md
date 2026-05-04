# Backend Domain-Driven Architecture

This directory (`src`) contains the new Domain-Driven structure for the backend API. 
The goal of this architecture is to separate concerns by domain/feature, making the codebase scalable and easier to maintain.

## Folder Structure

- `/api`: Contains all the domain-specific modules. Each domain folder (e.g., `auth`, `courses`) should have its own:
  - `*.routes.js`: Express route definitions.
  - `*.controller.js`: Request/Response handling.
  - `*.service.js`: Core business logic.
  - `*.model.js`: Mongoose database schemas.
- `/config`: Configuration files for database, cloud storage, environment variables.
- `/middlewares`: Global Express middlewares (e.g., error handling, authentication guards).
- `/services`: Third-party integration services (e.g., GCP Storage, Nodemailer, Razorpay).
- `/utils`: Shared helper functions, constants, and utilities.

## Migration Steps

To migrate the existing monolith to this new structure:

1. **Move Configurations:** Move database and GCP setup scripts from the root `server` folder to `src/config/`.
2. **Move Models:** Move all models from `models/` into their respective domains in `src/api/<domain>/`.
3. **Split Services/Controllers:** Break down large files like `auth-service.js` and `subscription-service.js` into smaller controllers and services within their domain folders.
4. **Update Routes:** Update `server.js` to point to the new route files in `src/api/<domain>/*.routes.js`.
