import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting gold to inventory migration...");

  try {
    // Find the Gold item
    const goldItem = await prisma.item.findFirst({
      where: {
        name: "Gold",
        type: "CURRENCY",
      },
    });

    if (!goldItem) {
      console.error(
        "❌ Gold item not found in database. Please run the items seed first."
      );
      process.exit(1);
    }

    console.log(`✅ Found Gold item: ${goldItem.id}`);

    // Query all characters with gold > 0
    const charactersWithGold = await prisma.character.findMany({
      where: {
        gold: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        gold: true,
      },
    });

    console.log(
      `📊 Found ${charactersWithGold.length} characters with gold to migrate`
    );

    let migratedCount = 0;
    let totalGoldMigrated = 0;

    for (const character of charactersWithGold) {
      try {
        console.log(
          `🔄 Migrating ${character.name} (${character.gold} gold)...`
        );

        // Check if character already has gold in inventory
        const existingGoldInventory = await prisma.inventory.findFirst({
          where: {
            characterId: character.id,
            itemId: goldItem.id,
            equipped: false,
          },
        });

        if (existingGoldInventory) {
          // Update existing gold inventory
          const newQuantity = existingGoldInventory.quantity + character.gold;
          await prisma.inventory.update({
            where: { id: existingGoldInventory.id },
            data: { quantity: newQuantity },
          });
          console.log(
            `  ✅ Updated existing gold inventory: ${existingGoldInventory.quantity} + ${character.gold} = ${newQuantity}`
          );
        } else {
          // Create new gold inventory entry
          await prisma.inventory.create({
            data: {
              characterId: character.id,
              itemId: goldItem.id,
              quantity: character.gold,
              equipped: false,
            },
          });
          console.log(
            `  ✅ Created new gold inventory: ${character.gold} gold`
          );
        }

        // Optionally: set character.gold = 0 (uncomment if you want to clear the old field)
        // await prisma.character.update({
        //   where: { id: character.id },
        //   data: { gold: 0 }
        // });

        migratedCount++;
        totalGoldMigrated += character.gold;
      } catch (error) {
        console.error(`❌ Error migrating character ${character.name}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Statistics:`);
    console.log(
      `  - Characters migrated: ${migratedCount}/${charactersWithGold.length}`
    );
    console.log(`  - Total gold migrated: ${totalGoldMigrated}`);
    console.log(`  - Gold item ID: ${goldItem.id}`);

    // Verify migration
    console.log(`\n🔍 Verifying migration...`);
    const totalInventoryGold = await prisma.inventory.aggregate({
      where: {
        itemId: goldItem.id,
        equipped: false,
      },
      _sum: {
        quantity: true,
      },
    });

    console.log(
      `✅ Total gold in inventory: ${totalInventoryGold._sum.quantity || 0}`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
