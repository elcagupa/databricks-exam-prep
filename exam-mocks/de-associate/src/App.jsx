import { useState, useEffect, useCallback } from "react";

const DOMAINS = [
  { id: 1, name: "Databricks Intelligence Platform", weight: 10, color: "#FF6B35" },
  { id: 2, name: "Development & Ingestion", weight: 30, color: "#4A90D9" },
  { id: 3, name: "Data Processing & Transformations", weight: 31, color: "#7B4FBF" },
  { id: 4, name: "Productionizing Data Pipelines", weight: 18, color: "#27AE60" },
  { id: 5, name: "Data Governance & Quality", weight: 11, color: "#E74C3C" },
];

const ALL_QUESTIONS = [
  // Domain 1 – Platform (10%)
  { id:1, domain:1, q:"Which component of the classic Databricks architecture is hosted completely in the control plane?", opts:["Worker node","JDBC data source","Databricks web application","Driver node"], ans:2, exp:"The Databricks web application (UI) runs in the control plane managed by Databricks. Driver and worker nodes run in the customer's data plane." },
  { id:2, domain:1, q:"Which Databricks feature automatically optimizes file sizes and data layout to improve query performance without manual intervention?", opts:["VACUUM","Predictive Optimization","Z-Ordering","OPTIMIZE with HOZ"], ans:1, exp:"Predictive Optimization is an intelligent feature that automatically runs OPTIMIZE and VACUUM on Delta tables, simplifying data layout decisions." },
  { id:3, domain:1, q:"A team needs ad-hoc SQL queries run by multiple analysts concurrently with no cluster management overhead. Which compute type is most appropriate?", opts:["All-purpose cluster","Job cluster","SQL Warehouse","Single-node cluster"], ans:2, exp:"SQL Warehouses are purpose-built for SQL analytics, support concurrency, and require no cluster management – ideal for analyst teams." },
  { id:4, domain:1, q:"Which benefit of the Databricks Lakehouse Platform is provided specifically by Delta Lake?", opts:["Real-time notebook collaboration","Setting query failure alerts","Support for batch and streaming workloads","Distributing complex operations across languages"], ans:2, exp:"Delta Lake's transaction log and streaming APIs make it possible to support both batch and streaming workloads on the same table." },
  { id:5, domain:1, q:"A data engineer needs a compute environment for a long-running ML training job that runs nightly. Which cluster type is most cost-effective?", opts:["SQL Warehouse","All-purpose cluster","Job cluster","High-concurrency cluster"], ans:2, exp:"Job clusters are created for a single job run and terminated automatically after completion, making them most cost-effective for scheduled jobs." },

  // Domain 2 – Development & Ingestion (30%)
  { id:6, domain:2, q:"A data engineer uses Databricks Connect to run code. What is the primary advantage of this approach?", opts:["It allows notebooks to run on external Kubernetes clusters","It enables IDE-based local development while running computations on a remote Databricks cluster","It replaces Auto Loader for file ingestion","It provides a REST API for triggering jobs"], ans:1, exp:"Databricks Connect lets you use your local IDE (VS Code, PyCharm) while executing Spark code on a remote Databricks cluster." },
  { id:7, domain:2, q:"Which of the following is a valid Auto Loader source?", opts:["JDBC database tables","Files landing in cloud object storage (S3, ADLS, GCS)","Kafka topics directly","REST API endpoints"], ans:1, exp:"Auto Loader is designed to incrementally ingest files landing in cloud object storage (S3, ADLS, GCS). It cannot directly read JDBC, Kafka, or REST APIs." },
  { id:8, domain:2, q:"Which Auto Loader format option correctly reads JSON files from a cloud path?", opts:["spark.readStream.format('cloudFiles').option('cloudFiles.format','json').load(path)","spark.readStream.format('autoloader').option('format','json').load(path)","spark.readStream.format('json').option('cloudFiles.source',path).load()","spark.read.format('cloudFiles').option('cloudFiles.format','json').load(path)"], ans:0, exp:"Auto Loader uses the 'cloudFiles' format. The cloudFiles.format option specifies the file type. readStream is required for incremental ingestion." },
  { id:9, domain:2, q:"A data engineer notices a notebook cell is throwing an unexpected error. Which Databricks built-in tool helps inspect the full stack trace and variable state?", opts:["Spark UI","Ganglia metrics","%debug magic command / interactive debugger","EXPLAIN command"], ans:2, exp:"Databricks notebooks support Python's interactive debugger (%debug) to step through code and inspect variables after an exception." },
  { id:10, domain:2, q:"Which statement correctly describes notebook magic commands in Databricks?", opts:["Magic commands allow switching languages per cell, such as %sql or %python","Magic commands replace all SQL with Python","Magic commands only work in Scala notebooks","Magic commands require a restart to take effect"], ans:0, exp:"%sql, %python, %scala, %r, and %sh magic commands allow per-cell language switching in Databricks notebooks." },
  { id:11, domain:2, q:"A data engineer wants to incrementally load new CSV files dropped into an S3 bucket without reprocessing old files. Which approach is best?", opts:["COPY INTO","Auto Loader with cloudFiles format","spark.read.csv() with a watermark","readStream with format('csv')"], ans:1, exp:"Auto Loader tracks already-processed files using checkpointing, making it ideal for incremental ingestion of new files without reprocessing." },
  { id:12, domain:2, q:"What does the COPY INTO command do when run multiple times on the same source files?", opts:["It re-ingests all files each run","It is idempotent – it only loads files not yet processed","It raises a DuplicateFileError","It appends duplicate records"], ans:1, exp:"COPY INTO is idempotent. It tracks which files have been loaded and skips them on subsequent runs, preventing duplicate ingestion." },
  { id:13, domain:2, q:"Which notebook feature allows a data engineer to pass parameters at runtime to a notebook?", opts:["%run magic","dbutils.widgets","Spark conf","Task values"], ans:1, exp:"dbutils.widgets allow notebooks to accept runtime input parameters, making notebooks reusable and parameterizable." },

  // Domain 3 – Data Processing & Transformations (31%)
  { id:14, domain:3, q:"In the Medallion Architecture, which layer stores raw, unprocessed data exactly as received from source systems?", opts:["Gold","Silver","Bronze","Platinum"], ans:2, exp:"The Bronze layer ingests raw data as-is from source systems, without transformation, providing the full historical record." },
  { id:15, domain:3, q:"Which Medallion layer typically contains cleaned, validated, and deduplicated data?", opts:["Bronze","Gold","Silver","Raw"], ans:2, exp:"The Silver layer applies data quality checks, deduplication, and light transformations to produce a clean, conformed dataset." },
  { id:16, domain:3, q:"A data engineer needs to count unique billing IDs per day from a PySpark DataFrame billing_df. Which code is correct?", opts:["billing_df.groupBy('billing_date').agg(sum('billing_id').alias('total'))","billing_df.groupBy('billing_date').agg(count_distinct('billing_id').alias('total'))","billing_df.groupBy('billing_date').agg(count('billing_id').alias('total'))","billing_df.groupBy('billing_date').agg(col('billing_id').alias('total'))"], ans:1, exp:"count_distinct() counts unique values. count() counts all (including duplicates). sum() adds values numerically, not counts distinct IDs." },
  { id:17, domain:3, q:"Which DDL statement creates a Delta table only if it does NOT already exist?", opts:["CREATE OR REPLACE TABLE t (id STRING)","CREATE TABLE IF NOT EXISTS t (id STRING)","CREATE TABLE t AS SELECT id STRING","REPLACE TABLE t (id STRING)"], ans:1, exp:"CREATE TABLE IF NOT EXISTS skips creation if the table exists. CREATE OR REPLACE would drop and recreate it." },
  { id:18, domain:3, q:"A data engineer needs to append a single new row ('a1', 6, 9.4) to existing Delta table my_table. Which SQL command is correct?", opts:["UPDATE VALUES ('a1',6,9.4) my_table","INSERT INTO my_table VALUES ('a1',6,9.4)","INSERT VALUES ('a1',6,9.4) INTO my_table","UPDATE my_table VALUES ('a1',6,9.4)"], ans:1, exp:"INSERT INTO table VALUES (...) is standard SQL for appending rows. UPDATE modifies existing rows; it cannot add new ones." },
  { id:19, domain:3, q:"What is the primary advantage of Lakeflow Spark Declarative Pipelines (formerly Delta Live Tables) for ETL?", opts:["They eliminate the need for any SQL","They automatically manage dependencies, retries, and data quality expectations","They only work with batch data","They replace Unity Catalog governance"], ans:1, exp:"Lakeflow Spark Declarative Pipelines (DLT) automatically manage pipeline dependencies, handle retries, and enforce data quality expectations via EXPECT clauses." },
  { id:20, domain:3, q:"In a Lakeflow Spark Declarative Pipeline, which keyword defines a streaming table that continuously processes new data?", opts:["CREATE LIVE TABLE","CREATE OR REFRESH STREAMING LIVE TABLE","CREATE STREAMING TABLE","DEFINE STREAMING TABLE"], ans:1, exp:"CREATE OR REFRESH STREAMING LIVE TABLE defines a streaming table in Lakeflow Spark Declarative Pipelines that processes data incrementally." },
  { id:21, domain:3, q:"Which cluster configuration is best for ML workloads requiring GPU acceleration?", opts:["Standard cluster with auto-scaling","Single-node cluster with GPU instance type","SQL Warehouse with photon enabled","High-concurrency cluster"], ans:1, exp:"GPU-accelerated ML workloads require a cluster type and instance type that supports GPUs. Single-node GPU clusters are common for experimentation." },
  { id:22, domain:3, q:"What does the MERGE INTO statement do in Delta Lake?", opts:["It only inserts new records","It performs upserts – insert, update, or delete based on a match condition","It compacts small files","It merges two schemas"], ans:1, exp:"MERGE INTO performs upsert operations: matched rows can be updated or deleted; unmatched rows can be inserted, all in a single atomic operation." },
  { id:23, domain:3, q:"A data engineer uses INSERT OVERWRITE on a Delta table. What is the key consideration?", opts:["It only adds new partitions","It atomically replaces the table data (or partition) and retains Delta history","It permanently deletes history","It cannot be rolled back"], ans:1, exp:"INSERT OVERWRITE atomically replaces data while keeping Delta transaction history, allowing time travel to previous versions." },
  { id:24, domain:3, q:"What is Z-Ordering in Databricks used for?", opts:["Replicating data across regions","Co-locating related data in the same files to speed up queries with filter predicates","Compressing Delta tables","Sorting data alphabetically"], ans:1, exp:"Z-Ordering co-locates related data in the same set of files, so queries with filter predicates on Z-ordered columns read fewer files (data skipping)." },

  // Domain 4 – Productionizing (18%)
  { id:25, domain:4, q:"What is a Databricks Asset Bundle (DAB)?", opts:["A ZIP archive of notebooks","A YAML-based project structure that packages workflows, clusters, and resources for CI/CD deployment","A Delta table export format","A type of SQL Warehouse configuration"], ans:1, exp:"DABs use YAML configuration to define Databricks resources (jobs, clusters, pipelines) as code, enabling repeatable CI/CD deployments." },
  { id:26, domain:4, q:"How does a Databricks Asset Bundle deployment differ from traditional deployment methods?", opts:["DABs require manual cluster creation before deployment","DABs use infrastructure-as-code enabling environment promotion and version control","DABs only support Python notebooks","DABs require Terraform exclusively"], ans:1, exp:"DABs represent resources as code (YAML + source files), supporting environment promotion (dev→staging→prod) and Git-based versioning, unlike manual UI-based deployments." },
  { id:27, domain:4, q:"A data engineer's workflow task fails midway. How can they rerun only the failed task without re-executing successful upstream tasks?", opts:["Delete and recreate the entire workflow","Use 'Repair and Rerun' on the failed task in the workflow run UI","Rerun the full workflow from the beginning","Manually trigger each downstream task"], ans:1, exp:"The 'Repair and Rerun' feature in Databricks Workflows lets you retry only the failed task (and its dependents), skipping successfully completed tasks." },
  { id:28, domain:4, q:"What is the key benefit of using Serverless compute for data engineering jobs?", opts:["Requires manual cluster sizing","Provides auto-optimized, fully managed compute with no cluster configuration overhead","Only available for SQL queries","Has higher latency than classic clusters"], ans:1, exp:"Serverless compute is fully managed by Databricks – no cluster configuration, auto-scaling, and faster startup times, reducing operational overhead." },
  { id:29, domain:4, q:"In the Spark UI, which tab helps identify shuffle-heavy stages causing performance bottlenecks?", opts:["SQL tab","Storage tab","Stages tab showing shuffle read/write metrics","Environment tab"], ans:2, exp:"The Stages tab in Spark UI shows shuffle read/write sizes per stage. High shuffle metrics indicate data redistribution bottlenecks to optimize." },
  { id:30, domain:4, q:"A data engineer needs to prevent a specific notebook task from running on Sundays. Which approach works in Databricks Workflows?", opts:["Add a cron expression that excludes Sundays","Use a conditional task with a custom logic notebook that exits early on Sundays","Set task type to 'Skip Sundays'","Use dbutils.notebook.exit() with a day check"], ans:3, exp:"Using Python's datetime to check the weekday and calling dbutils.notebook.exit() skips execution logic on Sundays within the task." },
  { id:31, domain:4, q:"Which component of a Databricks Asset Bundle defines the target environment configurations?", opts:["resources/ directory","databricks.yml targets section","src/ directory","requirements.txt"], ans:1, exp:"The databricks.yml file contains the 'targets' section that defines environment-specific configurations (dev, staging, prod) for a DAB." },

  // Domain 5 – Governance & Quality (11%)
  { id:32, domain:5, q:"What happens to data files when a MANAGED Delta table is dropped in Unity Catalog?", opts:["Data files are retained; only metadata is deleted","Data files are also deleted along with the metadata","Data files are moved to the external location","Data files are archived to cloud storage"], ans:0, exp:"With MANAGED tables, dropping the table deletes both the metadata AND the underlying data files. With EXTERNAL tables, only metadata is removed." },
  { id:33, domain:5, q:"A data engineer wants to grant the analyst group read-only access to the sales_data schema. They already have USE CATALOG and USE SCHEMA. Which SQL is correct?", opts:["GRANT ALL PRIVILEGES ON SCHEMA sales_data TO analysts","GRANT SELECT ON SCHEMA sales_data TO analysts","GRANT INSERT ON SCHEMA sales_data TO analysts","GRANT SELECT ON ALL TABLES IN SCHEMA sales_data TO analysts"], ans:1, exp:"GRANT SELECT ON SCHEMA grants SELECT on all current and future tables in the schema. GRANT SELECT ON ALL TABLES only covers existing tables." },
  { id:34, domain:5, q:"Which role in Unity Catalog has the highest level of administrative control over a metastore?", opts:["Schema owner","Catalog owner","Metastore admin","Account admin"], ans:2, exp:"The Metastore Admin in Unity Catalog has the broadest permissions, including managing catalogs, external locations, and storage credentials." },
  { id:35, domain:5, q:"A data engineer configures Delta Sharing for external partners. What permission can external partners receive through a Delta Share?", opts:["READ/WRITE on the share","READ only on the share","Admin access to the Unity Catalog","Full SQL privileges"], ans:1, exp:"Delta Sharing only grants READ permissions to recipients. External partners cannot write to shared data; write access is managed internally through UC." },
  { id:36, domain:5, q:"Where are Unity Catalog audit logs stored by default?", opts:["In the workspace's root DBFS","In a system.access.audit table within the Unity Catalog system catalog","In the driver node logs","In Spark event logs"], ans:1, exp:"Unity Catalog audit logs are written to the system.access.audit table in the Unity Catalog system catalog, queryable via SQL." },
  { id:37, domain:5, q:"Which Unity Catalog feature allows data engineers to track how data moves from source tables through transformations to final tables?", opts:["Delta Sharing","Audit Logs","Data Lineage","Table ACLs"], ans:2, exp:"Unity Catalog's Data Lineage feature automatically captures column-level and table-level lineage, showing how data flows across pipelines." },
  { id:38, domain:5, q:"A company wants to share data with a partner company using Databricks. The partner uses their own Databricks workspace. Which sharing type applies?", opts:["External Delta Sharing","Databricks-to-Databricks Delta Sharing","JDBC Federation","Lakehouse Federation"], ans:1, exp:"Databricks-to-Databricks Delta Sharing allows sharing data between Databricks organizations, with the recipient accessing data directly in their workspace." },
  { id:39, domain:5, q:"What is a key cost consideration when using Delta Sharing to share data across different clouds (e.g., AWS to Azure)?", opts:["Delta Sharing is free across clouds","Egress costs are incurred when data crosses cloud provider boundaries","Only ingress is charged","There are no network costs with Delta Sharing"], ans:1, exp:"Cross-cloud data sharing incurs cloud egress charges since data physically travels across cloud providers. This is a key cost consideration." },
  { id:40, domain:5, q:"A data engineer needs to query data from an external PostgreSQL database without moving the data into Databricks. Which feature enables this?", opts:["Delta Sharing","Auto Loader","Lakehouse Federation","Unity Catalog External Tables"], ans:2, exp:"Lakehouse Federation allows Databricks to query external database systems (PostgreSQL, MySQL, Snowflake) in-place via federated query, without data movement." },
  { id:41, domain:5, q:"How can a data engineer tag a table column as containing PII data in Unity Catalog?", opts:["Using ALTER TABLE SET TBLPROPERTIES with a pii key","Using Unity Catalog tags (ALTER TABLE column SET TAGS)","Using COMMENT on column during CREATE TABLE","Both B and C are valid approaches"], ans:3, exp:"Both column-level COMMENT (used during creation) and Unity Catalog TAGS (ALTER TABLE ... ALTER COLUMN ... SET TAGS) can mark PII. Tags are the preferred governance approach." },
  { id:42, domain:5, q:"A data engineer dropped a managed Unity Catalog table but needs to recover it. Which approach works?", opts:["Run UNDROP TABLE","Restore from Delta time travel using RESTORE TABLE","Use DESCRIBE HISTORY and re-create the table","Managed table data cannot be recovered after DROP"], ans:3, exp:"Once a managed table is dropped in Unity Catalog, the data files are deleted. Unlike external tables, there is no recovery path. Always use external tables for critical data that may need recovery." },

  // Mixed advanced questions
  { id:43, domain:2, q:"Which statement about COPY INTO vs Auto Loader is correct?", opts:["Auto Loader is better for large-scale continuous streaming ingestion; COPY INTO is better for one-time or occasional batch loads","COPY INTO supports streaming; Auto Loader does not","Both are exactly equivalent in all scenarios","COPY INTO uses Structured Streaming internally"], ans:0, exp:"COPY INTO is simpler for batch/one-time loads. Auto Loader scales better for continuous streaming with millions of files using directory listing or file notification mode." },
  { id:44, domain:3, q:"A Lakeflow pipeline uses EXPECT clause on a table. What happens to records violating the expectation when using 'on violation DROP ROW'?", opts:["The pipeline fails","Violating rows are quarantined in a separate table","Violating rows are silently dropped and metrics are tracked in the event log","The pipeline skips the entire batch"], ans:2, exp:"With 'on violation DROP ROW', violating records are dropped from the output. Data quality metrics (valid/invalid counts) are tracked in the pipeline event log." },
  { id:45, domain:4, q:"A data engineer wants to see which Databricks Workflows tasks share data. Which feature enables this?", opts:["Cluster logs","Task values (dbutils.jobs.taskValues)","Job output notebooks","dbutils.widgets"], ans:1, exp:"dbutils.jobs.taskValues.set() and .get() allow tasks within a Databricks Workflow to pass data between each other at runtime." },
];

