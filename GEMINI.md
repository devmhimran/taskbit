# Project Context & AI Rules: TaskBit

## 🏗️ Architecture & RBAC Overview
TaskBit is a Next.js (App Router) project with a Role-Based Access Control (RBAC) system organized via Route Groups.

### Route Groups
- `app/(public)`: Public access (Sign-in, Forgot Password).
- `app/(private)`: Layout-driven protected access:
  - `app/(private)/dashboard/(admin)`: Restricted to `ADMIN` and `CO_ADMIN`.
  - `app/(private)/dashboard/(user)`: Restricted to `USER` and `EMPLOYEE`.
  - `app/(private)/dashboard/(client)`: Restricted to `CLIENT`.
  - `app/(private)/dashboard/profile`: Shared profile management.

### User Roles & Permissions
- **Admin Roles:** `ADMIN`, `CO_ADMIN` (Full management, payments, tasks, salaries, clients, users).
- **User Roles:** `USER`, `EMPLOYEE` (Assigned tasks, own payments, work tracking).
- **Client Role:** `CLIENT` (Client tasks and requirements).

---

## 📁 Directory Structure & Mapping
- `app/`: Next.js App Router route groups and API routes (`app/api/auth/[...nextauth]`).
- `components/ui/`: Raw Shadcn UI components.
- `components/forms/`: Centralized form logic using React Hook Form + Zod.
- `components/filters/`: Reusable filter components (Task, User, Salary filters).
- `components/skeletons/`: Dedicated skeleton loading states for every private view.
- `hooks/`: TanStack Query hooks (queries and mutations).
- `server/`: Next.js Server Actions containing internal business and database logic.
- `prisma/`: Prisma schema (`schema.prisma`) and database client singleton (`prisma/db.ts`).
- `lib/`: Mailer, Error Handlers, and React Query provider/config.
- `utils/`: Pure utility functions and formatters.
- `types/`: Shared TypeScript types and enums.

---

## 🗄️ Database, Prisma & Soft-Delete Rules (Strict)

### 1. Soft-Delete Pattern
- Models with soft deletion (`User`, `Task`, `Client`, `ClientTasks`):
  - Field: `isDeleted Boolean @default(false)`
  - **Rule:** NEVER use hard `prisma.<model>.delete()` unless explicitly requested. Soft delete using `prisma.<model>.update({ where: { id }, data: { isDeleted: true } })`.
  - **Querying Rule:** ALL queries fetching active entities MUST include `{ isDeleted: false }` in their filter condition.

### 2. User Status & Auth Validation
- User status: `status UserStatus @default(ACTIVE)` (Enums: `ACTIVE`, `INACTIVE`).
- **Rule:** Any authentication flow (Sign-in, Forgot Password, Reset Password, OTP verification) and user assignment logic MUST verify that:
  1. The user exists.
  2. `isDeleted === false` (if deleted: `"This account has been deleted. Please contact support."`).
  3. `status === 'ACTIVE'` (if inactive: `"This account is inactive. Please contact support."`).

### 3. Prisma Schema Changes
- Whenever `prisma/schema.prisma` is altered, always regenerate the Prisma Client:
  ```bash
  npx prisma generate
  ```

---

## 🐳 Docker & Environment Architecture

### Services in `compose.yaml`
1. **`frontend`** (Port `3000`): Next.js application.
2. **`studio`** (Port `5555`): Prisma Studio for database inspection.
3. **`db`** (Port `5432`): PostgreSQL database container with persistent volume `postgres_data`.

### Database Connection Strings
- **Inside Docker Containers (`frontend`, `studio`):** Connects via the Docker network using host `db`:
  `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
- **Outside Docker (Host machine / Local Next.js dev):** Connects via localhost:
  `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}`

### Required Environment Variables (`.env`)
- `DATABASE_URL`: Connection string for PostgreSQL.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: PostgreSQL credentials.
- `NEXTAUTH_SECRET`, `NEXT_PUBLIC_AUTH_SECRET`: Secret key for NextAuth JWT encryption (must never be empty).
- `NEXTAUTH_URL`: Base application URL (`http://localhost:3000`).

---

## 📡 Data & API Patterns (Strict)

### 1. Server Action Response Format
All data-fetching server actions must return this standard structure:
```json
{
  "data": "values",
  "meta": {
    "count": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

Mutation server actions should return:
```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": "optional returned payload"
}
```

### 2. Data Fetching Rule
- Always use **TanStack Query** via dedicated hooks in the `hooks/` directory.
- **Rule:** Do NOT call Server Actions directly inside React components; always wrap them in a query/mutation hook for consistent loading, caching, and error state handling.

### 3. Error Handling
- Use the error handler pattern in `lib/error-handler.ts` or `catchError(error)` from `lib/utils.ts` in all Server Actions.
- Return structured error objects with `{ success: false, message: error.message }` rather than letting unhandled exceptions crash the request.

---

## 🛠️ Admin Module Specifications
When working in `app/(private)/dashboard/(admin)`, follow these UX guidelines:
- **Dashboard:** Must include Payment Overview, Expenses summary, and "Business Health Alert".
- **Tasks:** Card-based view. Filters: Payment Status, Task Status, Paper Type, Delivery Date, Create Date. Must support Export functionality.
- **Expenses/Salaries:** Table-based view. Summary statistics cards must be displayed at the top. Filtering requires Month/Year and specific Date support.
- **Management (Users/Clients):** Table-based view with real-time Search + Role/Status filter controls.

---

## 🤖 Interaction Rules for Agent

1. **Modification Rule:** If modifying a Shadcn UI component, do NOT edit it directly in `components/ui/`. Move it to the general `components/` folder before customizing.
2. **Naming Conventions:**
   - PascalCase for React components (`TaskCard.tsx`, `UserTable.tsx`).
   - kebab-case for utility files, hooks, server actions, and route files (`use-task.tsx`, `error-handler.ts`, `forgot-password.ts`).
3. **Skeleton Rule:** Every new page or data view in `(private)` must have a corresponding loading skeleton in `components/skeletons/`.
4. **Prisma Type Synchronization:** Always verify imports from `@prisma/client` after schema adjustments and ensure types compile cleanly without implicit `any`.
5. **No Broken Containers:** When modifying environment variables or Docker configuration, ensure fallbacks exist so containers never crash due to unset variables.
