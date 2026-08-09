-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FULL',
    "maxCompanions" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "attending" BOOLEAN,
    "respondedAt" DATETIME,
    "dietary" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "dietary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Companion_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InfoPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT,
    "infoPostId" TEXT,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailLog_infoPostId_fkey" FOREIGN KEY ("infoPostId") REFERENCES "InfoPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");

-- CreateIndex
CREATE INDEX "Guest_type_idx" ON "Guest"("type");

-- CreateIndex
CREATE INDEX "Guest_attending_idx" ON "Guest"("attending");

-- CreateIndex
CREATE INDEX "Companion_guestId_idx" ON "Companion"("guestId");

-- CreateIndex
CREATE INDEX "InfoPost_published_audience_idx" ON "InfoPost"("published", "audience");

-- CreateIndex
CREATE INDEX "EmailLog_guestId_idx" ON "EmailLog"("guestId");

-- CreateIndex
CREATE INDEX "EmailLog_kind_status_idx" ON "EmailLog"("kind", "status");