const QUIZ_SIZE = 45;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDomainColor(id) {
  return DOMAINS.find(d => d.id === id)?.color || "#999";
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home | quiz | results
  const [mode, setMode] = useState("full"); // full | domain | quick
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const startQuiz = (m, domId = null) => {
    setMode(m);
    setSelectedDomain(domId);
    let pool = domId ? ALL_QUESTIONS.filter(q => q.domain === domId) : ALL_QUESTIONS;
    const size = m === "quick" ? 10 : Math.min(QUIZ_SIZE, pool.length);
    const qs = shuffle(pool).slice(0, size);
    setQuestions(qs);
    setAnswers({});
    setCurrent(0);
    setRevealed(false);
    const secs = m === "quick" ? 600 : 5400;
    setTimeLeft(secs);
    setTimerActive(true);
    setScreen("quiz");
  };

  const selectAnswer = (idx) => {
    if (answers[questions[current].id] !== undefined) return;
    setAnswers(a => ({ ...a, [questions[current].id]: idx }));
    setRevealed(true);
  };

  const next = () => {
    setRevealed(false);
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setTimerActive(false);
      setScreen("results");
    }
  };

  const score = () => questions.filter(q => answers[q.id] === q.ans).length;

  const domainScore = (domId) => {
    const qs = questions.filter(q => q.domain === domId);
    if (!qs.length) return null;
    const correct = qs.filter(q => answers[q.id] === q.ans).length;
    return { correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) };
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const timerColor = timeLeft < 300 ? "#E74C3C" : timeLeft < 600 ? "#F39C12" : "#27AE60";

  if (screen === "home") return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.4)", borderRadius: 50, padding: "6px 18px", marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <span style={{ color: "#FF6B35", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>CERTIFICATION PREP · NOV 2025 EXAM GUIDE</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px", fontWeight: 700 }}>Databricks Certified</h1>
          <h1 style={{ color: "#FF6B35", fontSize: 32, margin: "0 0 12px", fontWeight: 800 }}>Data Engineer Associate</h1>
          <p style={{ color: "#aab", fontSize: 15, margin: 0 }}>45 questions · 90 min · Multiple choice · $200 · 80% passing score</p>
        </div>

        {/* Domain overview */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 20, marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 15, letterSpacing: 0.5 }}>EXAM DOMAINS</h3>
          {DOMAINS.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: d.color + "30", border: `1px solid ${d.color}60`, display: "flex", alignItems: "center", justifyContent: "center", color: d.color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{d.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#dde", fontSize: 13 }}>{d.name}</span>
                  <span style={{ color: d.color, fontWeight: 700, fontSize: 13 }}>{d.weight}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <div style={{ width: `${d.weight * 2.5}%`, height: "100%", background: d.color, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quiz modes */}
        <h3 style={{ color: "#aab", fontSize: 13, letterSpacing: 1, margin: "0 0 12px" }}>CHOOSE QUIZ MODE</h3>
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {[
            { icon: "📋", label: "Full Mock Exam", desc: `${Math.min(QUIZ_SIZE, ALL_QUESTIONS.length)} questions · 90 min timer · All domains`, action: () => startQuiz("full") },
            { icon: "⚡", label: "Quick Practice", desc: "10 random questions · 10 min timer", action: () => startQuiz("quick") },
          ].map(m => (
            <button key={m.label} onClick={m.action} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "16px 20px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,107,53,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{m.label}</div>
                <div style={{ color: "#889", fontSize: 13 }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <h3 style={{ color: "#aab", fontSize: 13, letterSpacing: 1, margin: "0 0 12px" }}>PRACTICE BY DOMAIN</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
          {DOMAINS.map(d => (
            <button key={d.id} onClick={() => startQuiz("domain", d.id)} style={{ background: `${d.color}15`, border: `1px solid ${d.color}40`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = `${d.color}30`}
              onMouseLeave={e => e.currentTarget.style.background = `${d.color}15`}>
              <div style={{ color: d.color, fontWeight: 700, fontSize: 22, marginBottom: 4 }}>D{d.id}</div>
              <div style={{ color: "#dde", fontSize: 12, lineHeight: 1.4 }}>{d.name}</div>
              <div style={{ color: d.color, fontSize: 12, marginTop: 6 }}>{d.weight}% of exam · {ALL_QUESTIONS.filter(q => q.domain === d.id).length} Qs</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "quiz") {
    const q = questions[current];
    const chosen = answers[q.id];
    const isCorrect = chosen === q.ans;
    const domColor = getDomainColor(q.domain);
    const domName = DOMAINS.find(d => d.id === q.domain)?.name;
    const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100;

    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "16px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => { setTimerActive(false); setScreen("home"); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#aab", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
            <div style={{ textAlign: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>{current + 1}</span>
              <span style={{ color: "#889" }}> / {questions.length}</span>
            </div>
            <div style={{ color: timerColor, fontWeight: 700, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{fmt(timeLeft)}</div>
          </div>

          {/* Progress */}
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 20 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#FF6B35", borderRadius: 2, transition: "width 0.3s" }} />
          </div>

          {/* Domain badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${domColor}20`, border: `1px solid ${domColor}50`, borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: domColor, display: "inline-block" }} />
            <span style={{ color: domColor, fontSize: 12, fontWeight: 600 }}>Domain {q.domain}: {domName}</span>
          </div>

          {/* Question */}
          <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <p style={{ color: "#fff", fontSize: 16, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{q.q}</p>
          </div>

          {/* Options */}
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {q.opts.map((opt, i) => {
              let bg = "rgba(255,255,255,0.05)";
              let border = "rgba(255,255,255,0.12)";
              let color = "#dde";
              if (revealed) {
                if (i === q.ans) { bg = "rgba(39,174,96,0.2)"; border = "#27AE60"; color = "#2ecc71"; }
                else if (i === chosen && chosen !== q.ans) { bg = "rgba(231,76,60,0.2)"; border = "#E74C3C"; color = "#e74c3c"; }
              }
              return (
                <button key={i} onClick={() => selectAnswer(i)} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: "14px 18px", cursor: revealed ? "default" : "pointer", textAlign: "left", color, fontSize: 14, lineHeight: 1.5, transition: "all 0.2s", display: "flex", alignItems: "flex-start", gap: 12 }}
                  onMouseEnter={e => { if (!revealed) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { if (!revealed) e.currentTarget.style.background = bg; }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                  <span style={{ fontFamily: opt.includes("(") || opt.includes(".agg") || opt.includes("SELECT") || opt.includes("INSERT") || opt.includes("GRANT") ? "monospace" : "inherit", fontSize: opt.length > 80 ? 12 : 14 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <div style={{ background: isCorrect ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", border: `1px solid ${isCorrect ? "#27AE60" : "#E74C3C"}40`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{isCorrect ? "✅" : "❌"}</span>
                <span style={{ color: isCorrect ? "#2ecc71" : "#e74c3c", fontWeight: 700, fontSize: 15 }}>{isCorrect ? "Correct!" : `Incorrect — Answer: ${String.fromCharCode(65 + q.ans)}`}</span>
              </div>
              <p style={{ color: "#ccd", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{q.exp}</p>
            </div>
          )}

          {revealed && (
            <button onClick={next} style={{ width: "100%", background: "#FF6B35", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {current < questions.length - 1 ? "Next Question →" : "View Results 🏆"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === "results") {
    const total = questions.length;
    const correct = score();
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= 80;

    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "24px 16px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Score hero */}
          <div style={{ background: passed ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", border: `1px solid ${passed ? "#27AE60" : "#E74C3C"}40`, borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{passed ? "🎉" : "📚"}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: passed ? "#2ecc71" : "#e74c3c" }}>{pct}%</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{passed ? "Exam Ready!" : "Keep Studying"}</div>
            <div style={{ color: "#aab", fontSize: 14 }}>{correct} / {total} correct · Passing score: 80%</div>
          </div>

          {/* Domain breakdown */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 15 }}>PERFORMANCE BY DOMAIN</h3>
            {DOMAINS.map(d => {
              const ds = domainScore(d.id);
              if (!ds) return null;
              return (
                <div key={d.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: "#ccd", fontSize: 13 }}>D{d.id}: {d.name}</span>
                    <span style={{ color: ds.pct >= 80 ? "#2ecc71" : "#e74c3c", fontWeight: 700, fontSize: 13 }}>{ds.correct}/{ds.total} ({ds.pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                    <div style={{ width: `${ds.pct}%`, height: "100%", background: ds.pct >= 80 ? "#27AE60" : ds.pct >= 60 ? "#F39C12" : "#E74C3C", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review wrong answers */}
          {questions.filter(q => answers[q.id] !== q.ans).length > 0 && (
            <div style={{ background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: "#e74c3c", margin: "0 0 16px", fontSize: 15 }}>❌ REVIEW MISSED QUESTIONS</h3>
              {questions.filter(q => answers[q.id] !== q.ans).map((q, i) => (
                <div key={q.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ color: "#ccd", fontSize: 13, marginBottom: 6, lineHeight: 1.5 }}><strong>{i + 1}.</strong> {q.q}</div>
                  <div style={{ color: "#e74c3c", fontSize: 12 }}>Your answer: {q.opts[answers[q.id]] || "Unanswered"}</div>
                  <div style={{ color: "#2ecc71", fontSize: 12 }}>Correct: {q.opts[q.ans]}</div>
                  <div style={{ color: "#889", fontSize: 12, marginTop: 4 }}>{q.exp}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={() => startQuiz(mode, selectedDomain)} style={{ background: "#FF6B35", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>🔄 Retry</button>
            <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "14px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>🏠 Home</button>
          </div>
        </div>
      </div>
    );
  }
}
