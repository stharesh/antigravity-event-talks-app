# BigQuery Release Hub & Twitter Share

Using the Antigravity CLI, this application was created, along with its repository.

<img width="1297" height="897" alt="image" src="https://github.com/user-attachments/assets/2fc03882-f1fb-4b7c-8420-5aae4d812419" />

---

A sleek, modern web application designed to fetch, display, and easily share Google Cloud BigQuery Release Notes on Twitter/X. 

Developed with a clean, dark-themed UI, dynamic search, and filtering options, the application features an integrated **Tweet Composer** with automatic hashtag wrapping, URL references, and character-limit warning systems.

## Features

- **Live GCP Release Feed**: Real-time retrieval and caching of BigQuery updates from the official Google Cloud Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Dynamic Content Grouping**: Automatically splits daily updates by categories (`Announcement`, `Feature`, `Deprecation`, `Resolved issue`, `Breaking change`).
- **Interactive UI**: Multi-device responsive dashboard utilizing CSS-based transitions, clean typography (`Outfit` and `Inter` fonts), and elegant skeleton loaders.
- **Smart Tweet Composer**: 
  - Select any release card to automatically draft a polished update.
  - Strips HTML content and packages key tags (`#GoogleCloud #BigQuery #DataEngineering`).
  - Limits content bounds dynamically so custom links fit within Twitter's 280-character ceiling.
  - Real-time SVG circular character limit counter (Blue ➔ Yellow ➔ Red indicator).

---

## File Structure

```text
bigquery-release-notes-viewer/
├── app.py                  # Flask Web Server & Atom parser
├── templates/
│   └── index.html          # Semantic HTML markup
├── static/
│   ├── style.css           # Custom stylesheets & animations
│   └── script.js           # Fetch logic, UI triggers & Tweet composer logic
├── .gitignore              # Project exclusions
└── README.md               # App documentation
```

---

## Prerequisites & Installation

To run the application locally, ensure you have Python 3.8+ installed on your system.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/stharesh/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Install Flask**:
   ```bash
   pip install flask
   ```

3. **Start the Web Server**:
   ```bash
   python app.py
   ```

4. **Open in Browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## API Endpoints

### `GET /api/release-notes`
Retrieves a JSON representation of the release feed.

**Query Parameters:**
- `refresh` (boolean, optional): If set to `true`, bypasses cache to execute a fresh fetch from the Google Cloud server.

**Example Response:**
```json
{
  "cached": false,
  "last_fetched": "2026-06-17T10:17:22.717163",
  "notes": [
    {
      "date": "June 16, 2026",
      "formatted_date": "June 16, 2026",
      "iso_date": "2026-06-16T00:00:00-07:00",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_16_2026",
      "updates": [
        {
          "description": "<p>Table Explorer behavior is moving to the Reference panel...</p>",
          "type": "Announcement"
        }
      ]
    }
  ]
}
```

---

## License
Created as an open-source development tool. Feel free to use and expand!
