# BPO Management System - Project Documentation

## 1. Aim
To design and develop a comprehensive BPO (Business Process Outsourcing) Management System that streamlines ticket handling, agent assignments, and customer support tracking.

## 2. Description
The BPO Management System is a digital platform designed to handle large volumes of customer inquiries and support requests efficiently. It provides a structured workflow where customers can raise tickets, admins can assign these to specialized agents, and agents can resolve issues within an defined SLA (Service Level Agreement).

### Key Features:
* **Ticket Lifecycle Management:** Tracking from 'New' to 'Closed'.
* **Role-Based Access:** Categorized portals for Customers, Agents, and Admins.
* **Agent Management:** Admin capability to monitor workload and productivity.
* **Reporting:** Visualizing resolved vs. pending tickets.

### Actors:
1. **Customer:** Raises tickets and tracks progress.
2. **Agent:** Picks up assigned tickets and provides resolutions.
3. **Admin:** Manages user accounts, assigns tasks, and views reports.

---

## 3. Procedure / Methodology
1. **Requirement Analysis:** Identifying the needs of Customers, Agents, and Admins in a BPO environment.
2. **System Design:** Creating UML diagrams (Use Case, Sequence, State, etc.) to model system behavior and structure.
3. **Frontend Development:** Implementing the user interface using React and Tailwind CSS for a responsive design.
4. **Logic Implementation:** Developing the ticket lifecycle management and role-based access control.
5. **Data Visualization:** Integrating Recharts to provide analytical insights into ticket resolution performance.
6. **Testing:** Executing test cases to ensure system reliability and security.

---

## 4. Use Case Diagram
### Actors and Use Cases:
* **Customer:** Login, View Profile, Raise Ticket, Track Ticket Status, Provide Feedback.
* **Agent:** Login, View Assigned Tickets, Update Ticket Status, Add Resolution, Chat with Customer.
* **Admin:** Login, Manage Users (Agents/Customers), Assign Tickets, Generate Reports, Monitor System Health.

---

## 5. UML Interaction Diagrams

### A. Sequence Diagram (Workflow)
1. **Customer** logs into the system.
2. **Customer** submits a "Raise Ticket" request with details.
3. **System** validates the request and saves it to the **Database**.
4. **Admin** views "New Tickets" and sends "Assign Task" call.
5. **Agent** receives "Notification" and starts "Processing".
6. **Agent** updates status to "Resolved" in **Database**.
7. **System** notifies **Customer** of resolution.

### B. Collaboration Diagram
* **Customer [1]** -> **UI Portal [2]** -> **Auth Module [3]**
* **Admin [4]** -> **Ticket Manager [5]** -> **Agent [6]**
* **Agent [7]** -> **Database [8]** (Update Record)

---

## 6. UML State Chart & Activity Diagram

### A. State Chart (Ticket States)
* **New:** Ticket is successfully raised.
* **Assigned:** Admin has allocated the ticket to an Agent.
* **In Progress:** Agent has started working on the issue.
* **On Hold:** Waiting for customer response or external input.
* **Resolved:** Solution provided by the Agent.
* **Closed:** Customer confirms resolution or auto-closed after timeout.

### B. Activity Diagram (Ticket Resolution Workflow)
1. **Start**
2. Login with Credentials.
3. **Decision:** Is Login Valid?
    * No: Return to Login.
    * Yes: Dashboard.
4. Raise/View Ticket.
5. Apply Logic/Process Issue.
6. Update Status.
7. Notify User.
8. **End**

---

## 7. UML Component & Deployment Diagram

### A. Component Diagram
* **User Interface (UI):** React components for viewing and handling data.
* **Authentication Module:** Handles login and session management.
* **Ticket Module:** Core logic for CRUD operations on tickets.
* **Reporting Engine:** Aggregates data for charts.
* **Database Interface:** Connector for persistent storage.

### B. Deployment Diagram
* **Client Machine:** Browser running the UI.
* **Web Server:** Hosts the static React build.
* **App Server:** Run the Node.js/Express backend API.
* **Database Server:** Host for PostgreSQL or MongoDB storage.

---

## 8. Testing (Test Cases)

| Use Case ID | Scenario | Input | Expected Output | Actual Output | Result |
|-------------|----------|-------|-----------------|---------------|--------|
| TC-01 | Valid Login | Correct User/Pass | Redirect to Dashboard | User at Dashboard | PASS |
| TC-02 | Invalid Login | Wrong Password | "Invalid Credentials" message | Show Error Msg | PASS |
| TC-03 | Ticket Creation | Subject & Desc | Ticket ID generated | ID #101 created | PASS |
| TC-04 | Status Update | Change to 'Assigned' | Status reflected in DB | DB updated to Assigned | PASS |
| TC-05 | File Attachment| JPG Image | Attachment visible on ticket | File uploaded | PASS |
| TC-06 | Report Gen | Date Range | PDF/Graph displayed | Graph shown | PASS |

---

## 9. Implementation Details

### Tech Stack:
* **Frontend:** React, Tailwind CSS (for modern UI).
* **Backend:** Node.js, Express.
* **Database:** NoSQL (MongoDB) or Relational (SQLite).

### Database Schema (Pseudocode):
* **Users:** `{ id, name, email, role: ['admin', 'agent', 'customer'], password }`
* **Tickets:** `{ id, customerId, agentId, subject, description, status, priority, createdAt }`
* **Logs:** `{ ticketId, action, timestamp, userId }`

---

## 10. Conclusion
The BPO Management System successfully demonstrates the application of UML modeling in designing a scalable enterprise solution. It provides a robust framework for managing customer relations and operational efficiency.
