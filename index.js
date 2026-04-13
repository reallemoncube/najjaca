const express = require("express");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "drogiranje69";

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", (req, res) => {
  try {
    const body = req.body;
    console.log("Full payload: " + JSON.stringify(body));

    const entry = body.entry?.[0];
    const changes = entry?.changes;

    if (changes) {
      for (const change of changes) {
        const value = change.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          for (const message of messages) {
            const from = message.from;
            const text = message.text?.body;
            const phoneNumberId = value?.metadata?.phone_number_id;

            console.log("From: " + from);
            console.log("Text: " + text);
            console.log("Phone Number ID: " + phoneNumberId);

            if (from && text && phoneNumberId) {
              sendReply(phoneNumberId, from,
                "Thanks for contacting us! We received your message. A technician will reply shortly."
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.log("Error: " + err.message);
  }

  res.sendStatus(200);
});

async function sendReply(phoneNumberId, to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  console.log("Sending reply to: " + to);

  const response = await fetch(
    "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message }
      })
    }
  );

  const data = await response.json();
  console.log("Reply result: " + JSON.stringify(data));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
