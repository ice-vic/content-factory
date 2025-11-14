-- CreateTable
CREATE TABLE "search_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "search_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "article_count" INTEGER,
    "avg_read" INTEGER,
    "avg_like" INTEGER,
    "original_rate" REAL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "error_message" TEXT,
    "type" TEXT NOT NULL DEFAULT 'wechat',
    "duration" INTEGER
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "search_history_id" INTEGER NOT NULL,
    "insights" TEXT NOT NULL,
    "word_cloud" TEXT NOT NULL,
    "top_liked_articles" TEXT NOT NULL,
    "top_interaction_articles" TEXT NOT NULL,
    "all_articles" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_summaries" TEXT,
    "structured_info" TEXT,
    "ai_insights" TEXT,
    "structured_topic_insights" TEXT,
    "rule_based_insights" TEXT,
    "ai_generated_insights" TEXT,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "ai_model_used" TEXT,
    "processing_time" INTEGER,
    "ai_analysis_status" TEXT,
    CONSTRAINT "analysis_results_search_history_id_fkey" FOREIGN KEY ("search_history_id") REFERENCES "search_history" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_search_history_id_key" ON "analysis_results"("search_history_id");
