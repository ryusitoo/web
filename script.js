// Presencia de Discord en vivo (Lanyard API)
// Documentación: https://github.com/Phineas/lanyard
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
  const activityImgEl = document.getElementById("dc-activity-img");
  const activityNameEl = document.getElementById("dc-activity-name");
  const activityDetailEl = document.getElementById("dc-activity-detail");

  // Esta tarjeta solo existe en index.html
  if (!statusTextEl) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();

    if (!json.success) throw new Error("Lanyard no encontró este usuario");

    const data = json.data;
    const user = data.discord_user;

    // Avatar y nombre
    if (avatarEl && user.avatar) {
      avatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
    }
    if (usernameEl) {
      usernameEl.textContent = user.global_name || user.username;
    }

    // Estado (online / idle / dnd / offline)
    const status = data.discord_status || "offline";
    if (dotEl) {
      dotEl.className = `dc-dot dc-dot-${status}`;
    }
    if (statusTextEl) {
      statusTextEl.textContent = statusLabels[status] || "Desconectado";
    }

    // Actividad: prioriza Spotify, luego cualquier otra actividad (jugando/viendo)
    if (data.listening_to_spotify && data.spotify) {
      activityEl.hidden = false;
      activityImgEl.hidden = false;
      activityImgEl.src = data.spotify.album_art_url;
      activityNameEl.textContent = `🎧 ${data.spotify.song}`;
      activityDetailEl.textContent = data.spotify.artist;
    } else {
      const activity = (data.activities || []).find((a) => a.type !== 4); // type 4 = estado personalizado
      if (activity) {
        activityEl.hidden = false;
        if (activity.assets && activity.assets.large_image) {
          const img = activity.assets.large_image.startsWith("mp:")
            ? `https://media.discordapp.net/${activity.assets.large_image.replace("mp:", "")}`
            : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
          activityImgEl.hidden = false;
          activityImgEl.src = img;
        } else {
          activityImgEl.hidden = true;
        }
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
