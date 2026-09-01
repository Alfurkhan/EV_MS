# E-Vidyalaya

**E-Vidyalaya** is a microservices-based School Management System currently under development. It is designed to provide separate functionality for **Students, Faculty, and Administrators**, with a React frontend and Spring Boot backend services.

The current implementation includes role-based authentication, email OTP verification during registration, Terms & Conditions acceptance, password reset through OTP, profile management, role-aware login validation, and service discovery through HashiCorp Consul.

---

## 📌 Project Overview

E-Vidyalaya is organized as a set of backend services behind an API Gateway, with a React + TypeScript frontend communicating through the gateway.

### Current user roles

- Student
- Faculty
- Admin

### Current authentication capabilities

- Email-based registration
- Registration OTP verification
- Duplicate email detection with the registered role
- Password validation
- Terms & Conditions acceptance during registration
- JWT-based authentication
- Refresh tokens
- Role-based login validation
- Forgot Password using email OTP
- Password reset using a temporary reset token
- Logout and protected frontend routes
- Role-protected pages

### Current profile capabilities

- View profile information
- Edit full name
- Edit country code
- Edit mobile number
- Dynamic role display
- Account status display
- Combined profile activity information

---

# 🏗️ Architecture

```text
                         ┌─────────────────────────┐
                         │        Frontend         │
                         │   React + TypeScript    │
                         │          Vite           │
                         │        :5179            │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      API Gateway        │
                         │  Spring Cloud Gateway   │
                         │         :9095           │
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                     ▼                ▼                ▼
              ┌────────────┐  ┌────────────┐  ┌────────────┐
              │User Service│  │Email Service│ │   Future   │
              │ Spring Boot│  │ Spring Boot │ │  Services  │
              │   :8080    │  │    :9091    │ │            │
              └─────┬──────┘  └─────────────┘ └────────────┘
                    │
                    ▼
              ┌────────────┐
              │ PostgreSQL │
              │  Database  │
              │    :5432   │
              └────────────┘

                    ▲
                    │
              ┌─────┴──────┐
              │   Consul   │
              │  Service   │
              │  Discovery │
              │ Host :9096 │
              │ App  :8500 │
              └────────────┘
```

### Request flow

The frontend does not normally communicate directly with the User Service. Frontend API requests are sent to the API Gateway, which routes the requests to the appropriate backend service.

```text
Browser
   ↓
React frontend
   ↓
http://localhost:9095
   ↓
API Gateway
   ↓
Target backend service
   ↓
PostgreSQL / Email Service / other resources
```

---

# 🧰 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Axios
- React Router
- Zod
- React Hook Form
- React Hot Toast
- Lucide React
- Tailwind CSS

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Cloud Gateway
- Spring Data JPA
- Spring Cloud Consul Discovery
- JWT Authentication
- Gradle
- Lombok
- RestTemplate
- Spring Mail
- Spring Boot Actuator

## Database

- PostgreSQL
- Liquibase

## Infrastructure

- Docker
- Docker Compose-compatible environment where applicable
- HashiCorp Consul

## Supporting libraries

### User Service

- Spring Web
- Spring Validation
- Spring Security
- Spring Data JPA
- PostgreSQL JDBC Driver
- JWT-related libraries used by the project
- Lombok
- Spring Cloud Consul Discovery

### Email Service

- Spring Boot Web
- Spring Boot Mail
- Spring Boot Actuator
- Spring Cloud Consul Discovery
- Lombok
- `me.paulschwarz:spring-dotenv:4.0.0`

The Email Service uses environment variables for mail credentials so that SMTP credentials are not hard-coded in source files.

---

# 📁 Project Structure

