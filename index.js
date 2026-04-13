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
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body;
      const phoneNumberId = change.value.metadata.phone_number_id;

      console.log("Message from " + from + ": " + text);

      sendReply(phoneNumberId, from,
        "Thanks for contacting us! We received your message. A technician will reply shortly."
      );
    }
  }

  res.sendStatus(200);
});

async function sendReply(phoneNumberId, to, message) {
  const token = process.env.WHATSAPP_TOKEN;

  await fetch(
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
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
