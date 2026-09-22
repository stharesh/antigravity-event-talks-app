# BigQuery Release Hub

An interactive dashboard that turns Google Cloud BigQuery release notes into an easy-to-browse, searchable, and shareable feed.

<img width="1297" height="897" alt="BigQuery Release Hub" src="https://github.com/user-attachments/assets/2fc03882-f1fb-4b7c-8420-5aae4d812419" />

## Overview

BigQuery Release Hub makes it easier to keep up with changes published in the official Google Cloud BigQuery release notes.

Instead of navigating through release-note pages manually, users can explore updates in one place, search for topics they care about, filter releases by type, open the original documentation, and turn an update into a ready-to-share post.

## What You Can Do

### Browse BigQuery Updates

The application brings the Google Cloud BigQuery release feed into a simple dashboard where updates can be viewed as individual release cards.

Each update provides the key information needed to understand what changed and where to find the original documentation.

### Search Releases

Search across the release feed to quickly find updates related to a particular feature, change, or topic.

### Filter by Release Type

Updates can be filtered by categories such as:

- Announcement
- Feature
- Deprecation
- Resolved issue
- Breaking change

This makes it easier to focus on the kinds of updates that matter to you.

### Open the Original Documentation

Every release remains connected to its original Google Cloud documentation, so users can move from the dashboard to the full source material when they need more detail.

### Create a Shareable Update

Select a release to generate a ready-to-share Twitter/X post.

The application:

- Creates a concise post from the selected release
- Adds relevant hashtags
- Includes the original source link
- Keeps track of the 280-character limit
- Adjusts long content when necessary
- Opens the prepared post through Twitter/X

### Responsive Experience

The dashboard is designed to work across desktop and smaller screens, with loading states, empty states, filtering controls, and a focused release-reading experience.

## How It Works

```text
Google Cloud BigQuery Release Notes
                ↓
          Release Feed
                ↓
       Browse & Search
                ↓
         Filter Updates
                ↓
       Read Release Details
                ↓
       Generate Shareable Post
                ↓
           Share on X
```

The application also keeps recently retrieved release data available during the current session, while allowing the user to request a fresh update from the source feed.

## The Product Workflow

The project is intentionally built around a simple user journey:

1. **Discover** — see recent BigQuery updates in one place.
2. **Find** — search or filter the feed.
3. **Understand** — review the release summary and open the official documentation.
4. **Prepare** — turn an interesting update into a concise social post.
5. **Share** — continue directly to Twitter/X with the prepared content.

## Why I Built It

The idea was to turn a frequently updated technical information source into a small, practical product.

The project focuses on making information easier to **discover, navigate, understand, and share** rather than simply displaying the underlying feed.

## Development Approach

This project was created using an **AI-assisted / vibe-coding workflow**, including the Antigravity CLI.

AI tools were used extensively during development, followed by iterative testing and refinement of the application's behavior, data flow, filtering experience, sharing workflow, and overall user experience.

## Project Structure

```text
antigravity-event-talks-app/
├── app.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md
```

## Run Locally

### Prerequisites

- Python 3.8+
- Internet access to retrieve the Google Cloud release feed

### Setup

```bash
git clone https://github.com/stharesh/antigravity-event-talks-app.git
cd antigravity-event-talks-app
pip install flask
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Current Scope

The application currently focuses on:

- BigQuery release-note discovery
- Search and filtering
- Release categorization
- Source documentation access
- Social-post generation
- Twitter/X sharing
- A responsive dashboard experience

Release data depends on the availability of the official Google Cloud release feed.

## Potential Extensions

Possible future directions include:

- Historical release analytics
- Persistent release-note storage
- Scheduled update notifications
- Change detection between releases
- Additional sharing destinations
- More advanced search and filtering

## License

No repository license is currently configured.