```text
E-Vidyalaya/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── gateway-service/
│   ├── src/
│   ├── build.gradle
│   └── ...
│
├── user-service/
│   ├── src/
│   ├── build.gradle
│   └── ...
│
├── email-service/
│   ├── src/
│   ├── build.gradle
│   ├── .env
│   └── ...
│
├── docs/
│   └── ...
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

> The `.env` file used by the Email Service is intentionally ignored by Git and must be created locally on each development machine.

---

# 🚀 Getting Started

## 1. Prerequisites

Install the following before running the project:

- Git
- Java 21 JDK
- Node.js
- npm
- PostgreSQL
- Docker Desktop
- A GitHub account with access to the E-Vidyalaya repository

### Verify installations

```bash
java -version
node -v
npm -v
git --version
docker --version
```

The backend services use **Gradle**. Use the project's Gradle wrapper/Gradle commands rather than Maven commands.

---

# 2. Clone the Project from GitHub

Clone the organization repository:

```bash
git clone https://github.com/Zunkunft-AI/EV.git
```

Move into the project directory:

```bash
cd EV
```

If the repository is private, your GitHub account must have permission to access it and GitHub authentication may be required.

### Check available branches

```bash
git branch -a
```

To work on the current authentication-development branch:

```bash
git switch --track origin/feature/email-otp-authentication
```

If the branch already exists locally:

```bash
git switch feature/email-otp-authentication
```

Pull the latest changes before running the project:

```bash
git pull
```

---

# 3. PostgreSQL Setup

Install PostgreSQL and make sure the PostgreSQL server is running.

Create the database used by the local development environment:

```text
Database: evidyalaya_dev
Host: localhost
Port: 5432
Username: postgres
Password: postgres
```

These are the local-development values currently documented for the project. Production credentials should be supplied through environment-specific configuration instead of being committed to Git.

Verify that PostgreSQL is running before starting the backend services.

---

# 4. Start Consul

E-Vidyalaya uses **HashiCorp Consul** for service discovery.

The local setup uses Docker and maps Consul's internal HTTP port `8500` to host port `9096`.

### Windows Command Prompt

```cmd
docker run -d ^
  --name consul ^
  -p 9096:8500 ^
  -p 8600:8600/udp ^
  hashicorp/consul:1.21 ^
  agent -dev -client=0.0.0.0
```

If a `consul` container already exists, start it instead of creating another one:

```cmd
docker start consul
```

Check the container:

```cmd
docker ps
```

Open the Consul dashboard:

```text
http://localhost:9096
```

### Important

Start Consul **before** starting services that register with Consul. If Consul is not running, a service may fail to start with an error similar to:

```text
Connect to localhost:8500 failed: Connection refused
```

---

# 5. Email Service Environment Configuration

The Email Service reads Gmail SMTP credentials from environment variables.

The service uses:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
```

Create this file:

```text
email-service/.env
```

Example:

```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-google-app-password
```

Use a **Google App Password**, not your normal Gmail account password, when Gmail SMTP requires it.

The project's `.gitignore` already excludes environment files such as:

```text
.env
.env.*
*.env
```

Therefore:

- Do not commit `email-service/.env`.
- Do not put real credentials in `application.yml`.
- Each developer must create their own local `.env` file.

---

# 6. Start the User Service

Open a terminal at the project root:

```cmd
cd user-service
```

Run the service with Gradle:

```cmd
gradlew bootRun
```

Or from the project root:

```cmd
gradlew :user-service:bootRun
```

The User Service runs on:

```text
http://localhost:8080
```

The User Service connects to PostgreSQL and registers itself with Consul.

---

# 7. Start the Email Service

Open another terminal:

```cmd
cd email-service
```

Run:

```cmd
gradlew bootRun
```

Or from the root:

```cmd
gradlew :email-service:bootRun
```

The Email Service runs on:

```text
http://localhost:9091
```

### Email Service requirements

Before testing registration OTP or Forgot Password:

1. PostgreSQL should be running.
2. Consul should be running.
3. `email-service/.env` must contain valid mail credentials.
4. The Email Service must start without SMTP authentication errors.

---

# 8. Start the API Gateway

Open another terminal:

```cmd
cd gateway-service
```

Run:

```cmd
gradlew bootRun
```

Or from the root:

```cmd
gradlew :gateway-service:bootRun
```

The API Gateway runs on:

```text
http://localhost:9095
```

Frontend API requests are routed through this gateway.

---

# 9. Start the Frontend

Open another terminal:

```cmd
cd frontend
```

Install dependencies:

