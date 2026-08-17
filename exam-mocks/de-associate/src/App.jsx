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
  { id:32, domain:5, q:"What happens to data files when a MANAGED Delta table is dropped in Unity Catalog?", opts:["Data files are retained; only metadata is deleted","Data files are also deleted along with the metadata","Data files are moved to the external location","Data files are archived to cloud storage"], ans:1, exp:"With MANAGED tables, dropping the table deletes both the metadata AND the underlying data files. With EXTERNAL tables, only metadata is removed." },
  { id:33, domain:5, q:"A data engineer wants to grant the analyst group read-only access to the sales_data schema. They already have USE CATALOG and USE SCHEMA. Which SQL is correct?", opts:["GRANT ALL PRIVILEGES ON SCHEMA sales_data TO analysts","GRANT SELECT ON SCHEMA sales_data TO analysts","GRANT INSERT ON SCHEMA sales_data TO analysts","GRANT SELECT ON ALL TABLES IN SCHEMA sales_data TO analysts"], ans:1, exp:"GRANT SELECT ON SCHEMA grants SELECT on all current and future tables in the schema. GRANT SELECT ON ALL TABLES only covers existing tables." },
  { id:34, domain:5, q:"Which role in Unity Catalog has the highest level of administrative control over a metastore?", opts:["Schema owner","Catalog owner","Metastore admin","Account admin"], ans:2, exp:"The Metastore Admin in Unity Catalog has the broadest permissions, including managing catalogs, external locations, and storage credentials." },
  { id:35, domain:5, q:"A data engineer configures Delta Sharing for external partners. What permission can external partners receive through a Delta Share?", opts:["READ/WRITE on the share","READ only on the share","Admin access to the Unity Catalog","Full SQL privileges"], ans:1, exp:"Delta Sharing only grants READ permissions to recipients. External partners cannot write to shared data; write access is managed internally through UC." },
  { id:36, domain:5, q:"Where are Unity Catalog audit logs stored by default?", opts:["In the workspace's root DBFS","In a system.access.audit table within the Unity Catalog system catalog","In the driver node logs","In Spark event logs"], ans:1, exp:"Unity Catalog audit logs are written to the system.access.audit table in the Unity Catalog system catalog, queryable via SQL." },
  { id:37, domain:5, q:"Which Unity Catalog feature allows data engineers to track how data moves from source tables through transformations to final tables?", opts:["Delta Sharing","Audit Logs","Data Lineage","Table ACLs"], ans:2, exp:"Unity Catalog's Data Lineage feature automatically captures column-level and table-level lineage, showing how data flows across pipelines." },
  { id:38, domain:5, q:"A company wants to share data with a partner company using Databricks. The partner uses their own Databricks workspace. Which sharing type applies?", opts:["External Delta Sharing","Databricks-to-Databricks Delta Sharing","JDBC Federation","Lakehouse Federation"], ans:1, exp:"Databricks-to-Databricks Delta Sharing allows sharing data between Databricks organizations, with the recipient accessing data directly in their workspace." },
  { id:39, domain:5, q:"What is a key cost consideration when using Delta Sharing to share data across different clouds (e.g., AWS to Azure)?", opts:["Delta Sharing is free across clouds","Egress costs are incurred when data crosses cloud provider boundaries","Only ingress is charged","There are no network costs with Delta Sharing"], ans:1, exp:"Cross-cloud data sharing incurs cloud egress charges since data physically travels across cloud providers. This is a key cost consideration." },
  { id:40, domain:5, q:"A data engineer needs to query data from an external PostgreSQL database without moving the data into Databricks. Which feature enables this?", opts:["Delta Sharing","Auto Loader","Lakehouse Federation","Unity Catalog External Tables"], ans:2, exp:"Lakehouse Federation allows Databricks to query external database systems (PostgreSQL, MySQL, Snowflake) in-place via federated query, without data movement." },
  { id:41, domain:5, q:"How can a data engineer tag a table column as containing PII data in Unity Catalog?", opts:["Using ALTER TABLE SET TBLPROPERTIES with a pii key","Using Unity Catalog tags (ALTER TABLE column SET TAGS)","Using COMMENT on column during CREATE TABLE","Both B and C are valid approaches"], ans:1, exp:"Unity Catalog TAGS (ALTER TABLE ... ALTER COLUMN ... SET TAGS) are the formal governance mechanism for classifying columns as PII. COMMENT is just free-text documentation, not a structured tagging feature." },
  { id:42, domain:5, q:"A data engineer dropped a managed Unity Catalog table but needs to recover it. Which approach works?", opts:["Run UNDROP TABLE","Restore from Delta time travel using RESTORE TABLE","Use DESCRIBE HISTORY and re-create the table","Managed table data cannot be recovered after DROP"], ans:0, exp:"Unity Catalog supports UNDROP TABLE, which recovers a dropped managed table within a 7-day soft-delete retention window, restoring both metadata and data files." },

  // Mixed advanced questions
  { id:43, domain:2, q:"Which statement about COPY INTO vs Auto Loader is correct?", opts:["Auto Loader is better for large-scale continuous streaming ingestion; COPY INTO is better for one-time or occasional batch loads","COPY INTO supports streaming; Auto Loader does not","Both are exactly equivalent in all scenarios","COPY INTO uses Structured Streaming internally"], ans:0, exp:"COPY INTO is simpler for batch/one-time loads. Auto Loader scales better for continuous streaming with millions of files using directory listing or file notification mode." },
  { id:44, domain:3, q:"A Lakeflow pipeline uses EXPECT clause on a table. What happens to records violating the expectation when using 'on violation DROP ROW'?", opts:["The pipeline fails","Violating rows are quarantined in a separate table","Violating rows are silently dropped and metrics are tracked in the event log","The pipeline skips the entire batch"], ans:2, exp:"With 'on violation DROP ROW', violating records are dropped from the output. Data quality metrics (valid/invalid counts) are tracked in the pipeline event log." },
  { id:45, domain:4, q:"A data engineer wants to see which Databricks Workflows tasks share data. Which feature enables this?", opts:["Cluster logs","Task values (dbutils.jobs.taskValues)","Job output notebooks","dbutils.widgets"], ans:1, exp:"dbutils.jobs.taskValues.set() and .get() allow tasks within a Databricks Workflow to pass data between each other at runtime." },

  // ─── NEW Domain 1: Databricks Intelligence Platform (5 questions) ───
  { id:46, domain:1, q:"What is the purpose of cluster policies in Databricks?", opts:["To schedule job runs at specific times","To restrict and enforce cluster configuration settings for users, such as allowed instance types and max nodes","To define data access permissions on Delta tables","To configure network firewall rules for the workspace"], ans:1, exp:"Cluster policies let admins define rules that restrict cluster creation options (e.g., allowed instance types, autoscaling limits, tags), ensuring cost control and compliance." },
  { id:47, domain:1, q:"A workspace admin wants to manage which users can create personal access tokens (PATs). Which permission level prevents a user from generating PATs?", opts:["CAN USE","CAN MANAGE","NO PERMISSIONS","READ ONLY"], ans:2, exp:"Users with NO PERMISSIONS on token management cannot create or use personal access tokens. CAN USE allows creating/using tokens; CAN MANAGE is for admins to manage all users' tokens." },
  { id:48, domain:1, q:"Which Databricks feature allows data engineers to sync notebooks and project files with a remote Git repository directly from the workspace?", opts:["DBFS mounts","Databricks Repos (Git folders)","Delta Sharing","Databricks Connect"], ans:1, exp:"Databricks Repos (Git folders) integrate Git version control into the workspace, allowing users to clone, commit, push, pull, and manage branches for notebooks and files." },
  { id:49, domain:1, q:"In Unity Catalog, what is the correct three-level namespace for referencing a table?", opts:["metastore.schema.table","workspace.database.table","catalog.schema.table","account.catalog.table"], ans:2, exp:"Unity Catalog uses a three-level namespace: catalog.schema.table (e.g., main.sales.orders). The metastore sits above catalogs but is not part of the object reference path." },
  { id:50, domain:1, q:"Which objects in Unity Catalog sit directly under the metastore rather than inside a catalog?", opts:["Tables and views","Schemas and functions","Storage credentials and external locations","Notebooks and dashboards"], ans:2, exp:"Storage credentials, external locations, connections, and shares are metastore-level securables that sit directly under the metastore, not inside any catalog." },

  // ─── NEW Domain 2: Development & Ingestion (13 questions) ───
  { id:51, domain:2, q:"When Auto Loader encounters a new column in incoming data that was not in the original inferred schema, what happens by default (rescue mode)?", opts:["The stream fails with an UnknownFieldException","The new column is automatically added to the target table schema","The new column data is placed into the _rescued_data column as JSON","The new records are silently dropped"], ans:2, exp:"By default, Auto Loader uses rescue mode, placing unexpected or new column data into the _rescued_data column in JSON format rather than failing or evolving the schema." },
  { id:52, domain:2, q:"Which Auto Loader option should be set to 'addNewColumns' to automatically evolve the schema when new fields appear in source files?", opts:["cloudFiles.format","cloudFiles.schemaLocation","cloudFiles.schemaEvolutionMode","cloudFiles.inferColumnTypes"], ans:2, exp:"Setting cloudFiles.schemaEvolutionMode to 'addNewColumns' causes Auto Loader to automatically add new columns to the schema when they appear in incoming data files." },
  { id:53, domain:2, q:"What is the key difference between Auto Loader's directory listing mode and file notification mode?", opts:["Directory listing mode only works with JSON files; file notification works with all formats","Directory listing mode scans the input directory for new files; file notification uses cloud event subscriptions for better scalability with large directories","File notification mode is only available on AWS, not Azure or GCP","Directory listing mode requires a schema location; file notification does not"], ans:1, exp:"Directory listing mode periodically lists files in the directory. File notification mode sets up cloud-native event notifications (e.g., AWS SNS/SQS, Azure Event Grid) for scalable detection of new files in large directories." },
  { id:54, domain:2, q:"A data engineer wants to enforce that incoming data must match an existing Delta table schema exactly, rejecting any writes with extra or mismatched columns. Which Delta Lake feature provides this?", opts:["Schema evolution","Schema enforcement (schema validation)","MERGE schema auto-merge","Rescue data column"], ans:1, exp:"Schema enforcement (also called schema validation) rejects writes that do not match the table's existing schema, preventing accidental schema corruption. It is enabled by default on Delta tables." },
  { id:55, domain:2, q:"Which option enables automatic schema evolution during a MERGE INTO operation, allowing new columns from the source to be added to the target Delta table?", opts:["spark.databricks.delta.schema.autoMerge.enabled = true","MERGE INTO ... USING ... ON ... WITH SCHEMA EVOLUTION","ALTER TABLE target ADD COLUMNS (auto)","SET spark.sql.adaptive.enabled = true"], ans:0, exp:"Setting spark.databricks.delta.schema.autoMerge.enabled to true allows MERGE, INSERT, and UPDATE operations to automatically add new columns from the source to the target table." },
  { id:56, domain:2, q:"In Structured Streaming, what does the trigger option Trigger.AvailableNow() do?", opts:["Processes one micro-batch then stops permanently","Processes all available data in incremental micro-batches then stops the stream","Continuously processes data with the lowest possible latency","Processes data once every 10 seconds"], ans:1, exp:"Trigger.AvailableNow() processes all currently available data in multiple micro-batches (respecting rate limits), then automatically stops. It replaces the deprecated Trigger.Once()." },
  { id:57, domain:2, q:"What is the purpose of the foreachBatch sink in Structured Streaming?", opts:["To write streaming output to a console for debugging","To apply arbitrary batch DataFrame operations (such as MERGE) to the output of each streaming micro-batch","To trigger an external REST API call for each record","To partition streaming output into separate Delta tables by date"], ans:1, exp:"foreachBatch receives each micro-batch as a standard DataFrame along with its batch ID, allowing any batch operation (e.g., Delta MERGE, writes to non-streaming sinks like JDBC) within a single streaming query." },
  { id:58, domain:2, q:"A data engineer writes a streaming query with .trigger(processingTime='30 seconds'). What does this configuration mean?", opts:["The query will stop after 30 seconds","Each micro-batch will take exactly 30 seconds to process","The system will check for and process new data every 30 seconds","Records older than 30 seconds will be dropped"], ans:2, exp:"Trigger.ProcessingTime('30 seconds') configures the streaming engine to initiate a new micro-batch every 30 seconds. If a batch takes longer, the next batch starts immediately after completion." },
  { id:59, domain:2, q:"Which command allows a parent notebook to run a child notebook and receive its exit value in Databricks?", opts:["%run ./child_notebook","dbutils.notebook.run('./child_notebook', timeout_seconds=60)","import child_notebook","spark.run('child_notebook')"], ans:1, exp:"dbutils.notebook.run() executes a child notebook and returns its exit value (set via dbutils.notebook.exit()). %run includes the child inline but does not return a value programmatically." },
  { id:60, domain:2, q:"When writing to a Delta table with .option('mergeSchema', 'true'), what happens?", opts:["The entire table schema is overwritten with the DataFrame's schema","New columns from the DataFrame are added to the existing table schema without removing existing columns","Data is merged using a primary key lookup","The DataFrame schema is forced to match the existing table schema exactly"], ans:1, exp:"The mergeSchema option adds new columns from the DataFrame to the existing table schema. It does not remove existing columns or overwrite the schema entirely (that would be overwriteSchema)." },
  { id:61, domain:2, q:"What is the _rescued_data column in Auto Loader used for?", opts:["It stores a backup copy of every record for disaster recovery","It captures fields that do not match the inferred or provided schema, including type mismatches and unexpected columns","It logs Auto Loader performance metrics for each batch","It holds the checkpoint file paths for processed files"], ans:1, exp:"The _rescued_data column stores data that does not conform to the expected schema — such as new or unexpected columns and type mismatches — as a JSON string for later analysis." },
  { id:62, domain:2, q:"Which cloudFiles.schemaEvolutionMode setting causes the streaming job to fail when new columns are detected, requiring manual schema updates?", opts:["rescue","addNewColumns","failOnNewColumns","none"], ans:2, exp:"With failOnNewColumns, Auto Loader throws an UnknownFieldException when new columns appear, forcing the data engineer to manually update the schema before restarting the stream." },
  { id:63, domain:2, q:"A data engineer needs to write streaming data to both a Delta table and an external JDBC database in each micro-batch. Which approach should they use?", opts:["Chain two separate writeStream calls on the same DataFrame","Use foreachBatch to write the micro-batch DataFrame to both sinks within the same function","Use Trigger.AvailableNow() with two output modes","Use COPY INTO for the JDBC database"], ans:1, exp:"foreachBatch allows you to apply multiple write operations to each micro-batch DataFrame, enabling writes to multiple sinks (Delta table and JDBC) within a single streaming query." },

  // ─── NEW Domain 3: Data Processing & Transformations (14 questions) ───
  { id:64, domain:3, q:"Which SQL window function assigns a unique sequential integer to each row within a partition, with no gaps even for tied values?", opts:["RANK()","DENSE_RANK()","ROW_NUMBER()","NTILE()"], ans:2, exp:"ROW_NUMBER() assigns a unique sequential integer to each row within a partition. Unlike RANK() or DENSE_RANK(), it never produces duplicate or tied numbers." },
  { id:65, domain:3, q:"What is the difference between RANK() and DENSE_RANK() window functions?", opts:["RANK() is for strings only; DENSE_RANK() is for numbers only","RANK() leaves gaps in ranking after ties (e.g., 1,1,3); DENSE_RANK() produces consecutive ranks without gaps (e.g., 1,1,2)","DENSE_RANK() requires a PARTITION BY clause; RANK() does not","There is no difference; they are aliases for each other"], ans:1, exp:"RANK() leaves gaps after ties (e.g., 1,1,3), while DENSE_RANK() produces consecutive ranks without gaps (e.g., 1,1,2). Both support PARTITION BY and ORDER BY." },
  { id:66, domain:3, q:"Which Spark SQL higher-order function applies a lambda expression to transform each element of an array column?", opts:["explode()","collect_list()","transform()","flatten()"], ans:2, exp:"transform() is a higher-order function that applies a lambda expression to every element of an array, returning a new array of the same size. Example: transform(arr, x -> x + 1)." },
  { id:67, domain:3, q:"What does the EXPLODE function do when applied to an array column in Spark SQL?", opts:["Combines multiple arrays into one","Creates a new row for each element in the array, expanding the result set","Counts the number of elements in the array","Converts the array into a JSON string"], ans:1, exp:"EXPLODE generates a new row for each element in the array (or each key-value pair in a map), effectively flattening nested array structures into individual rows." },
  { id:68, domain:3, q:"A data engineer defines a Common Table Expression (CTE) using a WITH clause in SQL. Which statement about CTEs is correct?", opts:["CTEs are persisted as tables in the catalog and can be queried later","CTEs exist only for the duration of the single SQL statement in which they are defined","CTEs can be referenced across multiple separate SQL statements in the same notebook cell","CTEs automatically create indexes for faster query performance"], ans:1, exp:"A CTE (WITH clause) is a temporary named result set scoped to a single SQL statement. It is not persisted and cannot be referenced outside its defining query." },
  { id:69, domain:3, q:"What is the key difference between CREATE TABLE AS SELECT (CTAS) and CREATE TEMPORARY VIEW in Databricks?", opts:["CTAS creates a persisted physical table with data stored on disk; a temporary view is a named query with no data materialized","CTAS creates a view; CREATE TEMPORARY VIEW creates a physical table","Both persist data but CTAS uses Parquet and the view uses Delta","There is no difference in behavior"], ans:0, exp:"CTAS materializes the query result into a physical table (stored as Delta by default). A temporary view is simply a named SQL query re-evaluated each time it is referenced, with no data stored." },
  { id:70, domain:3, q:"How do you query a global temporary view in Databricks SQL?", opts:["SELECT * FROM my_global_view","SELECT * FROM global_temp.my_global_view","SELECT * FROM temp.my_global_view","SELECT * FROM session.my_global_view"], ans:1, exp:"Global temporary views are registered in the system-reserved global_temp database. You must prefix the view name with global_temp. to query it: SELECT * FROM global_temp.my_view." },
  { id:71, domain:3, q:"Which SQL operation rotates row values into columns, creating a new column for each distinct value and applying an aggregate function?", opts:["UNPIVOT","LATERAL VIEW","PIVOT","CUBE"], ans:2, exp:"PIVOT rotates rows into columns by turning distinct values of a specified column into new column headers and applying an aggregate function (e.g., SUM, COUNT). UNPIVOT does the reverse." },
  { id:72, domain:3, q:"What does the FLATTEN function do when applied to an array of arrays in Spark SQL?", opts:["Converts a struct into separate columns","Collapses a nested array of arrays into a single flat array","Drops null values from an array","Converts an array into a map"], ans:1, exp:"FLATTEN takes an array of arrays and merges them into a single-level array. For example, flatten(array(array(1,2), array(3,4))) returns [1,2,3,4]." },
  { id:73, domain:3, q:"In Lakeflow Declarative Pipelines, what does the AUTO CDC INTO (formerly APPLY CHANGES INTO) statement do?", opts:["Applies schema changes to a table definition","Processes change data capture (CDC) feeds to maintain a target table with SCD Type 1 or Type 2 logic","Applies VACUUM to clean up old files","Changes the table owner in Unity Catalog"], ans:1, exp:"AUTO CDC INTO processes CDC feeds to automatically handle inserts, updates, and deletes on a target streaming table, supporting both SCD Type 1 (overwrite) and SCD Type 2 (history tracking)." },
  { id:74, domain:3, q:"What is the difference between SCD Type 1 and SCD Type 2 when using AUTO CDC INTO in a Lakeflow pipeline?", opts:["SCD Type 1 keeps full history; SCD Type 2 keeps only the latest record","SCD Type 1 overwrites existing records with no history; SCD Type 2 preserves historical versions of changed records","SCD Type 1 is for inserts only; SCD Type 2 is for updates only","There is no difference; both maintain the same level of history"], ans:1, exp:"SCD Type 1 directly updates records in place (no history). SCD Type 2 inserts a new row for each change, preserving full history with start/end timestamps or version flags." },
  { id:75, domain:3, q:"A data engineer registers a PySpark UDF using spark.udf.register('to_upper', lambda s: s.upper(), StringType()). How can this UDF be used in SQL?", opts:["It cannot be used in SQL; UDFs registered this way are DataFrame-only","SELECT to_upper(name) FROM my_table","SELECT UDF.to_upper(name) FROM my_table","SELECT pyspark.to_upper(name) FROM my_table"], ans:1, exp:"spark.udf.register() registers the function for use in Spark SQL. Once registered, it can be called directly by name in SQL queries: SELECT to_upper(name) FROM my_table." },
  { id:76, domain:3, q:"Which statement about temporary views vs global temporary views in Databricks is correct?", opts:["Temporary views are visible across all clusters in the workspace","Global temporary views are scoped to the Spark application and accessible from any notebook attached to the same cluster","Temporary views persist after the session ends","Global temporary views are stored permanently in the Unity Catalog metastore"], ans:1, exp:"Temporary views are scoped to the current SparkSession (notebook). Global temporary views exist in the global_temp database and are visible to all sessions on the same cluster (Spark application), but are dropped when the application ends." },
  { id:77, domain:3, q:"What does enabling Delta Lake Change Data Feed (CDF) on a table provide?", opts:["A way to stream CDC events from external databases into the Delta table","A record of row-level changes (inserts, updates, deletes) made to the Delta table, readable as a stream or batch query","An automatic merge operation for deduplication","A log of schema changes applied to the Delta table"], ans:1, exp:"Change Data Feed records row-level changes (_change_type, _commit_version, _commit_timestamp) to a Delta table, enabling downstream consumers to process only incremental changes rather than full table scans." },

  // ─── NEW Domain 4: Productionizing Data Pipelines (8 questions) ───
  { id:78, domain:4, q:"In Databricks Workflows, what type of graph structure represents task dependencies?", opts:["Circular dependency graph","Directed Acyclic Graph (DAG)","Binary tree","Linked list"], ans:1, exp:"Databricks Workflows represent task dependencies as a Directed Acyclic Graph (DAG), ensuring tasks execute in the correct order without circular dependencies." },
  { id:79, domain:4, q:"A data engineer wants to send an email notification when a workflow job fails. Where is this configured?", opts:["In the notebook code using dbutils.notification.send()","In the job's notification settings under email or webhook alerts on failure","In the cluster configuration settings","In the Unity Catalog permissions page"], ans:1, exp:"Databricks Workflows supports configuring email and webhook notifications for job events (start, success, failure) in the job's settings, without requiring any code changes." },
  { id:80, domain:4, q:"Which Databricks Workflows feature allows defining a condition that determines whether a downstream task should execute based on an expression?", opts:["If/else condition task (run_if conditions)","dbutils.widgets.get()","Cluster policies","EXPECT clause in DLT"], ans:0, exp:"Databricks Workflows supports If/else condition tasks that evaluate an expression to determine whether downstream tasks should run, enabling branching logic in job DAGs." },
  { id:81, domain:4, q:"A data engineer deploying a Databricks Asset Bundle wants to check the configuration for errors without actually deploying. Which CLI command should they use?", opts:["databricks bundle deploy --dry-run","databricks bundle validate","databricks bundle test","databricks bundle check"], ans:1, exp:"'databricks bundle validate' checks the bundle YAML configuration for errors and validates resource definitions without deploying anything, making it ideal for CI/CD validation steps." },
  { id:82, domain:4, q:"How can a data engineer programmatically monitor the health and progress of a Structured Streaming query in production?", opts:["Only by manually checking the Spark UI","Using query.lastProgress and query.status or attaching a StreamingQueryListener to track metrics","Streaming queries cannot be monitored programmatically","By examining DBFS log files only"], ans:1, exp:"query.lastProgress and query.status provide real-time metrics (input rate, processing rate, batch duration). StreamingQueryListener enables event-driven monitoring and alerting for production streaming jobs." },
  { id:83, domain:4, q:"A Databricks Workflow has tasks A, B, and C where B depends on A, and C depends on both A and B. If task B fails, what happens to task C?", opts:["Task C runs anyway since task A succeeded","Task C is skipped because one of its upstream dependencies (B) failed","Task C runs with a warning flag","The entire workflow restarts from task A"], ans:1, exp:"By default, if any upstream dependency of a task fails, the dependent task is skipped. Since C depends on B and B failed, C will not execute. Use Repair and Rerun to retry the failed task." },
  { id:84, domain:4, q:"Which task configuration option in Databricks Workflows specifies how many times a failed task should be automatically retried before marking it as permanently failed?", opts:["max_retries","retry_on_timeout only","There is no retry option; tasks always fail immediately","depends_on with a retry flag"], ans:0, exp:"Each task in a Databricks Workflow can be configured with max_retries (and min_retry_interval_millis) to automatically retry on failure, preventing transient errors from causing full workflow failures." },
  { id:85, domain:4, q:"What does the 'databricks bundle deploy' CLI command do?", opts:["It creates a brand new Databricks workspace from scratch","It deploys the bundle's resources (jobs, pipelines, clusters) to the target environment defined in databricks.yml","It only uploads notebooks to the workspace without creating any job definitions","It deletes all existing resources and replaces them"], ans:1, exp:"'databricks bundle deploy' provisions or updates all resources defined in the bundle (jobs, pipelines, clusters, permissions) to the target workspace specified in the databricks.yml targets section." },

  // ─── NEW Domain 5: Data Governance & Quality (5 questions) ───
  { id:86, domain:5, q:"What is a dynamic view in Databricks Unity Catalog used for?", opts:["A view that automatically refreshes its underlying data every hour","A view that returns different data based on the querying user's identity or group membership, enabling row-level and column-level security","A view that dynamically adds new columns when source data changes","A materialized view that caches results for faster performance"], ans:1, exp:"Dynamic views use functions like current_user() and is_account_group_member() in their definitions to filter rows or mask columns based on who is querying, providing fine-grained access control." },
  { id:87, domain:5, q:"Which Unity Catalog schema can a data engineer query to discover metadata about all tables, columns, and views within a catalog?", opts:["system.access.audit","information_schema","system.billing.usage","system.lineage.tables"], ans:1, exp:"Each catalog in Unity Catalog includes an information_schema that contains metadata views (tables, columns, views, etc.), following the SQL standard for discovering catalog objects." },
  { id:88, domain:5, q:"A data engineer needs to apply a column mask so that only members of the 'finance' group can see the full salary values while others see NULL. Which approach is recommended in Unity Catalog?", opts:["Create a separate filtered table for each user group","Apply a column mask function using ALTER TABLE ... ALTER COLUMN ... SET MASK with a function that checks group membership","Use a GRANT statement with column-level SELECT permissions","Encrypt the salary column with a workspace-level encryption key"], ans:1, exp:"Column masks in Unity Catalog use SQL UDF functions applied via ALTER TABLE ... ALTER COLUMN ... SET MASK. The masking function checks the user's identity or group and returns the real value or a masked value." },
  { id:89, domain:5, q:"What is a storage credential in Unity Catalog?", opts:["A username and password stored in a Databricks secret scope for database access","A securable object that encapsulates a long-term cloud credential (e.g., IAM role or service principal) granting access to cloud storage","A personal access token used for REST API authentication","A connection string for JDBC or ODBC databases"], ans:1, exp:"A storage credential is a Unity Catalog securable object that stores cloud provider credentials (AWS IAM role, Azure service principal, GCP service account) used to access cloud storage paths referenced by external locations." },
  { id:90, domain:5, q:"What is the relationship between a storage credential and an external location in Unity Catalog?", opts:["They are the same object with different names","An external location defines a cloud storage path and references a storage credential that provides the permissions to access that path","A storage credential automatically creates external locations for all accessible paths","External locations are only used with managed tables, not external tables"], ans:1, exp:"An external location maps a specific cloud storage path (e.g., s3://bucket/path) to a storage credential. Together they allow Unity Catalog to govern access to data stored in external cloud object storage." },
];

