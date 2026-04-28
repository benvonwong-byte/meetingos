require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const express = require("express");
const mongoose = require("mongoose");
const router = require("./routes");
const cors = require("cors");
const https = require("https");

const AIRTABLE_PAT = defineSecret("AIRTABLE_PAT");

const AIRTABLE_BASE  = "appLtX5g0cVrAlLkl";
const AIRTABLE_TABLE = "tblpvnCFglIv3Uffy";
const AIRTABLE_VIEW  = "viwDvOqur60rZWejg";

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use("/api/events", router);

// --- Airtable participants ---
let participantsCache = null;
let participantsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function airtableFetch(path, pat) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.airtable.com",
      path,
      headers: { Authorization: `Bearer ${pat}` },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchAllParticipants(pat) {
  const fields = ["Title", "Data Type", "Subtitle", "Short Bio"]
    .map((f) => `fields%5B%5D=${encodeURIComponent(f)}`)
    .join("&");

  let all = [];
  let offset = "";
  do {
    const offsetParam = offset ? `&offset=${encodeURIComponent(offset)}` : "";
    const data = await airtableFetch(
      `/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?view=${AIRTABLE_VIEW}&pageSize=100&${fields}${offsetParam}`,
      pat
    );
    for (const r of data.records || []) {
      const f = r.fields || {};
      const type = f["Data Type"];
      if (type !== "People" && type !== "Participant") continue;
      const name = (f.Title || "").trim();
      if (!name || name.toLowerCase().includes("anonymous")) continue;
      all.push({ id: r.id, name, subtitle: f.Subtitle || f["Short Bio"] || "" });
    }
    offset = data.offset || "";
  } while (offset);

  return all.sort((a, b) => a.name.localeCompare(b.name));
}

app.get("/api/participants", async (req, res) => {
  try {
    const pat = process.env.AIRTABLE_PAT;
    const now = Date.now();
    if (!participantsCache || now - participantsCacheTime > CACHE_TTL) {
      participantsCache = await fetchAllParticipants(pat);
      participantsCacheTime = now;
    }
    res.json({ participants: participantsCache });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Normalize phone: keep digits only, compare last 10 digits
function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.slice(-10);
}

app.post("/api/verify", async (req, res) => {
  const { recordId, phone } = req.body || {};
  if (!recordId || !phone) {
    return res.status(400).json({ success: false, error: "Missing recordId or phone" });
  }
  try {
    const pat = process.env.AIRTABLE_PAT;
    const data = await airtableFetch(
      `/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${encodeURIComponent(recordId)}`,
      pat
    );
    if (data.error) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    const storedPhone = data.fields && data.fields["Phone Contact"];
    if (!storedPhone) {
      return res.status(403).json({ success: false, error: "No phone on file for this participant" });
    }
    if (normalizePhone(storedPhone) !== normalizePhone(phone)) {
      return res.status(403).json({ success: false, error: "Phone number does not match" });
    }
    res.json({ success: true, name: (data.fields.Title || "").trim() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MongoDB ---
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
  isConnected = true;
};

exports.api = onRequest({ secrets: [AIRTABLE_PAT] }, async (req, res) => {
  await connectDB();
  app(req, res);
});
