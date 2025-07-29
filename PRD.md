# Product Requirements Document: MenuAI

**Version:** 1.0
**Date:** 2025-07-21
**Author:** Libo Yin

---

### Change Log
| Version | Date       | Changes        |
| :------ | :--------- | :------------- |
| 1.0     | 2025-07-21 | Initial draft. |
| 1.1     | 2025-07-21 | Updated UI requirements for modern, mobile-first design. |
| 1.2     | 2025-07-29 | Added support for missing prices and price inference. |

---

## 1. Overview & Vision

**MenuAI** is a stateless web application designed to help diners instantly understand restaurant menus. By leveraging a state-of-the-art **multi-modal AI model**, users can upload photos of a menu, and the application will directly interpret the image to digitize, enrich, and present the menu in an interactive format. The vision is to make every menu accessible, understandable, and easy to navigate for everyone, regardless of dietary needs or familiarity with the cuisine.

---

## 2. User Personas

* **Diana, the Diner with Dietary Needs:** Diana has a gluten intolerance. When she goes to a new restaurant, she spends a lot of time asking the staff which dishes are safe for her. She wants a quick way to scan a menu and see her options without a fuss.
* **Tom, the Curious Tourist:** Tom is traveling and loves trying local food, but he's often unsure what the dishes on the menu are. He wants to see pictures of the food and understand the main ingredients before ordering.

---

## 3. Functional Requirements

### 3.1 Use Case 1: Menu Ingestion and Processing

The user initiates the process by uploading one or more menu images. The system processes these images to generate a structured, enriched digital menu.

* **F1.1 Image Upload:** The user shall be able to upload one or more images (`.jpg`, `.png`, `.webp`) of a restaurant menu via a drag-and-drop interface or a standard file selector.
* **F1.2 (Revised) Multi-modal Menu Processing:** The system must use a multi-modal LLM to directly analyze the menu image(s) and extract structured information in a single step. The prompt for the model should instruct it to perform the following actions:
    * **F1.2.1 Identify & Structure:** Analyze the visual layout to identify menu items and parse them into a structured format (e.g., JSON). For each item, it must extract the **name**, **price** (or null if unavailable), and any listed **description/ingredients**. It should correctly interpret visual hierarchy, columns, and various currency formats.
    * **F1.2.2 Price Handling:** The system must handle various pricing scenarios: explicit prices (e.g., "$12.99"), market pricing ("market price", "MP", "seasonal"), and inferred pricing (e.g., "all sandwiches $6"). When no specific price is available or pricing is market-based, the price field should be set to null.
    * **F1.2.3 Infer Ingredients:** If ingredients are *not* listed in an item's description, the system must use its knowledge (or a subsequent LLM call) to generate a list of probable primary ingredients based on the dish name.
* **F1.3 Fetch Dish Image:** For each structured menu item, the system must perform an online image search for the dish name and select a high-quality, representative photo to display.
* **F1.4 Error Handling:** If the AI model cannot reliably interpret the image, the user should be notified with a clear error message (e.g., "We couldn't read this menu. The image might be too blurry or cut off.").

### 3.2 Use Case 2: Interactive Menu Display & Conversation

The structured data is presented on a clean, interactive webpage where the user can ask questions.

* **F2.1 Menu Visualization:** The processed menu shall be displayed as a series of cards optimized for mobile viewing. Each card must contain the dish name (as a heading), the fetched dish image, the list of ingredients, and the price (or "Market price" if unavailable). On mobile devices, cards should use a horizontal layout for better screen utilization.
* **F2.2 Conversational AI (Chatbot):** The page must feature a chat interface that adapts to the device form factor.
    * **F2.2.1 Contextual Awareness:** The chatbot's knowledge must be strictly limited to the menu items and ingredients processed in the current session.
    * **F2.2.2 Dietary Queries:** Users must be able to ask dietary questions like, "What are the vegan options?", "Which dishes are gluten-free?", or "What doesn't contain nuts?".
    * **F2.2.3 General Queries:** Users must be able to ask about specific dishes or types of food, such as "Do you have any omelettes?".
    * **F2.2.4 Mobile Interface:** On mobile devices, the chat interface should appear as a modal overlay to maximize screen real estate, while on desktop it should be displayed as a sidebar.

