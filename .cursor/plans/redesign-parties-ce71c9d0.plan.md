<!-- ce71c9d0-ea53-4e4a-a48d-b1e90a356c29 2e8b52ec-9731-4120-8ecb-d35c4f618380 -->
# NPC Hiring System Implementation

## Overview

Create a system where players can hire NPC companions to join their party for missions, allowing solo players to experience party content with AI-controlled allies.

## Database Schema Changes

### New Models

1. **NPCCompanion Model**

- `id`, `name`, `level`, `class/type`
- Full character stats (health, attack, defense, speed, etc.)
- `hireCost` (gold cost to hire per mission)
- `unlockType` (GOLD or MILESTONE)
- `unlockRequirement` (reputation/level needed if milestone-based)
- `isUnlocked` flag for milestone NPCs
- `rarity` (affects stats and cost)
- `description`, `backstory`

2. **HiredNPC Model** (junction table for active hires)

- Links Character to NPCCompanion for current mission
- `characterId`, `npcCompanionId`
- `hiredAt`, `expiresAt` (per-mission duration)
- `sessionId` (which dungeon session they're hired for)

3. **UnlockedNPC Model** (tracks milestone-unlocked NPCs)

- `characterId`, `npcCompanionId`
- `unlockedAt`
- Persistent record of milestone NPCs

### Schema Updates

- Add `isNPC` boolean field to `PartyMember` model
- Add `npcCompanionId` optional field to `PartyMember`
- Update `Party.maxMembers` logic to allow NPCs

## Backend Implementation

### 1. NPC Service (`src/server/services/npcService.ts`)

- `getAvailableNPCs(characterId)` - returns hireable NPCs
- `hireNPC(characterId, npcId, sessionId)` - hire for mission
- `dismissNPC(characterId, npcId)` - remove from party
- `unlockMilestoneNPC(characterId, npcId)` - unlock via achievement
- `checkUnlockRequirements(character)` - auto-check milestones

### 2. NPC Router (`src/server/routers/npc.ts`)

- `getAvailable` - query available NPCs
- `getUnlocked` - query player's unlocked NPCs
- `hire` - mutation to hire NPC
- `dismiss` - mutation to dismiss NPC

### 3. Party System Updates

- Modify `party.create` to allow adding NPCs
- Update `dungeon.startSoloSession` to support NPC party members
- Modify combat/event resolution to include NPC actions (AI-controlled)

### 4. Loot Distribution Updates

- Update `LootDistributionService` to:
- Identify NPC party members
- Deduct NPC's share from total loot
- Split remaining loot among players
- Handle gold splitting (NPCs take their cut)

### 5. AI Behavior System (`src/server/services/npcAiService.ts`)

- Simple AI for NPC combat decisions
- Role-based behavior (tank, healer, DPS)
- Auto-submit actions during dungeon turns

## Frontend Implementation

### 1. NPC Hiring Page (`src/app/game/companions/page.tsx`)

- Display available NPCs in cards/list
- Show hire cost, stats, unlock requirements
- Filter by unlocked/locked, rarity, class
- Hire button (deducts gold, adds to party)

### 2. Party Management Updates

- Show NPC members with special indicator
- Display NPC stats in party view
- Allow dismissing NPCs from party
- Show hire cost when adding NPCs

### 3. Mission Start Flow Updates

- Check if party has NPCs before starting
- Confirm NPC hire costs
- Create `HiredNPC` records for session

### 4. UI Components

- `NPCCard` - display NPC info
- `NPCStatsPanel` - detailed stats view
- `HireConfirmModal` - confirm hire with cost

## Seed Data

### Create Initial NPCs (`prisma/seeds/npcs.ts`)

- 5-10 starter NPCs (hireable with gold)
- Warrior tank (high HP, defense)
- Rogue DPS (high attack, speed)
- Cleric healer (healing abilities)
- Archer ranged DPS
- Mage caster
- 3-5 milestone NPCs (unlock via reputation/level)
- Legendary companions
- Unique abilities/stats

## Key Features

1. **Hiring Flow**

- Browse companions page
- Select NPC → View stats
- Click "Hire" → Deduct gold
- NPC added to party as `PartyMember` with `isNPC: true`

2. **Mission Integration**

- NPCs appear in party member list
- AI controls NPC actions during combat
- NPCs take damage, can die
- NPCs dismissed after mission ends

3. **Loot Sharing**

- Calculate NPC share (e.g., 20% per NPC)
- Deduct from total loot pool
- Remaining loot distributed to players
- Gold split equally (NPCs take cut)

4. **Milestone Unlocks**

- Check reputation/level on character updates
- Auto-unlock NPCs when requirements met
- Notification system for unlocks
- Unlocked NPCs stay in player's roster

## Implementation Order

1. Database schema (models, migrations)
2. Seed initial NPCs
3. Backend services (NPC service, AI service)
4. tRPC routers
5. Update party/dungeon logic for NPCs
6. Frontend companions page
7. Party management UI updates
8. Loot distribution updates
9. Testing and balancing

## Technical Considerations

- NPCs should not count toward player party limits for matchmaking
- NPC AI should be simple but effective (role-based)
- Hire costs should scale with NPC level/rarity
- Milestone NPCs should feel rewarding (better stats/unique abilities)
- Loot split should be fair but incentivize player parties
- Session cleanup should dismiss NPCs automatically

### To-dos

- [ ] Create NPCCompanion, HiredNPC, and UnlockedNPC models in schema
- [ ] Generate and run Prisma migration for NPC models
- [ ] Create seed file with initial NPCs (gold and milestone)
- [ ] Implement NPCService for hiring, dismissing, and unlocking NPCs
- [ ] Create NPCAiService for combat decision-making
- [ ] Create tRPC router for NPC operations
- [ ] Update party system to support NPC members
- [ ] Update dungeon session logic to include NPCs
- [ ] Update loot distribution to handle NPC shares
- [ ] Create companions page UI for browsing and hiring NPCs
- [ ] Update party UI to show and manage NPC members
- [ ] Test NPC hiring, combat, and loot distribution