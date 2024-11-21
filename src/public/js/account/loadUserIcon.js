const userIcon = document.getElementById('userIcon');
const userIconPreview = document.getElementById('userIconPreview');
const userId = userIcon.dataset.userId;
const iconPath = "/img/user_icon/" + userId +".jpg";
// const defaultPath = "/img/default_user_icon.jpg";

fetch(iconPath, { method: 'HEAD' })
  .then((response) => {
    if (response.ok && response.headers.get('Content-Type').startsWith('image/')) {
        // console.log(`${iconPath} existe, on la récupère.`);
        userIcon.src = iconPath;
        if (userIconPreview) {
          userIconPreview.src = iconPath;
        }
    } else {
        // console.log(`${iconPath} n'existe pas, on utilise l'image par défaut.`);
    }
  })
  .catch(() => {
    console.log(`Erreur lors du chargement de l'image utilisateur.`);
});