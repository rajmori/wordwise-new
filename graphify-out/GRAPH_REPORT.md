# Graph Report - .  (2026-06-16)

## Corpus Check
- 205 files · ~102,869 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 151 nodes · 112 edges · 55 communities (14 shown, 41 thin omitted)
- Extraction: 58% EXTRACTED · 42% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Razorpay Payment & Pricing|Razorpay Payment & Pricing]]
- [[_COMMUNITY_Auth & Admin Security|Auth & Admin Security]]
- [[_COMMUNITY_Course Access & Orders|Course Access & Orders]]
- [[_COMMUNITY_Subscriptions & Scheduling|Subscriptions & Scheduling]]
- [[_COMMUNITY_Express Server & MongoDB|Express Server & MongoDB]]
- [[_COMMUNITY_GCP Media Upload|GCP Media Upload]]
- [[_COMMUNITY_Google OAuth & Email|Google OAuth & Email]]
- [[_COMMUNITY_Webhook & Subscription API|Webhook & Subscription API]]
- [[_COMMUNITY_Frontend (Vanilla + Next.js)|Frontend (Vanilla + Next.js)]]
- [[_COMMUNITY_Admin Panel UI|Admin Panel UI]]
- [[_COMMUNITY_Cloudflare Deployment|Cloudflare Deployment]]
- [[_COMMUNITY_Flash Cards Feature|Flash Cards Feature]]
- [[_COMMUNITY_Quiz Management|Quiz Management]]
- [[_COMMUNITY_Integration Test Suite|Integration Test Suite]]
- [[_COMMUNITY_Railway Deployment|Railway Deployment]]
- [[_COMMUNITY_Lesson Management|Lesson Management]]
- [[_COMMUNITY_Course Editor UI|Course Editor UI]]
- [[_COMMUNITY_Admin Flash Cards UI|Admin Flash Cards UI]]
- [[_COMMUNITY_Next.js App Layout|Next.js App Layout]]
- [[_COMMUNITY_Client Agent Config|Client Agent Config]]
- [[_COMMUNITY_Contact Page|Contact Page]]
- [[_COMMUNITY_Contact Controller|Contact Controller]]
- [[_COMMUNITY_Profile Controller|Profile Controller]]
- [[_COMMUNITY_Course Navigation (Next)|Course Navigation (Next)]]
- [[_COMMUNITY_Course Navigation (Prev)|Course Navigation (Prev)]]
- [[_COMMUNITY_Course Video Lookup|Course Video Lookup]]
- [[_COMMUNITY_Deployment Docs|Deployment Docs]]
- [[_COMMUNITY_Deployment Guide|Deployment Guide]]
- [[_COMMUNITY_Direct Checkout|Direct Checkout]]
- [[_COMMUNITY_Features Page|Features Page]]
- [[_COMMUNITY_Debug Middleware|Debug Middleware]]
- [[_COMMUNITY_Quiz Model|Quiz Model]]
- [[_COMMUNITY_Reset Token Model|Reset Token Model]]
- [[_COMMUNITY_My Course Page|My Course Page]]
- [[_COMMUNITY_Session Navigation|Session Navigation]]
- [[_COMMUNITY_PPT Viewer|PPT Viewer]]
- [[_COMMUNITY_User Profile Page|User Profile Page]]
- [[_COMMUNITY_File SVG Icon|File SVG Icon]]
- [[_COMMUNITY_Globe SVG Icon|Globe SVG Icon]]
- [[_COMMUNITY_Window SVG Icon|Window SVG Icon]]
- [[_COMMUNITY_Razorpay Setup Guide|Razorpay Setup Guide]]
- [[_COMMUNITY_Razorpay Test Mode|Razorpay Test Mode]]
- [[_COMMUNITY_Project README|Project README]]
- [[_COMMUNITY_Contact Routes|Contact Routes]]
- [[_COMMUNITY_Profile Routes|Profile Routes]]
- [[_COMMUNITY_Admin Auth README|Admin Auth README]]
- [[_COMMUNITY_Server README|Server README]]
- [[_COMMUNITY_Subscription Service|Subscription Service]]
- [[_COMMUNITY_Admin Session Tests|Admin Session Tests]]
- [[_COMMUNITY_Flash Cards Tests|Flash Cards Tests]]
- [[_COMMUNITY_Password Reset Tests|Password Reset Tests]]
- [[_COMMUNITY_Quiz API Tests|Quiz API Tests]]
- [[_COMMUNITY_Frontend Package|Frontend Package]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Vocab Seed Data|Vocab Seed Data]]

