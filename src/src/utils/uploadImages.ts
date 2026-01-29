import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.development" });

console.log("Cloudinary Config:");
console.log(
  "  CLOUDINARY_URL:",
  process.env.CLOUDINARY_URL ? "********" : "NOT SET",
);

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
  secure: true,
});

const productsJsonPath = "./public/products.json";
const _publicImgPath = "./public/img";

async function uploadImagesAndUpdateProducts() {
  try {
    const productsData = JSON.parse(await readFile(productsJsonPath, "utf-8"));

    const updatedProducts = await Promise.all(
      productsData.map(async (product) => {
        if (product.img && product.img !== "logo.jpg") {
          const localImagePath = path.join("./public", product.img);
          console.log(`Processing ${localImagePath}...`);
          try {
            const uploadResult = await cloudinary.uploader.upload(
              localImagePath,
              {
                folder: "product_images",
              },
            );
            console.log(
              `Uploaded ${localImagePath} to ${uploadResult.secure_url}`,
            );
            return { ...product, img: uploadResult.secure_url };
          } catch (uploadError) {
            console.error(`Failed to upload ${localImagePath}:`, uploadError);
            return product;
          }
        } else if (product.img === "logo.jpg") {
          console.log(`Skipping logo.jpg as requested.`);
          return product;
        }
        return product;
      }),
    );

    console.log(
      "Finished processing all products. Writing to products.json...",
    );
    await writeFile(
      productsJsonPath,
      JSON.stringify(updatedProducts, null, 2),
      "utf-8",
    );
    console.log("products.json updated successfully with Cloudinary URLs.");
  } catch (error) {
    console.error("Error during image upload and product update:", error);
  }
}

import { mkdirSync } from "node:fs";

const scriptDir = "./scripts";
mkdirSync(scriptDir, { recursive: true });

uploadImagesAndUpdateProducts();
