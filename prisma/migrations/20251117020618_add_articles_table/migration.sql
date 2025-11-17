-- CreateTable
CREATE TABLE "articles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "html_content" TEXT,
    "plain_content" TEXT,
    "platform" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "target_platforms" TEXT NOT NULL,
    "custom_instructions" TEXT,
    "insight_id" TEXT,
    "topic_direction" TEXT,
    "has_images" BOOLEAN NOT NULL DEFAULT false,
    "image_config" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimated_reading_time" INTEGER,
    "sections" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "publish_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "article_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "published_url" TEXT,
    "published_at" DATETIME,
    "withdrawn_at" DATETIME,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "platform_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publish_records_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