## God Nodes (most connected - your core abstractions)
1. `Razorpay Payment Gateway` - 11 edges
2. `JWT Authentication` - 9 edges
3. `Server Package (Node.js Backend)` - 8 edges
4. `Express App (WordWise Server)` - 7 edges
5. `GCP Storage Upload` - 6 edges
6. `Auth Middleware (Admin JWT)` - 5 edges
7. `User Model (Mongoose)` - 5 edges
8. `User Auth Controller` - 4 edges
9. `Course Model (Mongoose)` - 4 edges
10. `Course Routes` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Vercel Logo (SVG)` --semantically_similar_to--> `Cloudflare Pages Deployment`  [INFERRED] [semantically similar]
  client/public/vercel.svg → CLOUDFLARE_DEPLOY.md
- `Admin Session Management README` --references--> `Auth Middleware (Admin JWT)`  [INFERRED]
  admin/SESSION_MANAGEMENT_README.md → server/middleware/auth.js
- `User Login Page` --references--> `JWT Authentication`  [INFERRED]
  login.html → server/middleware/auth.js
- `User Session Management` --references--> `JWT Authentication`  [INFERRED]
  USER_SESSION_MANAGEMENT.md → server/middleware/auth.js
- `Dynamic Pricing / Plan Management` --conceptually_related_to--> `Razorpay Payment Gateway`  [INFERRED]
  DYNAMIC_PRICING_FEATURE.md → server/controllers/subscriptionController.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MVC Pattern: Controller-Model-Route** — controllers_coursecontroller_coursecontroller, models_course_coursemodel, controllers_admincontroller_admincontroller [INFERRED 0.95]
- **Authentication System** — middleware_auth_authmiddleware, middleware_userauth_userauthmiddleware, concept_jwt_authentication, controllers_authcontroller_authcontroller [INFERRED 0.95]
- **Mongoose Data Models** — models_user_model_usermodel, models_course_coursemodel, models_lesson_lessonmodel, models_subscription_subscriptionmodel, models_quiz_quizmodel [EXTRACTED 1.00]
- **User-Facing Frontend Pages** — index_homepage, dashboard_userdashboard, login_loginpage, my_courses_mycoursespage, subscription_subscriptionpage [INFERRED 0.95]

## Communities (55 total, 41 thin omitted)

### Community 0 - "Razorpay Payment & Pricing"
Cohesion: 0.15
Nodes (13): Dynamic Pricing / Plan Management, Razorpay Payment Gateway, Stripe Payment (Legacy), Create Razorpay Plan, Dynamic Pricing Feature, Payment Page, Razorpay Integration Complete Guide, Test: Razorpay Integration (+5 more)

### Community 1 - "Auth & Admin Security"
Cohesion: 0.20
Nodes (12): Admin Session Management README, JWT Authentication, Admin Controller, User Login Page, Auth Middleware (Admin JWT), User Auth Middleware (JWT), Auth Middleware (New Style), Admin Model (Mongoose) (+4 more)

### Community 2 - "Course Access & Orders"
Cohesion: 0.17
Nodes (12): Subscription Access Control, Course Controller, Course Order Controller, User Dashboard Page, Check Subscription Access Middleware, Counter Model (Auto-increment), Course Model (Mongoose), Course Order Model (+4 more)

### Community 3 - "Subscriptions & Scheduling"
Cohesion: 0.20
Nodes (10): Annual Subscription Plan, Cron Job Scheduler, Flash Card Model, Login Log Model, Refresh Token Model, Subscription Model, User Model (Mongoose), node-cron Dependency (+2 more)

### Community 4 - "Express Server & MongoDB"
Cohesion: 0.20
Nodes (10): Express.js Server, MongoDB Database, Upload Middleware (Multer), MongoDB Setup Guide, Express.js Dependency, jsonwebtoken Dependency, Mongoose ODM Dependency, Multer File Upload Dependency (+2 more)

### Community 5 - "GCP Media Upload"
Cohesion: 0.22
Nodes (10): GCP Storage Upload, Video Upload (GCP Signed URL), Upload Controller, GCP Workload Identity Federation Setup, Upload Routes, GCP Setup Guide (Server), @google-cloud/storage Dependency, Test: GCP Upload (+2 more)

### Community 6 - "Google OAuth & Email"
Cohesion: 0.22
Nodes (9): Google OAuth 2.0 Login, Email via Nodemailer/SMTP, Contact Form Email Setup, User Auth Controller, Google Auth Integration Guide, Google OAuth Implementation, User Routes, Nodemailer Dependency (+1 more)

### Community 7 - "Webhook & Subscription API"
Cohesion: 0.22
Nodes (9): Webhook Signature Verification, Auth Controller, Handle Webhook (Razorpay), Subscription Controller, Auth Routes, Subscription Routes, Express App (WordWise Server), Webhook Setup Success (+1 more)

### Community 8 - "Frontend (Vanilla + Next.js)"
Cohesion: 0.40
Nodes (5): Client README (Next.js), Next.js Client (React), Vanilla HTML/JS Frontend, Home Page (Landing), Next.js Logo (SVG)

### Community 9 - "Admin Panel UI"
Cohesion: 0.50
Nodes (4): Courses Dashboard (Admin), Admin Dashboard, Admin Login Page, Admin Panel

### Community 10 - "Cloudflare Deployment"
Cohesion: 0.50
Nodes (4): Cloudflare Deploy Guide, Cloudflare Deployment Guide (Detailed), Cloudflare Pages Deployment, Vercel Logo (SVG)

### Community 11 - "Flash Cards Feature"
Cohesion: 0.50
Nodes (4): Flash Card Controller, User Flash Cards Page, Flash Card Routes, Test: Bulk Upload

### Community 12 - "Quiz Management"
Cohesion: 0.67
Nodes (3): Quiz Management Admin Page, Quiz Controller, Quiz Routes

### Community 13 - "Integration Test Suite"
Cohesion: 0.67
Nodes (3): Integration Test Suite, Test: Auth Flow (Antigravity), Testing Guide

## Knowledge Gaps
- **98 isolated node(s):** `RootLayout`, `getVideoById`, `getNextVideo`, `getPreviousVideo`, `initPPTViewer` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Server Package (Node.js Backend)` connect `Express Server & MongoDB` to `Subscriptions & Scheduling`, `GCP Media Upload`, `Google OAuth & Email`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `Express App (WordWise Server)` connect `Webhook & Subscription API` to `Auth & Admin Security`, `Course Access & Orders`, `Express Server & MongoDB`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Razorpay Payment Gateway` connect `Razorpay Payment & Pricing` to `Express Server & MongoDB`, `Webhook & Subscription API`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Razorpay Payment Gateway` (e.g. with `Dynamic Pricing / Plan Management` and `Payment Page`) actually correct?**
  _`Razorpay Payment Gateway` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `JWT Authentication` (e.g. with `User Auth Controller` and `User Login Page`) actually correct?**
  _`JWT Authentication` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RootLayout`, `getVideoById`, `getNextVideo` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._