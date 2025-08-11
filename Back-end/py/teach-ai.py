from flask import Flask, request, jsonify
import fitz  # PyMuPDF for PDF text extraction
import openai
import base64

app = Flask(__name__)

openai.api_key = "J1e0O17jKQb8aW7jAijJQl1TEvb3NajD"

@app.route("/api/extract-story", methods=["POST"])
def extract_story():
    file = request.files["pdf"]

    # Extract text from PDF
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    story_text = ""
    for page in pdf:
        story_text += page.get_text()

    # Get AI-generated title
    ai_title = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": f"Give me a good title for this story:\n{story_text}"}]
    ).choices[0].message["content"]

    # Get AI-generated image (DALL·E or similar)
    image_prompt = f"An illustrated children's book style cover image representing this story:\n{story_text}"
    image_response = openai.Image.create(
        prompt=image_prompt,
        n=1,
        size="512x512"
    )
    image_url = image_response['data'][0]['url']

    return jsonify({
        "title": ai_title.strip(),
        "story": story_text.strip(),
        "imageUrl": image_url
    })

if __name__ == "__main__":
    app.run(debug=True)
