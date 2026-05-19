self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Notifikasi Baru", body: event.data.text() };
    }
  }

  const title = data.title || "E-Arsip Notifikasi";
  const options = {
    body: data.body || "Ada pembaruan baru di E-Arsip.",
    icon: "/logo.png", // Sesuaikan dengan icon PWA Anda jika ada
    badge: "/logo.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Jika url dari notifikasi sudah absolut (https://...), pakai langsung.
  // Jika relatif (/path), gabungkan dengan self.location.origin.
  const rawUrl = event.notification.data.url || "/";
  const urlToOpen = rawUrl.startsWith("http")
    ? rawUrl
    : new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        // Buka tab yang sudah ada jika URL-nya sama
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Jika tidak ada tab yang terbuka, buka tab baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
