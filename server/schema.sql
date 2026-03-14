-- CoreInventory PostgreSQL Database Schema
-- Run this script to manually create the database tables if you are not using Sequelize sync.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types / Enums
CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE "enum_WarehouseLocations_type" AS ENUM ('input', 'quality', 'stock', 'output', 'packing', 'custom');
CREATE TYPE "enum_StockMoves_type" AS ENUM ('receipt', 'delivery', 'transfer', 'adjustment');
CREATE TYPE "enum_StockMoves_status" AS ENUM ('draft', 'waiting', 'ready', 'done', 'cancelled');

-- Tables

CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" "enum_Users_role" DEFAULT 'staff',
    "avatar" VARCHAR(255) DEFAULT '',
    "resetOtp" VARCHAR(255),
    "resetOtpExpiry" TIMESTAMP WITH TIME ZONE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "Warehouses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL UNIQUE,
    "address" VARCHAR(255) DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "WarehouseLocations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "type" "enum_WarehouseLocations_type" DEFAULT 'stock',
    "WarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "Categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" VARCHAR(255) DEFAULT '',
    "parentId" UUID REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "Products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT DEFAULT '',
    "uom" VARCHAR(255) DEFAULT 'Units',
    "costPrice" DECIMAL(10,2) DEFAULT 0,
    "salePrice" DECIMAL(10,2) DEFAULT 0,
    "minStockLevel" INTEGER DEFAULT 0,
    "reorderQty" INTEGER DEFAULT 0,
    "image" VARCHAR(255) DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "categoryId" UUID REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "ProductStocks" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "locationName" VARCHAR(255) NOT NULL,
    "quantity" INTEGER DEFAULT 0,
    "ProductId" UUID REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "WarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "StockMoves" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reference" VARCHAR(255) NOT NULL UNIQUE,
    "type" "enum_StockMoves_type" NOT NULL,
    "status" "enum_StockMoves_status" DEFAULT 'draft',
    "partner" VARCHAR(255) DEFAULT '',
    "fromLocation" VARCHAR(255) DEFAULT '',
    "toLocation" VARCHAR(255) DEFAULT '',
    "scheduledDate" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "validatedDate" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT DEFAULT '',
    "fromWarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "toWarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdById" UUID REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "validatedById" UUID REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "StockMoveLines" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productName" VARCHAR(255),
    "sku" VARCHAR(255),
    "demandQty" INTEGER NOT NULL,
    "doneQty" INTEGER DEFAULT 0,
    "uom" VARCHAR(255) DEFAULT 'Units',
    "StockMoveId" UUID REFERENCES "StockMoves"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "ProductId" UUID REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
