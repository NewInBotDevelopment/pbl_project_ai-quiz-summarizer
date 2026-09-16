// LecturAI Pre-analyzed Grounded Demo Datasets
// Guaranteed 100% reliable for live presentations and evaluations

window.PRESET_DEMOS = {
  deep_learning: {
    filename: "Lecture_08_Deep_Learning_and_CNNs.pdf",
    processTime: "12.8s",
    wordCount: 3450,
    document_id: "demo_doc_cnn_08",
    coverage: {
      coverage_score: 94,
      pages_analyzed: 8,
      total_pages: 8,
      sections_detected: 6,
      chunks_indexed: 24,
      topics_covered: ["Convolutional Layers", "Backpropagation", "Feature Maps", "Pooling & Stride", "Vanishing Gradient", "ReLU & Normalization"],
      methodology: "Hybrid BM25 + Multi-Stage LLM Grounding"
    },
    summary: [
      "Convolutional Neural Networks (CNNs) specialize in grid-structured inputs by replacing standard matrix multiplications with convolution operations.",
      "Convolutional layers use learnable spatial filter kernels that compute dot products across input receptive fields to capture translation-invariant features.",
      "Activation functions such as ReLU (Rectified Linear Unit) mitigate the vanishing gradient problem in deep feedforward architectures.",
      "Pooling operations (Max Pooling, Average Pooling) reduce spatial dimensions, downsampling parameter count and computational complexity.",
      "Batch Normalization stabilizes internal covariate shift across training batches, accelerating convergence and allowing higher learning rates.",
      "Fully Connected (Dense) layers at the network head aggregate feature maps into final multi-class probabilistic distributions using Softmax."
    ],
    summary_sources: [
      { page: 1, text: "Convolutional Neural Networks specialize in spatial grid data..." },
      { page: 2, text: "Kernels glide across receptive fields computing localized dot products..." },
      { page: 3, text: "ReLU f(x) = max(0, x) prevents gradient saturation..." },
      { page: 4, text: "Spatial pooling downsamples feature map dimensions..." },
      { page: 6, text: "Batch Normalization normalizes layer inputs across mini-batches..." },
      { page: 8, text: "Softmax produces final categorical probability distributions..." }
    ],
    detailed_summary: `Convolutional Neural Networks (CNNs) represent a foundational paradigm in computer vision and deep learning. Unlike classical multilayer perceptrons where every neuron is densely connected to all inputs, CNNs exploit spatial locality through parameter sharing and sparse connectivity. Feature extraction is governed by convolutional kernels that scan the input tensor to detect localized patterns such as edges, textures, and compositional shapes.

Non-linear transformations are applied downstream using Rectified Linear Units (ReLU) and Leaky ReLU activations, which prevent gradient vanishing during backpropagation through deep hidden layers. Spatial dimension reduction is accomplished via pooling layers, which summarize local pixel neighborhoods to achieve translational invariance and curb overfitting.

Modern architectures incorporate Batch Normalization and Residual Connections (Skip Connections) to ensure numerical stability and enable training of networks exceeding 100 layers. In the final stage, high-level multidimensional feature representations are flattened and projected through dense classification layers, with Softmax normalizing output logits into definitive class probabilities.`,
    key_points: [
      "Sparse Connectivity & Weight Sharing significantly reduce total learnable parameters compared to MLPs.",
      "Convolution Filter Kernels act as automated spatial feature extractors across receptive fields.",
      "ReLU Activation Function f(x)=max(0,x) resolves saturation and vanishing gradient bottlenecks.",
      "Max Pooling downsamples spatial dimensions while preserving dominant structural activations.",
      "Batch Normalization stabilizes intermediate activations and accelerates optimization convergence.",
      "Stride and Padding hyperparameters govern output tensor dimensionality and boundary preservation.",
      "Cross-Entropy Loss combined with Adam/SGD optimizers drives backpropagation weight updates.",
      "Softmax Activation converts final layer unnormalized logit scores into bounded probability distributions."
    ],
    key_points_sources: [
      { page: 1, text: "Sparse connectivity allows scaling to high-resolution imagery." },
      { page: 2, text: "Weight sharing enforces translation equivariance across the image." },
      { page: 3, text: "ReLU provides constant gradient of 1 for positive activations." },
      { page: 4, text: "Max pooling retains dominant features within local pooling windows." },
      { page: 5, text: "Stride controls step size; padding maintains border spatial resolution." },
      { page: 6, text: "Batch normalization normalizes mean and variance across training batches." },
      { page: 7, text: "Cross-entropy loss quantifies categorical classification error." },
      { page: 8, text: "Softmax ensures sum of all class probabilities equals 1.0." }
    ],
    quiz: {
      mcqs: [
        {
          question: "What primary advantage do Convolutional Layers have over Fully Connected layers for image processing?",
          options: ["Complete lack of activation functions", "Parameter sharing and sparse spatial connectivity", "Guaranteed linear decision boundaries", "Elimination of backpropagation"],
          answer: 1,
          explanation: "Weight sharing and sparse connectivity drastically reduce parameter count and preserve 2D spatial relationships.",
          difficulty: "Easy",
          source_page: 1
        },
        {
          question: "Why is the ReLU activation function preferred over Sigmoid in deep neural networks?",
          options: ["It compresses outputs between 0 and 1", "It prevents vanishing gradients for positive activations", "It requires complex exponential calculation", "It completely eliminates overfitting"],
          answer: 1,
          explanation: "ReLU has a constant derivative of 1 for positive inputs, avoiding gradient saturation and vanishing.",
          difficulty: "Medium",
          source_page: 3
        },
        {
          question: "What is the primary operational purpose of Max Pooling in a CNN?",
          options: ["Increase channel depth", "Reduce spatial dimensions and compute complexity", "Normalize weights to zero mean", "Apply non-linear classification"],
          answer: 1,
          explanation: "Max pooling extracts the maximum value in local spatial windows, reducing tensor dimensions and computational load.",
          difficulty: "Easy",
          source_page: 4
        },
        {
          question: "Which layer is typically placed at the output of a multi-class classification CNN?",
          options: ["Sigmoid layer", "Softmax layer", "Batch Normalization layer", "Convolution layer with stride 3"],
          answer: 1,
          explanation: "Softmax normalizes real-valued logits into a multi-class probability distribution summing to 1.",
          difficulty: "Easy",
          source_page: 8
        },
        {
          question: "How does Batch Normalization contribute to faster neural network training?",
          options: ["By setting all gradients to zero", "By reducing internal covariate shift across mini-batches", "By replacing convolution with matrix inversion", "By eliminating the need for validation data"],
          answer: 1,
          explanation: "Batch Normalization standardizes intermediate activations, enabling higher learning rates and smoother loss landscapes.",
          difficulty: "Hard",
          source_page: 6
        },
        {
          question: "If an input image of 32x32 is convolved with a 5x5 filter with Stride 1 and No Padding, what is the output size?",
          options: ["28x28", "32x32", "27x27", "30x30"],
          answer: 0,
          explanation: "Formula: (W - F + 2P)/S + 1 = (32 - 5 + 0)/1 + 1 = 28.",
          difficulty: "Medium",
          source_page: 5
        }
      ],
      short_questions: [
        {
          question: "Explain the concept of Translation Invariance in CNNs.",
          answer: "Translation invariance means the network recognizes an object or feature regardless of its exact spatial location within the input image, achieved through weight sharing and pooling.",
          difficulty: "Medium",
          source_page: 2
        },
        {
          question: "What role do Skip / Residual Connections play in Deep ResNet architectures?",
          answer: "Skip connections allow gradients to flow directly through identity mappings without attenuation, enabling the training of extremely deep networks (100+ layers) without performance degradation.",
          difficulty: "Hard",
          source_page: 7
        },
        {
          question: "What is the difference between Stride and Padding in convolution?",
          answer: "Stride defines the step size by which the kernel slides across the tensor, whereas Padding adds borders of zeros to preserve spatial dimensions and edge information.",
          difficulty: "Easy",
          source_page: 5
        }
      ]
    },
    knowledge_map: {
      nodes: [
        { id: "1", label: "CNN Architecture", type: "domain", definition: "Deep learning model for structured spatial data", source_pages: [1,2] },
        { id: "2", label: "Convolutional Layer", type: "concept", definition: "Extracts localized spatial feature maps", source_pages: [2,3] },
        { id: "3", label: "ReLU Activation", type: "concept", definition: "Non-linear activation preventing gradient vanishing", source_pages: [3] },
        { id: "4", label: "Pooling Layers", type: "concept", definition: "Spatial downsampling for translation invariance", source_pages: [4] },
        { id: "5", label: "Batch Normalization", type: "process", definition: "Mini-batch normalization for training stability", source_pages: [6] },
        { id: "6", label: "Softmax Classification", type: "topic", definition: "Final categorical probability distribution", source_pages: [8] }
      ],
      edges: [
        { source: "1", target: "2", relationship: "contains" },
        { source: "2", target: "3", relationship: "passes_to" },
        { source: "3", target: "4", relationship: "downsampled_by" },
        { source: "4", target: "5", relationship: "stabilized_by" },
        { source: "5", target: "6", relationship: "classified_by" }
      ]
    },
    transcript: `--- Page 1 ---
# Lecture 08: Convolutional Neural Networks (CNNs) & Deep Vision
Department of Computer Science & Engineering — Neural Computation

In this lecture, we explore the mathematical foundations and architectural design of Convolutional Neural Networks (CNNs). Standard Multilayer Perceptrons (MLPs) struggle with high-resolution image inputs due to the sheer explosion of parameters. A 1000x1000 pixel RGB image has 3 million inputs, resulting in billions of weights in a single hidden layer. CNNs overcome this limitation by introducing parameter sharing and sparse connectivity, allowing spatial hierarchy extraction.

--- Page 2 ---
# 1. Convolution Operations & Kernel Filtering
The core building block of a CNN is the convolutional layer. A kernel (filter matrix, typically 3x3 or 5x5) slides across the receptive field of the input tensor, computing discrete 2D convolutions (Frobenius inner products). The kernel weights are shared across the entire image space, enforcing translational equivariance.

--- Page 3 ---
# 2. Activation Functions & Rectified Linear Units (ReLU)
Following each linear convolution, element-wise non-linear activations are applied. While Sigmoid and Tanh were historically utilized, they suffer from gradient saturation in deep networks where derivatives approach zero. The Rectified Linear Unit, f(x) = max(0, x), provides constant unit gradient for positive values, accelerating gradient descent and preventing vanishing gradients.

--- Page 4 ---
# 3. Spatial Pooling & Downsampling
Pooling layers reduce the spatial dimensions (height and width) of intermediate feature representations while preserving channel depth. Max Pooling takes the maximum activation within a sliding window (e.g., 2x2 with stride 2), discarding 75% of activations while retaining dominant features and imparting translation invariance.

--- Page 5 ---
# 4. Hyperparameters: Stride and Padding
Output spatial dimensionality is governed by input size (W), filter size (F), zero-padding (P), and stride (S):
Output Size = ((W - F + 2P) / S) + 1. 'Same' padding adds border zeros to preserve spatial resolution, while 'Valid' padding permits spatial shrinkage.

--- Page 6 ---
# 5. Batch Normalization & Internal Covariate Shift
Batch Normalization (Ioffe & Szegedy) normalizes layer inputs across each mini-batch to have zero mean and unit variance, followed by learnable scale (gamma) and shift (beta) parameters. This stabilizes optimization dynamics and reduces sensitivity to weight initialization.

--- Page 7 ---
# 6. Residual Connections & Optimization
Deep networks with over 50 layers experience optimization degradation. Deep Residual Networks (ResNet) introduce shortcut connections that skip one or more layers, allowing gradients to propagate uninhibited through identity mappings back to the earliest layers.

--- Page 8 ---
# 7. Dense Heads & Softmax Categorization
The final feature maps are flattened into a 1D vector and fed into one or more Fully Connected (Dense) layers. The final layer applies the Softmax activation function:
P(y = c | x) = exp(z_c) / sum(exp(z_j)), mapping unbounded logits into normalized class probabilities summing to 1.0.`
  },

  operating_systems: {
    filename: "CS301_OS_Concurrency_and_Deadlocks.pptx",
    processTime: "11.2s",
    wordCount: 2980,
    document_id: "demo_doc_os_301",
    coverage: {
      coverage_score: 91,
      pages_analyzed: 6,
      total_pages: 6,
      sections_detected: 5,
      chunks_indexed: 18,
      topics_covered: ["Mutual Exclusion", "Semaphores & Mutexes", "Coffman Deadlock Conditions", "Banker's Algorithm", "Resource Allocation Graphs"],
      methodology: "Hybrid BM25 + Multi-Stage LLM Grounding"
    },
    summary: [
      "Concurrency introduces race conditions when multiple threads access shared resources without proper synchronization mechanisms.",
      "Critical sections must satisfy Mutual Exclusion, Progress, and Bounded Waiting to guarantee thread safety.",
      "Deadlock is a state where a set of processes is permanently blocked because each process holds a resource and waits for another held by another process.",
      "The four Coffman Conditions for deadlock are Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.",
      "Deadlock handling strategies include Prevention (invalidating one Coffman condition), Avoidance (Banker's Algorithm), and Detection & Recovery.",
      "Dijkstra's Banker's Algorithm dynamically verifies that allocating resources will leave the system in a provably Safe State."
    ],
    summary_sources: [
      { page: 1, text: "Concurrency creates race conditions on shared memory..." },
      { page: 2, text: "Critical sections require Mutual Exclusion and Progress..." },
      { page: 3, text: "Deadlock occurs when processes permanently wait on held resources..." },
      { page: 4, text: "Four Coffman conditions must hold simultaneously for deadlock..." },
      { page: 5, text: "Banker's algorithm checks safe states via Need <= Available vectors..." },
      { page: 6, text: "Resource Allocation Graphs (RAG) detect cycles under single-instance resources..." }
    ],
    detailed_summary: `Operating system concurrency models allow multiple execution threads to share processor time and address spaces. However, asynchronous interleaved access to shared mutable data introduces race conditions. Synchronization primitives, such as Mutexes and Counting Semaphores (P/wait and V/signal operations), ensure that only one thread enters a Critical Section at any time while satisfying Mutual Exclusion, Progress, and Bounded Waiting criteria.

A major failure mode in concurrent systems is Deadlock, characterized by the simultaneous fulfillment of the four Coffman Conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If any single condition is structurally prevented, deadlocks cannot occur.

In dynamic resource allocation environments, Deadlock Avoidance is enforced via Dijkstra's Banker's Algorithm. By maintaining Available, Max, Allocation, and Need matrices, the OS evaluates incoming requests to verify whether a Safe Execution Sequence exists where every process can complete. In systems without avoidance mechanisms, Resource Allocation Graphs (RAG) and cycle detection algorithms are periodically executed to trigger process preemption or termination.`,
    key_points: [
      "Race Conditions occur when program correctness depends on non-deterministic thread execution timing.",
      "Critical Section requirements: Mutual Exclusion, Progress, and Bounded Waiting.",
      "Semaphores utilize atomic wait() (P) and signal() (V) operations to manage resource counters.",
      "Four Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.",
      "Safe State in Banker's Algorithm guarantees at least one execution sequence where all processes finish.",
      "Need Matrix is calculated as Need[i][j] = Max[i][j] - Allocation[i][j].",
      "Resource Allocation Graph (RAG) contains deadlocks if and only if a cycle exists in single-instance resources.",
      "Deadlock Recovery involves process termination or preemptive resource rollback to safe checkpoints."
    ],
    key_points_sources: [
      { page: 1, text: "Race conditions lead to corrupted state in uncoordinated threads." },
      { page: 2, text: "Mutual exclusion guarantees only one process in critical section." },
      { page: 3, text: "Counting semaphores manage multi-instance resource access." },
      { page: 4, text: "Deadlocks require all four Coffman conditions to hold simultaneously." },
      { page: 5, text: "Safe state ensures no deadlock can occur under worst-case allocations." },
      { page: 5, text: "Need matrix tracks remaining claim for each active thread." },
      { page: 6, text: "Cycles in single-instance RAG indicate definite deadlock." },
      { page: 6, text: "Rollback and termination recover systems from detected deadlocks." }
    ],
    quiz: {
      mcqs: [
        {
          question: "Which of the following is NOT one of the four Coffman conditions required for a deadlock?",
          options: ["Mutual Exclusion", "Hold and Wait", "Preemptive Scheduling", "Circular Wait"],
          answer: 2,
          explanation: "The condition is 'No Preemption'. Preemptive scheduling actually prevents deadlocks.",
          difficulty: "Easy",
          source_page: 4
        },
        {
          question: "What does a 'Safe State' signify in Dijkstra's Banker's Algorithm?",
          options: ["All processes have already finished execution", "The system can allocate max resources to all processes in some order without deadlocking", "No processes are currently requesting resources", "All resources are locked by the kernel"],
          answer: 1,
          explanation: "A safe state guarantees that there exists at least one sequence of process completions that avoids deadlock.",
          difficulty: "Medium",
          source_page: 5
        },
        {
          question: "How is the Need Matrix calculated in Deadlock Avoidance?",
          options: ["Need = Max + Allocation", "Need = Max - Allocation", "Need = Available - Allocation", "Need = Max / Available"],
          answer: 1,
          explanation: "Need represents the remaining resources a process may request: Need[i] = Max[i] - Allocation[i].",
          difficulty: "Easy",
          source_page: 5
        },
        {
          question: "In a Resource Allocation Graph with SINGLE-instance resource types, a cycle indicates:",
          options: ["High CPU utilization", "A necessary and sufficient condition for Deadlock", "Starvation only, but not deadlock", "Efficient lock distribution"],
          answer: 1,
          explanation: "For single-instance resource systems, a cycle in the RAG is both necessary and sufficient for deadlock.",
          difficulty: "Medium",
          source_page: 6
        },
        {
          question: "What atomic operations are defined on standard counting semaphores?",
          options: ["lock() and unlock()", "wait() (or P) and signal() (or V)", "push() and pop()", "start() and yield()"],
          answer: 1,
          explanation: "Semaphores define wait() (decrements counter or blocks) and signal() (increments counter and unblocks).",
          difficulty: "Easy",
          source_page: 3
        },
        {
          question: "Which deadlock handling strategy completely removes the possibility of circular wait by imposing a total resource ordering?",
          options: ["Deadlock Detection", "Deadlock Prevention", "Deadlock Recovery", "Ostrich Algorithm"],
          answer: 1,
          explanation: "Enforcing a global numerical ordering on all resources prevents the Circular Wait Coffman condition.",
          difficulty: "Hard",
          source_page: 4
        }
      ],
      short_questions: [
        {
          question: "Define the term 'Race Condition' in concurrent programming.",
          answer: "A race condition occurs when the outcome of concurrent execution depends unpredictably on the relative order or timing of thread execution when accessing shared memory.",
          difficulty: "Easy",
          source_page: 1
        },
        {
          question: "What are the three mandatory requirements for solving the Critical Section Problem?",
          answer: "1. Mutual Exclusion (only one process in critical section at a time), 2. Progress (selection of next process cannot be postponed indefinitely), 3. Bounded Waiting (limit on times other processes enter before a waiting process).",
          difficulty: "Medium",
          source_page: 2
        },
        {
          question: "How does Deadlock Prevention differ from Deadlock Avoidance?",
          answer: "Deadlock Prevention designs system rules to ensure at least one Coffman condition is impossible at all times. Deadlock Avoidance dynamically inspects state (using Banker's algorithm) to reject requests that lead to unsafe states.",
          difficulty: "Hard",
          source_page: 5
        }
      ]
    },
    knowledge_map: {
      nodes: [
        { id: "1", label: "Concurrency Control", type: "domain", definition: "Management of simultaneous execution threads", source_pages: [1,2] },
        { id: "2", label: "Critical Section", type: "topic", definition: "Code accessing shared resources", source_pages: [2] },
        { id: "3", label: "Semaphores & Mutex", type: "concept", definition: "Atomic synchronization primitives", source_pages: [3] },
        { id: "4", label: "Coffman Conditions", type: "concept", definition: "4 prerequisites for deadlock state", source_pages: [4] },
        { id: "5", label: "Banker's Algorithm", type: "process", definition: "Safe state deadlock avoidance protocol", source_pages: [5] },
        { id: "6", label: "RAG Cycle Detection", type: "topic", definition: "Graph-based deadlock identification", source_pages: [6] }
      ],
      edges: [
        { source: "1", target: "2", relationship: "protects" },
        { source: "2", target: "3", relationship: "implemented_by" },
        { source: "1", target: "4", relationship: "threatened_by" },
        { source: "4", target: "5", relationship: "avoided_by" },
        { source: "4", target: "6", relationship: "detected_by" }
      ]
    },
    transcript: `--- Page 1 ---
# Lecture: Operating System Synchronization & Deadlocks
Dept. of Computer Science & Engineering — Systems Core

Concurrent systems allow multiple processes or threads to execute in interleaved fashion. When threads share memory without coordination, Race Conditions occur, leading to non-deterministic bugs and memory corruption.

--- Page 2 ---
# 1. The Critical Section Problem
A Critical Section is a segment of code in which a process accesses shared resources (tables, files, memory). Any valid synchronization solution must satisfy three criteria:
1. Mutual Exclusion: If process P_i is executing in its critical section, no other processes can be.
2. Progress: If no process is in its critical section, only processes not in their remainder sections can participate in deciding who enters next.
3. Bounded Waiting: There must be a bound on the number of times other processes can enter before a requesting process is granted entry.

--- Page 3 ---
# 2. Synchronization Primitives: Semaphores & Mutexes
A Semaphore S is an integer variable accessed only through atomic operations:
- wait(S): while (S <= 0); S--;
- signal(S): S++;
Binary semaphores act as Mutex locks, whereas Counting Semaphores coordinate access to finite resource pools.

--- Page 4 ---
# 3. Deadlock Characterization: Coffman Conditions
A Deadlock occurs when a set of blocked processes each hold a resource and wait to acquire a resource held by another process in the set.
Deadlock can arise if and only if four Coffman conditions hold simultaneously:
1. Mutual Exclusion: At least one non-shareable resource.
2. Hold and Wait: A process holds at least one resource and requests additional resources held by others.
3. No Preemption: Resources cannot be forcibly preempted.
4. Circular Wait: A closed chain of processes exists where each process holds resources needed by the next.

--- Page 5 ---
# 4. Deadlock Avoidance & Banker's Algorithm
Deadlock avoidance dynamically assesses resource requests using state algorithms.
Dijkstra's Banker's Algorithm tracks Available[m], Max[n][m], Allocation[n][m], and Need[n][m] where Need = Max - Allocation. A request is granted only if the resulting state is 'Safe', meaning a sequence <P1, P2, ... Pn> exists where each process can obtain its maximum claim and terminate.

--- Page 6 ---
# 5. Resource Allocation Graphs & Detection
A Resource Allocation Graph (RAG) consists of Process nodes (circles) and Resource nodes (boxes). Request edges point from Process to Resource, and Assignment edges point from Resource to Process. In single-instance resource systems, the presence of a cycle in the RAG is a necessary and sufficient condition for deadlock.`
  },

  distributed_systems: {
    filename: "SE402_Cloud_Distributed_Systems.docx",
    processTime: "14.1s",
    wordCount: 3820,
    document_id: "demo_doc_cloud_402",
    coverage: {
      coverage_score: 96,
      pages_analyzed: 10,
      total_pages: 10,
      sections_detected: 7,
      chunks_indexed: 28,
      topics_covered: ["CAP Theorem", "Raft Consensus", "PACELC Model", "Distributed Transactions", "Two-Phase Commit (2PC)", "Eventual Consistency"],
      methodology: "Hybrid BM25 + Multi-Stage LLM Grounding"
    },
    summary: [
      "Distributed systems coordinate autonomous computing nodes over network partitions to provide unified computational and storage services.",
      "The CAP Theorem states that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency, Availability, and Partition Tolerance.",
      "Because network partitions (P) are unavoidable in physical networks, architectures must trade off Consistency (CP systems) versus Availability (AP systems).",
      "The PACELC Theorem extends CAP by addressing the trade-off between Latency (L) and Consistency (C) even during normal operation when no partition (E) exists.",
      "The Raft Consensus Algorithm manages replicated state machines across clusters using Leader Election, Log Replication, and Safety invariants.",
      "Two-Phase Commit (2PC) coordinates atomic distributed transactions across multiple resource managers via Prepare and Commit phases."
    ],
    summary_sources: [
      { page: 1, text: "Distributed systems scale across autonomous nodes..." },
      { page: 2, text: "CAP theorem limits systems to 2 of Consistency, Availability, Partition tolerance..." },
      { page: 4, text: "PACELC evaluates Latency versus Consistency in normal states..." },
      { page: 6, text: "Raft consensus decomposes state replication into Leader Election..." },
      { page: 8, text: "Two-Phase Commit guarantees ACID atomicity across distributed shards..." },
      { page: 10, text: "Eventual consistency models guarantee convergence over time..." }
    ],
    detailed_summary: `Distributed Systems provide massive scalability and fault resilience by coordinating independent compute and storage nodes across network boundaries. System design is fundamentally constrained by Brewer's CAP Theorem, which proves that under network partition events, a distributed system must sacrifice either linearizable Consistency (yielding an AP system such as Cassandra) or high Availability (yielding a CP system such as HBase or etcd).

The PACELC theorem expands upon CAP by addressing steady-state operation: if there is a Partition (P), trade off Availability (A) and Consistency (C); Else (E), trade off Latency (L) and Consistency (C). High-throughput modern web architectures often adopt BASE (Basically Available, Soft state, Eventual consistency) semantics to prioritize low latency.

To maintain strong consistency across replicated state machines, consensus protocols like Raft and Multi-Paxos are implemented. Raft elects a single cluster leader via randomized term timeouts, handles client log append requests, and commits log entries only after replication across a quorum (majority) of nodes. For cross-service atomic transactions, Two-Phase Commit (2PC) ensures distributed atomicity through voting and commit phases, while Saga patterns manage long-running asynchronous distributed workflows.`,
    key_points: [
      "CAP Theorem proves that Partition Tolerance (P) is mandatory, forcing a choice between Consistency (C) and Availability (A).",
      "PACELC Model evaluates Partition (P/A/C) and Non-Partition (E/L/C) operational tradeoffs.",
      "Raft Consensus decomposes consensus into Leader Election, Log Replication, and Safety guarantees.",
      "Quorum Consensus requires read and write quorums satisfying R + W > N to prevent stale reads.",
      "Two-Phase Commit (2PC) consists of Phase 1 (Prepare voting) and Phase 2 (Commit or Abort execution).",
      "Eventual Consistency guarantees all replicas converge to identical states given no new updates.",
      "Vector Clocks establish causal ordering and detect concurrent conflicts in distributed storage.",
      "Saga Pattern coordinates distributed transactions across microservices using compensating rollback actions."
    ],
    key_points_sources: [
      { page: 2, text: "Networks cannot avoid partitions, making P non-negotiable." },
      { page: 4, text: "PACELC highlights latency costs in maintaining strong consistency." },
      { page: 6, text: "Raft ensures log entries match across majority quorums." },
      { page: 7, text: "Quorum intersection guarantees overlap between read and write sets." },
      { page: 8, text: "2PC blocks coordinators if network fails during commit phase." },
      { page: 9, text: "Eventual consistency trades instantaneous accuracy for high throughput." },
      { page: 9, text: "Vector clocks track partial ordering across independent nodes." },
      { page: 10, text: "Sagas use compensating transactions instead of distributed locking." }
    ],
    quiz: {
      mcqs: [
        {
          question: "According to the CAP theorem, which guarantee CANNOT be dropped in real-world distributed networks?",
          options: ["Consistency (C)", "Availability (A)", "Partition Tolerance (P)", "Linearizability (L)"],
          answer: 2,
          explanation: "Network hardware and cabling will inevitably experience partitions, making Partition Tolerance mandatory.",
          difficulty: "Easy",
          source_page: 2
        },
        {
          question: "In the PACELC theorem, what does 'E' and 'L' stand for in the expression 'Else, trade off Latency versus Consistency'?",
          options: ["Elasticity and Load", "Else and Latency", "Encryption and Lock", "Execution and Log"],
          answer: 1,
          explanation: "PACELC: If Partition (P) -> Availability (A) or Consistency (C); Else (E) -> Latency (L) or Consistency (C).",
          difficulty: "Medium",
          source_page: 4
        },
        {
          question: "What is the minimum number of nodes required in a Raft consensus cluster to tolerate 2 node failures?",
          options: ["3 nodes", "4 nodes", "5 nodes", "7 nodes"],
          answer: 2,
          explanation: "Formula: 2F + 1 nodes to tolerate F failures. For F=2: 2(2) + 1 = 5 nodes.",
          difficulty: "Medium",
          source_page: 6
        },
        {
          question: "What is the primary drawback of the Two-Phase Commit (2PC) protocol?",
          options: ["It does not support SQL databases", "It is a blocking protocol that can hang if coordinator fails", "It violates ACID atomicity", "It requires asymmetric encryption keys"],
          answer: 1,
          explanation: "2PC is a blocking protocol: if the coordinator crashes after the prepare phase, cohorts remain blocked holding locks.",
          difficulty: "Hard",
          source_page: 8
        },
        {
          question: "If a cluster has N=5 nodes, W=3 (write quorum), what is the minimum read quorum (R) needed for strong consistency?",
          options: ["R = 1", "R = 2", "R = 3", "R = 5"],
          answer: 2,
          explanation: "Strong consistency requires R + W > N. Here 3 + R > 5 => R >= 3.",
          difficulty: "Medium",
          source_page: 7
        },
        {
          question: "Which consistency model guarantees that all replicas will eventually match if no further updates are sent?",
          options: ["Linearizable Consistency", "Strict Serializability", "Eventual Consistency", "Sequential Consistency"],
          answer: 2,
          explanation: "Eventual consistency guarantees that in the absence of new mutations, all replicas converge over time.",
          difficulty: "Easy",
          source_page: 10
        }
      ],
      short_questions: [
        {
          question: "Explain the difference between a CP system and an AP system in CAP theory.",
          answer: "A CP system (e.g. etcd) prioritizes Consistency over Availability, returning errors if nodes cannot communicate during a partition. An AP system (e.g. Cassandra) prioritizes Availability, returning local data even if stale during partitions.",
          difficulty: "Medium",
          source_page: 3
        },
        {
          question: "How does the Raft consensus algorithm elect a new leader when the current leader fails?",
          answer: "Followers timeout after randomized election intervals (150-300ms), increment the term counter, transition to Candidate state, and request votes. The candidate receiving a majority of cluster votes becomes the new leader.",
          difficulty: "Medium",
          source_page: 6
        },
        {
          question: "Why is the Saga Pattern preferred over 2PC in modern Microservices architectures?",
          answer: "Sagas use asynchronous local transactions with compensating rollback actions instead of holding distributed cross-database locks, avoiding tight coupling, high latency, and coordinator blocking.",
          difficulty: "Hard",
          source_page: 10
        }
      ]
    },
    knowledge_map: {
      nodes: [
        { id: "1", label: "Distributed Architecture", type: "domain", definition: "Coordinated autonomous compute nodes", source_pages: [1] },
        { id: "2", label: "CAP Theorem", type: "topic", definition: "Fundamental consistency vs availability boundary", source_pages: [2,3] },
        { id: "3", label: "PACELC Model", type: "topic", definition: "Latency vs consistency steady-state analysis", source_pages: [4] },
        { id: "4", label: "Raft Consensus", type: "process", definition: "Leader-based replicated state machine protocol", source_pages: [6] },
        { id: "5", label: "Two-Phase Commit (2PC)", type: "process", definition: "Atomic distributed transaction coordination", source_pages: [8] },
        { id: "6", label: "Eventual Consistency", type: "concept", definition: "Asynchronous convergence across replicas", source_pages: [10] }
      ],
      edges: [
        { source: "1", target: "2", relationship: "constrained_by" },
        { source: "2", target: "3", relationship: "extended_by" },
        { source: "1", target: "4", relationship: "coordinated_by" },
        { source: "1", target: "5", relationship: "transactions_via" },
        { source: "3", target: "6", relationship: "implements" }
      ]
    },
    transcript: `--- Page 1 ---
# Lecture 12: Distributed Systems Architecture, Consensus & CAP
Dept. of Software Engineering & Cloud Computing

Distributed systems consist of autonomous nodes communicating across physical network topologies to solve computational and storage problems collaboratively. They provide horizontal scalability, high fault tolerance, and geo-redundancy.

--- Page 2 ---
# 1. Brewer's CAP Theorem
Eric Brewer proved that any distributed data store can simultaneously guarantee at most two of the following three properties:
- Consistency (C): Every read receives the most recent write or an error (Linearizability).
- Availability (A): Every non-failing node returns a non-error response for every request.
- Partition Tolerance (P): The system continues operating despite dropped or delayed messages between nodes.

--- Page 3 ---
# 2. CP vs AP Trade-offs in Practice
Because physical networks inevitably partition (fiber cuts, router reboots), P is non-negotiable. Therefore, architects must choose:
- CP Systems (e.g., Zookeeper, etcd, MongoDB strict): Reject writes during partitions to avoid split-brain inconsistencies.
- AP Systems (e.g., Apache Cassandra, DynamoDB): Accept writes on both sides of partition, resolving conflicts downstream.

--- Page 4 ---
# 3. The PACELC Theorem
Abadi formulated PACELC to describe trade-offs during normal execution when NO partition exists:
If Partition (P), choose Availability (A) or Consistency (C);
Else (E), choose Latency (L) or Consistency (C).
For example, MongoDB is PC/EC (prefers consistency in both states), while Cassandra is PA/EL (prefers availability and low latency).

--- Page 5 ---
# 4. Quorum Consensus Models
In distributed storage with N nodes, read and write quorums (R and W) enforce consistency:
- If R + W > N, the read quorum and write quorum overlap by at least one node, ensuring strong read-your-writes consistency.
- If R + W <= N, stale reads are possible, yielding eventual consistency.

--- Page 6 ---
# 5. The Raft Consensus Algorithm
Ongaro & Ousterhout designed Raft as an understandable alternative to Paxos. Raft decomposes consensus into:
1. Leader Election: Nodes use randomized election timers (150-300ms) to vote for candidate leaders.
2. Log Replication: The leader appends client entries, sends AppendEntries RPCs to followers, and commits once a majority quorum acknowledges.
3. State Machine Safety: If a leader commits an entry, no other node can apply a different entry for that log index.

--- Page 7 ---
# 6. Byzantine Fault Tolerance (BFT)
Crash-fault tolerant protocols (Raft, Paxos) assume nodes are benign and only crash. Byzantine protocols (PBFT) handle malicious or corrupted nodes, requiring 3F + 1 total nodes to tolerate F Byzantine failures.

--- Page 8 ---
# 7. Distributed Transactions: Two-Phase Commit (2PC)
2PC coordinates atomic updates across distributed databases:
- Phase 1 (Prepare): Coordinator sends PREPARE to cohorts. Cohorts write undo/redo logs and vote YES or NO.
- Phase 2 (Commit): If all vote YES, coordinator broadcasts COMMIT. If any vote NO, coordinator broadcasts ABORT.
2PC is a blocking protocol: if the coordinator crashes during Phase 2, cohorts must wait indefinitely holding locks.

--- Page 9 ---
# 8. Vector Clocks and Conflict Resolution
In decentralized systems without global clocks, Vector Clocks associate each event with a vector of logical timestamps V = [v1, v2, ... vn], establishing causal dependencies and detecting concurrent write conflicts (e.g., in DynamoDB).

--- Page 10 ---
# 9. Eventual Consistency & The Saga Pattern
For microservices architectures, the Saga Pattern breaks a distributed business transaction into a sequence of local transactions. Each step publishes an event; if a step fails, compensating transactions are executed in reverse order to undo earlier changes without distributed locking.`
  }
};
