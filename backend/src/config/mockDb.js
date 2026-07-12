const mockTopics = [
  { _id: "mock_topic_1", title: 'Java', description: 'Core Java, OOPs concepts, Collections, Multithreading, JVM, and Exception Handling.', questionCount: 6 },
  { _id: "mock_topic_2", title: 'JavaScript', description: 'ES6+ syntax, Closures, Event Loop, Promises, Async/Await, DOM manipulation, and Prototypes.', questionCount: 6 },
  { _id: "mock_topic_3", title: 'React', description: 'Virtual DOM, JSX, Hooks (useState, useEffect, useContext), State Management, Lifecycle methods, and Performance.', questionCount: 6 },
  { _id: "mock_topic_4", title: 'Node.js', description: 'Event Loop, Streams, Buffer, Express framework, Middleware, REST APIs, and Event Emitters.', questionCount: 5 },
  { _id: "mock_topic_5", title: 'MongoDB', description: 'NoSQL architecture, Document queries, Indexes, Aggregations, Mongoose, and Replication.', questionCount: 5 },
  { _id: "mock_topic_6", title: 'SQL', description: 'Relational databases, Joins, Subqueries, Normalization, Transactions, ACID properties, and DDL/DML commands.', questionCount: 5 },
  { _id: "mock_topic_7", title: 'DBMS', description: 'Database management systems, Keys (Primary, Foreign), ER Diagrams, Indexing, and Concurrency Control.', questionCount: 5 },
  { _id: "mock_topic_8", title: 'Operating System', description: 'Process management, Threading, CPU Scheduling, Deadlocks, Memory Management, Virtual Memory, and System Calls.', questionCount: 5 },
  { _id: "mock_topic_9", title: 'Computer Networks', description: 'OSI Model layers, TCP/UDP protocols, IP Addressing, DNS, HTTP/HTTPS handshake, and Firewalls.', questionCount: 5 },
  { _id: "mock_topic_10", title: 'OOP', description: 'Inheritance, Polymorphism, Encapsulation, Abstraction, Interfaces, Abstract classes, and SOLID principles.', questionCount: 5 },
  { _id: "mock_topic_11", title: 'DSA', description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting & Searching, and Dynamic Programming.', questionCount: 6 },
  { _id: "mock_topic_12", title: 'HR Questions', description: 'Behavioral assessment, Situational questions, Teamwork, Weaknesses & Strengths, and Conflict Resolution.', questionCount: 5 }
];

const mockQuestions = {
  'Java': [
    { _id: "mq_java_1", topicId: "mock_topic_1", question: 'What are the main differences between Abstract Classes and Interfaces in Java?', difficulty: 'Beginner' },
    { _id: "mq_java_2", topicId: "mock_topic_1", question: 'Explain the internal working of HashMap in Java. How are collisions handled?', difficulty: 'Intermediate' },
    { _id: "mq_java_3", topicId: "mock_topic_1", question: 'What is Multithreading in Java, and how do you achieve synchronization between threads?', difficulty: 'Intermediate' },
    { _id: "mq_java_4", topicId: "mock_topic_1", question: 'Explain JVM memory structure. What is garbage collection and how does it work?', difficulty: 'Advanced' },
    { _id: "mq_java_5", topicId: "mock_topic_1", question: 'What are functional interfaces and lambda expressions introduced in Java 8?', difficulty: 'Beginner' },
    { _id: "mq_java_6", topicId: "mock_topic_1", question: 'Explain the difference between fail-fast and fail-safe iterators in Java.', difficulty: 'Advanced' }
  ],
  'JavaScript': [
    { _id: "mq_js_1", topicId: "mock_topic_2", question: 'What is a Closure in JavaScript, and what are its practical use cases?', difficulty: 'Beginner' },
    { _id: "mq_js_2", topicId: "mock_topic_2", question: 'Explain how the JavaScript Event Loop works, covering call stack, callback queue, and microtask queue.', difficulty: 'Intermediate' },
    { _id: "mq_js_3", topicId: "mock_topic_2", question: 'Compare "var", "let", and "const" scope details and hoisting behavior.', difficulty: 'Beginner' },
    { _id: "mq_js_4", topicId: "mock_topic_2", question: 'How do Promises work? Explain the difference between promise chains and async/await syntax.', difficulty: 'Intermediate' },
    { _id: "mq_js_5", topicId: "mock_topic_2", question: 'What is prototype-based inheritance in JavaScript? How does it differ from classical class-based inheritance?', difficulty: 'Advanced' },
    { _id: "mq_js_6", topicId: "mock_topic_2", question: 'What is the purpose of bind, call, and apply methods in JavaScript?', difficulty: 'Advanced' }
  ],
  'React': [
    { _id: "mq_react_1", topicId: "mock_topic_3", question: 'What is the Virtual DOM and how does the reconciliation process (diffing algorithm) work in React?', difficulty: 'Beginner' },
    { _id: "mq_react_2", topicId: "mock_topic_3", question: 'What are React Hooks? Explain the rules of hooks and when to use useEffect and useMemo.', difficulty: 'Beginner' },
    { _id: "mq_react_3", topicId: "mock_topic_3", question: 'What are the differences between Controlled and Uncontrolled components in React?', difficulty: 'Intermediate' },
    { _id: "mq_react_4", topicId: "mock_topic_3", question: 'Explain the custom hooks pattern. How do they share stateful logic instead of actual state?', difficulty: 'Intermediate' },
    { _id: "mq_react_5", topicId: "mock_topic_3", question: 'How does React Fiber architecture work and how does it improve app responsiveness?', difficulty: 'Advanced' },
    { _id: "mq_react_6", topicId: "mock_topic_3", question: 'Explain the context API and how it helps solve the prop-drilling issue.', difficulty: 'Intermediate' }
  ],
  'Node.js': [
    { _id: "mq_node_1", topicId: "mock_topic_4", question: 'Explain how the Node.js single-threaded event loop architecture handles high concurrency.', difficulty: 'Intermediate' },
    { _id: "mq_node_2", topicId: "mock_topic_4", question: 'What is middleware in Express? How do you write error-handling middleware?', difficulty: 'Beginner' },
    { _id: "mq_node_3", topicId: "mock_topic_4", question: 'Explain Node.js streams. What are the different types of streams and when should we use them?', difficulty: 'Advanced' },
    { _id: "mq_node_4", topicId: "mock_topic_4", question: 'What is the difference between setImmediate(), setTimeout(), and process.nextTick()?', difficulty: 'Advanced' },
    { _id: "mq_node_5", topicId: "mock_topic_4", question: 'What is the package.json file? Explain the difference between dependencies and devDependencies.', difficulty: 'Beginner' }
  ],
  'MongoDB': [
    { _id: "mq_mongo_1", topicId: "mock_topic_5", question: 'What is the difference between SQL and NoSQL databases? When should you choose MongoDB over MySQL?', difficulty: 'Beginner' },
    { _id: "mq_mongo_2", topicId: "mock_topic_5", question: 'Explain MongoDB indexing. How does index creation improve search performance, and what are the trade-offs?', difficulty: 'Intermediate' },
    { _id: "mq_mongo_3", topicId: "mock_topic_5", question: 'What are aggregation pipelines in MongoDB? Explain key stages like $match, $group, and $lookup.', difficulty: 'Advanced' },
    { _id: "mq_mongo_4", topicId: "mock_topic_5", question: 'What is sharding and replication in MongoDB? How do they ensure scalability and high availability?', difficulty: 'Advanced' },
    { _id: "mq_mongo_5", topicId: "mock_topic_5", question: 'How do you model one-to-many relationships in MongoDB documents (embedding vs referencing)?', difficulty: 'Intermediate' }
  ],
  'SQL': [
    { _id: "mq_sql_1", topicId: "mock_topic_6", question: 'What are Joins in SQL? Explain the differences between INNER, LEFT, RIGHT, and FULL outer joins with examples.', difficulty: 'Beginner' },
    { _id: "mq_sql_2", topicId: "mock_topic_6", question: 'What is Database Normalization? Describe 1NF, 2NF, and 3NF database structures.', difficulty: 'Intermediate' },
    { _id: "mq_sql_3", topicId: "mock_topic_6", question: 'Explain ACID properties in Relational Database Management Systems.', difficulty: 'Intermediate' },
    { _id: "mq_sql_4", topicId: "mock_topic_6", question: 'What is a SQL Subquery, and how does it differ from a Join? Explain correlated subqueries.', difficulty: 'Advanced' },
    { _id: "mq_sql_5", topicId: "mock_topic_6", question: 'What are database transactions? Explain the difference between commit and rollback operations.', difficulty: 'Beginner' }
  ],
  'DBMS': [
    { _id: "mq_dbms_1", topicId: "mock_topic_7", question: 'What is DBMS? Explain the difference between 2-Tier and 3-Tier database architectures.', difficulty: 'Beginner' },
    { _id: "mq_dbms_2", topicId: "mock_topic_7", question: 'What is the difference between Primary Key, Candidate Key, and Foreign Key?', difficulty: 'Beginner' },
    { _id: "mq_dbms_3", topicId: "mock_topic_7", question: 'Explain the concepts of Concurrency Control and Lock-based protocols (like two-phase locking).', difficulty: 'Advanced' },
    { _id: "mq_dbms_4", topicId: "mock_topic_7", question: 'Explain the difference between clustered and non-clustered indexing in databases.', difficulty: 'Intermediate' },
    { _id: "mq_dbms_5", topicId: "mock_topic_7", question: 'What are ER Diagrams? What is the role of attributes, entities, and relationships in them?', difficulty: 'Beginner' }
  ],
  'Operating System': [
    { _id: "mq_os_1", topicId: "mock_topic_8", question: 'What is a Process and what is a Thread? Explain the key differences between them.', difficulty: 'Beginner' },
    { _id: "mq_os_2", topicId: "mock_topic_8", question: 'What is a Deadlock? What are the four Coffman conditions necessary for a deadlock to occur?', difficulty: 'Intermediate' },
    { _id: "mq_os_3", topicId: "mock_topic_8", question: 'Explain Virtual Memory, Paging, and the Page Replacement Algorithms (like LRU, FIFO).', difficulty: 'Advanced' },
    { _id: "mq_os_4", topicId: "mock_topic_8", question: 'Describe CPU scheduling algorithms (e.g., Round Robin, Shortest Job First, Priority Scheduling).', difficulty: 'Intermediate' },
    { _id: "mq_os_5", topicId: "mock_topic_8", question: 'What are semaphores and mutexes? How do they solve the critical section problem?', difficulty: 'Advanced' }
  ],
  'Computer Networks': [
    { _id: "mq_cn_1", topicId: "mock_topic_9", question: 'Explain the OSI Model. Name all 7 layers and their primary responsibilities.', difficulty: 'Beginner' },
    { _id: "mq_cn_2", topicId: "mock_topic_9", question: 'Compare TCP and UDP protocols. When would you choose UDP over TCP?', difficulty: 'Intermediate' },
    { _id: "mq_cn_3", topicId: "mock_topic_9", question: 'Explain what happens when you type "www.google.com" in a web browser address bar.', difficulty: 'Intermediate' },
    { _id: "mq_cn_4", topicId: "mock_topic_9", question: 'How does the HTTP three-way handshake work during TCP connection setup?', difficulty: 'Advanced' },
    { _id: "mq_cn_5", topicId: "mock_topic_9", question: 'What is the difference between Symmetric and Asymmetric encryption? How does HTTPS secure communication?', difficulty: 'Advanced' }
  ],
  'OOP': [
    { _id: "mq_oop_1", topicId: "mock_topic_10", question: 'Explain the four pillars of Object-Oriented Programming (OOP) with real-world examples.', difficulty: 'Beginner' },
    { _id: "mq_oop_2", topicId: "mock_topic_10", question: 'What is the difference between Method Overloading and Method Overriding?', difficulty: 'Beginner' },
    { _id: "mq_oop_3", topicId: "mock_topic_10", question: 'Explain the SOLID design principles. Give a brief description of each principle.', difficulty: 'Intermediate' },
    { _id: "mq_oop_4", topicId: "mock_topic_10", question: 'Explain the difference between Interface inheritance and implementation inheritance.', difficulty: 'Intermediate' },
    { _id: "mq_oop_5", topicId: "mock_topic_10", question: 'What is Abstraction, and how does it differ from Encapsulation?', difficulty: 'Advanced' }
  ],
  'DSA': [
    { _id: "mq_dsa_1", topicId: "mock_topic_11", question: 'Explain the difference between Array and Linked List data structures. Compare their search and insertion complexities.', difficulty: 'Beginner' },
    { _id: "mq_dsa_2", topicId: "mock_topic_11", question: 'Explain how Binary Search works. What is its time complexity and space complexity?', difficulty: 'Beginner' },
    { _id: "mq_dsa_3", topicId: "mock_topic_11", question: 'How do Stacks and Queues differ? Write down real-world programming use cases for each.', difficulty: 'Intermediate' },
    { _id: "mq_dsa_4", topicId: "mock_topic_11", question: 'What is a Graph? Contrast Depth First Search (DFS) and Breadth First Search (BFS) traversals.', difficulty: 'Intermediate' },
    { _id: "mq_dsa_5", topicId: "mock_topic_11", question: 'Explain Dynamic Programming. Describe the memoization vs. tabulation approach using the Fibonacci example.', difficulty: 'Advanced' },
    { _id: "mq_dsa_6", topicId: "mock_topic_11", question: 'What is a Hash Collision? How do open addressing and chaining resolve hash collisions?', difficulty: 'Advanced' }
  ],
  'HR Questions': [
    { _id: "mq_hr_1", topicId: "mock_topic_12", question: 'Tell me about yourself. What are your core strengths and how do they align with this role?', difficulty: 'Beginner' },
    { _id: "mq_hr_2", topicId: "mock_topic_12", question: 'Describe a situation where you had a conflict with a team member. How did you resolve it?', difficulty: 'Intermediate' },
    { _id: "mq_hr_3", topicId: "mock_topic_12", question: 'Where do you see yourself in five years? How does this mock platform fit into your aspirations?', difficulty: 'Beginner' },
    { _id: "mq_hr_4", topicId: "mock_topic_12", question: 'Tell me about a time you failed or made a mistake on a project. What did you learn?', difficulty: 'Intermediate' },
    { _id: "mq_hr_5", topicId: "mock_topic_12", question: 'Why should we hire you? What unique value do you bring to our development team?', difficulty: 'Advanced' }
  ]
};

// Global in-memory logs for offline mode
const inMemoryInterviews = [];
const inMemoryResponses = [];

module.exports = {
  mockTopics,
  mockQuestions,
  inMemoryInterviews,
  inMemoryResponses
};