```cmd
npm install
```

Start the Vite development server:

```cmd
npm run dev
```

The frontend development application is expected to run at:

```text
http://localhost:5179
```

The exact port may be affected by the Vite configuration or an occupied port.

---

# 10. Recommended Startup Order

For a fresh local environment, use this order:

```text
1. PostgreSQL
       ↓
2. Consul
       ↓
3. User Service
       ↓
4. Email Service
       ↓
5. API Gateway
       ↓
6. Frontend
```

Then open:

```text
http://localhost:5179
```

---

# 🌐 Local Service URLs

| Component | URL / Port |
|---|---|
| Frontend | `http://localhost:5179` |
| API Gateway | `http://localhost:9095` |
| User Service | `http://localhost:8080` |
| Email Service | `http://localhost:9091` |
| Consul UI | `http://localhost:9096` |
| PostgreSQL | `localhost:5432` |

> Consul itself listens on port `8500` inside its container; Docker maps that port to `9096` on the host.

---

# 🔐 Authentication Features

## Registration

The current registration workflow keeps email verification inside the registration form.

```text
Sign Up
   ↓
Select Role
   ↓
Registration Form
   ↓
Enter Email
   ↓
Send OTP
   ↓
Enter OTP
   ↓
Verify Email
   ↓
Complete Registration Details
   ↓
Accept Terms & Conditions
   ↓
Create Account
```

### Registration validation

The registration process includes:

- Valid email format
- Duplicate email check
- Role-aware duplicate email message
- Six-digit registration OTP
- Ten-minute OTP expiration
- OTP deletion after successful registration
- Automatic cleanup of expired unused registration OTP records
- Full-name validation
- Ten-digit mobile-number validation
- Password complexity validation
- Confirm-password validation
- Terms & Conditions acceptance
- Backend verification that the email was actually verified before account creation

### Existing registered email

Before a registration OTP is sent, the backend checks whether the email already belongs to an account and returns its registered role.

Examples:

```text
This email is already registered as Student.
This email is already registered as Faculty.
```

---

# 📧 Registration OTP

Registration OTPs are stored in the `email_registration_otp` table.

Each OTP includes:

- Email
- Six-digit OTP
- Creation time
- Expiration time
- Verification state

OTP validity is limited to **10 minutes**.

### OTP lifecycle

```text
Generate OTP
    ↓
Save OTP
    ↓
Send email
    ↓
Verify OTP
    ↓
Successful registration
    ↓
Delete OTP
```

Unused expired OTP records are automatically removed by the scheduled cleanup task.

The User Service enables Spring scheduling and periodically deletes OTP records whose `expiresAt` has passed.

---

# 📜 Terms & Conditions

Users must accept the Terms & Conditions before creating an account.

The registration form provides a Terms & Conditions modal where the user can read the platform terms before accepting them.

Registration cannot continue until the terms are accepted.

---

# 🔑 Login

Login uses:

- Email/username
- Password
- Selected role

The frontend sends the selected role to the backend, and the backend verifies that the authenticated account actually contains that role.

Example:

```text
Selected role: Faculty
Credentials belong to: Student

→ Login rejected
```

This prevents a user from selecting a different role in the UI and entering an account belonging to another role.

The backend returns a `ROLE_MISMATCH` error when the selected role does not match the user's actual account role.

---

# 🔄 Forgot Password

The project includes a dedicated Forgot Password flow based on OTP verification.

```text
Forgot Password?
      ↓
Enter registered email
      ↓
Send OTP
      ↓
Receive OTP by email
      ↓
Verify OTP
      ↓
Receive reset token
      ↓
Enter new password
      ↓
Reset password
      ↓
Login using new password
```

The password reset process uses the existing `forgot_password` database entity/table.

Reset requests contain:

- Reset token
- OTP
- Creation time
- Expiration time
- Associated user

Reset tokens are temporary and are consumed after a successful password reset.

Passwords are stored using BCrypt hashing through Spring Security's `PasswordEncoder`.

---

# 👤 Profile Management

The profile page currently provides:

## Profile Header

- Profile initial/avatar area
- Full name
- Email
- Dynamic role badge
- Account status
- Edit Profile action

