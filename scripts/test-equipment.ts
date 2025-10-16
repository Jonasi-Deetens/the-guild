import { PrismaClient, EquipmentSlot } from "@prisma/client";
import { EquipmentService } from "../src/server/services/equipmentService";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing equipment system...");

  try {
    // 1. Find a test character
    console.log("\n1️⃣ Finding test character...");
    const testCharacter = await prisma.character.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!testCharacter) {
      console.error("❌ No test character found. Please create one.");
      return;
    }
    console.log(
      `✅ Test character: ${testCharacter.name} (${testCharacter.id})`
    );
    console.log(`   - Level: ${testCharacter.level}`);
    console.log(
      `   - Base stats: ATK=${testCharacter.attack}, DEF=${testCharacter.defense}, SPD=${testCharacter.speed}, PER=${testCharacter.perception}`
    );

    // 2. Find some test equipment
    console.log("\n2️⃣ Finding test equipment...");
    const testItems = await prisma.item.findMany({
      where: {
        equipmentSlot: { not: null },
        levelRequirement: { lte: testCharacter.level + 2 }, // Items within reach
      },
      take: 5,
    });

    if (testItems.length === 0) {
      console.error("❌ No test equipment found. Please run the items seed.");
      return;
    }

    console.log(`✅ Found ${testItems.length} test items:`);
    testItems.forEach((item) => {
      console.log(
        `   - ${item.name} (${item.equipmentSlot}) - Level ${item.levelRequirement}`
      );
    });

    // 3. Add items to character inventory
    console.log("\n3️⃣ Adding items to character inventory...");
    for (const item of testItems) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          characterId: testCharacter.id,
          itemId: item.id,
        },
      });

      if (!existingInventory) {
        await prisma.inventory.create({
          data: {
            characterId: testCharacter.id,
            itemId: item.id,
            quantity: 1,
            equipped: false,
          },
        });
        console.log(`   ✅ Added ${item.name} to inventory`);
      } else {
        console.log(`   ⊘ ${item.name} already in inventory`);
      }
    }

    // 4. Test equipment requirements
    console.log("\n4️⃣ Testing equipment requirements...");
    for (const item of testItems) {
      const canEquipResult = await EquipmentService.canEquip(
        testCharacter,
        item
      );
      console.log(
        `   ${item.name}: ${
          canEquipResult.canEquip ? "✅ Can equip" : "❌ Cannot equip"
        }`
      );
      if (!canEquipResult.canEquip && canEquipResult.reason) {
        console.log(`     Reason: ${canEquipResult.reason}`);
      }
    }

    // 5. Test equipping items
    console.log("\n5️⃣ Testing equipping items...");
    const equippableItems = testItems.filter((item) => {
      // Simple check - in real implementation, use EquipmentService.canEquip
      return item.levelRequirement <= testCharacter.level;
    });

    for (const item of equippableItems.slice(0, 3)) {
      // Test first 3 items
      console.log(`\n   Testing ${item.name}...`);

      try {
        const equipResult = await EquipmentService.equipItem(
          testCharacter.id,
          item.id
        );
        if (equipResult.success) {
          console.log(`   ✅ Successfully equipped: ${equipResult.message}`);
          if (equipResult.unequippedItem) {
            console.log(`   ⊘ Unequipped: ${equipResult.unequippedItem.name}`);
          }
        } else {
          console.log(`   ❌ Failed to equip: ${equipResult.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error equipping: ${error}`);
      }
    }

    // 6. Test getting equipped items
    console.log("\n6️⃣ Testing get equipped items...");
    const equippedItems = await EquipmentService.getEquippedItems(
      testCharacter.id
    );
    console.log("   Equipped items:");
    Object.entries(equippedItems).forEach(([slot, item]) => {
      if (item) {
        console.log(`     ${slot}: ${item.name}`);
      }
    });

    // 7. Test stat calculations
    console.log("\n7️⃣ Testing stat calculations...");
    const calculatedStats = await EquipmentService.calculateStats(
      testCharacter.id
    );
    console.log("   Calculated stats:");
    console.log(
      `     Attack: ${calculatedStats.attack} (base: ${testCharacter.attack} + ${calculatedStats.attackBonus})`
    );
    console.log(
      `     Defense: ${calculatedStats.defense} (base: ${testCharacter.defense} + ${calculatedStats.defenseBonus})`
    );
    console.log(
      `     Speed: ${calculatedStats.speed} (base: ${testCharacter.speed} + ${calculatedStats.speedBonus})`
    );
    console.log(
      `     Perception: ${calculatedStats.perception} (base: ${testCharacter.perception} + ${calculatedStats.perceptionBonus})`
    );
    console.log(
      `     Health: ${calculatedStats.health} (base: ${testCharacter.maxHealth} + ${calculatedStats.healthBonus})`
    );

    // 8. Test unequipping items
    console.log("\n8️⃣ Testing unequipping items...");
    const equippedSlots = Object.entries(equippedItems)
      .filter(([_, item]) => item !== undefined)
      .map(([slot, _]) => {
        // Convert slot names to EquipmentSlot enum values
        switch (slot) {
          case "weapon":
            return EquipmentSlot.WEAPON;
          case "offHand":
            return EquipmentSlot.OFF_HAND;
          case "head":
            return EquipmentSlot.HEAD;
          case "chest":
            return EquipmentSlot.CHEST;
          case "legs":
            return EquipmentSlot.LEGS;
          case "boots":
            return EquipmentSlot.BOOTS;
          case "gloves":
            return EquipmentSlot.GLOVES;
          case "ring1":
            return EquipmentSlot.RING;
          case "ring2":
            return EquipmentSlot.RING;
          case "amulet":
            return EquipmentSlot.AMULET;
          default:
            throw new Error(`Unknown slot: ${slot}`);
        }
      });

    if (equippedSlots.length > 0) {
      const slotToUnequip = equippedSlots[0];
      console.log(`   Unequipping from ${slotToUnequip}...`);

      try {
        await EquipmentService.unequipItem(testCharacter.id, slotToUnequip);
        console.log(`   ✅ Successfully unequipped from ${slotToUnequip}`);
      } catch (error) {
        console.log(`   ❌ Error unequipping: ${error}`);
      }
    }

    // 9. Test ring slot logic
    console.log("\n9️⃣ Testing ring slot logic...");
    const ringItems = await prisma.item.findMany({
      where: {
        equipmentSlot: EquipmentSlot.RING,
        levelRequirement: { lte: testCharacter.level },
      },
      take: 2,
    });

    if (ringItems.length >= 2) {
      console.log(`   Testing dual ring equipping...`);

      // Add rings to inventory if not already there
      for (const ring of ringItems) {
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            characterId: testCharacter.id,
            itemId: ring.id,
          },
        });

        if (!existingInventory) {
          await prisma.inventory.create({
            data: {
              characterId: testCharacter.id,
              itemId: ring.id,
              quantity: 1,
              equipped: false,
            },
          });
        }
      }

      // Try to equip both rings
      for (const ring of ringItems) {
        try {
          const equipResult = await EquipmentService.equipItem(
            testCharacter.id,
            ring.id
          );
          console.log(
            `   ${ring.name}: ${
              equipResult.success ? "✅ Equipped" : "❌ Failed"
            }`
          );
        } catch (error) {
          console.log(`   ${ring.name}: ❌ Error - ${error}`);
        }
      }

      // Check final equipped items
      const finalEquippedItems = await EquipmentService.getEquippedItems(
        testCharacter.id
      );
      console.log(
        `   Final ring slots: Ring1=${
          finalEquippedItems.ring1?.name || "empty"
        }, Ring2=${finalEquippedItems.ring2?.name || "empty"}`
      );
    }

    // 10. Final verification
    console.log("\n🔟 Final verification...");
    const finalStats = await EquipmentService.calculateStats(testCharacter.id);
    const finalEquippedItems = await EquipmentService.getEquippedItems(
      testCharacter.id
    );

    console.log("   Final equipped items:");
    Object.entries(finalEquippedItems).forEach(([slot, item]) => {
      if (item) {
        console.log(`     ${slot}: ${item.name}`);
      }
    });

    console.log("   Final calculated stats:");
    console.log(`     Attack: ${finalStats.attack}`);
    console.log(`     Defense: ${finalStats.defense}`);
    console.log(`     Speed: ${finalStats.speed}`);
    console.log(`     Perception: ${finalStats.perception}`);
    console.log(`     Health: ${finalStats.health}`);

    console.log("\n🎉 Equipment system test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
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
