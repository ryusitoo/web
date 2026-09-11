const DISCORD_ID = "1299797897201586328";

const statusLabels = {
  online: "En línea",
  idle: "Ausente",
  dnd: "No molestar",
  offline: "Desconectado",
};

async function loadDiscordPresence() {
  const avatarEl = document.getElementById("dc-avatar");
  const dotEl = document.getElementById("dc-dot");
  const usernameEl = document.getElementById("dc-username");
  const statusTextEl = document.getElementById("dc-status-text");
  const activityEl = document.getElementById("dc-activity");
  const activityNameEl = document.getElementById("dc-activity-name");
  const activityDetailEl = document.getElementById("dc-activity-detail");

  if (!statusTextEl) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();

    if (!json.success) throw new Error("Lanyard no encontró este usuario");

    const data = json.data;
    const user = data.discord_user;

    if (avatarEl && user.avatar) {
      avatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }
    if (usernameEl) {
      usernameEl.textContent = user.global_name || user.username;
    }

    const status = data.discord_status || "offline";
    if (dotEl) {
      dotEl.className = `dc-dot dc-dot-${status}`;
    }
    if (statusTextEl) {
      statusTextEl.textContent = statusLabels[status] || "Desconectado";
    }

    if (data.listening_to_spotify && data.spotify) {
      activityEl.hidden = false;
      activityNameEl.textContent = `🎧 ${data.spotify.song}`;
      activityDetailEl.textContent = `de ${data.spotify.artist}`;
    } else {
      const activity = (data.activities || []).find((a) => a.type !== 4);
      if (activity) {
        activityEl.hidden = false;
        activityNameEl.textContent = `🎮 ${activity.name}`;
        activityDetailEl.textContent = activity.details || activity.state || "";
      } else {
        activityEl.hidden = true;
      }
    }
  } catch (err) {
    if (statusTextEl) statusTextEl.textContent = "No disponible";
    if (dotEl) dotEl.className = "dc-dot dc-dot-offline";
  }
}

if (document.getElementById("dc-status-text")) {
  loadDiscordPresence();
  setInterval(loadDiscordPresence, 20000);
}
