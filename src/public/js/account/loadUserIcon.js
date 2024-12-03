const userIcon = document.getElementById("userIcon");
// const userIconPreview = document.getElementById('userIconPreview');
// const ctx = userIconPreview.getContext('2d');

const userId = userIcon.dataset.userId;
const iconPath = "/img/user_icon/" + userId + ".jpg";
// const defaultPath = "/img/default_user_icon.jpg";

fetch(iconPath, { method: "HEAD" })
  .then((response) => {
    if (response.ok && response.headers.get("Content-Type").startsWith("image/")) {
      userIcon.src = iconPath;

      // Si la page contient la balise canvas de preview de l'avatar de l'utilisateur
      if (userIconPreview) {
        let img = new Image();
        img.src = iconPath; // Charge l'image de l'utilisateur

        // Redimensionne le canvas et y affiche l'image
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          userIconPreview.width = width;
          userIconPreview.height = height;
          ctx.clearRect(0, 0, userIconPreview.width, userIconPreview.height);
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
    } else {
      if (userIconPreview) {
        let img = new Image();
        img.src = "/img/default_user_icon.jpg"; // Charge l'image par défaut
        // Redimensionne le canvas et y affiche l'image
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          userIconPreview.width = width;
          userIconPreview.height = height;
          ctx.clearRect(0, 0, userIconPreview.width, userIconPreview.height);
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
    }
  })
  .catch((err) => {
    console.error("Erreur lors du chargement de l'image utilisateur.", err);
  });
