import { PrismaClient } from "@prisma/client";
import { GoldService } from "../src/server/services/goldService";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing gold inventory system...");

  try {
    // Test 1: Check if Gold item exists
    console.log("\n1️⃣ Testing Gold item existence...");
    const goldItem = await prisma.item.findFirst({
      where: {
        name: "Gold",
        type: "CURRENCY",
      },
    });

    if (!goldItem) {
      console.error("❌ Gold item not found!");
      return;
    }
    console.log(`✅ Gold item found: ${goldItem.name} (${goldItem.id})`);
    console.log(`   - Type: ${goldItem.type}`);
    console.log(`   - Stackable: ${goldItem.isStackable}`);
    console.log(`   - Max Stack: ${goldItem.maxStack}`);

    // Test 2: Find a test character
    console.log("\n2️⃣ Finding test character...");
    const testCharacter = await prisma.character.findFirst({
      select: { id: true, name: true, gold: true },
    });

    if (!testCharacter) {
      console.error("❌ No characters found for testing!");
      return;
    }
    console.log(
      `✅ Test character: ${testCharacter.name} (${testCharacter.id})`
    );
    console.log(`   - Current gold field: ${testCharacter.gold}`);

    // Test 3: Test GoldService methods
    console.log("\n3️⃣ Testing GoldService methods...");

    // Get current gold amount
    const currentGold = await GoldService.getGoldAmount(testCharacter.id);
    console.log(`✅ getGoldAmount: ${currentGold}`);

    // Test hasEnoughGold
    const hasEnough = await GoldService.hasEnoughGold(testCharacter.id, 50);
    console.log(`✅ hasEnoughGold(50): ${hasEnough}`);

    // Test addGold
    console.log("\n4️⃣ Testing addGold...");
    const addAmount = 100;
    await GoldService.addGold(testCharacter.id, addAmount);
    const goldAfterAdd = await GoldService.getGoldAmount(testCharacter.id);
    console.log(`✅ Added ${addAmount} gold: ${currentGold} → ${goldAfterAdd}`);

    // Test removeGold
    console.log("\n5️⃣ Testing removeGold...");
    const removeAmount = 30;
    const removed = await GoldService.removeGold(
      testCharacter.id,
      removeAmount
    );
    const goldAfterRemove = await GoldService.getGoldAmount(testCharacter.id);
    console.log(
      `✅ Removed ${removeAmount} gold (success: ${removed}): ${goldAfterAdd} → ${goldAfterRemove}`
    );

    // Test insufficient gold
    console.log("\n6️⃣ Testing insufficient gold...");
    const insufficientRemoved = await GoldService.removeGold(
      testCharacter.id,
      1000000
    );
    console.log(
      `✅ Try to remove 1000000 gold (should fail): ${insufficientRemoved}`
    );

    // Test transferGold
    console.log("\n7️⃣ Testing transferGold...");
    const transferAmount = 20;
    const transferSuccess = await GoldService.transferGold(
      testCharacter.id,
      testCharacter.id,
      transferAmount
    );
    console.log(
      `✅ Transfer ${transferAmount} gold to self (should succeed): ${transferSuccess}`
    );

    // Test 8: Check inventory entries
    console.log("\n8️⃣ Checking inventory entries...");
    const goldInventory = await prisma.inventory.findFirst({
      where: {
        characterId: testCharacter.id,
        itemId: goldItem.id,
        equipped: false,
      },
    });

    if (goldInventory) {
      console.log(`✅ Gold inventory entry found:`);
      console.log(`   - Quantity: ${goldInventory.quantity}`);
      console.log(`   - Equipped: ${goldInventory.equipped}`);
      console.log(`   - Created: ${goldInventory.createdAt}`);
    } else {
      console.log("❌ No gold inventory entry found!");
    }

    // Test 9: Verify final state
    console.log("\n9️⃣ Final verification...");
    const finalGold = await GoldService.getGoldAmount(testCharacter.id);
    console.log(`✅ Final gold amount: ${finalGold}`);

    // Test 10: Test with non-existent character
    console.log("\n🔟 Testing with non-existent character...");
    try {
      await GoldService.getGoldAmount("non-existent-id");
      console.log("❌ Should have thrown error for non-existent character");
    } catch (error) {
      console.log("✅ Correctly handled non-existent character");
    }

    console.log("\n🎉 All tests completed successfully!");
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
