# Senior Software Engineer: Mesa Cloud

At Mesa Cloud, my work centered on the architectural modernization of a mission-critical Ed-Tech platform. I led the migration of a monolithic flagging system into a scalable, microservice-based architecture, ensuring data integrity across complex educational data models.

## 🏗️ Architectural Modernization: The Flagging System

The "Flagging System" is the platform's flagship feature, designed to identify student-level anomalies such as double registrations, missing prerequisites, and scheduling conflicts across entire school districts.

### 1. Monolith to Microservices Migration
I transitioned the legacy system—originally a collection of client-specific SQL script libraries—into a suite of scalable Python microservices.
* **Elastic Beanstalk Deployment**: Architected the deployment pipeline using **AWS Elastic Beanstalk**, managing the lifecycle of these services across multiple environments.
* **YAML-Driven Orchestration**: Implemented a configuration-based execution model where flags could be triggered live or scheduled via YAML, replacing the manual execution of SQL libraries.
* **Secure Networking**: Configured VPC networking, including security groups and RDS access, to ensure secure read/write operations against a complex PostgreSQL database (spanning students, courses, grad plans, and districts).

### 2. The SQL-to-Python Logic Rewrite & Distributed Batching
The most significant technical challenge involved porting hundreds of legacy SQL scripts into serializable Python/Pandas logic.
* **Distributed Batching for Multi-Tenant Scale**: Large school districts required processing massive aggregate student datasets that could exceed standard memory limits. I implemented a distributed batching system to partition these datasets into manageable jobs, ensuring reliability for the platform's largest clients.
* **Pandas Data Normalization**: Managed the transition from SQL `NULL` behaviors to Python `None` and Pandas `NaN`. This was a high-friction task due to inconsistent data "washing" in the ingestion pipeline.
* **Edge Case Recovery**: Discovered and addressed dozens of edge cases where the legacy system relied on specific database behaviors. To achieve parity, I implemented a strategy of capturing and anonymizing real-world edge cases to create a robust, regression-proof test suite.

### 3. Ed-Tech Data Modeling & Scalability
Working within the K-12 sector required managing highly relational and sensitive data structures.
* **Performance Optimization**: By moving the flag recognition logic out of the database and into parallelized Python microservices, we significantly reduced the load on our primary RDS instances, allowing for more concurrent client processing.
* **Complex Schema Management**: Navigated a multi-tenant data model involving hundreds of tables across various school districts.

---

## 🧠 Narrative & Engineering Reflections
* **The "Data Washing" Challenge**: The transition from SQL to Python was a significant lesson in data consistency. I had to solve the "High Friction" problem of inconsistent data washing in our ingestion pipeline. SQL, Python, and Pandas all treat `NULL`, `None`, `0`, and empty strings differently; mapping these behaviors accurately across hundreds of flags required meticulous attention to detail and a "trust-but-verify" approach to our raw data.
* **Real-World Flagging Complexity**: The flags weren't just simple checks. I had to account for dozens of specific, often conflicting educational rules—like detecting if a student was double-registered for the same class across different systems or missing a niche prerequisite that varied by district.
* **Proactive Parity**: I didn't wait for errors to surface in production. I built my own auxiliary tools specifically to hunt for discrepancies between the legacy SQL environment and my new Python microservices, which is why the initial transition was so smooth.
* **Edge Case Anonymization**: To solve the hardest 1% of bugs, I developed a workflow for capturing real-world data edge cases, anonymizing them, and baking them into our permanent test suite, ensuring that a fix for one district never broke another.

## 🛠️ Tech Stack & Keywords
* **Languages**: Python (Pandas), SQL
* **Infrastructure**: AWS (Elastic Beanstalk, RDS, VPC, Security Groups)
* **Tools & Config**: YAML, Docker, PostgreSQL
* **Domain**: Ed-Tech, ETL, Microservices Migration, Data Parity, Distributed Batch Processing
