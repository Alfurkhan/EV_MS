# E-Vidyalaya

E-Vidyalaya is a **microservices-based School Management System** currently under development.

The project provides separate functionality for different users such as **Students, Faculty, and Administrators**.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Axios

### Backend

* Java 21
* Spring Boot
* Spring Cloud Gateway
* Spring Security
* JWT
* Gradle

### Database & Infrastructure

* PostgreSQL
* Liquibase
* HashiCorp Consul
* Docker

---

# Prerequisites

Make sure the following are installed:

* Java 21
* Node.js & npm
* PostgreSQL
* Docker

Check the installations:

```bash
java -version
node -v
npm -v
docker --version
```

---

# Project Structure

```text
E-Vidyalaya/
│
├── frontend/
├── gateway-service/
├── user-service/
├── email-service/
└── README.md
```

---

# 1. Start PostgreSQL

Create a PostgreSQL database named:

```text
evidyalaya_dev
```

Default local configuration used by the project:

```text
Host: localhost
Port: 5432
Database: evidyalaya_dev
Username: postgres
Password: postgres
```

Make sure PostgreSQL is running before starting the backend services.

---

# 2. Start Consul

E-Vidyalaya uses **HashiCorp Consul** for service discovery.

Start Consul using Docker:

```bash
docker run -d ^
  --name consul ^
  -p 9096:8500 ^
  -p 8600:8600/udp ^
  hashicorp/consul:1.21 ^
  agent -dev -client=0.0.0.0
```

> The above command is for **Windows Command Prompt**.

Check whether Consul is running:

```bash
docker ps
```

Open the Consul dashboard:

```text
http://localhost:9096
```

---

# 3. Start Backend Services

The backend services use **Gradle**.

## Gateway Service

Open a terminal:

```bash
cd gateway-service
gradlew bootRun
```

Gateway:

```text
http://localhost:9095
```

---

## User Service

Open another terminal:

```bash
cd user-service
gradlew bootRun
```

User Service:

```text
http://localhost:8080
```

---

## Email Service

Open another terminal:

```bash
cd email-service
gradlew bootRun
```

The Email Service runs on its configured port.

---

# 4. Start Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 5. Run Order

For a fresh setup, start the services in this order:

```text
1. PostgreSQL
       ↓
2. Consul
       ↓
3. User Service
       ↓
4. Email Service
       ↓
5. Gateway Service
       ↓
6. Frontend
```

Once everything is running, open:

```text
http://localhost:5173
```

---

# Local Services

| Service      | URL                   |
| ------------ | --------------------- |
| Frontend     | http://localhost:5173 |
| API Gateway  | http://localhost:9095 |
| User Service | http://localhost:8080 |
| Consul       | http://localhost:9096 |
| PostgreSQL   | localhost:5432        |

---

## Notes

* Backend services are run using **Gradle**.
* Consul is currently run using Docker.
* PostgreSQL must be running before starting the backend.
* Frontend requests are sent through the API Gateway.
* Do not commit passwords, JWT secrets, API keys, or other sensitive credentials to the repository.

---

**E-Vidyalaya — School Management System**

*Currently under development.*