## Personal Information

- Full Name
- Email
- Country Code
- Mobile Number

## Account Information

- Username
- Role
- Account status
- Email verification state

## Account Activity

- Account creation date
- Last login

### Edit Profile

Users can currently edit:

- Full name
- Country code
- Mobile number

The email field is displayed as account identity information and is **not editable** from Edit Profile.

---

# 🛡️ Security

The backend uses Spring Security with a stateless authentication model.

Current security-related features include:

- JWT access tokens
- Refresh tokens
- BCrypt password hashing
- Role-based authorization
- Protected API routes
- JWT authentication filter
- Account enabled/disabled handling
- Account locked handling
- Email verification during registration
- OTP-based password reset
- Protected frontend routes
- Role-protected frontend routes

Sensitive credentials should never be committed to the repository.

Do not commit:

- Gmail/App Passwords
- Database passwords
- JWT secrets
- API keys
- Production credentials
- Private URLs or tokens
- `.env` files

---

# 🔀 API Gateway

The gateway runs on:

```text
http://localhost:9095
```

Typical frontend authentication requests are routed through the gateway:

```text
POST /auth/check/email
POST /auth/send/email
POST /auth/verify-registration-otp
POST /auth/register/user
POST /auth/login
POST /auth/refreshToken
POST /auth/forgot-password/send-otp
POST /auth/forgot-password/verify-otp
POST /auth/forgot-password/reset
```

The exact route implementation is defined by the backend controllers and gateway configuration.

---

# 🧭 Service Discovery

Consul is used for backend service registration and discovery.

Expected services include:

```text
api-gateway
user-service
email-service
```

Use the Consul dashboard to verify that the services are registered and healthy:

```text
http://localhost:9096
```

If a backend service reports `Connection refused` for `localhost:8500`, check that the Consul container is running.

---

# 🗃️ Database & Migrations

PostgreSQL stores application data for the backend.

Liquibase is used for database schema management where configured by the service.

Important authentication-related tables include tables corresponding to:

- Users
- User roles
- Registration OTPs
- Forgot Password records
- Refresh tokens

The registration OTP table is:

```text
email_registration_otp
```

The password reset table is:

```text
forgot_password
```

---

# 📚 API Documentation

The backend uses Springdoc/OpenAPI where configured.

For the User Service, the OpenAPI JSON endpoint is typically:

```text
http://localhost:8080/v3/api-docs
```

Swagger UI is typically available at:

```text
http://localhost:8080/swagger-ui/index.html
```

The exact availability of Swagger UI depends on the running service configuration.

---

# 🧪 Testing the Main User Flow

After starting all services, test the application in this order:

### Registration

1. Open the frontend.
2. Click **Sign Up**.
3. Select Student, Faculty, or Admin.
4. Enter an unused email.
5. Click **Send OTP**.
6. Check the email service/Gmail inbox.
7. Enter the six-digit OTP.
8. Verify the email.
9. Enter full name and phone details.
10. Accept Terms & Conditions.
11. Create the account.
12. Confirm that the account appears in PostgreSQL.
13. Confirm that the used registration OTP has been removed from `email_registration_otp`.

### Login

1. Select the appropriate role.
2. Enter the registered email and password.
3. Confirm successful login.
4. Try selecting a different role and confirm that login is rejected.

### Forgot Password

1. Click **Forgot Password?**.
2. Enter the registered email.
3. Request an OTP.
4. Enter the OTP.
5. Verify the OTP.
6. Enter a new password.
7. Reset the password.
8. Log in using the new password.

### Profile

1. Open the Profile page.
2. Confirm the correct role is displayed.
3. Confirm country code and mobile number are shown separately.
4. Open Edit Profile.
5. Edit allowed profile fields.
6. Save changes.

---

# 🛠️ Common Troubleshooting

## Consul connection refused

Error example:

```text
Connect to localhost:8500 failed: Connection refused
```

Check:

```cmd
docker ps
```

If necessary:

```cmd
docker start consul
```

Then restart the affected backend service.

---

## Email authentication failure

