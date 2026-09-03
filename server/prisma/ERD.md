# Database ERD

Generated from `schema.prisma`. Keep this in sync — see the root `CLAUDE.md` for the update rule.

```mermaid
erDiagram
    USER ||--o{ LEAGUE_LINK : has
    USER ||--o{ LEAGUE : creates
    USER ||--o{ LEAGUE_MEMBER : "is (optionally)"
    LEAGUE_LINK |o--o{ LEAGUE : syncs
    LEAGUE_LINK ||--o| ESPN_LEAGUE_LINK : ""
    LEAGUE_LINK ||--o| YAHOO_LEAGUE_LINK : ""
    LEAGUE_LINK ||--o| SLEEPER_LEAGUE_LINK : ""
    LEAGUE ||--o{ LEAGUE_MEMBER : has
    LEAGUE ||--o{ MATCHUP : has
    LEAGUE ||--o{ TRANSACTION : has
    LEAGUE_MEMBER ||--o| ROSTER : "has (active only)"
    LEAGUE_MEMBER ||--o| STANDING : has
    LEAGUE_MEMBER ||--o{ ROSTER_MATCHUP : "plays in"
    LEAGUE_MEMBER ||--o{ TRANSACTION_ITEM : "party to"
    MATCHUP ||--o{ ROSTER_MATCHUP : "has (one per side)"
    ROSTER ||--o{ ROSTER_SLOT : has
    ROSTER_MATCHUP ||--o{ ROSTER_MATCHUP_SLOT : has
    TRANSACTION ||--o{ TRANSACTION_ITEM : has
    PLAYER ||--o{ PLAYER_EXTERNAL_ID : "mapped by"
    PLAYER ||--o{ ROSTER_SLOT : fills
    PLAYER ||--o{ ROSTER_MATCHUP_SLOT : fills
    PLAYER ||--o{ TRANSACTION_ITEM : involves
    USER ||--o{ CREWMATE : owns
    USER ||--o{ CREWMATE : "matched as (optionally)"
    CREWMATE ||--o{ CREWMATE_LEAGUE_MEMBER : has
    LEAGUE_MEMBER ||--o{ CREWMATE_LEAGUE_MEMBER : "tagged as"
    USER ||--o{ LEAGUE_GROUP : owns
    LEAGUE_GROUP |o--o{ LEAGUE : groups

    USER {
        string id PK
        string email UK
        string displayName
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_LINK {
        string id PK
        Platform platform "ESPN | YAHOO | SLEEPER"
        datetime createdAt
        datetime updatedAt
        string userId FK
    }

    ESPN_LEAGUE_LINK {
        string id PK
        string swid
        string espnS2
        string leagueLinkId FK "unique"
    }

    YAHOO_LEAGUE_LINK {
        string id PK
        string externalUserId "nullable"
        string accessToken
        string refreshToken
        datetime expiresAt
        string leagueLinkId FK "unique"
    }

    SLEEPER_LEAGUE_LINK {
        string id PK
        string externalUsername
        string externalUserId
        string leagueLinkId FK "unique"
    }

    LEAGUE {
        string id PK
        Platform platform "ESPN | YAHOO | SLEEPER"
        string externalLeagueId
        string name
        int season
        boolean isActive
        datetime createdAt
        datetime updatedAt
        string createdById FK
        string leagueLinkId FK "nullable"
        string leagueGroupId FK "nullable"
    }

    LEAGUE_GROUP {
        string id PK
        string name
        datetime createdAt
        datetime updatedAt
        string ownerId FK
    }

    LEAGUE_MEMBER {
        string id PK
        string teamId
        string teamName "nullable"
        string externalDisplayName "nullable"
        datetime createdAt
        datetime updatedAt
        string leagueId FK
        string userId FK "nullable"
    }

    PLAYER {
        string id PK
        string fullName
        Position position "QB | RB | WR | TE | K | DST"
        string nflTeam "nullable"
        datetime createdAt
        datetime updatedAt
    }

    PLAYER_EXTERNAL_ID {
        string id PK
        Platform platform "ESPN | YAHOO | SLEEPER"
        string externalId
        string playerId FK
    }

    ROSTER {
        string id PK
        datetime createdAt
        datetime updatedAt
        string leagueMemberId FK "unique"
    }

    ROSTER_SLOT {
        string id PK
        string lineupSlot "e.g. RB1, FLEX, BENCH, IR"
        boolean isStarter
        string rosterId FK
        string playerId FK
    }

    STANDING {
        string id PK
        int wins
        int losses
        int ties
        float pointsFor
        float pointsAgainst
        int rank "nullable"
        string streak "nullable"
        datetime createdAt
        datetime updatedAt
        string leagueMemberId FK "unique"
    }

    MATCHUP {
        string id PK
        int week
        datetime createdAt
        datetime updatedAt
        string leagueId FK
    }

    ROSTER_MATCHUP {
        string id PK
        float score "nullable"
        float projectedScore "nullable"
        datetime createdAt
        datetime updatedAt
        string matchupId FK
        string leagueMemberId FK
    }

    ROSTER_MATCHUP_SLOT {
        string id PK
        string lineupSlot "e.g. RB1, FLEX, BENCH, IR"
        boolean isStarter
        float points "nullable"
        float projectedPoints "nullable"
        string rosterMatchupId FK
        string playerId FK
    }

    TRANSACTION {
        string id PK
        TransactionType type "ADD | DROP | TRADE | WAIVER_CLAIM | COMMISSIONER"
        string externalId "nullable"
        datetime processedAt "nullable"
        datetime createdAt
        datetime updatedAt
        string leagueId FK
    }

    TRANSACTION_ITEM {
        string id PK
        TransactionItemAction action "ADDED | DROPPED"
        string transactionId FK
        string playerId FK
        string leagueMemberId FK "nullable"
    }

    CREWMATE {
        string id PK
        string displayName
        datetime createdAt
        datetime updatedAt
        string ownerId FK
        string userId FK "nullable"
    }

    CREWMATE_LEAGUE_MEMBER {
        string id PK
        datetime createdAt
        string crewmateId FK
        string leagueMemberId FK
    }
```

