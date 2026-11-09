
const SUPABASE_URL = "https://vxauwhnppuqujxmdnhdq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xBg5tfJkeeSwogyQZA-_Kw_DhJjMeMp";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("guestbook-form");
const messagesDiv = document.getElementById("messages");
const status = document.getElementById("status");
const submitButton = document.getElementById("submit-button");

function displayMessage(item) {
  const card = document.createElement("div");
  card.className = "message";

  const name = document.createElement("h3");
  name.textContent = item.name;

  const message = document.createElement("p");
  message.textContent = item.message;

  const date = document.createElement("small");
  date.textContent = new Date(item.created_at).toLocaleString();

  card.append(name, message, date);
  return card;
}

async function loadMessages() {
  messagesDiv.textContent = "Loading messages...";

  const { data, error } = await db
    .from("guestbook_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    messagesDiv.textContent = "Could not load messages.";
    console.error(error);
    return;
  }

  messagesDiv.replaceChildren();

  if (data.length === 0) {
    messagesDiv.textContent = "Be the first to sign!";
    return;
  }

  data.forEach(item => {
    messagesDiv.appendChild(displayMessage(item));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !message) return;

  if (name.length > 40 || message.length > 500) {
    status.textContent = "Your message is too long.";
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Sending...";

  const { error } = await db
    .from("guestbook_messages")
    .insert([{ name, message }]);

  submitButton.disabled = false;

  if (error) {
    status.textContent = "Something went wrong. Please try again.";
    console.error(error);
    return;
  }

  form.reset();
  status.textContent = "Your message was posted!";
  await loadMessages();
});

const channel = db
  .channel("guestbook-live")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "guestbook_messages"
    },
    () => loadMessages()
  )
  .subscribe();

loadMessages();