If the Email Service reports Gmail SMTP authentication errors:

- Confirm `email-service/.env` exists.
- Confirm `MAIL_USERNAME` is correct.
- Confirm `MAIL_PASSWORD` contains the required Gmail App Password.
- Confirm the Email Service was restarted after changing `.env`.

---

## Port already in use

Windows:

```cmd
netstat -ano | findstr :9095
```

Replace `9095` with the required port.

---

## Frontend dependency problems

From `frontend`:

```cmd
npm install
npm run dev
```

If dependencies are inconsistent after switching branches, remove the local dependency installation and reinstall:

```cmd
rmdir /s /q node_modules
npm install
```

Use PowerShell or Git Bash equivalents when appropriate for your shell.

---

## Backend build/run problems

The project uses Gradle.

Examples:

```cmd
gradlew build
```

Run one service from the repository root:

```cmd
gradlew :user-service:bootRun
gradlew :email-service:bootRun
gradlew :gateway-service:bootRun
```

---

# 🌿 Git Workflow

Check the working tree:

```bash
git status
```

Review unstaged changes:

```bash
git diff
```

Review staged changes:

```bash
git diff --cached
```

Check whitespace errors:

```bash
git diff --cached --check
```

Stage changes:

```bash
git add .
```

Commit changes:

```bash
git commit -m "describe the change"
```

Push the current feature branch:

```bash
git push origin feature/email-otp-authentication
```

When working with the organization's remote, use the remote configured for the organization repository, for example:

```bash
git push organization feature/email-otp-authentication
```

Always verify the target remote before pushing:

```bash
git remote -v
```

---

# 🔒 Environment & Configuration Guidelines

The repository contains configuration intended for local development, but sensitive values must remain local.

The `.gitignore` includes:

```text
.env
.env.*
*.env
```

Never commit local SMTP credentials or other secrets.

When another developer clones the repository, they must recreate the required local environment files manually.

---

# 🚧 Current Development Status

## Authentication

- [x] Student registration
- [x] Faculty registration
- [x] Admin role support
- [x] Email registration OTP
- [x] OTP verification
- [x] Ten-minute OTP expiry
- [x] Successful OTP consumption/deletion
- [x] Expired OTP cleanup
- [x] Duplicate email detection
- [x] Duplicate email role display
- [x] Password complexity validation
- [x] Mobile-number validation
- [x] Terms & Conditions acceptance
- [x] JWT authentication
- [x] Refresh token support
- [x] Role-aware login validation
- [x] Forgot Password OTP
- [x] Password reset
- [x] Password visibility controls
- [x] Logout

## Profile

- [x] Profile page
- [x] Dynamic role display
- [x] Account status display
- [x] Personal information display
- [x] Account information display
- [x] Account activity display
- [x] Edit full name
- [x] Edit country code
- [x] Edit mobile number
- [x] Non-editable email identity field

## Infrastructure

- [x] API Gateway
- [x] Consul service discovery
- [x] PostgreSQL
- [x] Liquibase support
- [x] Email Service
- [x] Environment-based email credentials
- [x] React + TypeScript + Vite frontend

## School Management Modules

The following areas are planned or under development and may not yet have complete functionality:

- [ ] Student management
- [ ] Faculty management
- [ ] Classes and sections
- [ ] Subjects
- [ ] Attendance
- [ ] Assignments
- [ ] Submissions
- [ ] Notifications
- [ ] Additional administrator functionality

---

# 📌 Important Development Notes

1. Start **Consul before backend services that register with it**.
2. Start PostgreSQL before services that use the database.
3. Keep `email-service/.env` local and never commit it.
4. Frontend API requests are routed through port `9095`.
5. The User Service runs on `8080`.
6. The Email Service runs on `9091`.
7. Consul is exposed on host port `9096` and uses internal port `8500`.
8. Backend services are run using Gradle.
9. Registration email verification is part of the registration form.
10. A user's selected login role must match the actual role assigned to the account.

---

# 📄 License

This project is currently under development as part of the E-Vidyalaya project.

---

## 👥 Project

**E-Vidyalaya**

A microservices-based school management platform.
