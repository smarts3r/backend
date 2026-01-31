/*
  Warnings:

  - A unique constraint covering the columns `[user_id,product_id]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "_KitsToProduct" ADD CONSTRAINT "_KitsToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_KitsToProduct_AB_unique";

-- CreateIndex
CREATE UNIQUE INDEX "Cart_user_id_product_id_key" ON "Cart"("user_id", "product_id");
