## **Is it resilient – Visualization**

This web app provides a visual exploration of relations between WoW characters in Mythic+ dungeon runs. It builds on data from the original [**Is it resilient?**](https://hocus-p0cus.github.io/) project, using the same logic to determine whether a character has a resilient X key, but represents that information as a Directed Acyclic Graph (DAG).

#### 📊 Data Summary
 - **Regions**: EU and NA
 - **Seasons**: *The War Within* (TWW) Season 2 and Season 3  
 - **Keystone levels**: 18 and above  
 - DAG edge data is automatically updated once a day from exported Raider.IO leaderboards

 ### 🕹️ Features
- 🧭 **Graph navigation**
  - Zoom in/out using the mouse wheel  
  - Press **Spacebar** to reset the view  

- 🔍 **Character search**
  - Simply **Ctrl+V** a copied Raider.IO profile link to search and visualize relations for that character  

- ⚙️ **Display controls**
  - Toggle visibility of **non-resilient nodes** (the queried character is always visible)  

- 👆 **Interactive nodes and edges**
  - **Left-click a node:** opens the character’s detailed stats in a new tab  
  - **Right-click a node:** queries that node to rebuild the graph around it ("walking" on the graph)  
  - **Left-click an edge:** displays related M+ runs  
  - If multiple edges overlap, choose which character relation you want to inspect

### 🧩 How It Works
 
#### **1. Nodes and Edges**
Each **node** represents a player character.  
Each **edge** represents a timed M+ run (or multiple runs) that creates a relationship between two characters:
- If a character **A** (without a resilient X key) completes a run with a character **B** (who is already X resilient), the run forms a **directed edge `B → A`**.
- Repeating this for all characters in the region who timed a key on a set level produces a **Directed Acyclic Graph (DAG)**.

#### **2. Multiple Resilient Players**
If several characters with resilient X keys participate in the same run, multiple edges are created — for example:  
`C → A`, `B → A`, etc.  
(one edge per pair of resilient → non-resilient characters).

#### **3. Topological Ordering and Colors**
- The graph layout is **topologically sorted** for display convenience — the vertical order of nodes does **not** necessarily reflect when a character reached resilient X.  
- **Node colors** represent when each character achieved their resilient key:  
  - **Dark purple** → earliest achievers  
  - **Bright yellow** → latest achievers  
  - **Gray** → not yet resilient  

#### **4. Who Appears in the Graph**
Characters who never had any resilient key interactions do **not** appear:
- Players who only run in fixed premade groups (and reached resilient level X at the same time), or  
- Players who neither received nor provided help with resilient keys  
→ have **no edges**, so they are omitted from the DAG.

### 🗂️ Data Format

The visualization uses JSON exports:
- `<season>-<region>-resi<keylevel>_timestamps.json`
- `<season>-<region>-resi<keylevel>_down_edges.json`
- `<season>-<region>-resi<keylevel>_non_resil_edges.json`

These files contain:
- **Timestamps** for when each character obtained their resilient X key,  
- **Relations** between resilient key holders, and  
- **Edges** pointing toward characters who have not yet reached resilient X level.  

