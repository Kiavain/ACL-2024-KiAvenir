const userIcon = document.getElementById('userIcon');
const userId = userIcon.dataset.userId;
const iconPath = "/img/user_icon/" + userId +".jpg";
const defaultPath = "/img/user_icon/account.jpg";

fetch(iconPath, { method: 'HEAD' })
  .then((response) => {
    if (response.ok && response.headers.get('Content-Type').startsWith('image/')) {
        // console.log(`${iconPath} existe, on la récupère.`);
        userIcon.src = iconPath;
    } else {
        // console.log(`${iconPath} n'existe pas, on utilise l'image par défaut.`);
    }
  })
  .catch(() => {
    console.log(`Erreur lors du chargement de l'image utilisateur.`);
});