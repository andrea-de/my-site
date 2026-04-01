# Senior Software Engineer: Intellisense.io

My time at Intellisense.io was a highlight of my career, characterized by deep technical problem-solving and close collaboration with global mining partners. I focused on bridging the gap between our predictive models and the legacy data structures of industry-leading clients.

## 🏗️ Technical Focus: Mine-to-Market Integration & SIO

My primary responsibility was a specialized deployment of our **Stockpile & Inventory Optimization (SIO)** application for a major global mining partner. The core challenge was ensuring our "Mine-to-Market" predictive models could interoperate with the client’s existing data models.

### 1. Async Site Management Microservice
I designed and implemented an event-driven microservice to act as the "middleware" between the client’s data infrastructure and our internal SIO models.
* **Event-Driven Architecture**: Built as an asynchronous system where the client would provide data dumps, and the service would process the transformation before sending a callback.
* **On-Premise Deployment**: I engineered these services to be deployed directly on the client’s infrastructure using **Docker Compose**, ensuring data sovereignty and low-latency processing for their site management.
* **Event Management System**: Developed a dedicated service to orchestrate the lifecycle of these processing events, ensuring reliability and traceability across the material value chain.

### 2. Spatial Data Translation Math Library
The most complex part of this project was the mathematical translation between disparate 3D data models. While our internal predictive models used variable-height column slices, the client’s systems often operated on fixed "cube" (voxel) models.
* **Cubes to Columns**: Created a custom math library in **Python** to translate fixed-size cubes into variable-height column slices (and vice versa).
* **Coordinate Mapping**: Developed logic to account for spatial offsets and non-fixed arrangements, ensuring that predictive data remained geographically accurate across models.
* **Spatial Visualization**: Used **Plotly** to build graphical representations of this data, overlaying terrain maps and surface scans with our cube/column models to verify translation accuracy for stakeholders.

### 3. Spatial Edge Synchronization & Batching
To process massive, geographically-extensive stockpiles, I implemented a synchronized batching strategy.
* **Overlapping Region Processing**: Developed a solution for "edge synchronization," where large stockpiles were processed in overlapping spatial batches. This ensured that predictive calculations remained continuous and accurate across the boundaries of different processing jobs.
* **Distributed Batching**: Architected the system to handle massive aggregate datasets by distributing spatial chunks across multiple processing instances, preventing memory bottlenecks while maintaining a unified digital twin state.

### 4. Engineering Operations & Collaboration
While my focus was technical delivery, I contributed to the broader engineering culture and cross-functional efforts:
* **DevOps & Delivery**: Managed project delivery via **Docker** and **Docker Compose**, and collaborated with the DevOps team on **Kubernetes** manifests for scaling.
* **Data Persistence**: Worked with **MongoDB** to handle the storage and retrieval of complex, semi-structured spatial data.
* **Stakeholder Management**: Met regularly with the client’s engineers and contractors, often assisting with their own test suites to ensure a seamless integration of our SIO solutions.
* **Hiring**: Administered numerous technical interviews for engineering candidates.

---

## 🧠 Narrative & Engineering Reflections
* **Personal Impact**: This was my favorite professional experience to date. I thrived in the "zero-to-one" environment where I could wear many hats—from core architect to client-facing engineer.
* **Interdisciplinary Collaboration**: I worked at the intersection of several high-performance teams. I met regularly with **Data Scientists** to align our mathematical translations with their predictive models, collaborated with **UX Designers** to visualize complex 3D spatial data, and partnered with **DevOps** on Kubernetes and Docker delivery pipelines.
* **Candidate Interviews**: Beyond my technical tasks, I was heavily involved in the growth of the team, administering numerous technical interviews to ensure we brought in engineers who shared our focus on high-scale industrial AI.
* **Stakeholder Engagement**: I didn't just write code; I sat in the room with the client's project managers and contractors, explaining the "why" behind our architectural choices and even helping them write their own test suites to ensure the integration held up under real-world conditions.

## 🛠️ Tech Stack & Keywords
* **Core Domains**: Mine-to-Market, Stockpile & Inventory Optimization (SIO)
* **Languages**: Node.js, Python
* **Data & Visualization**: MongoDB, Plotly
* **Infrastructure**: Docker, Docker Compose, Kubernetes
* **Architecture**: Event-Driven Microservices, 3D Spatial Translation, Async Callbacks, Spatial Edge Synchronization