## Notes
- `LeagueLink` is a user's connection to a fantasy platform — one per platform per user (`@@unique([userId, platform])`). It only carries the platform and ownership; the actual credentials live on whichever platform-specific table is attached 1:1 (`EspnLeagueLink`, `YahooLeagueLink`, `SleeperLeagueLink`), since each platform's auth shape is different (ESPN: `swid`/`espn_s2` cookies, Yahoo: OAuth tokens, Sleeper: no auth, just a username/user id).
- `League.leagueLink` is nullable — public leagues (mainly ESPN) can be added without stored credentials.
- `League.createdBy` (FK `createdById`) is the user who added the league; deleting that user is `Restrict`ed rather than cascading, since other users may already be linked to the league via `LeagueMember`.
- `LeagueMember` tracks every roster/owner slot in a league as reported by the platform (`teamId`, unique per league). `userId` is nullable and only set once that member is matched to a First Mate account — this is the join point the crewmate-mapping feature will build on.
- `Player` is the global, platform-agnostic player pool. `PlayerExternalId` maps each platform's own player id onto one `Player` row — this is the "player ID mapper" called out as a technical need in the README.
- `Roster`/`RosterSlot` hold only the **current** active roster for a team (one `Roster` per `LeagueMember`, enforced by the unique `leagueMemberId`) — syncing is expected to run only for active leagues' active rosters, not history. Historical per-week lineups live on `RosterMatchup`/`RosterMatchupSlot` instead.
- `Standing` is likewise a live, continuously-updated cumulative record per team (one row per `LeagueMember`), not a week-by-week history.
- `Matchup` is just the week/league container; each side's participation is its own `RosterMatchup` row (`@@unique([matchupId, leagueMemberId])`, so a bye week simply has one row instead of two) carrying that team's score and projected score. `RosterMatchupSlot` then records, per player, `lineupSlot`/`isStarter` (started vs. benched) and that player's points/projected points for the week.
- `Transaction` is a single platform event (add/drop/trade/waiver/commissioner); `TransactionItem` records each player movement under it, so a trade is just several items spanning multiple `LeagueMember`s under one `Transaction`. `leagueMemberId` on an item is nullable to represent a move to/from free agency.
- `Crewmate` is a contact-list entry **owned by one User** (`ownerId`), not a mutual/bidirectional relationship — it exists specifically so a crewmate doesn't need a First Mate account: `userId` is only set once that person is matched or signs up via invite. `CrewmateLeagueMember` is the many-to-many join that groups a Crewmate's history: it links one `Crewmate` to every `LeagueMember` that represents them across leagues, platforms, and seasons. The same `LeagueMember` can be tagged by several different owners independently (each maintains their own crew even inside a shared league), which is why this needs a join table rather than a column on either side.
- Season history itself needed no new models: every `League` row is already one season (`@@unique([createdById, platform, externalLeagueId, season])`), so `Matchup`/`RosterMatchup`/`RosterMatchupSlot`, `Standing`, and `Transaction`/`TransactionItem` are already permanent per-season records. `LeagueGroup` fills the one real gap — tying the `League` rows for the same real-world league together across years (and even across a platform migration), so history can be viewed as one continuous timeline. Grouping is manual and owned by one `User` (`ownerId`), same rationale as `Crewmate`: the same leagues could be grouped differently by different owners. `League.leagueGroup` is nullable since a league isn't grouped until its owner does so.
- Weekly standings history (a snapshot per week, vs. the current cumulative record `Standing` holds) is intentionally not modeled yet.