### 3.3 Use Case 3: Filtering

The interactive menu page must include powerful filtering capabilities to help users narrow down their choices.

* **F3.1 Filter by Price:** A price range input system shall be provided to allow users to filter dishes within a specific budget. Items without prices (market price items) are automatically included in all price range filters.
* **F3.2 Filter by Ingredient:** A text input field shall allow users to filter dishes that **contain** a specific ingredient.
* **F3.3 Ingredient Exclusion:** The ingredient filter must ignore a predefined list of trivial ingredients. This list shall initially include: **salt, water, pepper, sugar, and oil**.
* **F3.4 Mobile Filter Interface:** On mobile devices, filters should be collapsible to save screen space, with clear visual indicators when filters are active.

---

## 4. Non-Functional Requirements

* **NF1 Technology Stack:**
    * **Frontend:** Must be a single-page application (SPA) built with **TypeScript** and a modern framework (e.g., **Next.js/React, Nuxt/Vue**).
    * **Backend:** Can be **TypeScript (Node.js)** or **Python**. TypeScript is preferred for consistency with frontend.
* **NF1.5 UI/UX Requirements:**
    * **Modern Design:** The web app's UI must be modern and simplistic with clean aesthetics.
    * **Mobile Optimization:** The interface must be optimized for usage on mobile phones with touch-friendly interactions.
    * **Responsive Design:** Must provide an optimal viewing experience across desktop, tablet, and mobile devices.
    * **Visual Hierarchy:** Clear typography, appropriate spacing, and intuitive navigation patterns.
* **NF2 Stateless Architecture:** The application must be fully stateless. No user accounts, login, or session data will be stored on the server.
* **NF3 Hosting and Scalability:**
    * The application must be hosted on a major cloud provider (e.g., **AWS, Google Cloud, Azure**).
    * The architecture should be serverless (e.g., using **AWS Lambda** or **Google Cloud Functions**).
* **NF4 Performance:**
    * The end-to-end processing time from menu upload to displaying the interactive page should ideally be **under 20 seconds**.
    * Chatbot and filter responses should feel instantaneous (**under 2 seconds**).

---

## 5. (Revised) High-Level Technical Architecture Proposal

The updated, simpler serverless architecture is as follows:

1.  **Frontend (e.g., Next.js on Vercel):** The user interacts with the React-based frontend. On image upload, it sends the file(s) to a secure cloud storage location.
2.  **Cloud Storage (e.g., AWS S3 / Google Cloud Storage):** Receives the uploaded image. This event triggers the backend processing function.
3.  **Backend (e.g., Python on AWS Lambda):** A serverless function orchestrates the simplified AI workflow:
    * **Step A (Combined Processing):** The function sends the image directly to a **Multi-modal LLM API (e.g., Google Gemini 2.5 Pro, OpenAI GPT-4.1)**. A carefully engineered prompt instructs the model to "see" the menu and return a clean JSON object containing all menu items with their name, price, and description.
    * **Step B (Enrichment - Image Search):** The function iterates through the structured JSON from Step A. For each item name, it calls an image search API (e.g., **Google Custom Search API**) to get a URL for a representative photo.
    * **Step C (Response):** The final, enriched JSON data is returned to the frontend.
4.  **Frontend (Display & Chat):** Renders the JSON data. Chat sends the menu JSON and user query to the backend for a context-aware LLM response.

This revised flow **removes the need for a separate OCR service**, reducing architectural complexity.

---

## 6. Assumptions & Out of Scope

* **Assumptions:**
    * The multi-modal LLM can handle various languages, but the primary target for v1.0 is English.
    * The system will use the first high-quality image returned from the image search API.
    * Ingredient inference by the LLM is on a "best-effort" basis. This should be communicated to the user with a small disclaimer.
* **Out of Scope for v1.0:**
    * User accounts, saving menus, or viewing history.
    * Handling handwritten menus.
    * Restaurant location services or reviews.
    * Handling QR code menus directly (though a user could screenshot the menu from the QR code link and upload that).
