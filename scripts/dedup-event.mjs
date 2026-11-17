import mongoose from "mongoose";

const EVENT_ID   = "69f33acd04f18206dc839b97";
const DROP_ID    = "ifscrnrek";   // empty duplicate
const KEEP_ID    = "bfn3wvjwj";  // has 64 slot marks

const uri = process.env.MONGO_DB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = db.collection("users");

const event = await col.findOne({ _id: new mongoose.Types.ObjectId(EVENT_ID) });
console.log("Users before:", event.users.map(u => `${u.name} (${u.id})`));

// Merge: move any DROP_ID marks to KEEP_ID (none in this case, but safe to run)
const avail = event.availability;
let mergedSlots = 0;
for (const [slot, ids] of Object.entries(avail)) {
  if (ids.includes(DROP_ID)) {
    avail[slot] = ids.filter(id => id !== DROP_ID);
    if (!avail[slot].includes(KEEP_ID)) avail[slot].push(KEEP_ID);
    mergedSlots++;
  }
}
console.log("Slots merged from drop→keep:", mergedSlots);

// Remove duplicate user entry
const cleanUsers = event.users.filter(u => u.id !== DROP_ID);
console.log("Users after:", cleanUsers.map(u => `${u.name} (${u.id})`));

await col.updateOne(
  { _id: new mongoose.Types.ObjectId(EVENT_ID) },
  { $set: { users: cleanUsers, availability: avail } }
);

console.log("Done ✓");
await mongoose.disconnect();
