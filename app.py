from flask import Flask, jsonify, render_template, request, send_from_directory
import urllib.request
import xml.etree.ElementTree as ET
import re
import os
from datetime import datetime

app = Flask(__name__)

# Cache variables to avoid rate-limiting or double fetching unnecessarily
cache = {
    'data': None,
    'last_fetched': None
}

def clean_html_content(html):
    """
    Optional cleaning if needed, but since we use vanilla HTML and want to show
    well-formatted content, we will pass HTML description safely to client.
    """
    if not html:
        return ""
    # Ensure links open in a new tab
    html = re.sub(r'<a\s+href=', '<a target="_blank" rel="noopener noreferrer" href=', html)
    return html.strip()

def split_content_to_updates(content_html):
    """
    Splits the HTML content of an entry by <h3> tags.
    Returns a list of updates, each having a type and a description.
    """
    if not content_html:
        return []
    
    # Split by h3 headings, keeping the headings
    parts = re.split(r'(?is)(<h3[^>]*>.*?</h3>)', content_html)
    
    updates = []
    current_type = "Update"
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Check if this part is a heading
        if re.match(r'(?is)^<h3[^>]*>.*?</h3>$', part):
            # Strip tags to get clean title (e.g. Announcement, Feature)
            current_type = re.sub(r'(?i)<[^>]*>', '', part).strip()
        else:
            cleaned_desc = clean_html_content(part)
            if cleaned_desc:
                updates.append({
                    'type': current_type,
                    'description': cleaned_desc
                })
                
    # Fallback if no h3 found
    if not updates and content_html.strip():
        updates.append({
            'type': 'Update',
            'description': clean_html_content(content_html)
        })
        
    return updates

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Error fetching RSS feed: {e}")
        # If cache exists, use it
        if cache['data']:
            return cache['data'], True
        raise e

    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    parsed_entries = []
    
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        updated_elem = entry.find('atom:updated', ns)
        
        date_str = title_elem.text if title_elem is not None else 'Unknown Date'
        updated_str = updated_elem.text if updated_elem is not None else ''
        
        # Parse alternate link
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        if link_elem is None:
            link_elem = entry.find("atom:link", ns)
        link = link_elem.attrib.get('href', '') if link_elem is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        # Parse inner updates from HTML content
        sub_updates = split_content_to_updates(content_html)
        
        # Attempt to format updated date nicely
        formatted_date = date_str
        try:
            if updated_str:
                # updated_str is typically ISO 8601 (e.g. 2026-06-16T00:00:00-07:00)
                # Parse date part
                dt = datetime.fromisoformat(updated_str)
                formatted_date = dt.strftime("%B %d, %Y")
        except Exception:
            pass
            
        parsed_entries.append({
            'date': date_str,
            'formatted_date': formatted_date,
            'iso_date': updated_str,
            'link': link,
            'updates': sub_updates
        })
        
    cache['data'] = parsed_entries
    cache['last_fetched'] = datetime.utcnow().isoformat()
    return parsed_entries, False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    # Return cache if available and not forcing refresh
    if cache['data'] and not force_refresh:
        return jsonify({
            'notes': cache['data'],
            'cached': True,
            'last_fetched': cache['last_fetched']
        })
        
    try:
        notes, used_fallback = fetch_release_notes()
        return jsonify({
            'notes': notes,
            'cached': used_fallback,
            'last_fetched': cache['last_fetched']
        })
    except Exception as e:
        return jsonify({
            'error': f"Failed to retrieve release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Run the application on localhost:5000
    app.run(debug=True, host='127.0.0.1', port=5000)
