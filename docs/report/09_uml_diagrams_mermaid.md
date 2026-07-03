# UML Use Case Diagrams

---

## Diagram 1 — Global Use Case Diagram

```mermaid
flowchart LR
    Student(["👤\nStudent"])
    Teacher(["👤\nTeacher"])
    Admin(["👤\nAdmin"])

    Teacher -.->|"▷"| Student
    Admin -.->|"▷"| Teacher

    subgraph System["Yakine Audio Learner Global Use Case Diagram"]
        direction TB
        UC1(["Register Account"])
        UC2(["Manage Profile"])
        UC3(["Browse Catalog"])
        UC4(["Play Audio Lesson"])
        UC5(["Download for Offline"])
        UC6(["Track Progress"])
        UC7(["Create Lesson"])
        UC8(["Generate AI Audio"])
        UC9(["Manage Users"])
        UC10(["Moderate Content"])
        UC11(["Manage Announcements"])
        UC12(["View Dashboard"])
        AUTH(["Authenticate"])
    end

    ElevenLabs(["🤖\nElevenLabs\nService"])

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6

    Teacher --> UC7
    Teacher --> UC8

    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    UC2 -.->|"≪include≫"| AUTH
    UC4 -.->|"≪include≫"| AUTH
    UC5 -.->|"≪include≫"| AUTH
    UC7 -.->|"≪include≫"| AUTH
    UC9 -.->|"≪include≫"| AUTH

    UC8 --- ElevenLabs
```

---

## Diagram 2 — Authentication and Account Management Use Case Diagram

```mermaid
flowchart LR
    Guest(["👤\nGuest"])
    Member(["👤\nMember"])

    subgraph System["Authentication and Account Management Use Case Diagram"]
        direction TB
        UC1(["Register Account"])
        UC2(["Provide Law Onboarding"])
        UC3(["Log In"])
        UC4(["Log Out"])
        UC5(["Refresh Token"])
        UC6(["Validate Session"])
        UC7(["Manage Profile"])
        UC8(["Switch Language"])
        UC9(["Toggle Theme"])
        UC10(["Enforce Rate Limiting"])
        AUTH(["Authenticate"])
    end

    Guest --> UC1
    Guest --> UC3

    Member --> UC3
    Member --> UC4
    Member --> UC5
    Member --> UC6
    Member --> UC7
    Member --> UC8
    Member --> UC9

    UC1 -.->|"≪include≫"| UC2
    UC3 -.->|"≪include≫"| UC10
    UC1 -.->|"≪include≫"| UC10
    UC7 -.->|"≪include≫"| AUTH
    UC8 -.->|"≪include≫"| AUTH
```

---

## Diagram 3 — Catalog and Access Governance Use Case Diagram

```mermaid
flowchart LR
    Student(["👤\nStudent"])
    Teacher(["👤\nTeacher"])
    Admin(["👤\nAdmin"])

    subgraph System["Catalog and Access Governance Use Case Diagram"]
        direction TB
        UC1(["Browse Subjects"])
        UC2(["Browse Chapters"])
        UC3(["Browse Lessons"])
        UC4(["Play Lesson"])
        UC5(["Download for Offline"])
        UC6(["Track Progress"])
        UC7(["Display Premium Lock"])
        UC8(["Filter by Academic Profile"])
        UC9(["Create Subject"])
        UC10(["Create Lesson"])
        UC11(["Edit Lesson"])
        UC12(["Delete Content"])
        UC13(["Submit for Review"])
        UC14(["Verify Teacher Scope"])
        AUTH(["Authenticate"])
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7

    Teacher --> UC9
    Teacher --> UC10
    Teacher --> UC11
    Teacher --> UC13

    Admin --> UC9
    Admin --> UC11
    Admin --> UC12

    UC1 -.->|"≪include≫"| UC8
    UC4 -.->|"≪include≫"| AUTH
    UC5 -.->|"≪include≫"| AUTH
    UC6 -.->|"≪include≫"| AUTH
    UC10 -.->|"≪include≫"| AUTH
    UC10 -.->|"≪include≫"| UC14
    UC13 -.->|"≪extend≫"| UC10
```

---

## Diagram 4 — Administrative Governance Use Case Diagram

```mermaid
flowchart LR
    Admin(["👤\nAdmin"])
    Member(["👤\nMember"])

    subgraph System["Administrative Governance Use Case Diagram"]
        direction TB
        UC1(["Manage Users"])
        UC2(["Change Role"])
        UC3(["Ban or Unban User"])
        UC4(["Change Subscription"])
        UC5(["Delete User"])
        UC6(["Moderate Content"])
        UC7(["Approve Lesson"])
        UC8(["Reject Lesson"])
        UC9(["Manage Teacher Permissions"])
        UC10(["Create Announcement"])
        UC11(["Edit Announcement"])
        UC12(["View Announcement"])
        UC13(["Toggle Feature Flag"])
        UC14(["View Dashboard"])
        AUTH(["Authenticate"])
    end

    Admin --> UC1
    Admin --> UC6
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC13
    Admin --> UC14

    Member --> UC12

    UC2 -.->|"≪extend≫"| UC1
    UC3 -.->|"≪extend≫"| UC1
    UC4 -.->|"≪extend≫"| UC1
    UC5 -.->|"≪extend≫"| UC1
    UC7 -.->|"≪extend≫"| UC6
    UC8 -.->|"≪extend≫"| UC6

    UC1 -.->|"≪include≫"| AUTH
    UC6 -.->|"≪include≫"| AUTH
    UC9 -.->|"≪include≫"| AUTH
    UC10 -.->|"≪include≫"| AUTH
```

---

## Diagram 5 — Content Creation and TTS Use Case Diagram

```mermaid
flowchart LR
    Teacher(["👤\nTeacher"])
    Admin(["👤\nAdmin"])

    subgraph System["Content Creation and TTS Use Case Diagram"]
        direction TB
        UC1(["Import Transcript"])
        UC2(["Parse Document"])
        UC3(["Create Lesson Draft"])
        UC4(["Edit Multilingual Scripts"])
        UC5(["Attach Manual Audio"])
        UC6(["Generate AI Audio"])
        UC7(["Select Languages"])
        UC8(["Select Voice"])
        UC9(["View Generation Jobs"])
        UC10(["Retry Failed Job"])
        UC11(["Cancel Job"])
        UC12(["Export Catalog"])
        UC13(["Import Catalog"])
        AUTH(["Authenticate"])
    end

    ElevenLabs(["🤖\nElevenLabs\nService"])

    Teacher --> UC1
    Teacher --> UC3
    Teacher --> UC4
    Teacher --> UC5
    Teacher --> UC6
    Teacher --> UC9
    Teacher --> UC10
    Teacher --> UC11

    Admin --> UC12
    Admin --> UC13

    UC1 -.->|"≪include≫"| UC2
    UC6 -.->|"≪include≫"| UC7
    UC6 -.->|"≪include≫"| UC8
    UC3 -.->|"≪include≫"| AUTH
    UC6 -.->|"≪include≫"| AUTH
    UC10 -.->|"≪extend≫"| UC9
    UC11 -.->|"≪extend≫"| UC9

    UC6 --- ElevenLabs
```
