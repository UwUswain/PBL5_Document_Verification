---
description: YÊU TIÊN CAO NH
---

OFFICIAL ENGINEERING RULES
AI AGENT OPERATING RULES
FRONTEND ARCHITECTURE GOVERNANCE

cho toàn bộ frontend project PBL5.

Bối cảnh:

Project dùng NextJS App Router + TypeScript.
Đã có:
docs/current-frontend-architecture.md
docs/current-auth-flow.md
docs/target-frontend-architecture.md
Mục tiêu:
stabilize auth
prevent architecture chaos
support AI-assisted refactoring
enforce feature-based architecture
avoid duplicate systems
keep architecture scalable and maintainable
FILE NÀY PHẢI HOẠT ĐỘNG NHƯ:
luật kiến trúc chính thức
luật coding chính thức
luật refactor chính thức
luật dành cho AI agents
anti-chaos governance layer
PHẢI BAO GỒM CÁC PHẦN SAU
1. Core Architecture Principles

Ví dụ:

feature-first architecture
separation of concerns
predictable state management
centralized infrastructure
minimal coupling
2. Official Folder Structure Rules

Quy định rõ:

app/ dùng cho gì
features/ dùng cho gì
components/ui dùng cho gì
lib/ dùng cho gì
hooks/ dùng cho gì
providers/ dùng cho gì

Phải cấm:

business logic inside app/
giant shared services
duplicated feature logic
3. Feature Module Rules

Mỗi feature phải self-contained.

Ví dụ:

features/auth/
features/documents/
features/users/

Mỗi feature được phép chứa:

api/
hooks/
components/
types/

Không được cross-feature coupling trực tiếp.

4. Authentication Rules

Đây là phần CRITICAL.

Phải quy định:

auth source of truth
token ownership
auth hydration lifecycle
protected route ownership
logout behavior
unauthorized handling

Phải cấm:

duplicate auth state
redirect before hydration
auth checks inside random components
token logic outside api client
5. API Layer Rules

Quy định:

lib/apiClient.ts là transport layer duy nhất
feature api clients dùng shared apiClient
không fetch trực tiếp trong components/pages
không tạo axios instance mới lung tung
6. React Query Rules

Quy định:

server state ownership
invalidation strategy
loading strategy
stale handling
cache ownership

Cấm:

duplicated loading states
duplicated server state
manual fetching khi đã có query
7. Component Rules

Phân biệt:

UI-only components
feature components
layout components

Cấm:

API calls trong UI components
auth logic trong reusable UI
giant smart components
8. NextJS App Router Rules

Quy định:

app/ chỉ routing/layout composition
business logic nằm trong features/
protected logic ở layout/guards
client/server boundary rules

Cấm:

SPA-style routing redesign
random use client spread
business logic inside page.tsx
9. Naming Conventions

Quy định:

*Client.ts
use*.ts
*Provider.tsx
*Page.tsx
*Modal.tsx
DTO naming
query key naming
10. Migration & Refactor Rules

Đây là phần QUAN TRỌNG.

Quy định:

migrate feature-by-feature
verify build after each migration
never restructure whole project at once
stabilize auth before large refactors

Cấm:

massive rewrites
simultaneous backend/frontend rewrites
architecture redesign without documentation updates
11. AI Agent Constraints

Quy định dành riêng cho AI:

never invent duplicate systems
always search existing implementation first
prefer extending existing feature
avoid creating alternative auth flows
avoid duplicate api layers
follow target architecture strictly
OUTPUT FORMAT

Viết thành file markdown chuyên nghiệp.

Tone:

strict
production-oriented
architecture governance
engineering handbook

Đây là source of truth chính thức cho AI-assisted frontend development.