const QUIZ_SIZE = 45; // Questions per quiz attempt (from 90 total)
const GFORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfqxRncPqDw_R9vZTifxyemZ_bajwgha1ua9tPrgvbgmkrcBA/formResponse";
const GFORM_FIELDS = { questionId: "entry.161244691", vote: "entry.1668645012", ip: "entry.766343008" };
const GSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSeuC4MCSsJxi1EpqkbGxod9o_cKroXQepqjsf9AjjBw6bDtW8l54Oc2Lyiee3_xP1u9IQVLbc6JvvG/pub?output=csv";

let cachedIP = null;
function getIP() {
  if (cachedIP) return Promise.resolve(cachedIP);
  return fetch("https://api.ipify.org?format=text")
    .then(r => r.text())
    .then(ip => { cachedIP = ip; return ip; })
    .catch(() => "unknown");
}

function submitToGoogleForm(qId, vote) {
  getIP().then(ip => {
    const params = new URLSearchParams({
      [GFORM_FIELDS.questionId]: String(qId),
      [GFORM_FIELDS.vote]: vote,
      [GFORM_FIELDS.ip]: ip,
    });
    fetch(`${GFORM_URL}?${params}`, { method: "POST", mode: "no-cors" }).catch(() => {});
  });
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    return { questionId: cols[1]?.replace(/"/g, "").trim(), vote: cols[2]?.replace(/"/g, "").trim() };
  });
}

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
  const [screen, setScreen] = useState("home"); // home | quiz | results | feedback
  const [mode, setMode] = useState("full"); // full | domain | quick
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState({});
  const [communityFeedback, setCommunityFeedback] = useState([]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  // Fetch community feedback from published Google Sheet
  const fetchCommunityFeedback = useCallback(() => {
    fetch(`${GSHEET_CSV_URL}&_t=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(text => setCommunityFeedback(parseCSV(text)))
      .catch(err => console.error("Failed to fetch community feedback:", err));
  }, []);

  useEffect(() => { fetchCommunityFeedback(); }, [fetchCommunityFeedback]);

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
    const secs = m === "quick" ? 600 : m === "domain" ? 600 : 5400;
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

  const submitFeedback = (qId, vote) => {
    submitToGoogleForm(qId, vote);
    setSubmittedFeedback(prev => ({ ...prev, [qId]: vote }));
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

        {/* Feedback survey button */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={() => setScreen("feedback")} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 24px", cursor: "pointer", color: "#aab", fontSize: 14, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,107,53,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}>
            View Answer Feedback Survey ({communityFeedback.length} responses)
          </button>
        </div>
      </div>
    </div>
  );

  if (screen === "feedback") {
    // Aggregate community feedback per question
    const communityStats = {};
    communityFeedback.forEach(({ questionId, vote }) => {
      if (!communityStats[questionId]) communityStats[questionId] = { correct: 0, incorrect: 0 };
      if (vote === "correct") communityStats[questionId].correct++;
      else if (vote === "incorrect") communityStats[questionId].incorrect++;
    });
    const totalCorrect = communityFeedback.filter(f => f.vote === "correct").length;
    const totalIncorrect = communityFeedback.filter(f => f.vote === "incorrect").length;

    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "24px 16px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#aab", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>← Home</button>

          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Community Feedback Survey</h2>
          <p style={{ color: "#889", fontSize: 14, margin: "0 0 20px" }}>{communityFeedback.length} total responses from all users</p>

          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "rgba(39,174,96,0.1)", border: "1px solid #27AE6040", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#2ecc71", fontSize: 32, fontWeight: 900 }}>{totalCorrect}</div>
              <div style={{ color: "#2ecc71", fontSize: 13 }}>Marked Correct</div>
            </div>
            <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid #E74C3C40", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#e74c3c", fontSize: 32, fontWeight: 900 }}>{totalIncorrect}</div>
              <div style={{ color: "#e74c3c", fontSize: 13 }}>Flagged Incorrect</div>
            </div>
          </div>

          {/* Questions with votes */}
          {ALL_QUESTIONS.filter(q => communityStats[q.id]).length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 15 }}>VOTED QUESTIONS</h3>
              {ALL_QUESTIONS.filter(q => communityStats[q.id]).map(q => {
                const cs = communityStats[q.id];
                const total = cs.correct + cs.incorrect;
                const pct = Math.round((cs.incorrect / total) * 100);
                return (
                  <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "#ccd", fontSize: 12, flex: 1 }}>Q{q.id}: {q.q.slice(0, 50)}...</span>
                    <span style={{ fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ color: "#2ecc71" }}>{cs.correct}</span>
                      <span style={{ color: "#889" }}> / </span>
                      <span style={{ color: "#e74c3c" }}>{cs.incorrect}</span>
                      {pct >= 50 && <span style={{ color: "#e74c3c", fontWeight: 700, marginLeft: 6 }}>({pct}% flagged)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={fetchCommunityFeedback} style={{ width: "100%", background: "rgba(74,144,217,0.15)", border: "1px solid rgba(74,144,217,0.3)", borderRadius: 12, padding: "14px", color: "#4A90D9", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Refresh Community Data</button>
        </div>
      </div>
    );
  }

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
              {/* Feedback buttons */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#889", fontSize: 12 }}>Is this answer correct?</span>
                {submittedFeedback[q.id] ? (
                  <span style={{ color: submittedFeedback[q.id] === "correct" ? "#2ecc71" : "#e74c3c", fontSize: 12, fontWeight: 600 }}>
                    {submittedFeedback[q.id] === "correct" ? "Marked correct" : "Flagged incorrect"}
                  </span>
                ) : (
                  <>
                    <button onClick={() => submitFeedback(q.id, "correct")} style={{ background: "rgba(39,174,96,0.2)", border: "1px solid #27AE6060", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#2ecc71", fontSize: 12, fontWeight: 600 }}>Yes</button>
                    <button onClick={() => submitFeedback(q.id, "incorrect")} style={{ background: "rgba(231,76,60,0.2)", border: "1px solid #E74C3C60", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#e74c3c", fontSize: 12, fontWeight: 600 }}>No</button>
                  </>
                )}
              </div>
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
