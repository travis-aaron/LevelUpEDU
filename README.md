# LevelUpEDU
A gamified educational platform for web and mobile where students navigate a 2d RPG-like world and complete challenges to earn rewards.

## Quick Start

1. Clone the repo
2. Run the following commands:
```sh
pnpm install
pnpm dev
```
3. Navigate to: <https://localhost:8080/game>

## Project Structure
```
src/
├── app/             # Next.js App Router, API endpoints, pages
├── components/      # React / Phaser bridge and initialization wrapper
├── data/            # Tiled map JSON files
├── interactions/    # Interaction handlers for each possible interaction
├── scenes/          # Scene class (main game loop), and individual scenes
├── types/           # TypeScript interfaces
└── utils/           # InputHandler, physics helpers, sprite effects
```

## Adding Interactable Objects

1. Add sprite to manifest: `public/assets/sprites/{sceneName}/manifest.json`
2. Add sprite image to same folder: `public/assets/sprites/{sceneName}/{spriteName}.png`
3. In Tiled add the object to "Interactable" layer with these fields:
    - eventType: Name of interaction (e.g., "chalkboard")
    - active: true/false - whether interaction is enabled
    - displayName: Text label player sees
    - tooltip: Interaction prompt
    - passable: false if player can't walk through
    - pulseColor: Optional hex color for animation like "#ffffff"
4. Create file with interaction code in src/interactions/{name}.ts
5. Register the interaction by adding import in src/interactions/index.ts

## Business Rules

1. Transactions must reference exactly one submission, or redemption: 
`CHECK ((submission_id IS NOT NULL AND redemption_id IS NULL) OR (submission_id IS NULL AND redemption_id IS NOT NULL))`
2. Student points are not stored in student table to protect against data inconsistency (use a SUM instead)
## Database Schema
```mermaid
---
config:
  layout: elk
---
erDiagram
	direction BT
	STUDENT {
		string email PK ""  
		string name  ""
		date last_signin  ""
	}
	INSTRUCTOR {
		string email PK ""  
		string name  ""  
		date last_signin  ""  
	}
	REGISTRATION {
		int student_id FK ""  
		int course_id FK ""  
	}
	COURSE {
		int course_id PK ""  
		string course_code ""  
		int instructor_id FK ""  
		string title  ""  
		string description  ""  
	}
	QUEST {
		int quest_id PK ""  
		int course_id FK ""
        int created_by FK "references INSTRUCTOR"  
		string title  ""  
		int points_value  ""  
		date expiration_date  ""  
		date created_date  ""  
	}
	SUBMISSION {
		int submission_id PK ""  
		int student_id FK ""  
		int quest_id FK ""  
		date submitted_date  ""  
		string status  ""  
		int verified_by FK ""  
		date verified_date  ""  
	}
	TRANSACTION {
		int transaction_id PK ""  
		int student_id FK ""  
		int points  ""  
		date transaction_date  ""  
		int submission_id FK "nullable"  
		int redemption_id FK "nullable"
	}
	REDEMPTION {
		int redemption_id PK ""  
		int student_id FK ""  
		int reward_id FK ""  
		date redemption_date  ""  
		string status  "pending | completed | cancelled"  
		date completion_date  ""  
		string instructor_notes  ""  
		string student_notes  ""  
	}
	REWARD {
		int reward_id PK ""  
		int course_id FK ""  
		date created_date  ""  
		string name  ""  
		text description  ""  
		int point_cost  ""  
		string reward_type  ""  
		int quantity_limit  ""  
		boolean active  ""  
	}
	STUDENT||--o{REGISTRATION:"has"
	COURSE||--o{REGISTRATION:"contains"
	INSTRUCTOR||--o{COURSE:"teaches"
	COURSE||--o{QUEST:"has"
	INSTRUCTOR||--o{QUEST:"creates"
	INSTRUCTOR||--o{REWARD:"manages"
	STUDENT||--o{SUBMISSION:"submits"
	QUEST||--o{SUBMISSION:"receives"
	INSTRUCTOR||--o{SUBMISSION:"verifies"
    STUDENT||--o{TRANSACTION:"has"
	STUDENT||--o{REDEMPTION:"triggers a"
	REWARD||--o{REDEMPTION:"redeemed as"    
    SUBMISSION||--||TRANSACTION:"creates"
    REDEMPTION||--||TRANSACTION:"creates"

```